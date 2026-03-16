import React from 'react';
import { AlertCircle } from 'lucide-react';
import { fmtDate } from '../utils/formatters';
import type { DividendPayment } from '../types';

interface PaymentHistoryProps {
  payments: DividendPayment[];
  sym: string;
}

export default function PaymentHistory({ payments, sym }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-500">
          Dividend payment history could not be retrieved from Massive API for {sym}. Yield and payout metrics above are sourced from Finnhub aggregated data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-200">{sym} — Dividend Payment History</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">Ex-Date</th>
              <th className="text-right px-4 py-3 font-medium">Amount / Share</th>
              <th className="text-right px-4 py-3 font-medium">Pay Date</th>
              <th className="text-center px-4 py-3 font-medium">Type</th>
              <th className="text-right px-4 py-3 font-medium">vs Prior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {payments.slice(0, 10).map((p, i) => {
              const prev = payments.slice(i + 1).find(q => q.type === p.type);
              const change = prev?.amount ? ((p.amount - prev.amount) / prev.amount) * 100 : null;
              const isSpecial = p.type === 'irregular' || p.type === 'special';
              return (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300">{fmtDate(p.date || p.exDate)}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold">${p.amount?.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right text-slate-400 text-xs">{p.payDate ? fmtDate(p.payDate) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${isSpecial ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                      {isSpecial ? 'Special' : p.type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {change !== null && Math.abs(change) > 0.1 ? (
                      <span className={`text-xs ${change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {payments.length > 10 && (
        <p className="text-xs text-slate-500 text-center">Showing 10 most recent of {payments.length} total payments</p>
      )}
    </div>
  );
}
