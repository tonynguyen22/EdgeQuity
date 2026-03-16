import React, { useState, useMemo, useCallback } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { useQualityData } from './hooks/useQualityData';
import {
  buildHistoricalSummary, computeGrades,
  computeAltmanZ, computePiotroski, computeRiskFlags,
} from './calculations';

import ComparisonSearchForm from './components/ComparisonSearchForm';
import ComparisonView, { type TickerAnalysis } from './components/ComparisonView';

/* ─── Per-ticker processing hook ──────────────────────────────────────────── */

function useTickerAnalysis(symbol: string): {
  analysis: TickerAnalysis | null;
  loading: boolean;
  error: string;
} {
  const { data, loading, error } = useQualityData(symbol);

  const analysis = useMemo(() => {
    if (!data) return null;
    const { historicalSummary, revCagr3yr } = buildHistoricalSummary(data);
    const gradeResult = computeGrades(historicalSummary, revCagr3yr);
    if (!gradeResult) return null;

    const latest = historicalSummary[historicalSummary.length - 1];
    const marketCap = data.profile?.marketCapitalization ?? 0;
    const altmanZ = latest ? computeAltmanZ(latest, marketCap) : null;
    const piotroski = computePiotroski(historicalSummary);
    const riskFlags = computeRiskFlags(historicalSummary);

    return {
      ticker: symbol,
      companyName: data.profile?.name ?? '',
      gradeResult,
      altmanZ,
      piotroski,
      riskFlags: riskFlags ?? [],
    };
  }, [data, symbol]);

  return { analysis, loading, error };
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export default function QualityAnalysis() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(true);

  // Always call both hooks (React rules of hooks — can't conditionally call)
  const slot0 = useTickerAnalysis(tickers[0] ?? '');
  const slot1 = useTickerAnalysis(tickers[1] ?? '');

  const handleAddTicker = useCallback((sym: string) => {
    setTickers(prev => {
      if (prev.length >= 2 || prev.includes(sym)) return prev;
      return [...prev, sym];
    });
    setShowSearch(false);
  }, []);

  const handleRemoveTicker = useCallback((sym: string) => {
    setTickers(prev => prev.filter(t => t !== sym));
  }, []);

  const handleGoBack = useCallback(() => {
    setTickers([]);
    setShowSearch(true);
  }, []);

  const handleShowSearchToAdd = useCallback(() => {
    setShowSearch(true);
  }, []);

  // Build analyses array from loaded data
  const analyses: TickerAnalysis[] = useMemo(() => {
    const result: TickerAnalysis[] = [];
    if (tickers[0] && slot0.analysis) result.push(slot0.analysis);
    if (tickers[1] && slot1.analysis) result.push(slot1.analysis);
    return result;
  }, [tickers, slot0.analysis, slot1.analysis]);

  const anyLoading = (tickers[0] && slot0.loading) || (tickers[1] && slot1.loading);
  const anyError = (tickers[0] && slot0.error) || (tickers[1] && slot1.error);
  const hasResults = !anyLoading && analyses.length > 0;
  const needsMoreTickers = tickers.length < 2;

  // Determine view state
  const isLanding = tickers.length === 0 || showSearch;

  return (
    <div className="space-y-6">
      {/* Landing / search view */}
      {isLanding && !anyLoading && (
        <>
          {tickers.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoBack}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          )}
          <ComparisonSearchForm
            tickers={tickers}
            loading={!!anyLoading}
            onAddTicker={handleAddTicker}
            onRemoveTicker={handleRemoveTicker}
          />
        </>
      )}

      {/* Loading indicator */}
      {anyLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Fetching financial data...</p>
        </div>
      )}

      {/* Error display */}
      {!anyLoading && anyError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5 flex items-start gap-3 max-w-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm">{slot0.error || slot1.error}</p>
          </div>
        </div>
      )}

      {/* Results view */}
      {hasResults && !isLanding && (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">
              {analyses.map(a => a.ticker).join(' vs ')}
            </h2>
          </div>
          <ComparisonView
            analyses={analyses}
            onRemoveTicker={handleRemoveTicker}
            onAddTicker={handleShowSearchToAdd}
          />
        </>
      )}
    </div>
  );
}
