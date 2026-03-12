import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import type { MultipleStats, CurrentMetrics } from '../types';
import { formatMultiple, formatPremiumDiscount } from '../calculations';

interface Props {
  stats: MultipleStats[];
  companyName: string;
  ticker: string;
  currentPrice: number;
  currentMetrics: CurrentMetrics;
}

/** Map from MultipleKey → corresponding TTM metric key in CurrentMetrics */
const TTM_MAP: Record<string, keyof CurrentMetrics> = {
  pe: 'peTTM',
  evEbitda: 'evEbitdaTTM',
  evRevenue: 'evRevenueTTM',
  pb: 'pbQuarterly',
  ps: 'psTTM',
  pfcf: 'pfcfShareTTM',
};

export default function MultiplesCards({ stats, companyName, ticker, currentPrice, currentMetrics }: Props) {
  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold text-white">{ticker}</h2>
        {companyName && <span className="text-sm text-slate-400">{companyName}</span>}
        <span className="text-sm font-mono text-pink-400 tabular-nums">${currentPrice.toFixed(2)}</span>
      </div>

      {/* Live TTM Metrics strip */}
      {currentMetrics.peTTM !== null && (
        <div className="bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 border border-slate-700/40 rounded-xl px-5 py-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Activity className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">Live TTM Metrics</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {[
              { label: 'P/E TTM', value: currentMetrics.peTTM },
              { label: 'Fwd P/E', value: currentMetrics.forwardPE },
              { label: 'P/S TTM', value: currentMetrics.psTTM },
              { label: 'P/B', value: currentMetrics.pbQuarterly },
              { label: 'EV/EBITDA', value: currentMetrics.evEbitdaTTM },
              { label: 'EV/Rev', value: currentMetrics.evRevenueTTM },
              { label: 'P/FCF', value: currentMetrics.pfcfShareTTM },
            ].filter(m => m.value !== null).map(m => (
              <div key={m.label} className="flex items-baseline gap-1.5">
                <span className="text-[10px] text-slate-500 uppercase">{m.label}</span>
                <span className="text-sm font-bold text-white tabular-nums">{m.value!.toFixed(1)}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multiple cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const pd = s.premiumDiscount;
          const isPremium = pd !== null && pd > 5;
          const isDiscount = pd !== null && pd < -5;
          const borderColor = isDiscount ? 'border-emerald-500/30' : isPremium ? 'border-red-500/30' : 'border-slate-700/50';
          const bgColor = isDiscount ? 'bg-emerald-500/5' : isPremium ? 'bg-red-500/5' : 'bg-slate-800/50';

          // TTM value for this multiple
          const ttmKey = TTM_MAP[s.key];
          const ttmVal = ttmKey ? currentMetrics[ttmKey] : null;

          return (
            <div key={s.key} className={`${bgColor} border ${borderColor} rounded-xl p-4 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">{s.label}</span>
                {isDiscount && <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
                {isPremium && <TrendingUp className="w-3.5 h-3.5 text-red-400" />}
                {!isDiscount && !isPremium && pd !== null && <Minus className="w-3.5 h-3.5 text-slate-500" />}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white tabular-nums">{formatMultiple(s.current)}</span>
                {ttmVal !== null && s.current !== null && Math.abs(ttmVal - s.current) > 0.1 && (
                  <span className="text-[10px] text-pink-400/70 font-medium tabular-nums" title="Trailing 12-month (live)">
                    TTM {ttmVal.toFixed(1)}x
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">5yr avg: {formatMultiple(s.avg)}</span>
                <span className={`font-medium tabular-nums ${isDiscount ? 'text-emerald-400' : isPremium ? 'text-red-400' : 'text-slate-400'}`}>
                  {formatPremiumDiscount(pd)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
