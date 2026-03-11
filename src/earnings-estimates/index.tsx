import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
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
  const { quarterly, annual, loading, error, fetchData } = useEarningsData();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (s) { setSym(s); setView('quarterly'); fetchData(s); }
  };

  const beats = quarterly.filter(r => r.surprisePercent != null && r.surprisePercent > 0.5).length;
  const misses = quarterly.filter(r => r.surprisePercent != null && r.surprisePercent < -0.5).length;
  const total = quarterly.length;

  const epsMomentum = computeEpsMomentum(quarterly);
  const annualMomentum = computeAnnualMomentum(annual);
  const qualityScore = computeQualityScore(quarterly);

  const hasData = quarterly.length > 0 || annual.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">Earnings Estimates</h2>
        <p className="text-slate-400 text-sm">Recent EPS results and surprise history via Alpha Vantage.</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter ticker (e.g. AAPL, MSFT)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent uppercase transition-all"
        />
        <button type="submit" disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Analyze
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-8 max-w-xl mx-auto">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading earnings data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {hasData && !loading && (
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            {(['quarterly', 'annual'] as EarningsView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize
                  ${view === v
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
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

      {!hasData && !loading && !error && (
        <div className="max-w-xl mx-auto bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-2">
          <p className="text-sm font-medium text-slate-300">What you'll see here</p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">*</span>Historical EPS surprise — Beat/Miss/In-line vs. consensus (20 quarters)</li>
            <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">*</span>Annual EPS history for the last 5 fiscal years</li>
            <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">*</span>Beat rate summary and earnings quality score</li>
            <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">*</span>EPS momentum trend (quarterly and annual)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
