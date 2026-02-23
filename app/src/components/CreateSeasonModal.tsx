import { useState } from 'react';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Create New Season</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Season name..."
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
              maxLength={64}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this season about?"
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-24 resize-none"
              maxLength={256}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Funding Period (days)</label>
              <input
                type="number"
                value={fundingDays}
                onChange={(e) => setFundingDays(parseInt(e.target.value))}
                min={1}
                max={30}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Voting Period (days)</label>
              <input
                type="number"
                value={votingDays}
                onChange={(e) => setVotingDays(parseInt(e.target.value))}
                min={1}
                max={30}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Min Funding per Region (SOL)</label>
            <input
              type="number"
              value={minFunding}
              onChange={(e) => setMinFunding(parseFloat(e.target.value))}
              min={0.01}
              step={0.01}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Create Season
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
