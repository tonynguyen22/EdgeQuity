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
import TickerSearch from '../components/TickerSearch';
import SupportedTickersBySector from '../components/SupportedTickersBySector';
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

    /* Landing: no ticker entered yet — show standard search (same as DCF) */
    const isLanding = peer.data.length === 0 && !peer.loading && !peer.error && !peer.ticker;

    return (
        <div className="space-y-6">
            {isLanding ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
                        Peer <span style={{ color: 'var(--vw-accent)' }}>Analysis</span>
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
                        Benchmark your target company against up to 5 peers
                    </p>
                </div>

                {/* Standard search — identical to DCF */}
                <div className="w-full max-w-xl">
                  <TickerSearch input={peer.tickerInput} setInput={peer.setTickerInput} onSelect={(sym: string) => { peer.setTickerInput(sym); peer.handleSearch({ preventDefault: () => {} } as React.FormEvent); }} />
                </div>

                {/* About box — identical to DCF */}
                <div className="w-full max-w-2xl mt-8 rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
                    <ul className="space-y-2.5">
                        {[
                            'Compares your chosen stock against up to 5 similar companies side by side',
                            'Uses 6 valuation methods (EV/Revenue, EV/EBITDA, P/E, P/Sales, P/Book, P/FCF)',
                            'Auto-suggests industry peers or lets you pick your own',
                            'Shows an implied price range using peer medians — a football-field valuation chart',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
                                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                                    style={{ background: 'rgba(0,212,170,0.12)', color: 'var(--vw-accent)' }}>
                                    {i + 1}
                                </span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    <SupportedTickersBySector className="mt-4" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={peer.handleGoBack}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
                    title="Go back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
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
                    showAbout={false}
                    error={peer.error}
                    hasData={peer.data.length > 0}
                    ticker={peer.ticker}
                />
              </>
            )}

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
