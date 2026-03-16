import React from 'react';
import {
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Tooltip, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Shield, DollarSign, Activity, AlertTriangle, X, Plus } from 'lucide-react';
import { METRIC_THRESHOLDS, scoreTo100 } from '../calculations';
import type { LetterGrade, GradeResult, AltmanZResult, PiotroskiResult, CategoryResult, MetricResult } from '../types';

/* ─── Grade color system ──────────────────────────────────────────────────── */

const gradeColors: Record<LetterGrade, { text: string; bg: string; border: string; badge: string; bar: string }> = {
    A: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300', bar: 'bg-emerald-500' },
    B: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300', bar: 'bg-blue-500' },
    C: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300', bar: 'bg-amber-500' },
    D: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300', bar: 'bg-red-500' },
};

const gradeLabel: Record<LetterGrade, string> = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor' };

const TICKER_COLORS: string[] = ['#10b981', '#3b82f6'];

/* ─── Processed data shape per ticker ─────────────────────────────────────── */

export interface TickerAnalysis {
    ticker: string;
    companyName: string;
    gradeResult: GradeResult;
    altmanZ: AltmanZResult | null;
    piotroski: PiotroskiResult | null;
    riskFlags: string[];
}

interface Props {
    analyses: TickerAnalysis[];
    onRemoveTicker: (ticker: string) => void;
    onAddTicker: () => void;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function GradeBadge({ grade, size = 'sm' }: { grade: LetterGrade; size?: 'sm' | 'lg' }) {
    const c = gradeColors[grade];
    if (size === 'lg') {
        return (
            <div className={`w-16 h-16 rounded-full border-[3px] ${c.border} ${c.bg} flex items-center justify-center`}>
                <span className={`text-3xl font-bold ${c.text}`}>{grade}</span>
            </div>
        );
    }
    return <span className={`text-xs font-bold px-2 py-0.5 rounded min-w-[28px] text-center ${c.badge}`}>{grade}</span>;
}

function WinnerIndicator({ isWinner }: { isWinner: boolean }) {
    if (!isWinner) return null;
    return <span className="text-[10px] font-semibold text-emerald-400 ml-1">★</span>;
}

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
    if (trend === 'improving') return <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />;
    if (trend === 'declining') return <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />;
    return <span className="w-3 h-3 flex-shrink-0 text-slate-500 text-xs flex items-center justify-center">&mdash;</span>;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function ComparisonView({ analyses, onRemoveTicker, onAddTicker }: Props) {
    const isSingle = analyses.length === 1;

    /* Radar chart data */
    const radarData = ['Health', 'Profit', 'Growth', 'Cash Flow'].map((subject, idx) => {
        const point: Record<string, any> = { subject, fullMark: 100 };
        analyses.forEach((a, i) => {
            point[a.ticker] = scoreTo100(a.gradeResult.rawCategories[idx].score);
        });
        return point;
    });

    return (
        <div className="space-y-6">

            {/* ─── Overall Grade Cards ───────────────────────────────────────── */}
            <div className={`grid gap-6 ${isSingle ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {analyses.map((a, i) => {
                    const { gradeResult, ticker, companyName } = a;
                    const c = gradeColors[gradeResult.overallGrade];
                    return (
                        <div key={ticker} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className={`flex-shrink-0 w-20 h-20 rounded-full border-[3px] ${c.border} ${c.bg} flex items-center justify-center`}>
                                    <span className={`text-4xl font-bold ${c.text}`}>{gradeResult.overallGrade}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-white font-mono">{ticker}</span>
                                        <button
                                            onClick={() => onRemoveTicker(ticker)}
                                            className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-dim)', color: 'var(--vw-text-tertiary)' }}
                                            title="Remove"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {companyName && <span className="text-sm text-slate-400 block truncate">{companyName}</span>}
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-2xl font-light text-slate-300">
                                            {gradeResult.overallScore}<span className="text-sm text-slate-500">/100</span>
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
                                            {gradeLabel[gradeResult.overallGrade]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Category mini-scores */}
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                {gradeResult.rawCategories.map(cat => {
                                    const cc = gradeColors[cat.grade];
                                    return (
                                        <div key={cat.name} className={`rounded-lg p-2 text-center ${cc.bg} border ${cc.border}`}>
                                            <div className="text-[10px] text-slate-400 truncate mb-0.5">{cat.name.split(' ')[0]}</div>
                                            <div className={`text-sm font-bold ${cc.text}`}>{cat.grade}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-slate-400 mt-3 leading-relaxed">{gradeResult.summary}</p>
                        </div>
                    );
                })}
                {/* Add ticker card */}
                {isSingle && (
                    <button
                        onClick={onAddTicker}
                        className="bg-slate-800/30 border border-dashed border-slate-600/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-emerald-500/40 hover:bg-slate-800/50 transition-all cursor-pointer group min-h-[180px]"
                    >
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-600 group-hover:border-emerald-500/50 flex items-center justify-center transition-colors">
                            <Plus className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <span className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">Add a 2nd ticker to compare</span>
                    </button>
                )}
            </div>

            {/* ─── Category Comparison Table ─────────────────────────────────── */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Category Comparison</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-wide border-b border-slate-700/50">
                                <th className="text-left pb-2.5 pr-4">Category</th>
                                <th className="text-left pb-2.5 pr-2 text-xs font-normal">Weight</th>
                                {analyses.map((a, i) => (
                                    <th key={a.ticker} className="text-center pb-2.5 px-3" style={{ color: TICKER_COLORS[i] }}>
                                        {a.ticker}
                                    </th>
                                ))}
                                {!isSingle && <th className="text-center pb-2.5 px-2 text-xs font-normal">Leader</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {analyses[0].gradeResult.rawCategories.map((cat, catIdx) => {
                                const scores = analyses.map(a => a.gradeResult.rawCategories[catIdx]);
                                const winnerIdx = !isSingle && scores[0].score !== scores[1].score
                                    ? (scores[0].score > scores[1].score ? 0 : 1) : -1;
                                return (
                                    <tr key={cat.name}>
                                        <td className="py-2.5 pr-4 text-slate-300 font-medium">{cat.name}</td>
                                        <td className="py-2.5 pr-2 text-slate-500 text-xs">{cat.weight}%</td>
                                        {scores.map((s, i) => (
                                            <td key={i} className="text-center py-2.5 px-3">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <GradeBadge grade={s.grade} />
                                                    <span className="text-[10px] text-slate-500">{scoreTo100(s.score)}/100</span>
                                                </div>
                                            </td>
                                        ))}
                                        {!isSingle && (
                                            <td className="text-center py-2.5 px-2 text-xs font-mono" style={{ color: winnerIdx >= 0 ? TICKER_COLORS[winnerIdx] : 'var(--vw-text-tertiary)' }}>
                                                {winnerIdx >= 0 ? analyses[winnerIdx].ticker : '—'}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {/* Overall row */}
                            <tr className="border-t-2 border-slate-600/50">
                                <td className="py-3 pr-4 text-white font-semibold">Overall</td>
                                <td className="py-3 pr-2 text-slate-500 text-xs">100%</td>
                                {analyses.map((a, i) => {
                                    const c = gradeColors[a.gradeResult.overallGrade];
                                    return (
                                        <td key={i} className="text-center py-3 px-3">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className={`text-sm font-bold px-2.5 py-0.5 rounded ${c.badge}`}>{a.gradeResult.overallGrade}</span>
                                                <span className="text-[10px] text-slate-400">{a.gradeResult.overallScore}/100</span>
                                            </div>
                                        </td>
                                    );
                                })}
                                {!isSingle && (() => {
                                    const w = analyses[0].gradeResult.overallScore !== analyses[1].gradeResult.overallScore
                                        ? (analyses[0].gradeResult.overallScore > analyses[1].gradeResult.overallScore ? 0 : 1) : -1;
                                    return (
                                        <td className="text-center py-3 px-2 text-xs font-mono font-semibold" style={{ color: w >= 0 ? TICKER_COLORS[w] : 'var(--vw-text-tertiary)' }}>
                                            {w >= 0 ? analyses[w].ticker : '—'}
                                        </td>
                                    );
                                })()}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Metric-Level Comparison ──────────────────────────────────── */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Metric-Level Comparison</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-wide border-b border-slate-700/50">
                                <th className="text-left pb-2.5 pr-4">Metric</th>
                                {analyses.map((a, i) => (
                                    <React.Fragment key={a.ticker}>
                                        <th className="text-right pb-2.5 px-2" style={{ color: TICKER_COLORS[i] }}>{a.ticker}</th>
                                        <th className="text-center pb-2.5 px-1" style={{ color: TICKER_COLORS[i] }}>Grade</th>
                                    </React.Fragment>
                                ))}
                                {!isSingle && <th className="text-center pb-2.5 px-1"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {analyses[0].gradeResult.rawCategories.map((cat, catIdx) => (
                                <React.Fragment key={cat.name}>
                                    {/* Category header row */}
                                    <tr>
                                        <td colSpan={100} className="pt-4 pb-1.5 px-0">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cat.name}</span>
                                        </td>
                                    </tr>
                                    {/* Metric rows */}
                                    {cat.metrics.map((metric, mIdx) => {
                                        const allMetrics = analyses.map(a => a.gradeResult.rawCategories[catIdx].metrics[mIdx]);
                                        const scores = allMetrics.map(m => m.value);
                                        // Determine winner (higher is better for most metrics, except D/E)
                                        const isInverted = metric.name === 'Debt / Equity';
                                        let winnerIdx = -1;
                                        if (!isSingle && scores[0] !== scores[1]) {
                                            if (isInverted) {
                                                winnerIdx = scores[0] < scores[1] ? 0 : 1;
                                            } else {
                                                winnerIdx = scores[0] > scores[1] ? 0 : 1;
                                            }
                                        }

                                        return (
                                            <tr key={metric.name} className="border-b border-slate-700/20">
                                                <td className="py-2 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <TrendIcon trend={allMetrics[0].trend} />
                                                        <span className="text-xs text-slate-400 cursor-help" title={METRIC_THRESHOLDS[metric.name]}>{metric.name}</span>
                                                    </div>
                                                </td>
                                                {allMetrics.map((m, i) => (
                                                    <React.Fragment key={i}>
                                                        <td className="py-2 px-2 text-right">
                                                            <span className={`text-xs font-mono ${winnerIdx === i ? 'text-white font-semibold' : 'text-slate-300'}`}>
                                                                {m.formattedValue}
                                                                <WinnerIndicator isWinner={winnerIdx === i} />
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-1 text-center">
                                                            <GradeBadge grade={m.grade} />
                                                        </td>
                                                    </React.Fragment>
                                                ))}
                                                {!isSingle && (
                                                    <td className="py-2 px-1 text-center">
                                                        {winnerIdx >= 0 && (
                                                            <span className="text-[10px] font-mono" style={{ color: TICKER_COLORS[winnerIdx] }}>
                                                                {analyses[winnerIdx].ticker}
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Radar Chart + Scores ─────────────────────────────────────── */}
            <div className={`grid gap-6 ${isSingle ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Category Profile</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Max" dataKey="fullMark" stroke="#334155" fill="none" strokeDasharray="3 2" />
                            {analyses.map((a, i) => (
                                <Radar
                                    key={a.ticker}
                                    name={a.ticker}
                                    dataKey={a.ticker}
                                    stroke={TICKER_COLORS[i]}
                                    fill={TICKER_COLORS[i]}
                                    fillOpacity={0.12}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: TICKER_COLORS[i] }}
                                />
                            ))}
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                                itemStyle={{ color: '#e2e8f0' }}
                                formatter={(v: number) => [`${v}/100`]}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Altman Z-Score Comparison */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Altman Z-Score</h3>
                    <div className={`grid gap-4 ${isSingle ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {analyses.map((a, i) => {
                            const z = a.altmanZ;
                            if (!z) return (
                                <div key={a.ticker} className="bg-slate-900/50 rounded-lg p-4 text-center">
                                    <span className="text-xs font-mono font-semibold mb-1 block" style={{ color: TICKER_COLORS[i] }}>{a.ticker}</span>
                                    <span className="text-sm text-slate-500">Insufficient data</span>
                                </div>
                            );
                            return (
                                <div key={a.ticker} className={`rounded-lg p-4 border ${z.zone === 'safe' ? 'bg-emerald-500/5 border-emerald-500/25' : z.zone === 'grey' ? 'bg-amber-500/5 border-amber-500/25' : 'bg-red-500/5 border-red-500/25'}`}>
                                    <span className="text-xs font-mono font-semibold mb-2 block" style={{ color: TICKER_COLORS[i] }}>{a.ticker}</span>
                                    <div className={`text-3xl font-bold font-mono ${z.zone === 'safe' ? 'text-emerald-400' : z.zone === 'grey' ? 'text-amber-400' : 'text-red-400'}`}>
                                        {z.z.toFixed(2)}
                                    </div>
                                    <span className={`text-xs font-semibold ${z.zone === 'safe' ? 'text-emerald-400' : z.zone === 'grey' ? 'text-amber-400' : 'text-red-400'}`}>
                                        {z.zone === 'safe' ? 'Safe Zone' : z.zone === 'grey' ? 'Grey Zone' : 'Distress Zone'}
                                    </span>
                                    <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                                        <div className={`rounded px-1 py-1 text-center ${z.zone === 'safe' ? 'bg-emerald-500/20 ring-1 ring-emerald-500/40' : 'bg-emerald-500/5'}`}>
                                            <div className="font-semibold text-emerald-400">Safe</div><div className="text-slate-500">&gt;2.99</div>
                                        </div>
                                        <div className={`rounded px-1 py-1 text-center ${z.zone === 'grey' ? 'bg-amber-500/20 ring-1 ring-amber-500/40' : 'bg-amber-500/5'}`}>
                                            <div className="font-semibold text-amber-400">Grey</div><div className="text-slate-500">1.81–2.99</div>
                                        </div>
                                        <div className={`rounded px-1 py-1 text-center ${z.zone === 'distress' ? 'bg-red-500/20 ring-1 ring-red-500/40' : 'bg-red-500/5'}`}>
                                            <div className="font-semibold text-red-400">Dist.</div><div className="text-slate-500">&lt;1.81</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {!isSingle && analyses[0].altmanZ && analyses[1].altmanZ && (
                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Directional signal — not a definitive bankruptcy predictor.
                        </p>
                    )}
                    {isSingle && analyses[0].altmanZ && (
                        <p className="text-xs text-slate-500 mt-3">
                            Standard Altman Z-Score using market cap. Directional signal — not a definitive bankruptcy predictor.
                        </p>
                    )}
                </div>
            </div>

            {/* ─── Piotroski F-Score Comparison ──────────────────────────────── */}
            {analyses.some(a => a.piotroski) && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Piotroski F-Score</h3>
                    <div className={`grid gap-6 ${isSingle ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {analyses.map((a, i) => {
                            const p = a.piotroski;
                            if (!p) return (
                                <div key={a.ticker} className="text-sm text-slate-500 text-center py-4">
                                    <span className="font-mono font-semibold" style={{ color: TICKER_COLORS[i] }}>{a.ticker}</span> — Insufficient data
                                </div>
                            );
                            return (
                                <div key={a.ticker}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-mono font-semibold" style={{ color: TICKER_COLORS[i] }}>{a.ticker}</span>
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-bold ${p.score >= 7 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : p.score >= 4 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                            {p.score}/9
                                            <span className="text-xs font-normal">{p.score >= 7 ? 'Strong' : p.score >= 4 ? 'Mixed' : 'Weak'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {p.signals.map((s, si) => (
                                            <div key={si} className="flex items-center gap-2 py-1 border-b border-slate-700/20 last:border-0">
                                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${s.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{s.passed ? '+' : '-'}</span>
                                                <span className="text-[11px] text-slate-400 truncate">{s.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">7-9: Strong fundamentals, 4-6: Mixed signals, 0-3: Weak fundamentals.</p>
                </div>
            )}

            {/* ─── Risk Flags Comparison ─────────────────────────────────────── */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-slate-300">Risk Flags</h3>
                </div>
                <div className={`grid gap-6 ${isSingle ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {analyses.map((a, i) => (
                        <div key={a.ticker}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono font-semibold" style={{ color: TICKER_COLORS[i] }}>{a.ticker}</span>
                                {a.riskFlags.length > 0 && (
                                    <span className="ml-auto text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
                                        {a.riskFlags.length} {a.riskFlags.length === 1 ? 'flag' : 'flags'}
                                    </span>
                                )}
                            </div>
                            {a.riskFlags.length === 0 ? (
                                <p className="text-xs text-emerald-400">No significant risk flags identified.</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {a.riskFlags.map(flag => (
                                        <span key={flag} className="inline-flex items-center gap-1 bg-red-500/10 text-red-300 border border-red-500/25 rounded-full px-2.5 py-0.5 text-[11px]">
                                            <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                                            {flag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <p className="text-xs text-slate-500 text-center pb-4">
                Grades based on 3-year averages of standardized financials (FMP). Trend indicators reflect direction across the 3 most recent reported periods.
            </p>
        </div>
    );
}
