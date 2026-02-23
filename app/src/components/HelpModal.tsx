import { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    title: 'WELCOME TO MARTUS',
    emoji: '🎮',
    content: 'Martus is a collaborative pixel canvas where communities fund and vote on artwork. Built on Solana with Tapestry social features!',
  },
  {
    title: 'STEP 1: CONNECT WALLET',
    emoji: '🔗',
    content: 'Click the wallet button in the top right to connect your Solana wallet (Phantom, Solflare, etc). You need devnet SOL to participate.',
  },
  {
    title: 'STEP 2: FUND A REGION',
    emoji: '💰',
    content: 'Click any grid cell to select a region. During the FUNDING phase, stake SOL to regions you want to see painted. Your stake = your voting power!',
  },
  {
    title: 'STEP 3: ARTISTS BID',
    emoji: '🎨',
    content: 'When voting starts, artists submit sketches and request a portion of the pool. They compete for community approval!',
  },
  {
    title: 'STEP 4: VOTE ON BIDS',
    emoji: '🗳️',
    content: 'As a funder, your voting weight equals your contribution. Vote for your favorite artist to paint the region!',
  },
  {
    title: 'STEP 5: ARTWORK & PAYOUT',
    emoji: '✨',
    content: 'Winning artists paint the final pixel art and claim their payout. The canvas fills with community-funded art!',
  },
  {
    title: 'SOCIAL FEATURES',
    emoji: '💬',
    content: 'Use Tapestry-powered comments to discuss regions, share ideas, and connect with other artists and funders!',
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-[--pixel-black]/90 flex items-center justify-center z-50">
      <div className="card pixel-border-accent w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-pixel-yellow">❓ HOW TO PLAY</span>
            <span className="text-xs text-[--pixel-light]">
              {step + 1}/{TOUR_STEPS.length}
            </span>
          </div>
          <button onClick={onClose} className="text-[--pixel-light] hover:text-pixel-red text-2xl">
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-6">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 ${i <= step ? 'bg-[--pixel-cyan]' : 'bg-[--pixel-mid]'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center py-6">
          <div className="text-6xl mb-4">{currentStep.emoji}</div>
          <h3 className="font-pixel text-sm text-pixel-cyan mb-4">{currentStep.title}</h3>
          <p className="text-[--pixel-white] leading-relaxed">{currentStep.content}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t-2 border-[--pixel-mid]">
          <button
            onClick={() => setStep(step - 1)}
            disabled={isFirst}
            className={`flex-1 py-3 border-2 font-pixel text-xs ${
              isFirst
                ? 'border-[--pixel-mid] text-[--pixel-mid] cursor-not-allowed'
                : 'border-[--pixel-light] text-[--pixel-light] hover:border-[--pixel-cyan] hover:text-pixel-cyan'
            }`}
          >
            ◄ BACK
          </button>
          {isLast ? (
            <button onClick={onClose} className="btn-primary flex-1">
              ▶ START PLAYING
            </button>
          ) : (
            <button onClick={() => setStep(step + 1)} className="btn-primary flex-1">
              NEXT ►
            </button>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={onClose}
          className="w-full mt-3 text-center text-xs text-[--pixel-mid] hover:text-[--pixel-light]"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
}
