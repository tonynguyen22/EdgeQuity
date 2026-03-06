/* ── PeerRanking — Relative Bar Ranking ───────────────────────────────── */

import React from 'react';
import type { RankingData } from '../types';

interface PeerRankingProps {
    rankingData: RankingData;
}

const METRICS = [
    { key: 'evToEbitda' as const, label: 'EV / EBITDA', fmt: (v: number) => `${v.toFixed(1)}x`, ascending: true },
    { key: 'pToE' as const, label: 'P / E', fmt: (v: number) => `${v.toFixed(1)}x`, ascending: true },
    { key: 'evToRev' as const, label: 'EV / Revenue', fmt: (v: number) => `${v.toFixed(1)}x`, ascending: true },
    { key: 'revGrowth' as const, label: 'Rev Growth %', fmt: (v: number) => `${(v * 100).toFixed(1)}%`, ascending: false },
];

export default function PeerRanking({ rankingData }: PeerRankingProps) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Peer Ranking by Metric</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {METRICS.map(({ key, label, fmt }) => {
                    const rows = rankingData[key];
                    if (rows.length === 0) return null;
                    const maxVal = Math.max(...rows.map(r => Math.abs(r.value)));
                    return (
                        <div key={key}>
                            <div className="text-xs text-slate-500 font-medium mb-2">
                                {label} {key !== 'revGrowth' ? '(lower = cheaper)' : '(higher = better)'}
                            </div>
                            <div className="space-y-1.5">
                                {rows.map(row => (
                                    <div key={row.symbol} className="flex items-center gap-2">
                                        <div className={`text-xs font-mono w-12 flex-shrink-0 text-right ${row.isTarget ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>{row.symbol}</div>
                                        <div className="flex-1 relative h-4 bg-slate-700/40 rounded overflow-hidden">
                                            <div
                                                className={`absolute inset-y-0 left-0 rounded ${row.isTarget ? 'bg-emerald-500' : 'bg-slate-600'} opacity-80`}
                                                style={{ width: `${Math.min(Math.abs(row.value) / maxVal * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className={`text-xs font-mono w-14 flex-shrink-0 ${row.isTarget ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {fmt(row.value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
