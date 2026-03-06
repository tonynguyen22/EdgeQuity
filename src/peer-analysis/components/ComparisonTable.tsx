/* ── ComparisonTable — Main Peer Comparison Table ─────────────────────── */

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import type { PeerData, AllStats, TargetPercentiles, HistEvEbitda } from '../types';
import { formatCurrency, formatPct, fmtX } from '../utils/formatters';
import { getHeatmapColor, ordinal } from '../calculations';

interface ComparisonTableProps {
    displayData: PeerData[];
    data: PeerData[];
    selectedPeers: Record<string, boolean>;
    onTogglePeer: (symbol: string) => void;
    stats: AllStats;
    sortKey: string | null;
    sortDir: 'asc' | 'desc';
    onToggleSort: (key: string) => void;
    targetPercentiles: TargetPercentiles | null;
    onExportExcel: () => void;
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function SortTh({ label, k, left, sortKey, sortDir, onToggleSort }: {
    label: string; k: string; left?: boolean;
    sortKey: string | null; sortDir: 'asc' | 'desc'; onToggleSort: (k: string) => void;
}) {
    return (
        <th onClick={() => onToggleSort(k)} className={`py-2 px-2 border border-slate-700/50 font-medium cursor-pointer select-none hover:bg-slate-700/30 transition-colors ${left ? 'text-left' : ''}`}>
            <span className="inline-flex items-center gap-1 justify-end w-full">
                {label}
                {sortKey === k ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-600" />}
            </span>
        </th>
    );
}

function Sparkline({ histEvEbitda }: { histEvEbitda: HistEvEbitda[] }) {
    const valid = histEvEbitda.filter(d => d.evEbitda != null && (d.evEbitda as number) > 0);
    if (valid.length < 2) return <span className="text-slate-500 text-xs">—</span>;
    return (
        <ResponsiveContainer width="100%" height={36}>
            <LineChart data={valid} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
                <Line type="monotone" dataKey="evEbitda" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}

/* ── Main component ────────────────────────────────────────────────────── */

export default function ComparisonTable({
    displayData, data, selectedPeers, onTogglePeer, stats,
    sortKey, sortDir, onToggleSort, targetPercentiles, onExportExcel,
}: ComparisonTableProps) {

    const pctCell = (v: number | null) => {
        if (v == null) return <td className="py-2.5 px-2 border border-slate-700/50 text-center text-slate-600 text-xs">—</td>;
        const color = v >= 75 ? 'text-emerald-400' : v >= 40 ? 'text-slate-400' : 'text-amber-400';
        return <td className={`py-2.5 px-2 border border-slate-700/50 text-center text-xs font-medium ${color}`}>{ordinal(v)}</td>;
    };

    const sortProps = { sortKey, sortDir, onToggleSort };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-medium">Peer Analysis</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Click any column header to sort peers</p>
                </div>
                <button onClick={onExportExcel} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors">
                    <Download className="w-4 h-4" /> Export to Excel
                </button>
            </div>

            <table className="w-full text-sm text-right border-collapse">
                <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                        <th className="text-left py-2 px-2 border border-slate-700/50 font-medium">Company</th>
                        <th className="py-2 px-2 border border-slate-700/50 font-medium text-center">Include</th>
                        <SortTh label="Rev Growth" k="revGrowth" {...sortProps} />
                        <SortTh label="EBITDA" k="ebitda" {...sortProps} />
                        <SortTh label="EBITDA %" k="ebitdaMargin" {...sortProps} />
                        <SortTh label="Net Income" k="netIncome" {...sortProps} />
                        <SortTh label="NI %" k="niMargin" {...sortProps} />
                        <SortTh label="Price / Share" k="price" {...sortProps} />
                        <SortTh label="Market Cap" k="marketCap" {...sortProps} />
                        <SortTh label="EV" k="ev" {...sortProps} />
                        <th className="py-2 px-2 border border-slate-700/50 border-l-2 border-l-slate-500 font-medium cursor-pointer hover:bg-slate-700/30" onClick={() => onToggleSort('evToRev')}>
                            <span className="inline-flex items-center gap-1 justify-end w-full">EV / Rev {sortKey === 'evToRev' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-600" />}</span>
                        </th>
                        <SortTh label="EV / EBITDA" k="evToEbitda" {...sortProps} />
                        <SortTh label="P / Sales" k="pToSales" {...sortProps} />
                        <SortTh label="P / E" k="pToE" {...sortProps} />
                        <SortTh label="P / Book" k="pToBook" {...sortProps} />
                        <SortTh label="P / FCF" k="pToFCF" {...sortProps} />
                        <th className="py-2 px-2 border border-slate-700/50 font-medium text-center" style={{ minWidth: '80px' }}>EV/EBITDA Trend</th>
                    </tr>
                </thead>
                <tbody className="font-mono text-base">
                    {displayData.map((d, i) => {
                        const isTarget = i === 0;
                        const isIncluded = isTarget || selectedPeers[d.symbol];
                        return (
                            <tr key={d.symbol} className={`border-b border-slate-700/50 ${isTarget ? 'bg-slate-700/30 font-semibold' : ''} ${!isIncluded ? 'opacity-50' : ''}`}>
                                <td className="text-left py-3 px-2 border border-slate-700/50 text-slate-300">
                                    <div className="flex flex-col"><span>{d.symbol}</span><span className="text-xs text-slate-500 font-sans truncate max-w-[120px]">{d.name}</span></div>
                                </td>
                                <td className="py-3 px-2 border border-slate-700/50 text-center">
                                    {!isTarget && <input type="checkbox" checked={selectedPeers[d.symbol] || false} onChange={() => onTogglePeer(d.symbol)} className="w-4 h-4 accent-emerald-500 cursor-pointer" />}
                                </td>
                                <td className={`py-3 px-2 border border-slate-700/50 italic text-xs ${d.revGrowth < 0 ? 'text-red-400' : ''}`} style={{ backgroundColor: getHeatmapColor(d.revGrowth, 'revGrowth', data) }}>{formatPct(d.revGrowth)}</td>
                                <td className={`py-3 px-2 border border-slate-700/50 ${d.ebitda < 0 ? 'text-red-400' : ''}`} style={{ backgroundColor: getHeatmapColor(d.ebitda, 'ebitda', data) }}>{formatCurrency(d.ebitda)}</td>
                                <td className={`py-3 px-2 border border-slate-700/50 italic text-xs ${d.ebitdaMargin < 0 ? 'text-red-400' : ''}`} style={{ backgroundColor: getHeatmapColor(d.ebitdaMargin, 'ebitdaMargin', data) }}>{formatPct(d.ebitdaMargin)}</td>
                                <td className={`py-3 px-2 border border-slate-700/50 ${d.netIncome < 0 ? 'text-red-400' : ''}`} style={{ backgroundColor: getHeatmapColor(d.netIncome, 'netIncome', data) }}>{formatCurrency(d.netIncome)}</td>
                                <td className={`py-3 px-2 border border-slate-700/50 italic text-xs ${d.niMargin < 0 ? 'text-red-400' : ''}`} style={{ backgroundColor: getHeatmapColor(d.niMargin, 'niMargin', data) }}>{formatPct(d.niMargin)}</td>
                                <td className="py-3 px-2 border border-slate-700/50" style={{ backgroundColor: getHeatmapColor(d.price, 'price', data) }}>${d.price.toFixed(2)}</td>
                                <td className="py-3 px-2 border border-slate-700/50" style={{ backgroundColor: getHeatmapColor(d.marketCap, 'marketCap', data) }}>{formatCurrency(d.marketCap)}</td>
                                <td className="py-3 px-2 border border-slate-700/50" style={{ backgroundColor: getHeatmapColor(d.ev, 'ev', data) }}>{formatCurrency(d.ev)}</td>
                                <td className="py-3 px-2 border border-slate-700/50 border-l-2 border-l-slate-500" style={{ backgroundColor: getHeatmapColor(d.evToRev, 'evToRev', data) }}>{fmtX(d.evToRev)}</td>
                                <td className="py-3 px-2 border border-slate-700/50" style={{ backgroundColor: getHeatmapColor(d.evToEbitda, 'evToEbitda', data) }}>{fmtX(d.evToEbitda)}</td>
                                <td className="py-3 px-2 border border-slate-700/50" style={{ backgroundColor: getHeatmapColor(d.pToSales, 'pToSales', data) }}>{fmtX(d.pToSales)}</td>
                                <td className="py-3 px-2 border border-slate-700/50" style={{ backgroundColor: getHeatmapColor(d.pToE, 'pToE', data) }}>{fmtX(d.pToE)}</td>
                                <td className="py-3 px-2 border border-slate-700/50" style={{ backgroundColor: getHeatmapColor(d.pToBook, 'pToBook', data) }}>{fmtX(d.pToBook)}</td>
                                <td className="py-3 px-2 border border-slate-700/50" style={{ backgroundColor: getHeatmapColor(d.pToFCF, 'pToFCF', data) }}>{fmtX(d.pToFCF)}</td>
                                <td className="py-1 px-2 border border-slate-700/50" style={{ minWidth: '80px' }}>
                                    <Sparkline histEvEbitda={d.histEvEbitda ?? []} />
                                </td>
                            </tr>
                        );
                    })}

                    {/* Stats rows */}
                    {(['Mean', 'Median', '25th Percentile', '75th Percentile'] as const).map((label, li) => {
                        const key = (['mean', 'median', 'p25', 'p75'] as const)[li];
                        return (
                            <tr key={label} className={`text-slate-400 text-sm font-mono ${li === 0 ? 'border-t-2 border-slate-600' : ''}`}>
                                <td className="text-left py-3 px-2 border border-slate-700/50 font-semibold" colSpan={2}>{label}</td>
                                <td className={`py-3 px-2 border border-slate-700/50 italic text-xs ${stats.revGrowth[key] < 0 ? 'text-red-400' : ''}`}>{formatPct(stats.revGrowth[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{formatCurrency(stats.ebitda[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50 italic text-xs">{formatPct(stats.ebitdaMargin[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{formatCurrency(stats.netIncome[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50 italic text-xs">{formatPct(stats.niMargin[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">${stats.price[key].toFixed(2)}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{formatCurrency(stats.marketCap[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{formatCurrency(stats.ev[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50 border-l-2 border-l-slate-500">{fmtX(stats.evToRev[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{fmtX(stats.evToEbitda[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{fmtX(stats.pToSales[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{fmtX(stats.pToE[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{fmtX(stats.pToBook[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50">{fmtX(stats.pToFCF[key])}</td>
                                <td className="py-3 px-2 border border-slate-700/50 text-center text-slate-600">—</td>
                            </tr>
                        );
                    })}

                    {/* Target Percentile row */}
                    {targetPercentiles && (() => {
                        return (
                            <tr className="border-t-2 border-slate-500 bg-slate-700/20">
                                <td className="text-left py-2.5 px-2 border border-slate-700/50 text-xs font-semibold text-slate-300" colSpan={2}>Target Percentile</td>
                                {pctCell(targetPercentiles.revGrowth)}
                                <td className="py-2.5 px-2 border border-slate-700/50 text-center text-slate-600 text-xs">—</td>
                                {pctCell(targetPercentiles.ebitdaMargin)}
                                <td className="py-2.5 px-2 border border-slate-700/50 text-center text-slate-600 text-xs">—</td>
                                <td className="py-2.5 px-2 border border-slate-700/50 text-center text-slate-600 text-xs">—</td>
                                <td className="py-2.5 px-2 border border-slate-700/50 text-center text-slate-600 text-xs">—</td>
                                <td className="py-2.5 px-2 border border-slate-700/50 text-center text-slate-600 text-xs">—</td>
                                <td className="py-2.5 px-2 border border-slate-700/50 text-center text-slate-600 text-xs">—</td>
                                {pctCell(targetPercentiles.evToRev)}
                                {pctCell(targetPercentiles.evToEbitda)}
                                {pctCell(targetPercentiles.pToSales)}
                                {pctCell(targetPercentiles.pToE)}
                                {pctCell(targetPercentiles.pToBook)}
                                {pctCell(targetPercentiles.pToFCF)}
                                <td className="py-2.5 px-2 border border-slate-700/50 text-center text-slate-600 text-xs">—</td>
                            </tr>
                        );
                    })()}
                </tbody>
            </table>
            <p className="text-xs text-slate-600 mt-2">Target Percentile: higher % = more favorable vs peer group (100 = highest growth / lowest multiple)</p>
        </div>
    );
}
