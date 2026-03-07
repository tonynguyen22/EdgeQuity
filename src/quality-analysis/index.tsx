import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { SUPPORTED_TICKERS } from '../dcf/types';

import { useQualityData } from './hooks/useQualityData';
import {
  buildHistoricalSummary, computeGrades, computeSingleYearGrades,
  computeAltmanZ, computePiotroski, computeDuPont,
  computeWorkingCapital, computeEarningsQuality, computeRiskFlags,
} from './calculations';

import SearchForm from './components/SearchForm';
import GradeOverview from './components/GradeOverview';
import RiskFlags from './components/RiskFlags';
import HistoricalCharts from './components/HistoricalCharts';
import ScoreOverview from './components/ScoreOverview';
import AdvancedMetrics from './components/AdvancedMetrics';

export default function QualityAnalysis() {
  const [tickerInput, setTickerInput] = useState('');
  const [ticker, setTicker] = useState('');
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLFormElement>(null);

  const { data, loading, error } = useQualityData(ticker);

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

  const processed = useMemo(() => {
    if (!data) return null;
    const { historicalSummary, revCagr3yr } = buildHistoricalSummary(data);
    const gradeResult = computeGrades(historicalSummary, revCagr3yr);
    if (!gradeResult) return null;
    return { historicalSummary, gradeResult, companyName: data.profile?.name ?? '', marketCap: data.profile?.marketCapitalization ?? 0 };
  }, [data]);

  const yoyGrades = useMemo(
    () => processed ? processed.historicalSummary.slice(-3).map(computeSingleYearGrades) : [],
    [processed],
  );

  const altmanZ = useMemo(() => {
    if (!processed) return null;
    const latest = processed.historicalSummary[processed.historicalSummary.length - 1];
    return latest ? computeAltmanZ(latest, processed.marketCap) : null;
  }, [processed]);

  const piotroski = useMemo(
    () => processed ? computePiotroski(processed.historicalSummary) : null,
    [processed],
  );

  const dupontData = useMemo(
    () => processed ? computeDuPont(processed.historicalSummary) : [],
    [processed],
  );

  const workingCapitalData = useMemo(
    () => processed ? computeWorkingCapital(processed.historicalSummary) : [],
    [processed],
  );

  const earningsQuality = useMemo(
    () => processed ? computeEarningsQuality(processed.historicalSummary) : null,
    [processed],
  );

  const riskFlags = useMemo(
    () => processed ? computeRiskFlags(processed.historicalSummary) : null,
    [processed],
  );

  const hasResults = !loading && (processed || error);
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
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-24 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isValid}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-md font-medium transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed z-10"
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
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Fetching financial data...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5 flex items-start gap-3 max-w-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!loading && processed && (
        <>
          <GradeOverview
            ticker={ticker}
            companyName={processed.companyName}
            gradeResult={processed.gradeResult}
          />

          {riskFlags !== null && <RiskFlags flags={riskFlags} />}

          <HistoricalCharts
            historicalSummary={processed.historicalSummary}
            yoyGrades={yoyGrades}
            hiddenSeries={hiddenSeries}
            onLegendClick={handleLegendClick}
          />

          {(yoyGrades.length > 0 || altmanZ) && (
            <ScoreOverview
              ticker={ticker}
              gradeResult={processed.gradeResult}
              yoyGrades={yoyGrades}
              altmanZ={altmanZ}
            />
          )}

          <AdvancedMetrics
            piotroski={piotroski}
            dupontData={dupontData}
            workingCapitalData={workingCapitalData}
            earningsQuality={earningsQuality}
            hiddenSeries={hiddenSeries}
            onLegendClick={handleLegendClick}
          />

          <p className="text-xs text-slate-600 text-center pb-4">
            Grades based on 3-year averages of standardized financials (FMP). Trend indicators reflect direction across the 3 most recent reported periods.
          </p>
        </>
      )}
    </div>
  );
}
