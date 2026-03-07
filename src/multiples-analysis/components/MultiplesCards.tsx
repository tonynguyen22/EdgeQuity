import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MultipleStats } from '../types';
import { formatMultiple, formatPremiumDiscount } from '../calculations';

interface Props {
  stats: MultipleStats[];
  companyName: string;
  ticker: string;
  currentPrice: number;
}

export default function MultiplesCards({ stats, companyName, ticker, currentPrice }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold text-white">{ticker}</h2>
        {companyName && <span className="text-sm text-slate-400">{companyName}</span>}
        <span className="text-sm font-mono text-pink-400 tabular-nums">${currentPrice.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const pd = s.premiumDiscount;
          const isPremium = pd !== null && pd > 5;
          const isDiscount = pd !== null && pd < -5;
          const borderColor = isDiscount ? 'border-emerald-500/30' : isPremium ? 'border-red-500/30' : 'border-slate-700/50';
          const bgColor = isDiscount ? 'bg-emerald-500/5' : isPremium ? 'bg-red-500/5' : 'bg-slate-800/50';

          return (
            <div key={s.key} className={`${bgColor} border ${borderColor} rounded-xl p-4 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">{s.label}</span>
                {isDiscount && <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
                {isPremium && <TrendingUp className="w-3.5 h-3.5 text-red-400" />}
                {!isDiscount && !isPremium && pd !== null && <Minus className="w-3.5 h-3.5 text-slate-500" />}
              </div>
              <div className="text-lg font-bold text-white tabular-nums">{formatMultiple(s.current)}</div>
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
