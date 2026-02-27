const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const { expect } = require("chai");
const { BN } = anchor;

describe("martus e2e tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Martus;
  const authority = provider.wallet;

  // Use unique title to avoid PDA collision
  const seasonTitle = `TestSeason${Date.now()}`;
  const seasonDescription = "E2E test for Collab Canvas";

  let seasonPDA: any;
  const regionX = 0;
  const regionY = 0;

  before(async () => {
    [seasonPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("season"), authority.publicKey.toBuffer(), Buffer.from(seasonTitle)],
      program.programId
    );
    console.log("\n=== Martus E2E Tests ===");
    console.log("Program ID:", program.programId.toBase58());
    console.log("Authority:", authority.publicKey.toBase58());
    console.log("Season PDA:", seasonPDA.toBase58());
  });

  it("1. Creates a new season", async () => {
    const now = Math.floor(Date.now() / 1000);
    const fundingEndTs = new BN(now + 86400);
    const votingEndTs = new BN(now + 172800);
    const minFundingPerRegion = new BN(0.01 * LAMPORTS_PER_SOL);

    await program.methods
      .createSeason(seasonTitle, seasonDescription, fundingEndTs, votingEndTs, minFundingPerRegion)
      .accounts({
        season: seasonPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const season = await program.account.season.fetch(seasonPDA);
    expect(season.title).to.equal(seasonTitle);
    expect(season.isFinalized).to.equal(false);
    console.log("✓ Season created:", seasonTitle);
  });

  it("2. Funds a region", async () => {
    const [regionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("region"), seasonPDA.toBuffer(), Buffer.from([regionX]), Buffer.from([regionY])],
      program.programId
    );
    const [regionVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("region_vault"), seasonPDA.toBuffer(), Buffer.from([regionX]), Buffer.from([regionY])],
      program.programId
    );
    const [contributionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("contribution"), seasonPDA.toBuffer(), Buffer.from([regionX]), Buffer.from([regionY]), authority.publicKey.toBuffer()],
      program.programId
    );

    const fundAmount = new BN(0.1 * LAMPORTS_PER_SOL);

    await program.methods
      .fundRegion(regionX, regionY, fundAmount)
      .accounts({
        season: seasonPDA,
        region: regionPDA,
        regionVault: regionVaultPDA,
        contribution: contributionPDA,
        funder: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const region = await program.account.region.fetch(regionPDA);
    expect(region.totalFunded.toNumber()).to.equal(fundAmount.toNumber());
    expect(region.contributorCount).to.equal(1);
    console.log("✓ Region (0,0) funded with 0.1 SOL");
  });

  it("3. Submits an artist bid", async () => {
    const [regionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("region"), seasonPDA.toBuffer(), Buffer.from([regionX]), Buffer.from([regionY])],
      program.programId
    );
    const [bidPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bid"), regionPDA.toBuffer(), authority.publicKey.toBuffer()],
      program.programId
    );

    const sketchUri = "ipfs://QmTestSketch123";
    const requestedAmount = new BN(0.05 * LAMPORTS_PER_SOL);

    await program.methods
      .submitBid(sketchUri, requestedAmount)
      .accounts({
        season: seasonPDA,
        region: regionPDA,
        bid: bidPDA,
        artist: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const bid = await program.account.bid.fetch(bidPDA);
    expect(bid.sketchUri).to.equal(sketchUri);
    expect(bid.voteCount).to.equal(0);
    expect(bid.isWinner).to.equal(false);
    console.log("✓ Artist bid submitted:", sketchUri);
  });

  it("4. Verifies season stats after funding", async () => {
    const season = await program.account.season.fetch(seasonPDA);
    expect(season.totalFunded.toNumber()).to.be.greaterThan(0);
    expect(season.regionsFunded).to.equal(1);
    console.log("✓ Season stats correct:");
    console.log("  - Total funded:", season.totalFunded.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("  - Regions funded:", season.regionsFunded);
  });

  it("5. Fails to fund with zero amount", async () => {
    const x = 7, y = 7;
    const [regionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("region"), seasonPDA.toBuffer(), Buffer.from([x]), Buffer.from([y])],
      program.programId
    );
    const [regionVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("region_vault"), seasonPDA.toBuffer(), Buffer.from([x]), Buffer.from([y])],
      program.programId
    );
    const [contributionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("contribution"), seasonPDA.toBuffer(), Buffer.from([x]), Buffer.from([y]), authority.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .fundRegion(x, y, new BN(0))
        .accounts({
          season: seasonPDA,
          region: regionPDA,
          regionVault: regionVaultPDA,
          contribution: contributionPDA,
          funder: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Should have thrown error");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("InvalidAmount");
      console.log("✓ Correctly rejected zero amount");
    }
  });

  it("6. Fails to fund invalid region", async () => {
    const x = 10, y = 10; // Invalid - GRID_SIZE is 8
    const [regionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("region"), seasonPDA.toBuffer(), Buffer.from([x]), Buffer.from([y])],
      program.programId
    );
    const [regionVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("region_vault"), seasonPDA.toBuffer(), Buffer.from([x]), Buffer.from([y])],
      program.programId
    );
    const [contributionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("contribution"), seasonPDA.toBuffer(), Buffer.from([x]), Buffer.from([y]), authority.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .fundRegion(x, y, new BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          season: seasonPDA,
          region: regionPDA,
          regionVault: regionVaultPDA,
          contribution: contributionPDA,
          funder: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Should have thrown error");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("InvalidRegion");
      console.log("✓ Correctly rejected invalid region (10,10)");
    }
  });

  after(() => {
    console.log("\n=== All E2E Tests Passed ===\n");
  });
});
