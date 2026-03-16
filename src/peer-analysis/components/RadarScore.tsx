/* ── RadarScore — Radar Chart + Composite Relative Value Score ────────── */

import React from 'react';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend } from 'recharts';
import type { RadarScorePoint } from '../types';

interface RadarScoreProps {
    radarScores: RadarScorePoint[];
    compositeScore: number | null;
    targetSymbol: string;
}

export default function RadarScore({ radarScores, compositeScore, targetSymbol }: RadarScoreProps) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-slate-300">Valuation Profile vs. Peer Median</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Percentile scores (0–100) — higher = more favorable (cheaper multiple / stronger growth)</p>
                </div>
                {compositeScore !== null && (() => {
                    const c = compositeScore >= 60
                        ? { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Attractive' }
                        : compositeScore >= 40
                            ? { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Fair' }
                            : { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Expensive' };
                    return (
                        <div className={`border rounded-xl px-4 py-3 text-center shrink-0 ${c.bg}`}>
                            <div className="text-xs text-slate-400 mb-0.5">Relative Value Score</div>
                            <div className={`text-3xl font-bold ${c.text}`}>{compositeScore}</div>
                            <div className={`text-xs font-medium mt-0.5 ${c.text}`}>{c.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">vs peers (0–100)</div>
                        </div>
                    );
                })()}
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarScores}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Peer Median" dataKey="median" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.08} strokeDasharray="4 2" strokeWidth={1.5} />
                    <Radar name={targetSymbol} dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(v: number, name: string) => [`${v}th percentile`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
