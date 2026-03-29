import { TrendingUp, TrendingDown } from 'lucide-react';
import type { DDMResult, DDMInputs } from '../types';

interface DDMResultsProps {
  ticker: string;
  data: { companyName: string; currentPrice: number };
  result: DDMResult;
  inputs: DDMInputs;
  sensitivity: {
    matrix: (number | null)[][];
    gSteps: number[];
    coeSteps: number[];
  } | null;
  onGoBack: () => void;
  onAdjust: () => void;
}

export default function DDMResults({
  ticker, data, result, inputs, sensitivity, onGoBack, onAdjust,
}: DDMResultsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-bold text-white">{ticker}</h2>
          <span className="text-sm text-slate-400">{data.companyName}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            {result.modelLabel}
          </span>
        </div>
        <button onClick={onGoBack} className="text-sm text-slate-500 hover:text-white transition-colors">
          New Search
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-sm text-slate-400 mb-1">Intrinsic Value</div>
          <div className="text-3xl font-light tracking-tight">${result.intrinsicValue.toFixed(2)}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-sm text-slate-400 mb-1">Current Price</div>
          <div className="text-3xl font-light tracking-tight">${result.currentPrice.toFixed(2)}</div>
        </div>
        <div className={`bg-slate-800/50 border rounded-xl p-5 ${result.upside >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <div className="text-sm text-slate-400 mb-1">Upside / Downside</div>
          <div className={`text-3xl font-light tracking-tight flex items-center gap-2 ${result.upside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.upside >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            {(result.upside * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-sm text-slate-400 mb-1">Implied Yield</div>
          <div className="text-3xl font-light tracking-tight">{(result.impliedYield * 100).toFixed(2)}%</div>
        </div>
      </div>

      {/* Valuation Bridge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="vw-card rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Valuation Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">PV of Dividends</span>
              <span className="text-sm font-mono text-white">${result.pvDividends.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">PV of Terminal Value</span>
              <span className="text-sm font-mono text-white">${result.pvTerminalValue.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-700/50 pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">Intrinsic Value</span>
              <span className="text-sm font-mono font-semibold" style={{ color: '#f59e0b' }}>${result.intrinsicValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Dividend Stream */}
        {result.dividendStream.length > 0 && (
          <div className="vw-card rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Projected Dividends</h3>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-2 text-left">Period</th>
                    <th className="pb-2 text-right">Dividend</th>
                    <th className="pb-2 text-right">PV</th>
                  </tr>
                </thead>
                <tbody>
                  {result.dividendStream.map((d, i) => (
                    <tr key={i} className="border-t border-slate-700/20">
                      <td className="py-1.5 text-slate-400">{d.year}</td>
                      <td className="py-1.5 text-right font-mono text-slate-300">${d.dividend.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-500">${d.pv.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sensitivity Table */}
      {sensitivity && (
        <div className="vw-card rounded-xl p-6 overflow-x-auto">
          <h3 className="text-sm font-medium text-slate-300 mb-1">Sensitivity Analysis</h3>
          <p className="text-xs text-slate-500 mb-4">Implied value — rows: terminal growth, columns: cost of equity</p>
          <table className="w-full text-sm font-mono text-center">
            <thead>
              <tr>
                <th className="text-left text-xs text-slate-500 pb-3 pr-4">g \ Ke</th>
                {sensitivity.coeSteps.map(coe => (
                  <th key={coe} className={`pb-3 px-3 text-xs font-medium ${Math.abs(coe - inputs.costOfEquity / 100) < 0.0001 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {(coe * 100).toFixed(1)}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensitivity.matrix.map((row, ri) => {
                const g = sensitivity.gSteps[ri];
                const isCurrentG = Math.abs(g - inputs.terminalGrowth / 100) < 0.0001;
                return (
                  <tr key={ri} className="border-t border-slate-700/30">
                    <td className={`text-left py-2.5 pr-4 text-xs ${isCurrentG ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
                      {(g * 100).toFixed(1)}%
                    </td>
                    {row.map((iv, ci) => {
                      const coe = sensitivity.coeSteps[ci];
                      const isCurrentCell = isCurrentG && Math.abs(coe - inputs.costOfEquity / 100) < 0.0001;
                      const pct = iv !== null && data.currentPrice > 0 ? (iv - data.currentPrice) / data.currentPrice : null;
                      const bg = iv === null ? '' : pct !== null && pct >= 0.10 ? 'bg-emerald-500/25' : pct !== null && pct >= 0 ? 'bg-emerald-500/10' : pct !== null && pct >= -0.10 ? 'bg-red-500/10' : 'bg-red-500/25';
                      const textColor = iv === null ? 'text-slate-500' : pct !== null && pct >= 0 ? 'text-emerald-400' : 'text-red-400';
                      return (
                        <td key={ci} className={`py-2.5 px-3 rounded ${bg} ${textColor} ${isCurrentCell ? 'ring-2 ring-amber-500' : ''}`}>
                          {iv === null ? '—' : `$${iv.toFixed(0)}`}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assumptions Summary */}
      <div className="vw-card rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Model Assumptions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Annual Dividend</span>
            <div className="font-mono text-slate-300 mt-0.5">${inputs.currentDividend.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-slate-500">Terminal Growth</span>
            <div className="font-mono text-slate-300 mt-0.5">{inputs.terminalGrowth.toFixed(1)}%</div>
          </div>
          <div>
            <span className="text-slate-500">Cost of Equity</span>
            <div className="font-mono text-slate-300 mt-0.5">{inputs.costOfEquity.toFixed(1)}%</div>
          </div>
          {inputs.modelType !== 'gordon' && (
            <>
              <div>
                <span className="text-slate-500">High Growth Rate</span>
                <div className="font-mono text-slate-300 mt-0.5">{inputs.shortTermGrowth.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-slate-500">High Growth Period</span>
                <div className="font-mono text-slate-300 mt-0.5">{inputs.highGrowthYears} years</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Adjust Assumptions */}
      <div className="flex justify-center">
        <button
          onClick={onAdjust}
          className="px-6 py-2.5 rounded-xl text-sm font-medium border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all"
        >
          Adjust Assumptions
        </button>
      </div>
    </div>
  );
}
