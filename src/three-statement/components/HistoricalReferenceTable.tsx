import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import type { HistoricalBase } from '../types';

interface HistRefMetric {
  label: string;
  values: (string | number)[];
  suffix?: string;
  isBold?: boolean;
  isDivider?: boolean;
}

const HistoricalReferenceTable = React.memo(function HistoricalReferenceTable({
  historicals,
}: {
  historicals: HistoricalBase[];
}) {
  const [expanded, setExpanded] = useState(true);

  const fmtCurrency = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
    return `${(v / 1e3).toFixed(0)}K`;
  };

  const metrics: HistRefMetric[] = useMemo(() => {
    if (historicals.length === 0) return [];
    return [
      { label: 'Revenue', values: historicals.map(h => fmtCurrency(h.revenue)), isBold: true },
      {
        label: 'Revenue Growth',
        values: historicals.map((h, i) => {
          if (i === 0) return '—';
          const prev = historicals[i - 1].revenue;
          return prev > 0 ? ((h.revenue - prev) / prev * 100).toFixed(1) : '—';
        }),
        suffix: '%',
      },
      { label: 'COGS % of Revenue', values: historicals.map(h => h.revenue > 0 ? (h.cogs / h.revenue * 100).toFixed(1) : '—'), suffix: '%', isDivider: true },
      { label: 'Gross Margin', values: historicals.map(h => h.revenue > 0 ? (h.grossProfit / h.revenue * 100).toFixed(1) : '—'), suffix: '%', isBold: true },
      { label: 'SG&A % of Revenue', values: historicals.map(h => h.revenue > 0 ? (h.sga / h.revenue * 100).toFixed(1) : '—'), suffix: '%' },
      { label: 'D&A % of Revenue', values: historicals.map(h => h.revenue > 0 ? (h.da / h.revenue * 100).toFixed(1) : '—'), suffix: '%' },
      { label: 'EBIT Margin', values: historicals.map(h => h.revenue > 0 ? (h.ebit / h.revenue * 100).toFixed(1) : '—'), suffix: '%', isBold: true, isDivider: true },
      { label: 'Net Margin', values: historicals.map(h => h.revenue > 0 ? (h.netIncome / h.revenue * 100).toFixed(1) : '—'), suffix: '%', isBold: true },
      { label: 'Effective Tax Rate', values: historicals.map(h => h.ebt > 0 ? (h.tax / h.ebt * 100).toFixed(1) : '—'), suffix: '%', isDivider: true },
      { label: 'CapEx % of Revenue', values: historicals.map(h => h.revenue > 0 ? (h.capex / h.revenue * 100).toFixed(1) : '—'), suffix: '%' },
      { label: 'DSO', values: historicals.map(h => h.revenue > 0 ? Math.round(h.receivables / h.revenue * 365).toString() : '—'), suffix: ' days', isDivider: true },
      { label: 'DIO', values: historicals.map(h => h.cogs > 0 ? Math.round(h.inventory / h.cogs * 365).toString() : '—'), suffix: ' days' },
      { label: 'DPO', values: historicals.map(h => h.cogs > 0 ? Math.round(h.payables / h.cogs * 365).toString() : '—'), suffix: ' days' },
    ];
  }, [historicals]);

  if (historicals.length === 0) return null;

  const lastIdx = historicals.length - 1;

  return (
    <div className="vw-card rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors"
        style={{ background: 'rgba(6, 182, 212, 0.04)' }}
      >
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Historical Reference</span>
          <span className="text-[11px] text-slate-500 ml-1">{historicals.length}Y data — use as reference for your assumptions</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {expanded && (
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr>
                <th className="text-left pb-3 pr-6 text-slate-500 font-medium sticky left-0 bg-[var(--vw-bg-surface)] z-10 min-w-[160px]">Metric</th>
                {historicals.map((h, i) => (
                  <th key={h.year} className={`pb-3 px-3 text-right min-w-[80px] ${i === lastIdx ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {h.year}
                    {i === lastIdx && (<div className="text-[9px] font-normal text-cyan-500/60 mt-0.5">latest</div>)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className={m.isDivider ? 'border-t border-slate-700/40' : ''}>
                  <td className={`py-1.5 pr-6 sticky left-0 bg-[var(--vw-bg-surface)] z-10 ${m.isBold ? 'text-slate-200 font-semibold' : 'text-slate-500'}`}>
                    {m.label}
                  </td>
                  {m.values.map((v, vi) => (
                    <td key={vi} className={`py-1.5 px-3 text-right ${vi === lastIdx ? 'text-cyan-300 font-medium' : m.isBold ? 'text-slate-300' : 'text-slate-400'}`}
                      style={vi === lastIdx ? { background: 'rgba(6, 182, 212, 0.05)' } : undefined}
                    >
                      {v === '—' ? '—' : `${v}${m.suffix || ''}`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default HistoricalReferenceTable;
