use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("bk3AL2Qz3RAg1mRLJWu8E2iA8NNVf7a3hAoF1L5p7t2");

pub const MAX_TITLE_LEN: usize = 64;
pub const MAX_DESC_LEN: usize = 256;
pub const MAX_URI_LEN: usize = 200;
pub const GRID_SIZE: u8 = 8; // 8x8 grid = 64 regions

#[program]
pub mod collab_canvas {
    use super::*;

    /// Create a new season (canvas)
    pub fn create_season(
        ctx: Context<CreateSeason>,
        title: String,
        description: String,
        funding_end_ts: i64,
        voting_end_ts: i64,
        min_funding_per_region: u64,
    ) -> Result<()> {
        require!(title.len() <= MAX_TITLE_LEN, ErrorCode::TitleTooLong);
        require!(description.len() <= MAX_DESC_LEN, ErrorCode::DescriptionTooLong);
        require!(funding_end_ts > Clock::get()?.unix_timestamp, ErrorCode::InvalidTimestamp);
        require!(voting_end_ts > funding_end_ts, ErrorCode::InvalidTimestamp);

        let season = &mut ctx.accounts.season;
        season.authority = ctx.accounts.authority.key();
        season.title = title;
        season.description = description;
        season.funding_end_ts = funding_end_ts;
        season.voting_end_ts = voting_end_ts;
        season.min_funding_per_region = min_funding_per_region;
        season.total_funded = 0;
        season.regions_funded = 0;
        season.is_finalized = false;
        season.final_nft_mint = None;
        season.bump = ctx.bumps.season;

        msg!("Season created: {}", season.title);
        Ok(())
    }

