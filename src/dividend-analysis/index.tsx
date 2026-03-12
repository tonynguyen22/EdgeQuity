import React, { useState, useCallback } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import TickerSearch from '../components/TickerSearch';
import TabLanding from '../components/TabLanding';
import { useDividendData } from './hooks/useDividendData';
import { computeAnnualDividend, computeCagr, computeGrowthStreak, getStreakBadge, getSafetyInfo } from './calculations';
import { clearCache } from './utils/storage';
import MetricCards from './components/MetricCards';
import SafetyScore from './components/SafetyScore';
import GrowthSection from './components/GrowthSection';
import PaymentHistory from './components/PaymentHistory';

export default function DividendAnalysis() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const { data, loading, error, fetchData, reset } = useDividendData();

  const handleAnalyze = useCallback((s: string) => {
    setSym(s);
    setShowLoading(true);
    fetchData(s);
    // Show loading screen for at least 2.5 seconds
    setTimeout(() => setShowLoading(false), 2500);
  }, [fetchData]);

  const handleGoBack = () => {
    reset();
    setSym('');
    setInput('');
    setShowLoading(false);
  };

  const isLoading = loading || showLoading;

  // Derived metrics
  const allPayments = data?.payments ?? [];
  const recurringPayments = allPayments.filter(p => p.type === 'recurring' || p.type === '');

  // Pull annual dividend directly from Finnhub metrics
  const annualDiv = data?.metrics?.dividendPerShareAnnual ?? data?.metrics?.dividendPerShareTTM ?? 0;

  // Recurring div is still needed for FCF payout ratio (per-share × shares outstanding)
  const annualRecurringDiv = data ? computeAnnualDividend(recurringPayments.length > 0 ? recurringPayments : allPayments) : 0;

  const cagrSource = recurringPayments.length >= 2 ? recurringPayments : allPayments;
  const cagr3 = data ? computeCagr(cagrSource, 3) : null;
  const cagr5 = data ? computeCagr(cagrSource, 5) : null;
  const cagr10 = data ? computeCagr(cagrSource, 10) : null;

  // Pull yield and payout ratio directly from Finnhub metrics
  const yieldPct = data?.metrics?.currentDividendYieldTTM ?? data?.metrics?.dividendYieldIndicatedAnnual ?? null;
  const payoutRatio = data?.metrics?.payoutRatioAnnual ?? data?.metrics?.payoutRatioTTM ?? null;

  const sharesOutstanding = data?.metrics?.sharesOutstanding ?? data?.metrics?.shareOutstanding ?? null;
  const totalAnnualDiv = sharesOutstanding && annualRecurringDiv ? sharesOutstanding * annualRecurringDiv * 1e6 : null;
  const fcfPayoutRatio = totalAnnualDiv && data?.fcfTTM && data.fcfTTM > 0 ? (totalAnnualDiv / data.fcfTTM) * 100 : null;

  const streakSource = recurringPayments.length >= 2 ? recurringPayments : allPayments;
  const growthStreak = data ? computeGrowthStreak(streakSource) : 0;
  const streakBadge = getStreakBadge(growthStreak);
  const safety = data ? getSafetyInfo(fcfPayoutRatio, payoutRatio, false) : null;

  // Finnhub metrics
  const dividendGrowthRate5Y = data?.metrics?.dividendGrowthRate5Y ?? null;
  const peTTM = data?.metrics?.peTTM ?? null;
  const beta = data?.metrics?.beta ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Landing — shown when no results */}
      {!data && !isLoading && !error && (
        <TabLanding
          title="Dividend"
          accentTitle="Analysis"
          subtitle="Dividend history, growth CAGR, yield, and FCF safety score"
          aboutItems={[
            'Shows you the full dividend payment history and how much the company pays per share',
            'Calculates how fast dividends have grown over 3, 5, and 10 years',
            'Rates dividend safety (A–D) based on whether the company earns enough cash to keep paying',
            'Tracks growth streaks and whether the payout ratio is sustainable',
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
          <p className="text-slate-400 animate-pulse">Analyzing dividend data…</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
            <button onClick={clearCache} className="mt-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors">Clear Cache & Retry</button>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !isLoading && (
        <div className="space-y-6">
          {/* Back button + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">{sym}</h2>
            </div>
          </div>

          <MetricCards
            yieldPct={yieldPct ?? null}
            currentPrice={data.currentPrice}
            annualDiv={annualDiv}
            payoutRatio={payoutRatio}
            fcfPayoutRatio={fcfPayoutRatio}
            dividendGrowthRate5Y={dividendGrowthRate5Y}
            peTTM={peTTM}
            beta={beta}
          />

          {safety && <SafetyScore safety={safety} />}

          <GrowthSection
            growthStreak={growthStreak}
            streakBadge={streakBadge}
            cagr3={cagr3}
            cagr5={cagr5}
            cagr10={cagr10}
            sym={sym}
          />

          <PaymentHistory payments={data.payments} sym={sym} />
        </div>
      )}
    </div>
  );
}
