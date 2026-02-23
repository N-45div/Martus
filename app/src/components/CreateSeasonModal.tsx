import { useState } from 'react';

interface CreateSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string, fundingDays: number, votingDays: number, minFunding: number) => void;
}

export function CreateSeasonModal({ isOpen, onClose, onCreate }: CreateSeasonModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fundingDays, setFundingDays] = useState(3);
  const [votingDays, setVotingDays] = useState(2);
  const [minFunding, setMinFunding] = useState(0.1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description) {
      onCreate(title, description, fundingDays, votingDays, minFunding);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[--pixel-black]/90 flex items-center justify-center z-50">
      <div className="card pixel-border-accent w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-sm text-pixel-cyan">🎮 NEW GAME</h2>
          <button onClick={onClose} className="text-[--pixel-light] hover:text-pixel-red text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[--pixel-light] mb-2">► TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter season name..."
              className="input-pixel w-full"
              maxLength={64}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-[--pixel-light] mb-2">► DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the theme?"
              className="input-pixel w-full h-20 resize-none"
              maxLength={256}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[--pixel-light] mb-2">► FUND DAYS</label>
              <input
                type="number"
                value={fundingDays}
                onChange={(e) => setFundingDays(parseInt(e.target.value))}
                min={1}
                max={30}
                className="input-pixel w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-[--pixel-light] mb-2">► VOTE DAYS</label>
              <input
                type="number"
                value={votingDays}
                onChange={(e) => setVotingDays(parseInt(e.target.value))}
                min={1}
                max={30}
                className="input-pixel w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[--pixel-light] mb-2">► MIN SOL / REGION</label>
            <input
              type="number"
              value={minFunding}
              onChange={(e) => setMinFunding(parseFloat(e.target.value))}
              min={0.01}
              step={0.01}
              className="input-pixel w-full"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t-2 border-[--pixel-mid]">
            <button type="button" onClick={onClose} className="btn-danger flex-1">
              ✕ CANCEL
            </button>
            <button type="submit" className="btn-primary flex-1">
              ▶ START
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
