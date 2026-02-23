import { useState } from 'react';
import type { Region, Bid, Contribution, SeasonPhase } from '../types';
import { lamportsToSol, formatAddress } from '../lib/program';

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
        <h3 className="font-pixel text-xs text-pixel-cyan">
          REGION [{x},{y}]
        </h3>
        <button onClick={onClose} className="text-[--pixel-light] hover:text-pixel-red text-xl">
          ×
        </button>
      </div>

      {region ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[--pixel-black] p-3 border-2 border-[--pixel-mid]">
              <span className="text-xs text-[--pixel-light]">TOTAL POOL</span>
              <p className="text-pixel-green font-pixel text-sm mt-1">
                {lamportsToSol(region.totalFunded).toFixed(2)} ◎
              </p>
            </div>
            <div className="bg-[--pixel-black] p-3 border-2 border-[--pixel-mid]">
              <span className="text-xs text-[--pixel-light]">PLAYERS</span>
              <p className="text-pixel-cyan font-pixel text-sm mt-1">{region.contributorCount}</p>
            </div>
          </div>

          {myContribution && (
            <div className="bg-[--pixel-green] bg-opacity-20 p-3 border-2 border-[--pixel-green]">
              <span className="text-xs text-[--pixel-light]">YOUR STAKE</span>
              <p className="text-pixel-green font-pixel text-sm mt-1">
                {lamportsToSol(myContribution.amount).toFixed(4)} ◎
              </p>
            </div>
          )}

          {phase === 'funding' && (
            <div className="space-y-3 border-t-2 border-[--pixel-mid] pt-4">
              <label className="text-xs text-[--pixel-light]">► ADD FUNDS (SOL)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="input-pixel flex-1"
                  min="0.001"
                  step="0.01"
                />
                <button onClick={handleFund} className="btn-primary">
                  💰 FUND
                </button>
              </div>
            </div>
          )}

          {phase === 'voting' && (
            <>
              <div className="border-t-2 border-[--pixel-mid] pt-4">
                <h4 className="font-pixel text-xs text-pixel-orange mb-3">
                  🎨 BIDS ({bids.length})
                </h4>
                {bids.length > 0 ? (
                  <div className="space-y-2">
                    {bids.map((bid) => (
                      <div
                        key={bid.publicKey.toBase58()}
                        className="bg-[--pixel-black] p-3 border-2 border-[--pixel-mid]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-[--pixel-light]">
                              {formatAddress(bid.artist)}
                            </p>
                            <p className="text-pixel-yellow text-sm mt-1">
                              ASK: {lamportsToSol(bid.requestedAmount).toFixed(2)} ◎
                            </p>
                            <p className="text-pixel-cyan text-xs">
                              VOTES: {bid.voteCount}
                            </p>
                          </div>
                          {myContribution && !myContribution.hasVoted && (
                            <button
                              onClick={() => onVote(bid.publicKey.toBase58())}
                              className="btn-secondary text-xs"
                            >
                              VOTE
                            </button>
                          )}
                          {bid.isWinner && (
                            <span className="text-2xl">🏆</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[--pixel-light] text-sm">No bids yet...</p>
                )}
              </div>

              <div className="border-t-2 border-[--pixel-mid] pt-4">
                <h4 className="font-pixel text-xs text-pixel-pink mb-3">
                  ✏️ SUBMIT BID
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="IPFS URI or URL"
                    value={sketchUri}
                    onChange={(e) => setSketchUri(e.target.value)}
                    className="input-pixel w-full"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="input-pixel flex-1"
                    />
                    <button onClick={handleSubmitBid} className="btn-secondary">
                      SEND
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {region.isPainted && region.finalArtUri && (
            <div className="border-t-2 border-[--pixel-mid] pt-4">
              <h4 className="font-pixel text-xs text-pixel-purple mb-2">★ ARTWORK</h4>
              <img
                src={region.finalArtUri}
                alt="Final artwork"
                className="w-full border-4 border-[--pixel-purple]"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-[--pixel-light]">Empty region - be first to claim!</p>
          </div>
          {phase === 'funding' && (
            <div className="space-y-3">
              <label className="text-xs text-[--pixel-light]">► STAKE SOL</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="input-pixel flex-1"
                  min="0.001"
                  step="0.01"
                />
                <button onClick={handleFund} className="btn-primary">
                  💰 FUND
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
