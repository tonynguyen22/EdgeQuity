import React, { useState, useMemo } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
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


  const { data, loading, error } = useQualityData(ticker);



  const handleSearch = (sym: string) => {
    setTicker(sym);
    setTickerInput(sym);
    setHiddenSeries({});
  };

  const handleGoBack = () => {
    setTicker('');
    setTickerInput('');
    setHiddenSeries({});
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
