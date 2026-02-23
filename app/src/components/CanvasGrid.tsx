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
    <div 
      className="grid gap-1"
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
              className={`${getRegionClass(region)} ${isSelected ? 'border-[--pixel-cyan] border-4 scale-110 z-10' : ''}`}
            >
              {region?.isPainted && region.finalArtUri ? (
                <img
                  src={region.finalArtUri}
                  alt={`Region ${x},${y}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-1">
                  {region && region.totalFunded > 0 ? (
                    <>
                      <span className="font-pixel text-[6px] text-[--pixel-black]">
                        {lamportsToSol(region.totalFunded).toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span className="font-pixel text-[6px] text-[--pixel-light]">
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
  );
}
