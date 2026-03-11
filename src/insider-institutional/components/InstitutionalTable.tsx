import React from 'react';
import { Eye } from 'lucide-react';
import { fmtDate } from '../utils/formatters';
import type { Institution } from '../types';

interface InstitutionalTableProps {
  institutions: Institution[];
  sym: string;
}

export default function InstitutionalTable({ institutions, sym }: InstitutionalTableProps) {
  if (institutions.length === 0) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 max-w-xl">
        <Eye className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-400 font-medium text-sm">Institutional Ownership Unavailable</p>
          <p className="text-slate-400 text-xs mt-1">Detailed institutional ownership data may require a Finnhub premium plan. Insider transaction data is shown above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-200">{sym} — Top Institutional Holders</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">Institution</th>
              <th className="text-right px-4 py-3 font-medium">Shares</th>
              <th className="text-right px-4 py-3 font-medium">% Ownership</th>
              <th className="text-right px-4 py-3 font-medium">Change</th>
              <th className="text-right px-4 py-3 font-medium">Report Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {institutions.map((inst, i) => {
              const change = inst.change ?? 0;
              return (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-200 max-w-[220px] truncate">{inst.name || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{inst.share ? inst.share.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {inst.ownershipPercent != null ? `${inst.ownershipPercent.toFixed(2)}%` : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {change !== 0 ? `${change > 0 ? '+' : ''}${change.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 text-xs">{fmtDate(inst.reportDate || '')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
