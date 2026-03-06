/* ── Financial Statement Charts ───────────────────────────────────────── */

import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { TrendPoint } from '../types';

interface Props {
    incomeMetrics: TrendPoint[];
    marginTrends: TrendPoint[];
}

export default function StatementCharts({ incomeMetrics, marginTrends }: Props) {
    const hasIncome = incomeMetrics.length >= 2 && incomeMetrics.some(d => d.Revenue != null);
    const hasMargins = marginTrends.length >= 2;

    if (!hasIncome && !hasMargins) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Profitability */}
            {hasIncome && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-slate-300 mb-4">Revenue & Profitability</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={incomeMetrics} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                tickFormatter={(v: number) => `$${(v / 1e9).toFixed(0)}B`}
                                width={50}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                                formatter={(v: number, name: string) => [`$${(v / 1e9).toFixed(1)}B`, name]}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="Revenue" fill="#2dd4bf" opacity={0.9} radius={[3, 3, 0, 0]} maxBarSize={48} />
                            <Bar dataKey="Gross Profit" fill="#34d399" opacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={48} />
                            <Bar dataKey="Net Income" fill="#60a5fa" opacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={48} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Margin Trends */}
            {hasMargins && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-slate-300 mb-4">Margin Trends</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={marginTrends} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} width={40} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                                formatter={(v: number, name: string) => [`${v}%`, name]}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <ReferenceLine y={0} stroke="#475569" />
                            <Line type="monotone" dataKey="Gross Margin" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="Operating Margin" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="Net Margin" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