    /// Fund a region on the canvas
    pub fn fund_region(
        ctx: Context<FundRegion>,
        region_x: u8,
        region_y: u8,
        amount: u64,
    ) -> Result<()> {
        require!(region_x < GRID_SIZE && region_y < GRID_SIZE, ErrorCode::InvalidRegion);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let season = &ctx.accounts.season;
        require!(!season.is_finalized, ErrorCode::SeasonFinalized);
        require!(Clock::get()?.unix_timestamp < season.funding_end_ts, ErrorCode::FundingEnded);

        // Transfer SOL to region vault
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.funder.to_account_info(),
                    to: ctx.accounts.region_vault.to_account_info(),
                },
            ),
            amount,
        )?;

        let region = &mut ctx.accounts.region;
        let is_new = region.total_funded == 0;
        
        region.season = ctx.accounts.season.key();
        region.x = region_x;
        region.y = region_y;
        region.total_funded = region.total_funded.checked_add(amount).unwrap();
        region.contributor_count = region.contributor_count.checked_add(1).unwrap();
        region.winning_bid = None;
        region.is_painted = false;
        region.vault_bump = ctx.bumps.region_vault;
        region.bump = ctx.bumps.region;

        // Track contribution
        let contribution = &mut ctx.accounts.contribution;
        contribution.region = ctx.accounts.region.key();
        contribution.contributor = ctx.accounts.funder.key();
        contribution.amount = contribution.amount.checked_add(amount).unwrap();
        contribution.has_voted = false;
        contribution.bump = ctx.bumps.contribution;

        // Update season stats
        let season = &mut ctx.accounts.season;
        season.total_funded = season.total_funded.checked_add(amount).unwrap();
        if is_new {
            season.regions_funded = season.regions_funded.checked_add(1).unwrap();
        }

        msg!("Funded region ({}, {}) with {} lamports", region_x, region_y, amount);
        Ok(())
    }

    /// Artist submits a bid for a region
    pub fn submit_bid(
        ctx: Context<SubmitBid>,
        sketch_uri: String,
        requested_amount: u64,
    ) -> Result<()> {
        require!(sketch_uri.len() <= MAX_URI_LEN, ErrorCode::UriTooLong);

        let season = &ctx.accounts.season;
        let region = &ctx.accounts.region;
        
        require!(!season.is_finalized, ErrorCode::SeasonFinalized);
        require!(Clock::get()?.unix_timestamp < season.voting_end_ts, ErrorCode::VotingEnded);
        require!(region.total_funded >= season.min_funding_per_region, ErrorCode::InsufficientFunding);
        require!(requested_amount <= region.total_funded, ErrorCode::BidTooHigh);

        let bid = &mut ctx.accounts.bid;
        bid.region = ctx.accounts.region.key();
        bid.artist = ctx.accounts.artist.key();
        bid.sketch_uri = sketch_uri;
        bid.requested_amount = requested_amount;
        bid.vote_count = 0;
        bid.vote_weight = 0;
        bid.final_art_uri = None;
        bid.is_winner = false;
        bid.bump = ctx.bumps.bid;

        msg!("Bid submitted by artist for region");
        Ok(())
    }

    /// Contributor votes for a bid
    pub fn vote_for_bid(ctx: Context<VoteForBid>) -> Result<()> {
        let season = &ctx.accounts.season;
        let now = Clock::get()?.unix_timestamp;
        
        require!(!season.is_finalized, ErrorCode::SeasonFinalized);
        require!(now >= season.funding_end_ts, ErrorCode::FundingNotEnded);
        require!(now < season.voting_end_ts, ErrorCode::VotingEnded);

        let contribution = &mut ctx.accounts.contribution;
        require!(!contribution.has_voted, ErrorCode::AlreadyVoted);
        
        contribution.has_voted = true;
        contribution.voted_bid = Some(ctx.accounts.bid.key());

        let bid = &mut ctx.accounts.bid;
        bid.vote_count = bid.vote_count.checked_add(1).unwrap();
        bid.vote_weight = bid.vote_weight.checked_add(contribution.amount).unwrap();

        msg!("Vote recorded with weight {}", contribution.amount);
        Ok(())
    }

    /// Finalize a region - select winning bid
    pub fn finalize_region(ctx: Context<FinalizeRegion>) -> Result<()> {
        let season = &ctx.accounts.season;
        let now = Clock::get()?.unix_timestamp;
        
        require!(!season.is_finalized, ErrorCode::SeasonFinalized);
        require!(now >= season.voting_end_ts, ErrorCode::VotingNotEnded);

        let region = &mut ctx.accounts.region;
        require!(region.winning_bid.is_none(), ErrorCode::AlreadyFinalized);

        let bid = &mut ctx.accounts.bid;
        require!(bid.vote_weight > 0, ErrorCode::NoVotes);

        bid.is_winner = true;
        region.winning_bid = Some(ctx.accounts.bid.key());

        msg!("Region finalized with winning bid");
        Ok(())
    }

    /// Winning artist submits final artwork
    pub fn submit_final_art(ctx: Context<SubmitFinalArt>, final_art_uri: String) -> Result<()> {
        require!(final_art_uri.len() <= MAX_URI_LEN, ErrorCode::UriTooLong);

        let bid = &mut ctx.accounts.bid;
        require!(bid.is_winner, ErrorCode::NotWinner);
        require!(bid.final_art_uri.is_none(), ErrorCode::AlreadySubmitted);

        bid.final_art_uri = Some(final_art_uri.clone());

        let region = &mut ctx.accounts.region;
        region.is_painted = true;
        region.final_art_uri = Some(final_art_uri);

        msg!("Final art submitted for region");
        Ok(())
    }

    /// Claim artist payout
    pub fn claim_artist_payout(ctx: Context<ClaimArtistPayout>) -> Result<()> {
        let bid = &ctx.accounts.bid;
        require!(bid.is_winner, ErrorCode::NotWinner);
        require!(bid.final_art_uri.is_some(), ErrorCode::ArtNotSubmitted);

        let region = &ctx.accounts.region;
        let payout = bid.requested_amount;

        // Transfer from region vault to artist
        let region_x = region.x;
        let region_y = region.y;
        let seeds = &[
            b"region_vault".as_ref(),
            region.season.as_ref(),
            &[region_x],
            &[region_y],
            &[region.vault_bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.region_vault.key(),
            &ctx.accounts.artist.key(),
            payout,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.region_vault.to_account_info(),
                ctx.accounts.artist.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer,
        )?;

        msg!("Artist payout of {} lamports claimed", payout);
        Ok(())
    }

    /// Finalize season - mark as complete
    pub fn finalize_season(ctx: Context<FinalizeSeason>, final_nft_uri: String) -> Result<()> {
        require!(final_nft_uri.len() <= MAX_URI_LEN, ErrorCode::UriTooLong);

        let season = &mut ctx.accounts.season;
        require!(!season.is_finalized, ErrorCode::SeasonFinalized);
        require!(Clock::get()?.unix_timestamp >= season.voting_end_ts, ErrorCode::VotingNotEnded);

        season.is_finalized = true;
        season.final_nft_uri = Some(final_nft_uri);

        msg!("Season finalized");
        Ok(())
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateSeason<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Season::INIT_SPACE,
        seeds = [b"season", authority.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub season: Account<'info, Season>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(region_x: u8, region_y: u8)]
pub struct FundRegion<'info> {
    #[account(mut)]
    pub season: Account<'info, Season>,

    /// CHECK: Region PDA - we derive it manually
    #[account(
        init_if_needed,
        payer = funder,
        space = 8 + Region::INIT_SPACE,
        seeds = [b"region", season.key().as_ref(), &[region_x], &[region_y]],
        bump
    )]
    pub region: Account<'info, Region>,

    /// CHECK: Region vault PDA for holding funds
    #[account(
        mut,
        seeds = [b"region_vault", season.key().as_ref(), &[region_x], &[region_y]],
        bump
    )]
    pub region_vault: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = funder,
        space = 8 + Contribution::INIT_SPACE,
        seeds = [b"contribution", season.key().as_ref(), &[region_x], &[region_y], funder.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, Contribution>,

    #[account(mut)]
    pub funder: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitBid<'info> {
    pub season: Account<'info, Season>,

    #[account(
        constraint = region.season == season.key()
    )]
    pub region: Account<'info, Region>,

    #[account(
        init,
        payer = artist,
        space = 8 + Bid::INIT_SPACE,
        seeds = [b"bid", region.key().as_ref(), artist.key().as_ref()],
        bump
    )]
    pub bid: Account<'info, Bid>,

    #[account(mut)]
    pub artist: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteForBid<'info> {
    pub season: Account<'info, Season>,

    #[account(
        constraint = region.season == season.key()
    )]
    pub region: Account<'info, Region>,

    #[account(
        mut,
        constraint = bid.region == region.key()
    )]
    pub bid: Account<'info, Bid>,

    #[account(
        mut,
        constraint = contribution.region == region.key(),
        constraint = contribution.contributor == voter.key()
    )]
    pub contribution: Account<'info, Contribution>,

    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct FinalizeRegion<'info> {
    pub season: Account<'info, Season>,

    #[account(
        mut,
        constraint = region.season == season.key()
    )]
    pub region: Account<'info, Region>,

    #[account(
        mut,
        constraint = bid.region == region.key()
    )]
    pub bid: Account<'info, Bid>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitFinalArt<'info> {
    #[account(
        mut,
        constraint = region.winning_bid == Some(bid.key())
    )]
    pub region: Account<'info, Region>,

    #[account(
        mut,
        constraint = bid.artist == artist.key()
    )]
    pub bid: Account<'info, Bid>,

    pub artist: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimArtistPayout<'info> {
    #[account(
        constraint = region.winning_bid == Some(bid.key())
    )]
    pub region: Account<'info, Region>,

    /// CHECK: Region vault PDA for holding funds
    #[account(
        mut,
        seeds = [b"region_vault", region.season.as_ref(), &[region.x], &[region.y]],
        bump = region.vault_bump
    )]
    pub region_vault: SystemAccount<'info>,

    #[account(
        constraint = bid.artist == artist.key(),
        constraint = bid.is_winner
    )]
    pub bid: Account<'info, Bid>,

    #[account(mut)]
    pub artist: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeSeason<'info> {
    #[account(
        mut,
        constraint = season.authority == authority.key()
    )]
    pub season: Account<'info, Season>,

    pub authority: Signer<'info>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Season {
    pub authority: Pubkey,
    #[max_len(64)]
    pub title: String,
    #[max_len(256)]
    pub description: String,
    pub funding_end_ts: i64,
    pub voting_end_ts: i64,
    pub min_funding_per_region: u64,
    pub total_funded: u64,
    pub regions_funded: u8,
    pub is_finalized: bool,
    pub final_nft_mint: Option<Pubkey>,
    #[max_len(200)]
    pub final_nft_uri: Option<String>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Region {
    pub season: Pubkey,
    pub x: u8,
    pub y: u8,
    pub total_funded: u64,
    pub contributor_count: u32,
    pub winning_bid: Option<Pubkey>,
    pub is_painted: bool,
    #[max_len(200)]
    pub final_art_uri: Option<String>,
    pub vault_bump: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Contribution {
    pub region: Pubkey,
    pub contributor: Pubkey,
    pub amount: u64,
    pub has_voted: bool,
    pub voted_bid: Option<Pubkey>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bid {
    pub region: Pubkey,
    pub artist: Pubkey,
    #[max_len(200)]
    pub sketch_uri: String,
    pub requested_amount: u64,
    pub vote_count: u32,
    pub vote_weight: u64,
    #[max_len(200)]
    pub final_art_uri: Option<String>,
    pub is_winner: bool,
    pub bump: u8,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Title too long")]
    TitleTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("URI too long")]
    UriTooLong,
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    #[msg("Invalid region coordinates")]
    InvalidRegion,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Season is finalized")]
    SeasonFinalized,
    #[msg("Funding period ended")]
    FundingEnded,
    #[msg("Funding period not ended")]
    FundingNotEnded,
    #[msg("Voting period ended")]
    VotingEnded,
    #[msg("Voting period not ended")]
    VotingNotEnded,
    #[msg("Insufficient funding for region")]
    InsufficientFunding,
    #[msg("Bid amount exceeds region funding")]
    BidTooHigh,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("No votes received")]
    NoVotes,
    #[msg("Region already finalized")]
    AlreadyFinalized,
    #[msg("Not the winning bid")]
    NotWinner,
    #[msg("Art already submitted")]
    AlreadySubmitted,
    #[msg("Art not submitted yet")]
    ArtNotSubmitted,
}
