import { useState, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import { SeasonHeader } from './components/SeasonHeader';
import { CanvasGrid } from './components/CanvasGrid';
import { RegionPanel } from './components/RegionPanel';
import { ActivityFeed } from './components/ActivityFeed';
import { CreateSeasonModal } from './components/CreateSeasonModal';
import { SocialPanel } from './components/SocialPanel';
import { HelpModal } from './components/HelpModal';
import { useProgram } from './hooks/useProgram';
import type { Region } from './types';

import '@solana/wallet-adapter-react-ui/styles.css';

function CollabCanvas() {
  const {
    season,
    regions,
    activities,
    loading,
    error,
    createSeason,
    fundRegion,
    submitBid,
    fetchBidsForRegion,
    getPhase,
  } = useProgram();

  const [selectedRegion, setSelectedRegion] = useState<{ x: number; y: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'region' | 'social'>('region');
  const [regionBids, setRegionBids] = useState<import('./types').Bid[]>([]);

  // Show help on first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('martus_tour_seen');
    if (!hasSeenTour) {
      setShowHelp(true);
      localStorage.setItem('martus_tour_seen', 'true');
    }
  }, []);

  const selectedRegionData = selectedRegion
    ? regions.get(`${selectedRegion.x}-${selectedRegion.y}`)
    : undefined;

  const phase = getPhase();

  const handleRegionClick = async (x: number, y: number, region?: Region) => {
    setSelectedRegion({ x, y });
    if (region) {
      const fetchedBids = await fetchBidsForRegion(region.publicKey);
      setRegionBids(fetchedBids);
    } else {
      setRegionBids([]);
    }
  };

  const handleFund = async (amount: number) => {
    if (!season || !selectedRegion) return;
    try {
      await fundRegion(season.publicKey, selectedRegion.x, selectedRegion.y, amount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitBid = async (sketchUri: string, amount: number) => {
    if (!season || !selectedRegion || !selectedRegionData) return;
    try {
      await submitBid(season.publicKey, selectedRegionData.publicKey, sketchUri, amount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (bidPubkey: string) => {
    console.log('Vote for bid:', bidPubkey);
  };

  const handleCreateSeason = async (
    title: string,
    description: string,
    fundingDays: number,
    votingDays: number,
    minFunding: number
  ) => {
    try {
      await createSeason(title, description, fundingDays, votingDays, minFunding);
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Scanlines overlay */}
      <div className="scanlines" />

      {/* Header */}
      <header className="border-b-4 border-[--pixel-mid] bg-[--pixel-dark]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🎮</div>
            <div>
              <h1 className="font-pixel text-lg text-pixel-cyan tracking-wider">MARTUS</h1>
              <p className="text-sm text-[--pixel-light] mt-1">[ COLLABORATIVE PIXEL CANVAS ]</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHelp(true)}
              className="px-3 py-2 border-2 border-[--pixel-yellow] text-pixel-yellow hover:bg-[--pixel-yellow] hover:text-[--pixel-black] font-pixel text-[8px]"
            >
              ❓ HELP
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-pixel-green">●</span>
              <span>DEVNET</span>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-[--pixel-blue] border-b-4 border-[--pixel-dark] py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span><span className="text-pixel-yellow">REGIONS:</span> 64</span>
            <span><span className="text-pixel-green">FUNDED:</span> {Array.from(regions.values()).filter(r => r.totalFunded > 0).length}</span>
            <span><span className="text-pixel-orange">PHASE:</span> {phase.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pixel-pink">♥</span>
            <span>PLACE YOUR PIXELS</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="card border-[--pixel-red] mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠</span>
              <span className="text-pixel-red">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="font-pixel text-pixel-cyan animate-pulse">LOADING...</div>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-4 h-4 bg-pixel-cyan"
                  style={{ animation: `pixel-blink 0.5s ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}

        <SeasonHeader
          season={season}
          onCreateSeason={() => setShowCreateModal(true)}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="card pixel-border-accent">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-pixel text-sm text-pixel-cyan">CANVAS</h2>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 region-empty" /> EMPTY
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[--pixel-green]" /> FUNDED
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[--pixel-orange]" /> VOTING
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[--pixel-purple]" /> PAINTED
                  </span>
                </div>
              </div>
              <CanvasGrid
                regions={regions}
                phase={phase}
                onRegionClick={handleRegionClick}
                selectedRegion={selectedRegion}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tab Buttons */}
            <div className="flex border-2 border-[--pixel-mid]">
              <button
                onClick={() => setActiveTab('region')}
                className={`flex-1 py-2 font-pixel text-[8px] ${
                  activeTab === 'region'
                    ? 'bg-[--pixel-cyan] text-[--pixel-black]'
                    : 'bg-[--pixel-dark] text-[--pixel-light] hover:bg-[--pixel-mid]'
                }`}
              >
                📍 REGION
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`flex-1 py-2 font-pixel text-[8px] ${
                  activeTab === 'social'
                    ? 'bg-[--pixel-pink] text-[--pixel-black]'
                    : 'bg-[--pixel-dark] text-[--pixel-light] hover:bg-[--pixel-mid]'
                }`}
              >
                💬 SOCIAL
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'region' ? (
              <>
                {selectedRegion ? (
                  <RegionPanel
                    x={selectedRegion.x}
                    y={selectedRegion.y}
                    region={selectedRegionData}
                    bids={regionBids}
                    phase={phase}
                    onFund={handleFund}
                    onSubmitBid={handleSubmitBid}
                    onVote={handleVote}
                    onClose={() => setSelectedRegion(null)}
                  />
                ) : (
                  <div className="card">
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">👆</div>
                      <p className="font-pixel text-xs text-pixel-cyan">SELECT A REGION</p>
                      <p className="mt-2 text-sm text-[--pixel-light]">Click on any grid cell to fund or bid</p>
                    </div>
                  </div>
                )}
                <ActivityFeed activities={activities} />
              </>
            ) : (
              <>
                <SocialPanel
                  contentId={season ? `season_${season.publicKey.toBase58().slice(0, 8)}` : 'global'}
                  title="CANVAS CHAT"
                />
                {selectedRegion && (
                  <SocialPanel
                    contentId={`region_${selectedRegion.x}_${selectedRegion.y}`}
                    title={`REGION [${selectedRegion.x},${selectedRegion.y}]`}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-[--pixel-mid] py-6 mt-12 bg-[--pixel-dark]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-pixel text-xs text-pixel-purple">SOLANA HACKATHON 2026</p>
          <p className="mt-2 text-sm text-[--pixel-light]">Powered by Tapestry Protocol</p>
          <div className="mt-4 flex justify-center gap-4 text-xl">
            <span>🎨</span>
            <span>⛓️</span>
            <span>🎮</span>
          </div>
        </div>
      </footer>

      <CreateSeasonModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSeason}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}

function App() {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <CollabCanvas />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
