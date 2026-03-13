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

function SortTh({ label, k, sortKey, sortDir, onToggleSort, divider }: {
    label: string; k: string;
    sortKey: string | null; sortDir: 'asc' | 'desc'; onToggleSort: (k: string) => void;
    divider?: boolean;
}) {
    const isActive = sortKey === k;
    return (
        <th
            onClick={() => onToggleSort(k)}
            className="py-3 px-3 text-right font-medium cursor-pointer select-none transition-colors whitespace-nowrap"
            style={{
                color: isActive ? 'var(--vw-accent)' : 'var(--vw-text-tertiary)',
                fontSize: '11px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                background: isActive ? 'rgba(0, 212, 170, 0.04)' : undefined,
                ...(divider ? DIVIDER_STYLE : {}),
            }}
        >
            <span className="inline-flex items-center gap-1 justify-end w-full">
                {label}
                {isActive
                    ? (sortDir === 'asc'
                        ? <ArrowUp className="w-3 h-3" style={{ color: 'var(--vw-accent)' }} />
                        : <ArrowDown className="w-3 h-3" style={{ color: 'var(--vw-accent)' }} />)
                    : <ArrowUpDown className="w-3 h-3" style={{ color: 'var(--vw-text-muted)', opacity: 0.4 }} />
                }
            </span>
        </th>
    );
}

