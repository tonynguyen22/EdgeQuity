/* ── BubbleChart — Valuation vs Growth Scatter ────────────────────────── */

import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import type { BubblePoint } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BubbleChartProps {
    bubbleData: BubblePoint[];
}

export default function BubbleChart({ bubbleData }: BubbleChartProps) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="mb-4">
                <h3 className="text-lg font-medium">Valuation vs. Growth Bubble Chart</h3>
                <p className="text-xs text-slate-500 mt-1">X: EV/EBITDA multiple · Y: Revenue growth · Bubble size: market cap</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="x" name="EV/EBITDA" type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'EV / EBITDA', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis dataKey="y" name="Rev Growth %" type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} label={{ value: 'Rev Growth %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                    <ZAxis dataKey="z" range={[40, 600]} name="Market Cap" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        content={({ payload }) => {
                            if (!payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs space-y-1">
                                    <div className="font-semibold text-white">{d.symbol}</div>
                                    <div className="text-slate-400">EV/EBITDA: <span className="text-slate-200">{d.x?.toFixed(1)}x</span></div>
                                    <div className="text-slate-400">Rev Growth: <span className="text-slate-200">{d.y?.toFixed(1)}%</span></div>
                                    <div className="text-slate-400">Market Cap: <span className="text-slate-200">{formatCurrency(d.z)}</span></div>
                                </div>
                            );
                        }}
                    />
                    <Scatter data={bubbleData} isAnimationActive={false}>
                        {bubbleData.map((entry, index) => (
                            <Cell key={index} fill={entry.isTarget ? '#10b981' : '#3b82f6'} fillOpacity={entry.isTarget ? 0.9 : 0.6} stroke={entry.isTarget ? '#6ee7b7' : '#93c5fd'} strokeWidth={1} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Target company</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Peers</span>
            </div>
        </div>
    );
}
