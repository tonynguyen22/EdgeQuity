import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardsProps {
  yieldPct: number | null;
  currentPrice: number;
  annualDiv: number;
  payoutRatio: number | null;
  fcfPayoutRatio: number | null;
  dividendGrowthRate5Y: number | null;
  peTTM: number | null;
  beta: number | null;
}

export default function MetricCards({ yieldPct, currentPrice, annualDiv, payoutRatio, fcfPayoutRatio, dividendGrowthRate5Y, peTTM, beta }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {yieldPct != null && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Dividend Yield</div>
          <div className="text-2xl font-bold text-rose-400">{yieldPct.toFixed(2)}%</div>
          {currentPrice > 0 && <div className="text-xs text-slate-500 mt-0.5">@ ${currentPrice.toFixed(2)}</div>}
        </div>
      )}
      {annualDiv > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Annual Dividend</div>
          <div className="text-2xl font-bold text-white">${annualDiv.toFixed(4)}</div>
          <div className="text-xs text-slate-500 mt-0.5">per share (TTM)</div>
        </div>
      )}
      {payoutRatio != null && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Payout Ratio</div>
          <div className={`text-2xl font-bold ${payoutRatio < 60 ? 'text-emerald-400' : payoutRatio < 90 ? 'text-amber-400' : 'text-red-400'}`}>
            {payoutRatio.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-0.5">of earnings</div>
        </div>
      )}
      {fcfPayoutRatio != null && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">FCF Payout Ratio</div>
          <div className={`text-2xl font-bold ${fcfPayoutRatio < 50 ? 'text-emerald-400' : fcfPayoutRatio < 80 ? 'text-amber-400' : 'text-red-400'}`}>
            {fcfPayoutRatio.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-0.5">of free cash flow</div>
        </div>
      )}
      {dividendGrowthRate5Y != null && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">5Y Div Growth</div>
          <div className={`text-2xl font-bold flex items-center gap-1.5 ${dividendGrowthRate5Y >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {dividendGrowthRate5Y >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {dividendGrowthRate5Y >= 0 ? '+' : ''}{dividendGrowthRate5Y.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-0.5">annualized</div>
        </div>
      )}
      {peTTM != null && peTTM > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">P/E (TTM)</div>
          <div className="text-2xl font-bold text-white">{peTTM.toFixed(1)}x</div>
          <div className="text-xs text-slate-500 mt-0.5">trailing earnings</div>
        </div>
      )}
      {beta != null && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Beta</div>
          <div className="text-2xl font-bold text-white">{beta.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-0.5">{beta < 1 ? 'lower vol' : beta > 1 ? 'higher vol' : 'market avg'}</div>
        </div>
      )}
    </div>
  );
}
