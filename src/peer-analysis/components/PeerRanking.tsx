/* ── PeerRanking — Relative Bar Ranking ───────────────────────────────── */

import React from 'react';
import type { RankingData } from '../types';

interface PeerRankingProps {
    rankingData: RankingData;
    targetSymbol: string;
}

const METRICS = [
    { key: 'evToEbitda' as const, label: 'EV / EBITDA', fmt: (v: number) => `${v.toFixed(1)}x`, ascending: true },
    { key: 'pToE' as const, label: 'P / E', fmt: (v: number) => `${v.toFixed(1)}x`, ascending: true },
    { key: 'evToRev' as const, label: 'EV / Revenue', fmt: (v: number) => `${v.toFixed(1)}x`, ascending: true },
    { key: 'revGrowth' as const, label: 'Rev Growth %', fmt: (v: number) => `${(v * 100).toFixed(1)}%`, ascending: false },
];

export default function PeerRanking({ rankingData, targetSymbol }: PeerRankingProps) {
    return (
        <div className="rounded-xl p-6" style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border)' }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: 'var(--vw-text-primary)' }}>Peer Ranking by Metric</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                {METRICS.map(({ key, label, fmt }) => {
                    const rows = rankingData[key];
                    if (rows.length === 0) return null;
                    const maxVal = Math.max(...rows.map(r => Math.abs(r.value)));

                    // Separate target and peers
                    const targetRow = rows.find(r => r.isTarget);
                    const peerRows = rows.filter(r => !r.isTarget);

                    return (
                        <div key={key}>
                            <div className="text-[13px] font-medium mb-3" style={{ color: 'var(--vw-text-secondary)' }}>
                                {label}
                                <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--vw-text-muted)' }}>
                                    {key !== 'revGrowth' ? '(lower = cheaper)' : '(higher = better)'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {/* Target row */}
                                {targetRow && (
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="text-[13px] font-mono w-14 flex-shrink-0 text-right"
                                            style={{ color: 'var(--vw-accent)' }}
                                        >
                                            {targetRow.symbol}
                                        </div>
                                        <div className="flex-1 relative h-5 rounded-md overflow-hidden" style={{ background: 'var(--vw-bg-hover)' }}>
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(Math.abs(targetRow.value) / maxVal * 100, 100)}%`,
                                                    background: 'linear-gradient(90deg, rgba(0, 212, 170, 0.6), rgba(0, 212, 170, 0.3))',
                                                }}
                                            />
                                        </div>
                                        <div
                                            className="text-[13px] font-mono w-16 flex-shrink-0 tabular-nums"
                                            style={{ color: 'var(--vw-accent)' }}
                                        >
                                            {fmt(targetRow.value)}
                                        </div>
                                    </div>
                                )}

                                {/* Divider between target and peers */}
                                {targetRow && peerRows.length > 0 && (
                                    <div className="flex items-center gap-2 py-0.5">
                                        <div className="w-14 flex-shrink-0" />
                                        <div className="flex-1 h-px" style={{ background: 'var(--vw-border-lit)' }} />
                                        <div className="w-16 flex-shrink-0" />
                                    </div>
                                )}

                                {/* Peer rows */}
                                {peerRows.map(row => (
                                    <div key={row.symbol} className="flex items-center gap-2.5">
                                        <div
                                            className="text-[13px] font-mono w-14 flex-shrink-0 text-right"
                                            style={{ color: 'var(--vw-text-secondary)' }}
                                        >
                                            {row.symbol}
                                        </div>
                                        <div className="flex-1 relative h-5 rounded-md overflow-hidden" style={{ background: 'var(--vw-bg-hover)' }}>
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(Math.abs(row.value) / maxVal * 100, 100)}%`,
                                                    background: 'linear-gradient(90deg, rgba(100, 116, 139, 0.5), rgba(100, 116, 139, 0.2))',
                                                }}
                                            />
                                        </div>
                                        <div
                                            className="text-[13px] font-mono w-16 flex-shrink-0 tabular-nums"
                                            style={{ color: 'var(--vw-text-secondary)' }}
                                        >
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
