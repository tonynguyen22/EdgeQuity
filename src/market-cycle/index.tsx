import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Activity, Shield, Zap } from 'lucide-react';
import type { MarketCycleResult, WyckoffPhase, TimeframeResult, Timeframe } from './types';
import { fetchMarketCycle } from './calculations';

/* ── Design Tokens ─────────────────────────────────────────────────────────── */

const PHASE_COLORS: Record<WyckoffPhase, string> = {
  'Accumulation': '#3b82f6',
  'Mark-Up': '#10b981',
  'Distribution': '#f59e0b',
  'Mark-Down': '#ef4444',
};

const PHASE_TEXT: Record<WyckoffPhase, string> = {
  'Accumulation': 'text-blue-400',
  'Mark-Up': 'text-emerald-400',
  'Distribution': 'text-amber-400',
  'Mark-Down': 'text-red-400',
};

const PHASE_BG: Record<WyckoffPhase, string> = {
  'Accumulation': 'bg-blue-500/10 border-blue-500/25',
  'Mark-Up': 'bg-emerald-500/10 border-emerald-500/25',
  'Distribution': 'bg-amber-500/10 border-amber-500/25',
  'Mark-Down': 'bg-red-500/10 border-red-500/25',
};

const PHASES: WyckoffPhase[] = ['Accumulation', 'Mark-Up', 'Distribution', 'Mark-Down'];

