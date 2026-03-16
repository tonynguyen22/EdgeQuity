import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fmtQuarter, fmtYear } from '../utils/formatters';
import type { AnnualEarningsRecord, EarningsRecord, EarningsView } from '../types';

interface EarningsTableProps {
  quarterly: EarningsRecord[];
  annual: AnnualEarningsRecord[];
  view: EarningsView;
  sym: string;
}

function SurpriseBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-slate-500">-</span>;
  if (Math.abs(pct) < 0.5) return <span className="text-slate-400 text-xs flex items-center gap-1"><Minus className="w-3 h-3" />In-line</span>;
  if (pct > 0) return <span className="text-emerald-400 text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" />+{pct.toFixed(1)}%</span>;
  return <span className="text-red-400 text-xs flex items-center gap-1"><TrendingDown className="w-3 h-3" />{pct.toFixed(1)}%</span>;
}

export default function EarningsTable({ quarterly, annual, view, sym }: EarningsTableProps) {
  if (view === 'annual') {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-200">{sym} — Annual EPS History</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Fiscal Year</th>
                <th className="text-right px-4 py-3 font-medium">Reported EPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {annual.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300 font-medium tabular-nums">{fmtYear(r.fiscalYear)}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">
                    {r.reportedEPS != null ? `$${r.reportedEPS.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">Showing {annual.length} most recent fiscal years. Data via Alpha Vantage.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-200">{sym} — EPS Results &amp; Surprise History</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">Period</th>
              <th className="text-right px-4 py-3 font-medium">Actual EPS</th>
              <th className="text-right px-4 py-3 font-medium">Estimate</th>
              <th className="text-right px-4 py-3 font-medium">Surprise</th>
              <th className="text-right px-4 py-3 font-medium">Surprise %</th>
              <th className="text-center px-4 py-3 font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {quarterly.map((r, i) => {
              const pct = r.surprisePercent;
              const beat = pct != null && pct > 0.5;
              const miss = pct != null && pct < -0.5;
              return (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300 font-medium tabular-nums">{fmtQuarter(r.period, r.quarter, r.year)}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">
                    {r.actual != null ? `$${r.actual.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                    {r.estimate != null ? `$${r.estimate.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.surprise != null ? (
                      <span className={r.surprise > 0 ? 'text-emerald-400' : r.surprise < 0 ? 'text-red-400' : 'text-slate-400'}>
                        {r.surprise > 0 ? '+' : ''}{r.surprise.toFixed(4)}
                      </span>
                    ) : <span className="text-slate-500">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <SurpriseBadge pct={pct} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${beat ? 'bg-emerald-500/15 text-emerald-400' : miss ? 'bg-red-500/15 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                      {beat ? 'Beat' : miss ? 'Miss' : 'In-line'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Showing {quarterly.length} most recent quarters. Data via Alpha Vantage.</p>
    </div>
  );
}
