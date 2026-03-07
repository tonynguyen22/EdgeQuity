import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, Search } from 'lucide-react';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLFormElement>(null);

  const { data, loading, error } = useMultiplesData(ticker);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTickers = useMemo(() => {
    const q = tickerInput.trim().toUpperCase();
    if (!q) return [...SUPPORTED_TICKERS];
    return SUPPORTED_TICKERS.filter(t => t.includes(q));
  }, [tickerInput]);

  const handleSearch = (sym: string) => {
    setTicker(sym);
    setTickerInput(sym);
    setHiddenSeries({});
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = tickerInput.trim().toUpperCase();
    if (sym && (SUPPORTED_TICKERS as readonly string[]).includes(sym)) {
      handleSearch(sym);
    }
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
  const isValid = tickerInput.trim() && (SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase());

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

      {/* Compact inline search when results are showing */}
      {hasResults && (
        <form onSubmit={handleSubmit} className="relative max-w-md" ref={dropdownRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => { setTickerInput(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search another ticker..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-24 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isValid}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-1.5 rounded-md font-medium transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed z-10"
          >
            Analyze
          </button>
          {showDropdown && filteredTickers.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50">
              {filteredTickers.map(t => (
                <button key={t} type="button" onClick={() => handleSearch(t)}
                  className="w-full text-left px-4 py-2 text-sm font-mono hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl text-slate-200"
                >{t}</button>
              ))}
            </div>
          )}
          {showDropdown && filteredTickers.length === 0 && tickerInput.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 px-4 py-2.5 text-xs text-slate-500">
              No matching ticker. Only {SUPPORTED_TICKERS.length} pre-selected stocks are supported.
            </div>
          )}
        </form>
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
          />

          <MultiplesTable
            years={result.years}
            stats={result.stats}
          />

          <MultiplesCharts
            years={result.years}
            stats={result.stats}
            hiddenSeries={hiddenSeries}
            onLegendClick={handleLegendClick}
          />

          <ValuationContext
            stats={result.stats}
            signal={result.signal}
          />
        </>
      )}
    </div>
  );
}