const ZONE_COLORS = {
  'strong-buy': { bar: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/30', icon: '🟢' },
  'neutral': { bar: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/30', icon: '🟡' },
  'defensive': { bar: '#ef4444', text: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/30', icon: '🔴' },
};

const TF_LABELS: Record<Timeframe, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

/* ── Readiness Gauge (SVG Arc) ────────────────────────────────────────────── */

function ReadinessGauge({ score, zone, label }: { score: number; zone: keyof typeof ZONE_COLORS; label: string }) {
  const z = ZONE_COLORS[zone];
  const angle = -90 + (score / 100) * 180;
  const needleX = 100 + 62 * Math.cos((angle * Math.PI) / 180);
  const needleY = 100 + 62 * Math.sin((angle * Math.PI) / 180);

  return (
    <div className={`rounded-2xl border ${z.border} ${z.bg} p-6 transition-all duration-500`}
      style={{ backdropFilter: 'blur(8px)' }}>
      <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-4 text-center">
        Investment Readiness
      </p>

      <div className="relative w-52 h-[120px] mx-auto mb-2">
        <svg viewBox="0 0 200 115" className="w-full h-full">
          {/* Track */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(100,116,139,0.12)" strokeWidth="14" strokeLinecap="round" />
          {/* Red zone */}
          <path d="M 20 100 A 80 80 0 0 1 55.6 33.6" fill="none" stroke="rgba(239,68,68,0.25)" strokeWidth="14" strokeLinecap="round" />
          {/* Amber zone */}
          <path d="M 55.6 33.6 A 80 80 0 0 1 117.2 21.6" fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth="14" />
          {/* Green zone */}
          <path d="M 117.2 21.6 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="14" strokeLinecap="round" />
          {/* Active fill */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={z.bar} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 251.3} 251.3`}
            style={{ opacity: 0.6, transition: 'stroke-dasharray 1s ease-out' }} />
          {/* Needle */}
          <line x1="100" y1="100" x2={needleX} y2={needleY} stroke={z.bar} strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'all 1s ease-out' }} />
          <circle cx="100" cy="100" r="4" fill={z.bar} />
          {/* Labels */}
          <text x="24" y="113" fill="rgba(148,163,184,0.5)" fontSize="8" fontFamily="monospace">0</text>
          <text x="168" y="113" fill="rgba(148,163,184,0.5)" fontSize="8" fontFamily="monospace">100</text>
        </svg>
      </div>

      <div className="text-center">
        <p className={`text-5xl font-bold tabular-nums tracking-tight ${z.text}`}
          style={{ fontVariantNumeric: 'tabular-nums', transition: 'color 0.5s' }}>
          {score}
        </p>
        <p className={`text-sm font-semibold mt-1 ${z.text}`}>{label}</p>
        <p className="text-[10px] text-slate-600 mt-2">
          Monthly + Weekly + Daily alignment
        </p>
      </div>
    </div>
  );
}

/* ── Timeframe Phase Card ────────────────────────────────────────────────── */

function TimeframeCard({ tf, result, icon }: { tf: string; result: TimeframeResult; icon: React.ReactNode }) {
  const color = PHASE_COLORS[result.phase];
  return (
    <div className="group relative bg-slate-800/20 hover:bg-slate-800/40 border border-slate-700/20 hover:border-slate-600/30 rounded-xl p-3.5 transition-all duration-300 cursor-default">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 bg-slate-800/60">
          {icon}
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-medium">{tf}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }} />
        <span className={`text-base font-bold ${PHASE_TEXT[result.phase]}`}>{result.phase}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 pl-4">
        <span className="text-xs tabular-nums text-slate-400 font-medium">{result.confidence}%</span>
        <span className="text-[10px] text-slate-600">confidence</span>
      </div>
      {/* Mini bar */}
      <div className="mt-2.5 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${result.confidence}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ── Alignment Badge ─────────────────────────────────────────────────────── */

function AlignmentBadge({ daily, weekly, monthly }: { daily: TimeframeResult; weekly: TimeframeResult; monthly: TimeframeResult }) {
  const bullish = (p: WyckoffPhase) => p === 'Mark-Up' || p === 'Accumulation';
  const allBullish = bullish(monthly.phase) && bullish(weekly.phase) && bullish(daily.phase);
  const allBearish = !bullish(monthly.phase) && !bullish(weekly.phase) && !bullish(daily.phase);
  const aligned = allBullish || allBearish;
  const count = [monthly.phase, weekly.phase, daily.phase].filter(p => bullish(p)).length;

  let text: string;
  let style: string;
  if (aligned) {
    text = allBullish ? 'Fully Aligned Bullish' : 'Fully Aligned Bearish';
    style = allBullish
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
      : 'bg-red-500/10 text-red-400 border-red-500/25';
  } else {
    text = `${count}/3 Bullish`;
    style = 'bg-amber-500/10 text-amber-400 border-amber-500/25';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${style}`}>
      {aligned ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {text}
    </div>
  );
}

/* ── Phase Donut ─────────────────────────────────────────────────────────── */

function PhaseDonut({ result, label }: { result: TimeframeResult; label: string }) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={PHASES.map(p => ({ name: p, value: result.probabilities[p] }))}
              dataKey="value" nameKey="name"
              cx="50%" cy="50%"
              innerRadius={44} outerRadius={70}
              paddingAngle={2} strokeWidth={0}
            >
              {PHASES.map(p => <Cell key={p} fill={PHASE_COLORS[p]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-lg font-bold tabular-nums ${PHASE_TEXT[result.phase]}`}>{result.confidence}%</span>
          <span className="text-[9px] text-slate-500 mt-0.5">{result.phase}</span>
          <span className="text-[8px] text-slate-600">{label}</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-1.5">
        {PHASES.map(p => {
          const prob = result.probabilities[p];
          const active = p === result.phase;
          return (
            <div key={p} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-300 ${active ? 'bg-slate-700/30' : 'hover:bg-slate-800/20'}`}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PHASE_COLORS[p] }} />
              <span className={`text-[13px] flex-1 ${active ? 'text-white font-semibold' : 'text-slate-500'}`}>{p}</span>
              <span className={`text-[13px] tabular-nums font-semibold ${active ? PHASE_TEXT[p] : 'text-slate-600'}`}>{prob}%</span>
              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${prob}%`, backgroundColor: PHASE_COLORS[p] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Phase Info Data ─────────────────────────────────────────────────────── */

const PHASE_INFO: { phase: WyckoffPhase; what: string; action: string }[] = [
  {
    phase: 'Accumulation',
    what: 'After a significant decline, the market finds a floor. Institutional investors quietly accumulate positions while retail sentiment remains fearful. Price moves sideways, volume declines on down moves.',
    action: 'Build watchlists and small starter positions. Look for stocks with strong fundamentals at discounted valuations. Dollar-cost averaging works well.',
  },
  {
    phase: 'Mark-Up',
    what: 'Sustained uptrend with healthy momentum. Price breaks above key moving averages, golden cross forms. Volume increases on up days, RSI stays in the 50–70 healthy range.',
    action: 'Best phase for full investment. Ride the trend, add on pullbacks to the 50-day moving average. Growth and momentum strategies outperform.',
  },
  {
    phase: 'Distribution',
    what: 'After a prolonged advance, the market stalls. Momentum fades, SMA 50 flattens, MACD diverges from price. Volume is high but price makes little progress.',
    action: 'Reduce risk. Take profits, tighten stop-losses. Rotate from growth into defensive sectors. Increase cash. Avoid chasing new breakouts.',
  },
  {
    phase: 'Mark-Down',
    what: 'Sustained downtrend with selling pressure. Price falls below key moving averages, death cross forms. Rallies are sold, RSI stays below 40.',
    action: 'Capital preservation is the priority. Raise cash, consider hedging. Avoid buying dips until accumulation signals emerge. Focus on bonds and defensive assets.',
  },
];

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function MarketCycle() {
  const [data, setData] = useState<MarketCycleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('daily');
  const [expandedPhase, setExpandedPhase] = useState<WyckoffPhase | null>(null);

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

  useEffect(() => {
    if (data) setExpandedPhase(data.daily.phase);
  }, [data]);

  const activeResult = data ? data[activeTimeframe] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Landing */}
      {!data && !loading && !error && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
              Market <span style={{ color: 'var(--vw-accent)' }}>Cycle</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>Multi-timeframe Wyckoff cycle detection</p>
          </div>
          <div className="w-full max-w-2xl rounded-2xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
            <ul className="space-y-2.5">
              {[
                'Monthly, weekly, and daily Wyckoff analysis on S&P 500 (SPY)',
                'Investment Readiness Score (0–100) — should you deploy capital now?',
                'Dynamic guidance tailored to the current 3-timeframe phase combination',
                'Probability breakdown for each Wyckoff phase across all timeframes',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: 'rgba(0,212,170,0.12)', color: 'var(--vw-accent)' }}>{i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Header */}
      {(data || loading || error) && (
        <div className="text-center mb-1">
          <h1 className="text-4xl font-bold tracking-tight mb-1.5" style={{ color: 'var(--vw-text-primary)' }}>
            Market <span style={{ color: 'var(--vw-accent)' }}>Cycle</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>Multi-timeframe Wyckoff cycle detection</p>
          {data && (
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono tracking-wide">
              SPY · Monthly/{data.candleCount.monthly}mo · Weekly/{data.candleCount.weekly}w · Daily/{data.candleCount.daily}d · Alpha Vantage
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="max-w-xl mx-auto text-center py-16">
          <RefreshCw className="w-7 h-7 text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Analyzing SPY across monthly, weekly & daily…</p>
          <p className="text-[10px] text-slate-600 mt-1">First load may take a few seconds</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="max-w-xl mx-auto text-center py-12">
          <AlertCircle className="w-7 h-7 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Main Dashboard */}
      {!loading && !error && data && (
        <div className="space-y-5 animate-[fadeIn_0.6s_ease-out]">
          {/* ─── Row 1: Gauge + Timeframe Cards ─── */}
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-5">
              {/* Gauge */}
              <ReadinessGauge score={data.readinessScore} zone={data.readinessZone} label={data.readinessLabel} />

              {/* Timeframe Cards + Alignment */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <TimeframeCard tf="Monthly" result={data.monthly} icon={<Shield className="w-3.5 h-3.5" />} />
                  <TimeframeCard tf="Weekly" result={data.weekly} icon={<Activity className="w-3.5 h-3.5" />} />
                  <TimeframeCard tf="Daily" result={data.daily} icon={<Zap className="w-3.5 h-3.5" />} />
                </div>
                <div className="flex items-center justify-between">
                  <AlignmentBadge daily={data.daily} weekly={data.weekly} monthly={data.monthly} />
                  <span className="text-[10px] text-slate-600 font-mono">
                    {data.dataRange.from} → {data.dataRange.to}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Row 2: Guidance ─── */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-800/20 border border-slate-700/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-base">{ZONE_COLORS[data.readinessZone].icon}</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-1.5">What This Means</p>
                  <p className="text-[13px] text-slate-300/90 leading-[1.7]">{data.guidance}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Row 3: Phase Probabilities ─── */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-800/20 border border-slate-700/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.1em]">Phase Probabilities</h2>
                <div className="flex bg-slate-900/60 rounded-lg p-0.5 border border-slate-700/20">
                  {(['daily', 'weekly', 'monthly'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setActiveTimeframe(tf)}
                      className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all duration-300 ${activeTimeframe === tf
                          ? 'bg-slate-700/80 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {TF_LABELS[tf]}
                    </button>
                  ))}
                </div>
              </div>

              {activeResult && <PhaseDonut result={activeResult} label={TF_LABELS[activeTimeframe]} />}
            </div>
          </div>

          {/* ─── Row 4: Wyckoff Phases ─── */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-800/20 border border-slate-700/20 rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.1em] mb-3">Wyckoff Market Phases</h2>
              <div className="space-y-1.5">
                {PHASE_INFO.map(({ phase, what, action }) => {
                  const isDaily = phase === data.daily.phase;
                  const isWeekly = phase === data.weekly.phase;
                  const isMonthly = phase === data.monthly.phase;
                  const isExpanded = expandedPhase === phase;
                  const hasBadge = isDaily || isWeekly || isMonthly;
                  return (
                    <div key={phase}
                      className={`rounded-xl border transition-all duration-300 ${isDaily ? PHASE_BG[phase] : 'bg-slate-800/10 border-slate-700/15 hover:border-slate-700/30'
                        }`}>
                      <button
                        onClick={() => setExpandedPhase(isExpanded ? null : phase)}
                        className="w-full flex items-center gap-2.5 p-3 text-left group"
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                        <span className={`text-[13px] font-medium flex-1 ${isDaily ? PHASE_TEXT[phase] : 'text-slate-400 group-hover:text-slate-300'}`}>
                          {phase}
                        </span>
                        {hasBadge && (
                          <div className="flex gap-1">
                            {isMonthly && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 font-medium uppercase tracking-wider">Mo</span>}
                            {isWeekly && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 font-medium uppercase tracking-wider">Wk</span>}
                            {isDaily && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 font-medium uppercase tracking-wider">Day</span>}
                          </div>
                        )}
                        {isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                          : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-3 pb-3 space-y-1.5 pl-[26px]">
                          <p className="text-xs text-slate-400/80 leading-relaxed">{what}</p>
                          <p className="text-xs leading-relaxed">
                            <span className="font-semibold text-slate-300">What to do: </span>
                            <span className="text-slate-400">{action}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fade-in keyframe */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
