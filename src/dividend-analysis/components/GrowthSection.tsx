import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { StreakBadge } from '../types';

interface GrowthSectionProps {
  growthStreak: number;
  streakBadge: StreakBadge | null;
  cagr3: number | null;
  cagr5: number | null;
  cagr10: number | null;
  sym: string;
}

export default function GrowthSection({ growthStreak, streakBadge, cagr3, cagr5, cagr10, sym }: GrowthSectionProps) {
  return (
    <>
      {growthStreak > 0 && (
        <div className={`border rounded-xl p-4 flex items-center gap-4 ${streakBadge ? `bg-${streakBadge.color}-500/10 border-${streakBadge.color}-500/20` : 'bg-slate-800/60 border-slate-700/50'}`}>
          <div className="text-center shrink-0">
            <div className={`text-3xl font-bold ${streakBadge ? `text-${streakBadge.color}-400` : 'text-slate-300'}`}>{growthStreak}</div>
            <div className="text-xs text-slate-500 mt-0.5">yr streak</div>
          </div>
          <div>
            <div className={`text-sm font-semibold ${streakBadge ? `text-${streakBadge.color}-400` : 'text-slate-300'}`}>
              {streakBadge ? streakBadge.label : 'Consecutive Growth'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {streakBadge ? streakBadge.desc : `${growthStreak} consecutive years of annual dividend growth (recurring payments)`}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-200">Dividend Growth CAGR</h3>
        {(cagr3 !== null || cagr5 !== null || cagr10 !== null) ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: '3-Year', val: cagr3 }, { label: '5-Year', val: cagr5 }, { label: '10-Year', val: cagr10 }].map(({ label, val }) => (
                val !== null && (
                  <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
                    <div className="text-xs text-slate-400 mb-1">{label} CAGR</div>
                    <div className={`text-xl font-bold flex items-center justify-center gap-1 ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {val >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                    </div>
                  </div>
                )
              ))}
            </div>
            <p className="text-xs text-slate-600">CAGR computed from per-payment amounts. Actual annualized growth may differ slightly by frequency.</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">CAGR requires payment history data from Massive API, which could not be retrieved for {sym}.</p>
        )}
      </div>
    </>
  );
}
