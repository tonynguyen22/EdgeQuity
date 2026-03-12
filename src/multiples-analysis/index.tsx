import React, { useState, useMemo } from 'react';
import { AlertCircle, ArrowLeft, ChevronDown, ChevronUp, History } from 'lucide-react';
import { SUPPORTED_TICKERS } from '../dcf/types';

import { useMultiplesData } from './hooks/useMultiplesData';
import { computeHistoricalMultiples } from './calculations';

import SearchForm from './components/SearchForm';
import MultiplesCards from './components/MultiplesCards';
import MultiplesTable from './components/MultiplesTable';
import MultiplesCharts from './components/MultiplesCharts';
import ValuationContext from './components/ValuationContext';

export default function MultiplesAnalysis() {
  const [tickerInput, setTickerInput] = useState('');
  const [ticker, setTicker] = useState('');
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});
  const [showFullHistory, setShowFullHistory] = useState(false);


  const { data, loading, error } = useMultiplesData(ticker);



  const handleSearch = (sym: string) => {
    setTicker(sym);
    setTickerInput(sym);
    setHiddenSeries({});
    setShowFullHistory(false);
  };

  const handleGoBack = () => {
    setTicker('');
    setTickerInput('');
    setHiddenSeries({});
    setShowFullHistory(false);
  };

  const handleLegendClick = (d: any, chartKeys: string[]) => {
    setHiddenSeries(prev => {
      const allOthersHidden = chartKeys.every(k => k === d.dataKey || prev[k]);
      if (allOthersHidden) {
        const next = { ...prev };
        chartKeys.forEach(k => { next[k] = false; });
        return next;
      }
      const next = { ...prev };
      chartKeys.forEach(k => { next[k] = k !== d.dataKey; });
      return next;
    });
  };

  const result = useMemo(() => {
    if (!data) return null;
    return computeHistoricalMultiples(data);
  }, [data]);

  const hasResults = !loading && !!result;
  const hasExtraHistory = result && result.allYears.length > result.years.length;

  return (
    <div className="space-y-6">
      {/* Full landing search when no results */}
      {!hasResults && !loading && (
        <SearchForm
          tickerInput={tickerInput}
          loading={loading}
          onTickerInputChange={setTickerInput}
          onSearch={handleSearch}
        />
      )}

      {/* Go back button when results are showing */}
      {hasResults && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white">{ticker}</h2>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Fetching financial data and historical prices...</p>
        </div>
      )}

      {!loading && error && !result && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5 flex items-start gap-3 max-w-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!loading && result && (
        <>
          <MultiplesCards
            stats={result.stats}
            companyName={result.companyName}
            ticker={ticker}
            currentPrice={result.currentPrice}
            currentMetrics={result.currentMetrics}
          />

          <MultiplesTable
            years={result.years}
            stats={result.stats}
            currentMetrics={result.currentMetrics}
          />

          <MultiplesCharts
            years={result.years}
            stats={result.stats}
            hiddenSeries={hiddenSeries}
            onLegendClick={handleLegendClick}
            quarterlyTrend={result.quarterlyTrend}
          />

          <ValuationContext
            stats={result.stats}
            signal={result.signal}
          />

          {/* Full Historical Data — collapsible section */}
          {hasExtraHistory && (
            <div className="border border-slate-700/40 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFullHistory(!showFullHistory)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-400">
                    Full Historical Data
                  </span>
                  <span className="text-xs text-slate-600">
                    {result.allYears.length} years ({result.allYears[0]?.year}–{result.allYears[result.allYears.length - 1]?.year})
                  </span>
                </div>
                {showFullHistory
                  ? <ChevronUp className="w-4 h-4 text-slate-500" />
                  : <ChevronDown className="w-4 h-4 text-slate-500" />
                }
              </button>

              {showFullHistory && (
                <div className="p-5 space-y-6 border-t border-slate-700/30">
                  <p className="text-xs text-slate-500">
                    Extended view showing all available historical multiples. Note: stats above use only the most recent {result.years.length} years for more relevant comparisons.
                  </p>
                  <MultiplesTable
                    years={result.allYears}
                    stats={result.stats}
                    currentMetrics={result.currentMetrics}
                  />
                  <MultiplesCharts
                    years={result.allYears}
                    stats={result.stats}
                    hiddenSeries={hiddenSeries}
                    onLegendClick={handleLegendClick}
                    quarterlyTrend={[]}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

