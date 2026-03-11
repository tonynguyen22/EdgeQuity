import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
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
  const { data, loading, error, fetchData } = useDividendData();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (s) { setSym(s); fetchData(s); }
  };

  // Derived metrics
  const allPayments = data?.payments ?? [];
  const recurringPayments = allPayments.filter(p => p.type === 'recurring' || p.type === '');

  const annualDiv = data ? computeAnnualDividend(allPayments) : 0;
  const annualRecurringDiv = data ? computeAnnualDividend(recurringPayments.length > 0 ? recurringPayments : allPayments) : 0;

  const cagrSource = recurringPayments.length >= 2 ? recurringPayments : allPayments;
  const cagr3 = data ? computeCagr(cagrSource, 3) : null;
  const cagr5 = data ? computeCagr(cagrSource, 5) : null;
  const cagr10 = data ? computeCagr(cagrSource, 10) : null;

  const yieldPct = data?.metrics?.dividendYieldIndicatedAnnual
    ?? (data?.currentPrice > 0 && annualDiv > 0 ? (annualDiv / data.currentPrice) * 100 : null);

  const hasSpecialDividends = allPayments.some(p => p.type === 'irregular' || p.type === 'special');
  const declaredAnnualDiv = data?.metrics?.dividendsPerShareAnnual ?? null;
  const annualDivForPayout = hasSpecialDividends
    ? annualRecurringDiv
    : (declaredAnnualDiv && declaredAnnualDiv > 0 ? declaredAnnualDiv : annualRecurringDiv);

  const eps = data?.metrics?.epsBasicExclExtraItemsTTM ?? data?.metrics?.epsNormalizedAnnual ?? null;
  const payoutRatioComputed = (eps && eps > 0 && annualDivForPayout > 0) ? (annualDivForPayout / eps) * 100 : null;
  const payoutRatio = payoutRatioComputed ?? data?.metrics?.payoutRatioAnnual ?? data?.metrics?.payoutRatioTTM ?? null;
  const payoutRatioIsComputed = payoutRatioComputed !== null;

  const sharesOutstanding = data?.metrics?.sharesOutstanding ?? data?.metrics?.shareOutstanding ?? null;
  const totalAnnualDiv = sharesOutstanding && annualRecurringDiv ? sharesOutstanding * annualRecurringDiv * 1e6 : null;
  const fcfPayoutRatio = totalAnnualDiv && data?.fcfTTM && data.fcfTTM > 0 ? (totalAnnualDiv / data.fcfTTM) * 100 : null;

  const streakSource = recurringPayments.length >= 2 ? recurringPayments : allPayments;
  const growthStreak = data ? computeGrowthStreak(streakSource) : 0;
  const streakBadge = getStreakBadge(growthStreak);
  const safety = data ? getSafetyInfo(fcfPayoutRatio, payoutRatio, payoutRatioIsComputed) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">Dividend Analysis</h2>
        <p className="text-slate-400 text-sm">Dividend history, growth CAGR, yield, and FCF safety score.</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter ticker (e.g. JNJ, KO, MSFT)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent uppercase transition-all"
        />
        <button type="submit" disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Analyze
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-8 max-w-xl mx-auto">
          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading dividend data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
            <button onClick={clearCache} className="mt-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors">Clear Cache & Retry</button>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <MetricCards
            yieldPct={yieldPct ?? null}
            currentPrice={data.currentPrice}
            annualDiv={annualDiv}
            payoutRatio={payoutRatio}
            payoutRatioIsComputed={payoutRatioIsComputed}
            fcfPayoutRatio={fcfPayoutRatio}
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

      {!data && !loading && !error && (
        <div className="max-w-xl mx-auto bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-2">
          <p className="text-sm font-medium text-slate-300">What you'll see here</p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span>Dividend yield, annual per-share dividend, and earnings payout ratio</li>
            <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span>FCF safety score (A–D) based on free cash flow coverage of dividends</li>
            <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span>Dividend growth CAGR over 3, 5, and 10 years</li>
            <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span>Full payment history with per-payment change vs. prior period</li>
          </ul>
        </div>
      )}
    </div>
  );
}
