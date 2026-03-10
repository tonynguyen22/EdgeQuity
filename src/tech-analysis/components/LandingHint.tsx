import { TrendingUp } from 'lucide-react';

export default function LandingHint() {
  return (
    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6 max-w-xl mx-auto space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-300">About Technical Analysis</span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Fetches 1 year of daily price data, resamples to weekly, and computes 20+ indicators across two timeframes (D1 and W1). Includes a 5-level signal score, support/resistance zones with buy-zone detection, and educational hover cards on every indicator.
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
        {([
          ['RSI, Stochastic, MFI, StochRSI, CCI, %R', 'Oscillators — spot overbought/oversold conditions and momentum shifts.'],
          ['MACD, ADX, PSAR, EMA 9/21, SMA 20/50/200', 'Trend — direction, strength, crossovers, and moving average alignment.'],
          ['Bollinger %B, BB Width, ATR', 'Volatility — how extended or compressed price movement is.'],
          ['ROC, Volume, OBV, 52-Week Position', 'Context — momentum, money flow, participation, and yearly range.'],
          ['Daily + Weekly Timeframes', 'Dual-timeframe analysis — compare short-term and long-term signals.'],
          ['Support & Resistance Zones', 'Pivot points, Fibonacci, swing levels, and a technical buy zone.'],
        ] as [string, string][]).map(([title, desc]) => (
          <div key={title} className="text-xs space-y-0.5">
            <p className="font-medium text-slate-300">{title}</p>
            <p className="text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
