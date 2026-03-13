import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Play, BarChart3, TrendingUp, Info, Loader2 } from 'lucide-react';
import type { FinancialData, DCFInputs, DCFResult } from '../types';
import { runMonteCarloSimulation, MonteCarloConfig, MonteCarloResult } from '../calculations/monte-carlo';

/* ── Extracted & memoised slider ─────────────────────────────────────────── */
const SimSlider = React.memo(function SimSlider({ label, value, onChange, min, max, step, suffix = '' }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-xs font-mono text-slate-300">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );
});

interface MonteCarloSimulationProps {
  dcf: DCFResult;
  data: FinancialData;
  inputs: DCFInputs;
}

export default function MonteCarloSimulation({ dcf, data, inputs }: MonteCarloSimulationProps) {
  const [config, setConfig] = useState<MonteCarloConfig>({
    numSimulations: 1000,
    revGrowthStdDev: 3,
    ebitMarginStdDev: 3,
    termGrowthStdDev: 0.5,
    waccStdDev: 0.5,
  });

  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = useCallback(() => {
    setRunning(true);
    // Use setTimeout to allow the UI to update with loading state
    setTimeout(() => {
      try {
        const res = runMonteCarloSimulation(data, inputs, config);
        setResult(res);
      } catch (err) {
        console.error('Monte Carlo simulation failed:', err);
      }
      setRunning(false);
    }, 50);
  }, [data, inputs, config]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Monte Carlo Simulation</h2>
        <p className="text-xs text-slate-500 mt-0.5">Run thousands of DCF simulations with randomized inputs to estimate the probability distribution of intrinsic value</p>
      </div>

      {/* Monte Carlo Definition */}
      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-emerald-300">What is a Monte Carlo Simulation?</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
              Instead of producing a single fair-value estimate, a Monte Carlo simulation runs your DCF model thousands of times — each time
              slightly randomizing key assumptions like revenue growth, profit margins, and discount rate. The result is a <span className="text-slate-300 font-medium">range of possible values</span> rather
              than a single number, showing you how sensitive the valuation is to changes in your inputs and what the probability is that the stock is undervalued.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
              <span className="text-slate-300 font-medium">How to use:</span> Adjust the standard deviation sliders below to set how much each input can vary (wider spread = more uncertainty), pick a simulation count, then hit <span className="text-emerald-400 font-medium">Run Simulation</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Config Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="vw-card rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Simulations</h3>
          <div className="flex gap-2">
            {[1000, 5000, 10000].map(n => (
              <button
                key={n}
                onClick={() => setConfig(prev => ({ ...prev, numSimulations: n }))}
                className="flex-1 py-1.5 rounded-lg text-xs font-mono transition-all"
                style={{
                  background: config.numSimulations === n ? 'rgba(0, 212, 170, 0.15)' : 'transparent',
                  border: `1px solid ${config.numSimulations === n ? 'rgba(0, 212, 170, 0.4)' : 'var(--vw-border-dim)'}`,
                  color: config.numSimulations === n ? 'var(--vw-accent)' : 'var(--vw-text-secondary)',
                }}
              >
                {(n / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>

        <div className="vw-card rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Revenue Growth Spread</h3>
          <SimSlider label="Std Dev (%)" value={config.revGrowthStdDev} onChange={v => setConfig(p => ({ ...p, revGrowthStdDev: v }))}
            min={1} max={15} step={0.5} suffix="%" />
        </div>

        <div className="vw-card rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Margin Spread</h3>
          <SimSlider label="Std Dev (%)" value={config.ebitMarginStdDev} onChange={v => setConfig(p => ({ ...p, ebitMarginStdDev: v }))}
            min={1} max={15} step={0.5} suffix="%" />
        </div>

        <div className="vw-card rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">WACC & Growth Spread</h3>
          <SimSlider label="Term Growth Std (%)" value={config.termGrowthStdDev} onChange={v => setConfig(p => ({ ...p, termGrowthStdDev: v }))}
            min={0.1} max={2} step={0.1} suffix="%" />
          <SimSlider label="WACC Std (%)" value={config.waccStdDev} onChange={v => setConfig(p => ({ ...p, waccStdDev: v }))}
            min={0.1} max={2} step={0.1} suffix="%" />
        </div>
      </div>

      {/* Run Button */}
      <div className="flex justify-center">
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #00d4aa, #00a88a)',
            color: 'white',
            boxShadow: '0 0 24px -4px rgba(0, 212, 170, 0.4)',
          }}
        >
          {running ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running {config.numSimulations.toLocaleString()} Simulations...</>
          ) : (
            <><Play className="w-4 h-4" /> Run Simulation</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="vw-card rounded-xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vw-text-secondary)' }}>Mean</div>
              <div className="text-xl font-mono font-light text-white">${result.mean.toFixed(2)}</div>
            </div>
            <div className="vw-card rounded-xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vw-text-secondary)' }}>Median</div>
              <div className="text-xl font-mono font-light text-white">${result.median.toFixed(2)}</div>
            </div>
            <div className="vw-card rounded-xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vw-text-secondary)' }}>Std Dev</div>
              <div className="text-xl font-mono font-light text-slate-300">${result.stdDev.toFixed(2)}</div>
            </div>
            <div className="vw-card rounded-xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vw-text-secondary)' }}>Current Price</div>
              <div className="text-xl font-mono font-light text-slate-300">${result.currentPrice.toFixed(2)}</div>
            </div>
            <div className="vw-card rounded-xl p-4 text-center col-span-2">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vw-text-secondary)' }}>P(Undervalued)</div>
              <div className={`text-2xl font-mono font-light ${result.probabilityUndervalued >= 0.6 ? 'text-emerald-400' : result.probabilityUndervalued >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                {(result.probabilityUndervalued * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Histogram */}
          <div className="vw-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Intrinsic Value Distribution ({result.values.length.toLocaleString()} simulations)
              </h3>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.histogram} margin={{ top: 24, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="bin" tick={{ fill: '#b0bec5', fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `$${v}`} interval={Math.floor(result.histogram.length / 6)} />
                  <YAxis tick={{ fill: '#b0bec5', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e8edf4' }}
                    itemStyle={{ color: '#e8edf4' }}
                    formatter={(v: number) => [v, 'Simulations']}
                    labelFormatter={(v: number) => `~$${v}`}
                  />
                  <ReferenceLine x={result.histogram.reduce((closest, h) =>
                    Math.abs(h.bin - result.currentPrice) < Math.abs(closest.bin - result.currentPrice) ? h : closest
                  ).bin} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'Price', position: 'top', fill: '#fca5a5', fontSize: 12, fontWeight: 600 }} />
                  <ReferenceLine x={result.histogram.reduce((closest, h) =>
                    Math.abs(h.bin - result.median) < Math.abs(closest.bin - result.median) ? h : closest
                  ).bin} stroke="#00d4aa" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'Median', position: 'top', fill: '#6ee7b7', fontSize: 12, fontWeight: 600 }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {result.histogram.map((entry, i) => (
                      <Cell key={i} fill={entry.bin >= result.currentPrice ? 'rgba(0, 212, 170, 0.6)' : 'rgba(239, 68, 68, 0.4)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px]" style={{ color: 'var(--vw-text-secondary)' }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Above current price</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Below current price</span>
            </div>
          </div>

          {/* Percentile Table */}
          <div className="vw-card rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Confidence Intervals
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs" style={{ color: 'var(--vw-text-secondary)' }}>
                    <th className="pb-3 text-left">Percentile</th>
                    <th className="pb-3 text-right">Intrinsic Value</th>
                    <th className="pb-3 text-right">vs Current Price</th>
                    <th className="pb-3 text-right">Upside/Downside</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { label: '10th (Downside)', value: result.percentiles.p10 },
                    { label: '25th', value: result.percentiles.p25 },
                    { label: '50th (Median)', value: result.percentiles.p50 },
                    { label: '75th', value: result.percentiles.p75 },
                    { label: '90th (Upside)', value: result.percentiles.p90 },
                  ]).map(({ label, value }) => {
                    const diff = result.currentPrice > 0 ? (value - result.currentPrice) / result.currentPrice : 0;
                    return (
                      <tr key={label} className="border-t border-slate-700/30">
                        <td className="py-3 text-slate-400">{label}</td>
                        <td className="py-3 text-right font-mono text-white">${value.toFixed(2)}</td>
                        <td className={`py-3 text-right font-mono ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${diff >= 0.1 ? 'bg-emerald-500/15 text-emerald-400' :
                            diff >= 0 ? 'bg-emerald-500/10 text-emerald-400/70' :
                              diff >= -0.1 ? 'bg-red-500/10 text-red-400/70' :
                                'bg-red-500/15 text-red-400'}`}>
                            {diff >= 0 ? 'Upside' : 'Downside'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info */}
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
                Each simulation randomizes Revenue Growth, EBIT Margin, Terminal Growth Rate, and WACC around your current slider values using a triangular distribution.
                Green bars represent simulations where the intrinsic value exceeds the current market price. The "P(Undervalued)" metric shows the percentage of simulations suggesting the stock is undervalued.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
