import React from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import type { MultipleStats, ValuationSignal } from '../types';
import { formatMultiple, formatPremiumDiscount } from '../calculations';

interface Props {
  stats: MultipleStats[];
  signal: ValuationSignal;
}

const signalConfig: Record<ValuationSignal, { bg: string; border: string; text: string; label: string }> = {
  Undervalued: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Undervalued' },
  'Fair Value': { bg: 'bg-slate-800/50', border: 'border-slate-700/50', text: 'text-slate-300', label: 'Fair Value' },
  Overvalued: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Overvalued' },
};

export default function ValuationContext({ stats, signal }: Props) {
  const cfg = signalConfig[signal];
  const validStats = stats.filter(s => s.premiumDiscount !== null);
  const belowAvg = validStats.filter(s => s.premiumDiscount! < -5).length;
  const aboveAvg = validStats.filter(s => s.premiumDiscount! > 5).length;
  const nearAvg = validStats.length - belowAvg - aboveAvg;

  return (
    <div className="space-y-4">
      <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Valuation Context</h3>
          <span className={`text-sm font-bold ${cfg.text} px-3 py-1 rounded-full ${cfg.bg} border ${cfg.border}`}>
            {cfg.label}
          </span>
        </div>

        <div className="flex items-center gap-6 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">{belowAvg} below avg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400">{nearAvg} near avg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ChevronUp className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">{aboveAvg} above avg</span>
          </div>
        </div>

        <div className="space-y-2">
          {stats.map(s => {
            if (s.current === null || s.avg === null) return null;
            const pd = s.premiumDiscount ?? 0;
            const isPremium = pd > 5;
            const isDiscount = pd < -5;

            const maxAbsPd = Math.max(
              ...stats.map(st => Math.abs(st.premiumDiscount ?? 0)),
              1,
            );
            const barWidth = Math.min(Math.abs(pd) / maxAbsPd * 100, 100);

            return (
              <div key={s.key} className="flex items-center gap-3 text-xs">
                <span className="w-20 text-slate-400 font-medium shrink-0">{s.label}</span>
                <span className="w-12 text-right tabular-nums text-slate-300">{formatMultiple(s.current)}</span>
                <div className="flex-1 relative h-4 bg-slate-700/30 rounded-full overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-px h-full bg-slate-600" />
                  </div>
                  {pd !== 0 && (
                    <div
                      className={`absolute top-0 h-full rounded-full transition-all ${isDiscount ? 'bg-emerald-500/40 right-1/2' : 'bg-red-500/40 left-1/2'}`}
                      style={{ width: `${barWidth / 2}%` }}
                    />
                  )}
                </div>
                <span className={`w-28 text-right tabular-nums font-medium ${isDiscount ? 'text-emerald-400' : isPremium ? 'text-red-400' : 'text-slate-400'}`}>
                  {formatPremiumDiscount(s.premiumDiscount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Multiples computed from standardized financials (FMP) with historical closing prices (Finnhub). Premium/discount is relative to the historical average of available fiscal years.
      </p>
    </div>
  );
}
