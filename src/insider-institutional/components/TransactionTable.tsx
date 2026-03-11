import React from 'react';
import { fmtDate, fmtNum } from '../utils/formatters';
import { TRANS_CODE_LABELS } from '../calculations';
import type { InsiderTransaction } from '../types';

interface TransactionTableProps {
  transactions: InsiderTransaction[];
  sym: string;
}

export default function TransactionTable({ transactions, sym }: TransactionTableProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-200">{sym} — Recent Insider Transactions (last 12 months)</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-center px-4 py-3 font-medium">Type</th>
              <th className="text-right px-4 py-3 font-medium">Shares</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-right px-4 py-3 font-medium">Est. Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {transactions.map((t, i) => {
              const isBuy = t.transactionCode === 'P';
              const isSell = t.transactionCode === 'S' || t.transactionCode === 'D';
              const shares = Math.abs(t.change ?? t.share ?? 0);
              const value = t.transactionPrice && shares ? t.transactionPrice * shares : null;
              const label = TRANS_CODE_LABELS[t.transactionCode ?? ''] ?? t.transactionCode ?? '—';
              return (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDate(t.transactionDate || t.filingDate || '')}</td>
                  <td className="px-4 py-3 text-slate-200 max-w-[180px] truncate">{t.name || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${isBuy ? 'bg-emerald-500/15 text-emerald-400' : isSell ? 'bg-red-500/15 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                      {label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-slate-300'}`}>
                    {shares > 0 ? shares.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {t.transactionPrice ? `$${t.transactionPrice.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {value ? fmtNum(value) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