function Sparkline({ histEvEbitda }: { histEvEbitda: HistEvEbitda[] }) {
    const valid = histEvEbitda.filter(d => d.evEbitda != null && (d.evEbitda as number) > 0);
    if (valid.length < 2) return <span className="text-xs" style={{ color: 'var(--vw-text-muted)' }}>—</span>;
    return (
        <ResponsiveContainer width="100%" height={32}>
            <LineChart data={valid} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
                <Line type="monotone" dataKey="evEbitda" stroke="var(--vw-accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}

/* helper: column group divider style */
const DIVIDER_STYLE: React.CSSProperties = {
    borderLeft: '2px solid var(--vw-border-lit)',
};

/* ── Main component ────────────────────────────────────────────────────── */

export default function ComparisonTable({
    displayData, data, selectedPeers, onTogglePeer, stats,
    sortKey, sortDir, onToggleSort, targetPercentiles, onExportExcel,
}: ComparisonTableProps) {

    const pctCell = (v: number | null, divider?: boolean) => {
        if (v == null) return (
            <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)', ...(divider ? DIVIDER_STYLE : {}) }}>—</td>
        );
        const bg = v >= 75
            ? 'rgba(0, 212, 170, 0.12)'
            : v >= 40
                ? 'rgba(100, 116, 139, 0.08)'
                : 'rgba(245, 158, 11, 0.10)';
        const color = v >= 75
            ? 'var(--vw-accent)'
            : v >= 40
                ? 'var(--vw-text-secondary)'
                : '#f59e0b';
        return (
            <td className="py-3 px-3 text-center" style={divider ? DIVIDER_STYLE : undefined}>
                <span
                    className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums"
                    style={{ background: bg, color }}
                >
                    {ordinal(v)}
                </span>
            </td>
        );
    };

    const sortProps = { sortKey, sortDir, onToggleSort };

    /* header style object for static (non-sortable) headers */
    const hStyle: React.CSSProperties = {
        color: 'var(--vw-text-tertiary)',
        fontSize: '11px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
    };

    return (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border)' }}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--vw-border)' }}>
                <div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--vw-text-primary)' }}>Peer Analysis</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--vw-text-muted)' }}>Click any column header to sort peers</p>
                </div>
                <button
                    onClick={onExportExcel}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
                    style={{
                        background: 'var(--vw-bg-hover)',
                        border: '1px solid var(--vw-border-lit)',
                        color: 'var(--vw-text-secondary)',
                    }}
                >
                    <Download className="w-3.5 h-3.5" /> Export to Excel
                </button>
            </div>

            {/* Table wrapper with horizontal scroll */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>

                    {/* ── Column group header ─────────────────────────────── */}
                    <thead>
                        <tr>
                            <th colSpan={3} className="py-2 px-3 text-left text-[10px] font-semibold uppercase tracking-widest"
                                style={{ color: 'var(--vw-text-muted)', background: 'var(--vw-bg-surface)' }}>
                            </th>
                            <th colSpan={7} className="py-2 px-3 text-center text-[10px] font-semibold uppercase tracking-widest"
                                style={{ color: 'var(--vw-text-muted)', background: 'var(--vw-bg-surface)' }}>
                                Fundamentals
                            </th>
                            <th colSpan={6} className="py-2 px-3 text-center text-[10px] font-semibold uppercase tracking-widest"
                                style={{ color: 'var(--vw-accent)', background: 'rgba(0, 212, 170, 0.04)', ...DIVIDER_STYLE }}>
                                Valuation Multiples
                            </th>
                            <th className="py-2 px-3 text-center text-[10px] font-semibold uppercase tracking-widest"
                                style={{ color: 'var(--vw-text-muted)', background: 'var(--vw-bg-surface)', ...DIVIDER_STYLE }}>
                            </th>
                        </tr>

                        {/* ── Metric headers ───────────────────────────────── */}
                        <tr style={{ borderBottom: '2px solid var(--vw-border-lit)' }}>
                            <th className="py-3 px-3 text-left font-medium sticky left-0 z-10" style={{ ...hStyle, background: 'var(--vw-bg-raised)', minWidth: 140 }}>
                                Company
                            </th>
                            <th className="py-3 px-3 font-medium text-center" style={{ ...hStyle, width: 56 }}>
                                Include
                            </th>
                            <SortTh label="Rev Growth" k="revGrowth" {...sortProps} />
                            <SortTh label="EBITDA" k="ebitda" {...sortProps} />
                            <SortTh label="EBITDA %" k="ebitdaMargin" {...sortProps} />
                            <SortTh label="Net Income" k="netIncome" {...sortProps} />
                            <SortTh label="NI %" k="niMargin" {...sortProps} />
                            <SortTh label="Price" k="price" {...sortProps} />
                            <SortTh label="Mkt Cap" k="marketCap" {...sortProps} />
                            <SortTh label="EV" k="ev" {...sortProps} />
                            <SortTh label="EV / Rev" k="evToRev" {...sortProps} divider />
                            <SortTh label="EV / EBITDA" k="evToEbitda" {...sortProps} />
                            <SortTh label="P / Sales" k="pToSales" {...sortProps} />
                            <SortTh label="P / E" k="pToE" {...sortProps} />
                            <SortTh label="P / Book" k="pToBook" {...sortProps} />
                            <SortTh label="P / FCF" k="pToFCF" {...sortProps} />
                            <th className="py-3 px-3 font-medium text-center" style={{ ...hStyle, minWidth: 80, ...DIVIDER_STYLE }}>
                                Trend
                            </th>
                        </tr>
                    </thead>

                    {/* ── Data rows ─────────────────────────────────────── */}
                    <tbody>
                        {displayData.map((d, i) => {
                            const isTarget = i === 0;
                            const isIncluded = isTarget || selectedPeers[d.symbol];
                            return (
                                <tr
                                    key={d.symbol}
                                    className="transition-colors"
                                    style={{
                                        borderBottom: '1px solid var(--vw-border-dim)',
                                        opacity: isIncluded ? 1 : 0.45,
                                        background: isTarget ? 'rgba(0, 212, 170, 0.03)' : undefined,
                                    }}
                                >
                                    {/* Company — sticky */}
                                    <td
                                        className="py-3 px-3 text-left sticky left-0 z-10"
                                        style={{
                                            background: isTarget ? 'var(--vw-bg-raised)' : 'var(--vw-bg-raised)',
                                            borderLeft: isTarget ? '3px solid var(--vw-accent)' : '3px solid transparent',
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[13px]" style={{ color: isTarget ? 'var(--vw-accent)' : 'var(--vw-text-primary)' }}>
                                                {d.symbol}
                                            </span>
                                            <span className="text-[11px] truncate max-w-[120px]" style={{ color: 'var(--vw-text-muted)' }}>
                                                {d.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Include checkbox */}
                                    <td className="py-3 px-3 text-center">
                                        {!isTarget && (
                                            <input
                                                type="checkbox"
                                                checked={selectedPeers[d.symbol] || false}
                                                onChange={() => onTogglePeer(d.symbol)}
                                                className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                                            />
                                        )}
                                    </td>

                                    {/* Fundamentals */}
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: d.revGrowth < 0 ? '#f87171' : 'var(--vw-text-secondary)', backgroundColor: getHeatmapColor(d.revGrowth, 'revGrowth', data) }}>
                                        {formatPct(d.revGrowth)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: d.ebitda < 0 ? '#f87171' : 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.ebitda, 'ebitda', data) }}>
                                        {formatCurrency(d.ebitda)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: d.ebitdaMargin < 0 ? '#f87171' : 'var(--vw-text-secondary)', backgroundColor: getHeatmapColor(d.ebitdaMargin, 'ebitdaMargin', data) }}>
                                        {formatPct(d.ebitdaMargin)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: d.netIncome < 0 ? '#f87171' : 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.netIncome, 'netIncome', data) }}>
                                        {formatCurrency(d.netIncome)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: d.niMargin < 0 ? '#f87171' : 'var(--vw-text-secondary)', backgroundColor: getHeatmapColor(d.niMargin, 'niMargin', data) }}>
                                        {formatPct(d.niMargin)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.price, 'price', data) }}>
                                        ${d.price.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.marketCap, 'marketCap', data) }}>
                                        {formatCurrency(d.marketCap)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.ev, 'ev', data) }}>
                                        {formatCurrency(d.ev)}
                                    </td>

                                    {/* Valuation Multiples — with divider on first */}
                                    <td className="py-3 px-3 font-mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.evToRev, 'evToRev', data), ...DIVIDER_STYLE }}>
                                        {fmtX(d.evToRev)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.evToEbitda, 'evToEbitda', data) }}>
                                        {fmtX(d.evToEbitda)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.pToSales, 'pToSales', data) }}>
                                        {fmtX(d.pToSales)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.pToE, 'pToE', data) }}>
                                        {fmtX(d.pToE)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.pToBook, 'pToBook', data) }}>
                                        {fmtX(d.pToBook)}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--vw-text-primary)', backgroundColor: getHeatmapColor(d.pToFCF, 'pToFCF', data) }}>
                                        {fmtX(d.pToFCF)}
                                    </td>

                                    {/* Sparkline */}
                                    <td className="py-1 px-3" style={{ minWidth: 80, ...DIVIDER_STYLE }}>
                                        <Sparkline histEvEbitda={d.histEvEbitda ?? []} />
                                    </td>
                                </tr>
                            );
                        })}

                        {/* ── Stats rows ────────────────────────────────── */}
                        {(['Mean', 'Median', '25th Pctl', '75th Pctl'] as const).map((label, li) => {
                            const key = (['mean', 'median', 'p25', 'p75'] as const)[li];
                            const isMedian = li === 1;
                            return (
                                <tr
                                    key={label}
                                    style={{
                                        borderTop: li === 0 ? '2px solid var(--vw-border-lit)' : undefined,
                                        borderBottom: '1px solid var(--vw-border-dim)',
                                        background: isMedian ? 'rgba(0, 212, 170, 0.03)' : 'var(--vw-bg-surface)',
                                    }}
                                >
                                    <td
                                        className="text-left py-3 px-3 font-semibold text-[13px] sticky left-0 z-10"
                                        style={{ color: isMedian ? 'var(--vw-accent)' : 'var(--vw-text-secondary)', background: isMedian ? 'rgba(0, 212, 170, 0.03)' : 'var(--vw-bg-surface)', borderLeft: isMedian ? '3px solid var(--vw-accent)' : '3px solid transparent' }}
                                        colSpan={2}
                                    >
                                        {label}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: stats.revGrowth[key] < 0 ? '#f87171' : 'var(--vw-text-secondary)' }}>{formatPct(stats.revGrowth[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-secondary)' }}>{formatCurrency(stats.ebitda[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-secondary)' }}>{formatPct(stats.ebitdaMargin[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-secondary)' }}>{formatCurrency(stats.netIncome[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-secondary)' }}>{formatPct(stats.niMargin[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-secondary)' }}>${stats.price[key].toFixed(2)}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-secondary)' }}>{formatCurrency(stats.marketCap[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums" style={{ color: 'var(--vw-text-secondary)' }}>{formatCurrency(stats.ev[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums font-semibold" style={{ color: isMedian ? 'var(--vw-accent)' : 'var(--vw-text-secondary)', ...DIVIDER_STYLE }}>{fmtX(stats.evToRev[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums font-semibold" style={{ color: isMedian ? 'var(--vw-accent)' : 'var(--vw-text-secondary)' }}>{fmtX(stats.evToEbitda[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums font-semibold" style={{ color: isMedian ? 'var(--vw-accent)' : 'var(--vw-text-secondary)' }}>{fmtX(stats.pToSales[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums font-semibold" style={{ color: isMedian ? 'var(--vw-accent)' : 'var(--vw-text-secondary)' }}>{fmtX(stats.pToE[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums font-semibold" style={{ color: isMedian ? 'var(--vw-accent)' : 'var(--vw-text-secondary)' }}>{fmtX(stats.pToBook[key])}</td>
                                    <td className="py-3 px-3 font-mono text-[13px] tabular-nums font-semibold" style={{ color: isMedian ? 'var(--vw-accent)' : 'var(--vw-text-secondary)' }}>{fmtX(stats.pToFCF[key])}</td>
                                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)', ...DIVIDER_STYLE }}>—</td>
                                </tr>
                            );
                        })}

                        {/* ── Target Percentile row ────────────────────── */}
                        {targetPercentiles && (() => {
                            return (
                                <tr style={{ borderTop: '2px solid var(--vw-border-lit)', background: 'rgba(0, 212, 170, 0.02)' }}>
                                    <td
                                        className="text-left py-3 px-3 text-[12px] font-semibold sticky left-0 z-10"
                                        style={{ color: 'var(--vw-accent)', background: 'rgba(0, 212, 170, 0.02)', borderLeft: '3px solid var(--vw-accent)' }}
                                        colSpan={2}
                                    >
                                        Target Percentile
                                    </td>
                                    {pctCell(targetPercentiles.revGrowth)}
                                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)' }}>—</td>
                                    {pctCell(targetPercentiles.ebitdaMargin)}
                                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)' }}>—</td>
                                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)' }}>—</td>
                                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)' }}>—</td>
                                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)' }}>—</td>
                                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)' }}>—</td>
                                    {pctCell(targetPercentiles.evToRev, true)}
                                    {pctCell(targetPercentiles.evToEbitda)}
                                    {pctCell(targetPercentiles.pToSales)}
                                    {pctCell(targetPercentiles.pToE)}
                                    {pctCell(targetPercentiles.pToBook)}
                                    {pctCell(targetPercentiles.pToFCF)}
                                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--vw-text-muted)', ...DIVIDER_STYLE }}>—</td>
                                </tr>
                            );
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Footer note */}
            <div className="px-6 py-3" style={{ borderTop: '1px solid var(--vw-border-dim)' }}>
                <p className="text-[11px]" style={{ color: 'var(--vw-text-muted)' }}>
                    Target Percentile: higher % = more favorable vs peer group (100 = highest growth / lowest multiple)
                </p>
            </div>
        </div>
    );
}
