import { useState } from 'react';
import type { Region, Bid, Contribution, SeasonPhase } from '../types';
import { lamportsToSol, formatAddress } from '../lib/program';
import { Coins, Send, Vote, Trophy, Image } from 'lucide-react';

interface RegionPanelProps {
  x: number;
  y: number;
  region?: Region;
  bids: Bid[];
  myContribution?: Contribution;
  phase: SeasonPhase;
  onFund: (amount: number) => void;
  onSubmitBid: (sketchUri: string, amount: number) => void;
  onVote: (bidPubkey: string) => void;
  onClose: () => void;
}

export function RegionPanel({
  x,
  y,
  region,
  bids,
  myContribution,
  phase,
  onFund,
  onSubmitBid,
  onVote,
  onClose,
}: RegionPanelProps) {
  const [fundAmount, setFundAmount] = useState('0.1');
  const [sketchUri, setSketchUri] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  const handleFund = () => {
    const amount = parseFloat(fundAmount);
    if (amount > 0) {
      onFund(amount);
    }
  };

  const handleSubmitBid = () => {
    const amount = parseFloat(bidAmount);
    if (sketchUri && amount > 0) {
      onSubmitBid(sketchUri, amount);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">
          Region ({x}, {y})
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      {region ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total Funded</span>
              <p className="text-emerald-400 font-bold text-lg">
                {lamportsToSol(region.totalFunded).toFixed(4)} SOL
              </p>
            </div>
            <div>
              <span className="text-gray-400">Contributors</span>
              <p className="text-white font-bold text-lg">{region.contributorCount}</p>
            </div>
          </div>

          {myContribution && (
            <div className="bg-emerald-900/30 rounded-lg p-3">
              <span className="text-sm text-gray-400">Your Contribution</span>
              <p className="text-emerald-400 font-bold">
                {lamportsToSol(myContribution.amount).toFixed(4)} SOL
              </p>
            </div>
          )}

          {phase === 'funding' && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Add Funding (SOL)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white"
                  min="0.001"
                  step="0.01"
                />
                <button onClick={handleFund} className="btn-primary flex items-center gap-2">
                  <Coins size={16} />
                  Fund
                </button>
              </div>
            </div>
          )}

          {phase === 'voting' && (
            <>
              <div className="border-t border-white/10 pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Vote size={16} />
                  Artist Bids ({bids.length})
                </h4>
                {bids.length > 0 ? (
                  <div className="space-y-2">
                    {bids.map((bid) => (
                      <div
                        key={bid.publicKey.toBase58()}
                        className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-mono text-gray-300">
                            {formatAddress(bid.artist)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Asking: {lamportsToSol(bid.requestedAmount).toFixed(2)} SOL
                          </p>
                          <p className="text-xs text-indigo-400">
                            Votes: {bid.voteCount} ({lamportsToSol(bid.voteWeight).toFixed(2)} SOL weight)
                          </p>
                        </div>
                        {myContribution && !myContribution.hasVoted && (
                          <button
                            onClick={() => onVote(bid.publicKey.toBase58())}
                            className="btn-secondary text-sm"
                          >
                            Vote
                          </button>
                        )}
                        {bid.isWinner && (
                          <Trophy className="text-amber-400" size={20} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No bids yet</p>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Image size={16} />
                  Submit Your Bid
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Sketch URI (IPFS or URL)"
                    value={sketchUri}
                    onChange={(e) => setSketchUri(e.target.value)}
                    className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Request amount (SOL)"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white"
                    />
                    <button onClick={handleSubmitBid} className="btn-secondary flex items-center gap-2">
                      <Send size={16} />
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {region.isPainted && region.finalArtUri && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="font-semibold mb-2">Final Artwork</h4>
              <img
                src={region.finalArtUri}
                alt="Final artwork"
                className="w-full rounded-lg"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-400">This region has no funding yet.</p>
          {phase === 'funding' && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Be the first to fund! (SOL)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white"
                  min="0.001"
                  step="0.01"
                />
                <button onClick={handleFund} className="btn-primary flex items-center gap-2">
                  <Coins size={16} />
                  Fund
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
