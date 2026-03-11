import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { RefreshCw, AlertCircle } from 'lucide-react';
import type { MarketCycleResult, WyckoffPhase } from './types';
import { fetchMarketCycle } from './calculations';

const PHASE_COLORS: Record<WyckoffPhase, string> = {
  'Accumulation': '#3b82f6',
  'Mark-Up': '#10b981',
  'Distribution': '#f59e0b',
  'Mark-Down': '#ef4444',
};

const PHASE_TEXT_COLORS: Record<WyckoffPhase, string> = {
  'Accumulation': 'text-blue-400',
  'Mark-Up': 'text-emerald-400',
  'Distribution': 'text-amber-400',
  'Mark-Down': 'text-red-400',
};

const PHASE_BG_COLORS: Record<WyckoffPhase, string> = {
  'Accumulation': 'bg-blue-500/15 border-blue-500/30',
  'Mark-Up': 'bg-emerald-500/15 border-emerald-500/30',
  'Distribution': 'bg-amber-500/15 border-amber-500/30',
  'Mark-Down': 'bg-red-500/15 border-red-500/30',
};

const PHASES: WyckoffPhase[] = ['Accumulation', 'Mark-Up', 'Distribution', 'Mark-Down'];

export default function MarketCycle() {
  const [data, setData] = useState<MarketCycleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchMarketCycle()
      .then(result => { if (!cancelled) setData(result); })
      .catch(err => { if (!cancelled) setError(err.message || 'Failed to load market cycle data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-teal-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6" />
          Market Cycle
        </h1>
        <p className="text-sm text-slate-500 mt-1">Wyckoff cycle detection based on SPY daily data</p>
      </div>

      {loading && (
        <div className="max-w-xl mx-auto text-center py-16">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Analyzing SPY market cycle...</p>
        </div>
      )}

      {!loading && error && (
        <div className="max-w-xl mx-auto text-center py-12">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Current Phase Banner */}
          <div className="max-w-2xl mx-auto">
            <div className={`rounded-xl border p-5 text-center ${PHASE_BG_COLORS[data.phase]}`}>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Current Phase</p>
              <p className={`text-3xl font-bold ${PHASE_TEXT_COLORS[data.phase]}`}>
                {data.phase}
              </p>
              <p className="text-sm text-slate-300 mt-1">
                Confidence: <span className="font-semibold tabular-nums">{data.confidence}%</span>
              </p>
            </div>
          </div>

          {/* Donut Chart + Phase Breakdown */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Phase Probabilities (SPY)</h2>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-48 h-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PHASES.map(p => ({ name: p, value: data.probabilities[p] }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {PHASES.map(p => (
                          <Cell key={p} fill={PHASE_COLORS[p]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className={`text-sm font-bold ${PHASE_TEXT_COLORS[data.phase]}`}>
                      {data.confidence}%
                    </span>
                    <span className="text-[10px] text-slate-500">{data.phase}</span>
                  </div>
                </div>

                {/* Phase Breakdown */}
                <div className="flex-1 w-full space-y-2.5">
                  {PHASES.map(p => {
                    const prob = data.probabilities[p];
                    const isCurrent = p === data.phase;
                    return (
                      <div
                        key={p}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isCurrent ? 'bg-slate-700/40' : ''
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: PHASE_COLORS[p] }}
                        />
                        <span className={`text-sm flex-1 ${isCurrent ? 'text-white font-medium' : 'text-slate-400'}`}>
                          {p}
                        </span>
                        <span className={`text-sm tabular-nums font-semibold ${isCurrent ? PHASE_TEXT_COLORS[p] : 'text-slate-500'}`}>
                          {prob}%
                        </span>
                        {/* Mini bar */}
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${prob}%`, backgroundColor: PHASE_COLORS[p] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <p className="text-xs text-slate-600 mt-4 text-center">
                Data: {data.dataRange.from} to {data.dataRange.to} ({data.candleCount} candles)
              </p>
            </div>
          </div>

          {/* Phase Descriptions */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Wyckoff Market Phases</h2>
              <div className="grid grid-cols-1 gap-3">
                {([
                  {
                    phase: 'Accumulation' as WyckoffPhase,
                    what: 'After a significant decline, the market finds a floor. Institutional investors quietly accumulate positions while retail sentiment remains fearful. Price moves sideways in a range, volume declines on down moves (selling exhaustion). SMA 50 is below SMA 200 but starts to flatten.',
                    action: 'Begin building watchlists and small starter positions. Look for stocks with strong fundamentals trading at discounted valuations. Dollar-cost averaging works well in this phase.',
                  },
                  {
                    phase: 'Mark-Up' as WyckoffPhase,
                    what: 'The market transitions into a sustained uptrend. Price breaks above key moving averages, a golden cross forms (SMA 50 crosses above SMA 200). Volume increases on up days, RSI stays in the 50-70 healthy range. Higher highs and higher lows confirm the trend.',
                    action: 'This is the best phase for being fully invested. Ride the trend, add to winning positions on pullbacks to the SMA 50. Avoid premature profit-taking. Growth and momentum strategies tend to outperform.',
                  },
                  {
                    phase: 'Distribution' as WyckoffPhase,
                    what: 'After a prolonged advance, the market begins to stall. Price remains elevated but momentum fades. The SMA 50 flattens, MACD diverges from price. Volume is high but price makes little progress. Volatility often increases.',
                    action: 'Begin reducing risk. Take profits on extended positions, tighten stop-losses. Rotate from growth into defensive sectors (utilities, healthcare, staples). Increase cash allocation. Avoid chasing new breakouts.',
                  },
                  {
                    phase: 'Mark-Down' as WyckoffPhase,
                    what: 'The market enters a sustained downtrend. Price falls below key moving averages, a death cross forms (SMA 50 crosses below SMA 200). Rallies are sold, RSI stays below 40, and lower lows/lower highs dominate.',
                    action: 'Capital preservation is the priority. Raise cash, consider hedging via inverse ETFs or options. Avoid buying dips until accumulation signals emerge. Focus on high-quality bonds and defensive assets.',
                  },
                ]).map(({ phase, what, action }) => (
                  <div
                    key={phase}
                    className={`rounded-lg border p-4 ${
                      phase === data.phase
                        ? PHASE_BG_COLORS[phase]
                        : 'bg-slate-800/20 border-slate-700/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                      <span className={`text-sm font-medium ${phase === data.phase ? PHASE_TEXT_COLORS[phase] : 'text-slate-400'}`}>
                        {phase}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{what}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-300">What to do: </span>{action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
