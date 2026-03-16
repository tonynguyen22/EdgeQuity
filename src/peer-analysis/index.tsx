/* ── Peer Analysis — App Shell ────────────────────────────────────────── */

import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { usePeerData } from './hooks/usePeerData';
import {
    computeAllStats, computeDisplayData, computeImpliedPrices,
    computeTargetPercentiles, computeCompositeScore, computeRadarScores,
    computeRankingData, computeBubbleData, computeMultiHistData,
} from './calculations';
import { exportToExcel } from './utils/excel';

// Components

import PeerControls from './components/PeerControls';
import ComparisonTable from './components/ComparisonTable';
import ImpliedValuation from './components/ImpliedValuation';
import EvEbitdaTrend from './components/EvEbitdaTrend';
import PeerRanking from './components/PeerRanking';
import RadarScore from './components/RadarScore';
import BubbleChart from './components/BubbleChart';

export default function PeerAnalysis() {
    const peer = usePeerData();

    /* ── Derived memos ──────────────────────────────────────────────────── */

    const stats = useMemo(
        () => computeAllStats(peer.data, peer.selectedPeers),
        [peer.data, peer.selectedPeers],
    );

    const displayData = useMemo(
        () => computeDisplayData(peer.data, peer.sortKey, peer.sortDir),
        [peer.data, peer.sortKey, peer.sortDir],
    );

    const impliedPrices = useMemo(
        () => computeImpliedPrices(peer.data, stats),
        [peer.data, stats],
    );

    const targetPercentiles = useMemo(
        () => computeTargetPercentiles(peer.data),
        [peer.data],
    );

    const compositeScore = useMemo(
        () => computeCompositeScore(targetPercentiles),
        [targetPercentiles],
    );

    const radarScores = useMemo(
        () => computeRadarScores(targetPercentiles, peer.data, stats),
        [targetPercentiles, peer.data, stats],
    );

    const rankingData = useMemo(
        () => computeRankingData(peer.data),
        [peer.data],
    );

    const bubbleData = useMemo(
        () => computeBubbleData(peer.data),
        [peer.data],
    );

    const multiHistData = useMemo(
        () => computeMultiHistData(peer.data),
        [peer.data],
    );

    const currentPrice = peer.data[0]?.price ?? 0;

    /* ── Render ─────────────────────────────────────────────────────────── */

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                {peer.ticker && (
                    <button
                        onClick={peer.handleGoBack}
                        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                        style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
                        title="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--vw-text-primary)' }}>
                        Peer <span style={{ color: 'var(--vw-accent)' }}>Analysis</span>
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--vw-text-secondary)' }}>
                        Benchmark your target company against up to 5 peers
                    </p>
                </div>
            </div>

            <PeerControls
                tickerInput={peer.tickerInput}
                onTickerInputChange={peer.setTickerInput}
                onSearch={peer.handleSearch}
                showPeerFinder={peer.showPeerFinder}
                peerFinderLoading={peer.peerFinderLoading}
                peerSuggestions={peer.peerSuggestions}
                onFetchPeerSuggestions={peer.fetchPeerSuggestions}
                selectedPeerSymbols={peer.selectedPeerSymbols}
                onTogglePeerSelection={peer.togglePeerSelection}
                onRemovePeer={peer.removePeer}
                onClearAllPeers={peer.clearAllPeers}
                customPeerInput={peer.customPeerInput}
                onCustomPeerInputChange={peer.setCustomPeerInput}
                onAddCustomPeer={peer.addCustomPeer}
                loading={peer.loading}
                onRunAnalysis={peer.fetchData}
                showAbout={peer.data.length === 0 && !peer.loading}
                error={peer.error}
                hasData={peer.data.length > 0}
                ticker={peer.ticker}
            />

            {peer.data.length > 0 && !peer.loading && (
                <>
                    <ComparisonTable
                        displayData={displayData}
                        data={peer.data}
                        selectedPeers={peer.selectedPeers}
                        onTogglePeer={peer.togglePeer}
                        stats={stats}
                        sortKey={peer.sortKey}
                        sortDir={peer.sortDir}
                        onToggleSort={peer.toggleSort}
                        targetPercentiles={targetPercentiles}
                        onExportExcel={() => exportToExcel(peer.data, stats, peer.ticker)}
                    />

                    {impliedPrices && impliedPrices.length > 0 && (
                        <ImpliedValuation
                            impliedPrices={impliedPrices}
                            currentPrice={currentPrice}
                            targetSymbol={peer.data[0]?.symbol ?? ''}
                        />
                    )}

                    {multiHistData.length >= 2 && peer.data.length >= 2 && (
                        <EvEbitdaTrend
                            multiHistData={multiHistData}
                            data={peer.data}
                            hiddenSeries={peer.hiddenSeries}
                            onLegendClick={peer.handleLegendClick}
                        />
                    )}

                    {rankingData && (
                        <PeerRanking rankingData={rankingData} targetSymbol={peer.data[0]?.symbol ?? ''} />
                    )}

                    {radarScores && radarScores.length > 0 && (
                        <RadarScore
                            radarScores={radarScores}
                            compositeScore={compositeScore}
                            targetSymbol={peer.data[0]?.symbol ?? 'Target'}
                        />
                    )}

                    {bubbleData.length > 1 && (
                        <BubbleChart bubbleData={bubbleData} />
                    )}
                </>
            )}
        </div>
    );
}
