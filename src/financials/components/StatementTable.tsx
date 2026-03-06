/* ── Financial Statement Table ────────────────────────────────────────── */

import React, { useState } from 'react';
import type { StatementLineItem } from '../types';
import { formatCompact, formatGrowth } from '../utils/formatters';
import { computeGrowth } from '../calculations';

interface Props {
    items: StatementLineItem[];
    periods: string[];
    title: string;
}

export default function StatementTable({ items, periods, title }: Props) {
    const [showGrowth, setShowGrowth] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    if (!items.length || !periods.length) {
        return (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-slate-300">{title}</h3>
                <p className="text-slate-500 text-sm mt-2">No data available for this statement.</p>
            </div>
        );
    }

    // Format period headers (trim to year if possible)
    const formatPeriod = (p: string) => {
        // Try to extract just the year
        const yearMatch = p.match(/\d{4}/);
        return yearMatch ? yearMatch[0] : p;
    };

    const toggleGrowth = () => setShowGrowth(prev => !prev);

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <h3 className="text-lg font-medium text-slate-200">{title}</h3>
                <button
                    onClick={toggleGrowth}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${showGrowth
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                        }`}
                >
                    {showGrowth ? 'Hide' : 'Show'} YoY %
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="text-left text-xs text-slate-500 font-medium px-6 py-3 sticky left-0 bg-slate-800/90 backdrop-blur-sm min-w-[200px] z-10">
                                Line Item
                            </th>
                            {periods.map(p => (
                                <th key={p} className="text-right text-xs text-slate-400 font-medium px-4 py-3 min-w-[100px]">
                                    {formatPeriod(p)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => {
                            const growthData = showGrowth ? computeGrowth(item, periods) : null;
                            // Detect "total" or "net" rows for visual emphasis
                            const isTotal = /^(total|net )/i.test(item.label) || /\btotal\b/i.test(item.label);
                            const allNull = periods.every(p => item.values[p] == null);

                            if (allNull) return null; // Skip empty rows

                            return (
                                <tr
                                    key={`${item.label}-${idx}`}
                                    className={`border-b border-slate-700/20 transition-colors hover:bg-slate-700/20 ${isTotal ? 'bg-slate-700/10' : ''
                                        }`}
                                >
                                    <td className={`px-6 py-2.5 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10 ${isTotal ? 'font-semibold text-slate-200' : 'text-slate-400'
                                        }`}>
                                        <span className="text-xs">{item.label}</span>
                                    </td>
                                    {periods.map(p => {
                                        const val = item.values[p];
                                        const growth = growthData?.[p];
                                        return (
                                            <td key={p} className="text-right px-4 py-2.5">
                                                <div className={`font-mono text-xs ${isTotal ? 'font-semibold text-slate-100' :
                                                        val != null && val < 0 ? 'text-red-400' : 'text-slate-300'
                                                    }`}>
                                                    {formatCompact(val)}
                                                </div>
                                                {showGrowth && growth != null && (
                                                    <div className={`text-[10px] font-mono mt-0.5 ${growth >= 0 ? 'text-emerald-500' : 'text-red-500'
                                                        }`}>
                                                        {formatGrowth(growth)}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
