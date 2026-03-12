import React, { useState, useCallback } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import TickerSearch from '../components/TickerSearch';
import TabLanding from '../components/TabLanding';
import { useEarningsData } from './hooks/useEarningsData';
import { computeEpsMomentum, computeAnnualMomentum, computeQualityScore } from './calculations';
import BeatMissSummary from './components/BeatMissSummary';
import MomentumQuality from './components/MomentumQuality';
import EarningsTable from './components/EarningsTable';
import type { EarningsView } from './types';

export default function EarningsEstimates() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const [view, setView] = useState<EarningsView>('quarterly');
  const [showLoading, setShowLoading] = useState(false);
  const { quarterly, annual, loading, error, fetchData, reset } = useEarningsData();

  const handleAnalyze = useCallback((s: string) => {
    setSym(s);
    setView('quarterly');
    setShowLoading(true);
    fetchData(s);
    setTimeout(() => setShowLoading(false), 2500);
  }, [fetchData]);

  const handleGoBack = () => {
    setSym('');
    setInput('');
    setShowLoading(false);
    reset();
  };

  const beats = quarterly.filter(r => r.surprisePercent != null && r.surprisePercent > 0.5).length;
  const misses = quarterly.filter(r => r.surprisePercent != null && r.surprisePercent < -0.5).length;
  const total = quarterly.length;

  const epsMomentum = computeEpsMomentum(quarterly);
  const annualMomentum = computeAnnualMomentum(annual);
  const qualityScore = computeQualityScore(quarterly);

  const hasData = quarterly.length > 0 || annual.length > 0;
  const isLoading = loading || showLoading;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Landing — shown when no results */}
      {!hasData && !isLoading && !error && (
        <TabLanding
          title="Earnings"
          accentTitle="Estimates"
          subtitle="Recent EPS results and surprise history"
          aboutItems={[
            'Shows whether a company beat or missed analyst EPS estimates for the last 20 quarters',
            'Tracks the beat rate — how consistently a company exceeds expectations',
            'Displays annual EPS history for the last 5 fiscal years',
            'Highlights EPS momentum trends so you can spot acceleration or deceleration',
          ]}
          searchInput={input}
          setSearchInput={setInput}
          onAnalyze={handleAnalyze}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading earnings data…</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {hasData && !isLoading && (
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">{sym}</h2>
          </div>

          <div className="flex items-center gap-2">
            {(['quarterly', 'annual'] as EarningsView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize
                  ${view === v
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-slate-300 hover:border-slate-600/60'
                  }`}
              >
                {v === 'quarterly' ? 'Quarterly' : 'Annual'}
              </button>
            ))}
          </div>

          {view === 'quarterly' && total > 0 && (
            <BeatMissSummary beats={beats} misses={misses} total={total} />
          )}
          <MomentumQuality
            epsMomentum={epsMomentum}
            annualMomentum={annualMomentum}
            qualityScore={qualityScore}
            view={view}
          />
          <EarningsTable quarterly={quarterly} annual={annual} view={view} sym={sym} />
        </div>
      )}
    </div>
  );
}
