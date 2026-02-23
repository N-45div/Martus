import type { Season, SeasonPhase } from '../types';
import { lamportsToSol, formatTimeRemaining, getPhase } from '../lib/program';
import { Clock, Users, Coins } from 'lucide-react';

interface SeasonHeaderProps {
  season: Season | null;
  onCreateSeason?: () => void;
}

export function SeasonHeader({ season, onCreateSeason }: SeasonHeaderProps) {
  if (!season) {
    return (
      <div className="card text-center py-8">
        <h2 className="text-2xl font-bold mb-4">No Active Season</h2>
        <p className="text-gray-400 mb-6">Create a new season to start the collaborative canvas!</p>
        {onCreateSeason && (
          <button onClick={onCreateSeason} className="btn-primary">
            Create Season
          </button>
        )}
      </div>
    );
  }

  const phase = getPhase(season);
  const phaseColors: Record<SeasonPhase, string> = {
    funding: 'bg-emerald-500',
    voting: 'bg-indigo-500',
    finalized: 'bg-amber-500',
  };

  const phaseLabels: Record<SeasonPhase, string> = {
    funding: 'Funding Phase',
    voting: 'Voting Phase',
    finalized: 'Finalized',
  };

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{season.title}</h1>
            <span className={`${phaseColors[phase]} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
              {phaseLabels[phase]}
            </span>
          </div>
          <p className="text-gray-400">{season.description}</p>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1 text-emerald-400 mb-1">
              <Coins size={16} />
              <span className="text-lg font-bold">{lamportsToSol(season.totalFunded).toFixed(2)}</span>
            </div>
            <span className="text-xs text-gray-400">SOL Funded</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1 text-indigo-400 mb-1">
              <Users size={16} />
              <span className="text-lg font-bold">{season.regionsFunded}</span>
            </div>
            <span className="text-xs text-gray-400">Regions</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1 text-amber-400 mb-1">
              <Clock size={16} />
              <span className="text-lg font-bold">
                {phase === 'funding'
                  ? formatTimeRemaining(season.fundingEndTs)
                  : phase === 'voting'
                  ? formatTimeRemaining(season.votingEndTs)
                  : '—'}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {phase === 'funding' ? 'Until Voting' : phase === 'voting' ? 'Until End' : 'Complete'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
