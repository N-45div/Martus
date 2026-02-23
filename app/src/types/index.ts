import { PublicKey } from '@solana/web3.js';

export interface Season {
  publicKey: PublicKey;
  authority: PublicKey;
  title: string;
  description: string;
  fundingEndTs: number;
  votingEndTs: number;
  minFundingPerRegion: number;
  totalFunded: number;
  regionsFunded: number;
  isFinalized: boolean;
  finalNftMint: PublicKey | null;
  finalNftUri: string | null;
  bump: number;
}

export interface Region {
  publicKey: PublicKey;
  season: PublicKey;
  x: number;
  y: number;
  totalFunded: number;
  contributorCount: number;
  winningBid: PublicKey | null;
  isPainted: boolean;
  finalArtUri: string | null;
  vaultBump: number;
  bump: number;
}

export interface Contribution {
  publicKey: PublicKey;
  region: PublicKey;
  contributor: PublicKey;
  amount: number;
  hasVoted: boolean;
  votedBid: PublicKey | null;
  bump: number;
}

export interface Bid {
  publicKey: PublicKey;
  region: PublicKey;
  artist: PublicKey;
  sketchUri: string;
  requestedAmount: number;
  voteCount: number;
  voteWeight: number;
  finalArtUri: string | null;
  isWinner: boolean;
  bump: number;
}

export type SeasonPhase = 'funding' | 'voting' | 'finalized';

export interface RegionWithBids extends Region {
  bids: Bid[];
  myContribution?: Contribution;
}

export interface ActivityItem {
  id: string;
  type: 'fund' | 'bid' | 'vote' | 'paint' | 'comment';
  actor: string;
  regionX?: number;
  regionY?: number;
  amount?: number;
  message?: string;
  timestamp: number;
}
