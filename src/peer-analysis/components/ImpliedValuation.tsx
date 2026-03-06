/* ── ImpliedValuation — Football-Field Implied Price Chart ────────────── */

import React from 'react';
import type { ImpliedPrice } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ImpliedValuationProps {
    impliedPrices: ImpliedPrice[];
    currentPrice: number;
    targetSymbol: string;
}

export default function ImpliedValuation({ impliedPrices, currentPrice, targetSymbol }: ImpliedValuationProps) {
    const prices = impliedPrices.map(r => r.price as number);
    const minP = Math.min(...prices, currentPrice) * 0.8;
    const maxP = Math.max(...prices, currentPrice) * 1.15;
    const range = maxP - minP || 1;

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="mb-4">
                <h3 className="text-lg font-medium">Implied Valuation — Peer Median Multiples</h3>
                <p className="text-xs text-slate-500 mt-1">Implied share price for {targetSymbol} using each peer group median multiple</p>
            </div>
            <div className="space-y-3">
                {impliedPrices.map(({ label, price }) => {
                    const p = price as number;
                    const barPct = ((p - minP) / range) * 100;
                    const curPct = ((currentPrice - minP) / range) * 100;
                    const upside = currentPrice > 0 ? (p - currentPrice) / currentPrice : 0;
                    return (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-28 text-xs text-slate-400 text-right shrink-0">{label}</div>
                            <div className="flex-1 relative h-6 bg-slate-700/40 rounded-md overflow-visible">
                                <div className={`absolute top-0 h-full rounded-md ${upside >= 0 ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}
                                    style={{ width: `${Math.max(2, Math.min(100, barPct))}%` }} />
                                <div className="absolute top-0 h-full w-0.5 bg-slate-400/70" style={{ left: `${Math.max(0, Math.min(100, curPct))}%` }} />
                            </div>
                            <div className="w-20 text-right font-mono text-sm text-slate-200">${p.toFixed(2)}</div>
                            <div className={`w-16 text-right text-xs font-medium ${upside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {upside >= 0 ? '+' : ''}{(upside * 100).toFixed(1)}%
                            </div>
                        </div>
                    );
                })}
                <div className="flex items-center gap-3 pt-1 border-t border-slate-700/50">
                    <div className="w-28 text-xs text-slate-500 text-right shrink-0">Current Price</div>
                    <div className="flex-1 h-px bg-slate-600" />
                    <div className="w-20 text-right font-mono text-sm text-slate-400">${currentPrice.toFixed(2)}</div>
                    <div className="w-16" />
                </div>
            </div>
        </div>
    );
}
