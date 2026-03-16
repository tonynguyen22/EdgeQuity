/* ── EvEbitdaTrend — Multi-line EV/EBITDA History Chart ────────────────── */

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { PeerData } from '../types';

interface EvEbitdaTrendProps {
    multiHistData: Record<string, any>[];
    data: PeerData[];
    hiddenSeries: Record<string, boolean>;
    onLegendClick: (d: any, chartKeys: string[]) => void;
}

/* Bright peer colors — easily distinguishable on the dark chart background */
const PEER_COLORS = ['#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c'];

export default function EvEbitdaTrend({ multiHistData, data, hiddenSeries, onLegendClick }: EvEbitdaTrendProps) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4">EV/EBITDA Trend — 3 Years</h3>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={multiHistData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}x`} width={40} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                        formatter={(v: number, name: string) => [`${v?.toFixed(1)}x`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} onClick={(d: any) => onLegendClick(d, data.map(dd => dd.symbol))} />
                    {data.map((d, i) => {
                        const color = i === 0 ? '#10b981' : PEER_COLORS[(i - 1) % PEER_COLORS.length];
                        return (
                            <Line
                                key={d.symbol}
                                type="monotone"
                                dataKey={d.symbol}
                                stroke={color}
                                strokeWidth={i === 0 ? 2.5 : 1.5}
                                dot={{ r: i === 0 ? 4 : 3, fill: color }}
                                connectNulls
                                hide={!!hiddenSeries[d.symbol]}
                            />
                        );
                    })}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
