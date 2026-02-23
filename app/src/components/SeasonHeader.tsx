import type { Season, SeasonPhase } from '../types';
import { lamportsToSol, formatTimeRemaining, getPhase } from '../lib/program';

interface SeasonHeaderProps {
  season: Season | null;
  onCreateSeason?: () => void;
}

export function SeasonHeader({ season, onCreateSeason }: SeasonHeaderProps) {
  if (!season) {
    return (
      <div className="card text-center py-8">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="font-pixel text-lg text-pixel-yellow mb-4">NO ACTIVE SEASON</h2>
        <p className="text-[--pixel-light] mb-6">Insert coin to start a new collaborative canvas!</p>
        {onCreateSeason && (
          <button onClick={onCreateSeason} className="btn-primary">
            ▶ START GAME
          </button>
        )}
      </div>
    );
  }

  const phase = getPhase(season);
  const phaseColors: Record<SeasonPhase, string> = {
    funding: 'bg-[--pixel-green] text-[--pixel-black]',
    voting: 'bg-[--pixel-orange] text-[--pixel-black]',
    finalized: 'bg-[--pixel-purple] text-[--pixel-white]',
  };

  const phaseLabels: Record<SeasonPhase, string> = {
    funding: '● FUNDING',
    voting: '● VOTING',
    finalized: '★ COMPLETE',
  };

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-pixel text-sm text-pixel-cyan">{season.title.toUpperCase()}</h1>
            <span className={`${phaseColors[phase]} font-pixel text-[8px] px-3 py-2`}>
              {phaseLabels[phase]}
            </span>
          </div>
          <p className="text-[--pixel-light]">{season.description}</p>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-pixel-green font-pixel text-xs mb-1">
              {lamportsToSol(season.totalFunded).toFixed(2)}
            </div>
            <span className="text-xs text-[--pixel-light]">SOL POOL</span>
          </div>

          <div className="text-center">
            <div className="text-pixel-cyan font-pixel text-xs mb-1">
              {season.regionsFunded}/64
            </div>
            <span className="text-xs text-[--pixel-light]">REGIONS</span>
          </div>

          <div className="text-center">
            <div className="text-pixel-yellow font-pixel text-xs mb-1">
              {phase === 'funding'
                ? formatTimeRemaining(season.fundingEndTs)
                : phase === 'voting'
                ? formatTimeRemaining(season.votingEndTs)
                : '—'}
            </div>
            <span className="text-xs text-[--pixel-light]">
              {phase === 'funding' ? 'TO VOTE' : phase === 'voting' ? 'TO END' : 'DONE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
