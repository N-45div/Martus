import { useState, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import { SeasonHeader } from './components/SeasonHeader';
import { CanvasGrid } from './components/CanvasGrid';
import { RegionPanel } from './components/RegionPanel';
import { ActivityFeed } from './components/ActivityFeed';
import { CreateSeasonModal } from './components/CreateSeasonModal';
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
    getPhase,
  } = useProgram();

  const [selectedRegion, setSelectedRegion] = useState<{ x: number; y: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedRegionData = selectedRegion
    ? regions.get(`${selectedRegion.x}-${selectedRegion.y}`)
    : undefined;

  const phase = getPhase();

  const handleRegionClick = (x: number, y: number, _region?: Region) => {
    setSelectedRegion({ x, y });
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
    // TODO: Implement vote
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
    <div className="min-h-screen bg-[--color-bg]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[--color-surface]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center text-xl font-bold">
              🎨
            </div>
            <div>
              <h1 className="text-xl font-bold">Collab Canvas</h1>
              <p className="text-xs text-gray-400">Onchain Collaborative Art</p>
            </div>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          </div>
        )}

        <SeasonHeader
          season={season}
          onCreateSeason={() => setShowCreateModal(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CanvasGrid
              regions={regions}
              phase={phase}
              onRegionClick={handleRegionClick}
              selectedRegion={selectedRegion}
            />
          </div>

          <div className="space-y-6">
            {selectedRegion && (
              <RegionPanel
                x={selectedRegion.x}
                y={selectedRegion.y}
                region={selectedRegionData}
                bids={[]}
                phase={phase}
                onFund={handleFund}
                onSubmitBid={handleSubmitBid}
                onVote={handleVote}
                onClose={() => setSelectedRegion(null)}
              />
            )}

            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          <p>Built for Solana Graveyard Hackathon 2026</p>
          <p className="mt-1">Art Track • Exchange Art Bounty</p>
        </div>
      </footer>

      <CreateSeasonModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSeason}
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
