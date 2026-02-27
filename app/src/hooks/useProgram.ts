import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, setProvider } from '@coral-xyz/anchor';
import {
  GRID_SIZE,
  getSeasonPDA,
  getRegionPDA,
  getRegionVaultPDA,
  getContributionPDA,
  getBidPDA,
  solToLamports,
  getPhase,
} from '../lib/program';
import type { Season, Region, Bid, Contribution, SeasonPhase, ActivityItem } from '../types';

// IDL will be loaded dynamically
let cachedIdl: object | null = null;

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [regions, setRegions] = useState<Map<string, Region>>(new Map());
  const [_bids, _setBids] = useState<Map<string, Bid[]>>(new Map());
  const [_myContributions, _setMyContributions] = useState<Map<string, Contribution>>(new Map());
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize program when wallet connects
  useEffect(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return;

    const initProgram = async () => {
      try {
        const provider = new AnchorProvider(
          connection,
          wallet as never,
          { commitment: 'confirmed' }
        );
        setProvider(provider);

        // Load IDL
        if (!cachedIdl) {
          const response = await fetch('/idl/martus.json');
          cachedIdl = await response.json();
        }

        const prog = new Program(cachedIdl as never, provider);
        setProgram(prog);
      } catch (err) {
        console.error('Failed to init program:', err);
        setError('Failed to initialize program');
      }
    };

    initProgram();
  }, [wallet.publicKey, wallet.signTransaction, connection]);

  // Fetch season data
  const fetchSeason = useCallback(async (seasonPubkey: PublicKey) => {
    if (!program) return null;

    try {
      const seasonAccount = await (program.account as Record<string, { fetch: (key: PublicKey) => Promise<Record<string, unknown>> }>).season.fetch(seasonPubkey);
      const seasonData: Season = {
        publicKey: seasonPubkey,
        authority: seasonAccount.authority as PublicKey,
        title: seasonAccount.title as string,
        description: seasonAccount.description as string,
        fundingEndTs: (seasonAccount.fundingEndTs as BN).toNumber(),
        votingEndTs: (seasonAccount.votingEndTs as BN).toNumber(),
        minFundingPerRegion: (seasonAccount.minFundingPerRegion as BN).toNumber(),
        totalFunded: (seasonAccount.totalFunded as BN).toNumber(),
        regionsFunded: seasonAccount.regionsFunded as number,
        isFinalized: seasonAccount.isFinalized as boolean,
        finalNftMint: seasonAccount.finalNftMint as PublicKey | null,
        finalNftUri: seasonAccount.finalNftUri as string | null,
        bump: seasonAccount.bump as number,
      };
      setSeason(seasonData);
      return seasonData;
    } catch {
      return null;
    }
  }, [program]);

  // Fetch all regions for a season
  const fetchRegions = useCallback(async (seasonPubkey: PublicKey) => {
    if (!program) return;

    const newRegions = new Map<string, Region>();

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        try {
          const [regionPDA] = getRegionPDA(seasonPubkey, x, y);
          const regionAccount = await (program.account as Record<string, { fetch: (key: PublicKey) => Promise<Record<string, unknown>> }>).region.fetch(regionPDA);
          
          const regionData: Region = {
            publicKey: regionPDA,
            season: regionAccount.season as PublicKey,
            x: regionAccount.x as number,
            y: regionAccount.y as number,
            totalFunded: (regionAccount.totalFunded as BN).toNumber(),
            contributorCount: regionAccount.contributorCount as number,
            winningBid: regionAccount.winningBid as PublicKey | null,
            isPainted: regionAccount.isPainted as boolean,
            finalArtUri: regionAccount.finalArtUri as string | null,
            vaultBump: regionAccount.vaultBump as number,
            bump: regionAccount.bump as number,
          };
          newRegions.set(`${x}-${y}`, regionData);
        } catch {
          // Region doesn't exist yet
        }
      }
    }

    setRegions(newRegions);
  }, [program]);

  // Create a new season
  const createSeason = useCallback(async (
    title: string,
    description: string,
    fundingDays: number,
    votingDays: number,
    minFundingPerRegion: number
  ) => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const fundingEndTs = new BN(now + fundingDays * 86400);
      const votingEndTs = new BN(now + (fundingDays + votingDays) * 86400);
      const minFunding = solToLamports(minFundingPerRegion);

      const [seasonPDA] = getSeasonPDA(wallet.publicKey, title);

      await (program.methods as Record<string, (...args: unknown[]) => { accounts: (accts: object) => { rpc: () => Promise<string> } }>)
        .createSeason(title, description, fundingEndTs, votingEndTs, minFunding)
        .accounts({
          season: seasonPDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await fetchSeason(seasonPDA);
      
      addActivity({
        id: Date.now().toString(),
        type: 'fund',
        actor: wallet.publicKey.toBase58(),
        message: `Created season "${title}"`,
        timestamp: Date.now(),
      });

      return seasonPDA;
    } catch (err) {
      console.error('Create season error:', err);
      setError('Failed to create season');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, fetchSeason]);

  // Fund a region
  const fundRegion = useCallback(async (
    seasonPubkey: PublicKey,
    x: number,
    y: number,
    amountSol: number
  ) => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const [regionPDA] = getRegionPDA(seasonPubkey, x, y);
      const [regionVaultPDA] = getRegionVaultPDA(seasonPubkey, x, y);
      const [contributionPDA] = getContributionPDA(seasonPubkey, x, y, wallet.publicKey);
      const amount = solToLamports(amountSol);

      await (program.methods as Record<string, (...args: unknown[]) => { accounts: (accts: object) => { rpc: () => Promise<string> } }>)
        .fundRegion(x, y, amount)
        .accounts({
          season: seasonPubkey,
          region: regionPDA,
          regionVault: regionVaultPDA,
          contribution: contributionPDA,
          funder: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await fetchRegions(seasonPubkey);
      await fetchSeason(seasonPubkey);

      addActivity({
        id: Date.now().toString(),
        type: 'fund',
        actor: wallet.publicKey.toBase58(),
        regionX: x,
        regionY: y,
        amount: amount.toNumber(),
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Fund region error:', err);
      setError('Failed to fund region');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, fetchRegions, fetchSeason]);

  // Submit a bid
  const submitBid = useCallback(async (
    seasonPubkey: PublicKey,
    regionPubkey: PublicKey,
    sketchUri: string,
    requestedAmountSol: number
  ) => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const [bidPDA] = getBidPDA(regionPubkey, wallet.publicKey);
      const amount = solToLamports(requestedAmountSol);

      await (program.methods as Record<string, (...args: unknown[]) => { accounts: (accts: object) => { rpc: () => Promise<string> } }>)
        .submitBid(sketchUri, amount)
        .accounts({
          season: seasonPubkey,
          region: regionPubkey,
          bid: bidPDA,
          artist: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      addActivity({
        id: Date.now().toString(),
        type: 'bid',
        actor: wallet.publicKey.toBase58(),
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Submit bid error:', err);
      setError('Failed to submit bid');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  // Vote for a bid
  const voteForBid = useCallback(async (
    seasonPubkey: PublicKey,
    regionPubkey: PublicKey,
    bidPubkey: PublicKey,
    x: number,
    y: number
  ) => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const [contributionPDA] = getContributionPDA(seasonPubkey, x, y, wallet.publicKey);

      await (program.methods as Record<string, () => { accounts: (accts: object) => { rpc: () => Promise<string> } }>)
        .voteForBid()
        .accounts({
          season: seasonPubkey,
          region: regionPubkey,
          bid: bidPubkey,
          contribution: contributionPDA,
          voter: wallet.publicKey,
        })
        .rpc();

      addActivity({
        id: Date.now().toString(),
        type: 'vote',
        actor: wallet.publicKey.toBase58(),
        regionX: x,
        regionY: y,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Vote error:', err);
      setError('Failed to vote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  const addActivity = (activity: ActivityItem) => {
    setActivities((prev) => [activity, ...prev].slice(0, 50));
  };

  return {
    program,
    season,
    regions,
    bids: _bids,
    myContributions: _myContributions,
    activities,
    loading,
    error,
    createSeason,
    fundRegion,
    submitBid,
    voteForBid,
    fetchSeason,
    fetchRegions,
    getPhase: season ? () => getPhase(season) : () => 'funding' as SeasonPhase,
  };
}
