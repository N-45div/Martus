import { GRID_SIZE, lamportsToSol } from '../lib/program';
import type { Region, SeasonPhase } from '../types';

interface CanvasGridProps {
  regions: Map<string, Region>;
  phase: SeasonPhase;
  onRegionClick: (x: number, y: number, region?: Region) => void;
  selectedRegion: { x: number; y: number } | null;
}

export function CanvasGrid({ regions, phase, onRegionClick, selectedRegion }: CanvasGridProps) {
  const getRegionKey = (x: number, y: number) => `${x}-${y}`;

  const getRegionClass = (region?: Region) => {
    if (!region) return 'region-cell region-empty';
    if (region.isPainted) return 'region-cell region-painted';
    if (phase === 'voting') return 'region-cell region-voting';
    return 'region-cell region-funded';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Canvas Grid</h2>
        <div className="flex gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-600 border border-dashed border-gray-500" />
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-800 border border-emerald-500" />
            <span>Funded</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-indigo-800 border border-indigo-500" />
            <span>Voting</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-800 border border-amber-500" />
            <span>Painted</span>
          </div>
        </div>
      </div>

      <div 
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {Array.from({ length: GRID_SIZE }, (_, y) =>
          Array.from({ length: GRID_SIZE }, (_, x) => {
            const key = getRegionKey(x, y);
            const region = regions.get(key);
            const isSelected = selectedRegion?.x === x && selectedRegion?.y === y;

            return (
              <div
                key={key}
                onClick={() => onRegionClick(x, y, region)}
                className={`${getRegionClass(region)} ${isSelected ? 'ring-2 ring-white scale-110 z-10' : ''}`}
              >
                {region?.isPainted && region.finalArtUri ? (
                  <img
                    src={region.finalArtUri}
                    alt={`Region ${x},${y}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-1">
                    {region ? (
                      <>
                        <span className="text-xs font-mono text-white/70">
                          {x},{y}
                        </span>
                        <span className="text-xs text-emerald-400 font-semibold">
                          {lamportsToSol(region.totalFunded).toFixed(2)} SOL
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-mono text-gray-500">
                        {x},{y}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
