import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// Deployed to devnet
export const PROGRAM_ID = new PublicKey('4rKLBVWtCkKGR2cP7iD5Bs9pNSGcFjNeK5BvMsR8MGX6');
export const GRID_SIZE = 8;

export function getSeasonPDA(authority: PublicKey, title: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('season'), authority.toBuffer(), Buffer.from(title)],
    PROGRAM_ID
  );
}

export function getRegionPDA(season: PublicKey, x: number, y: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('region'), season.toBuffer(), Buffer.from([x]), Buffer.from([y])],
    PROGRAM_ID
  );
}

export function getRegionVaultPDA(season: PublicKey, x: number, y: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('region_vault'), season.toBuffer(), Buffer.from([x]), Buffer.from([y])],
    PROGRAM_ID
  );
}

export function getContributionPDA(
  season: PublicKey,
  x: number,
  y: number,
  contributor: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('contribution'),
      season.toBuffer(),
      Buffer.from([x]),
      Buffer.from([y]),
      contributor.toBuffer(),
    ],
    PROGRAM_ID
  );
}

export function getBidPDA(region: PublicKey, artist: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bid'), region.toBuffer(), artist.toBuffer()],
    PROGRAM_ID
  );
}

export function lamportsToSol(lamports: number | BN): number {
  const value = typeof lamports === 'number' ? lamports : lamports.toNumber();
  return value / 1e9;
}

export function solToLamports(sol: number): BN {
  return new BN(Math.floor(sol * 1e9));
}

export function formatAddress(address: PublicKey | string): string {
  const str = typeof address === 'string' ? address : address.toBase58();
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

export function getPhase(season: { fundingEndTs: number; votingEndTs: number; isFinalized: boolean }): 'funding' | 'voting' | 'finalized' {
  const now = Date.now() / 1000;
  if (season.isFinalized) return 'finalized';
  if (now < season.fundingEndTs) return 'funding';
  if (now < season.votingEndTs) return 'voting';
  return 'finalized';
}

export function formatTimeRemaining(endTs: number): string {
  const now = Date.now() / 1000;
  const remaining = endTs - now;
  
  if (remaining <= 0) return 'Ended';
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
