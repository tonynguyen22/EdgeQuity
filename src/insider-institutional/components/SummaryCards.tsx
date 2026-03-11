import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { NetBuySell } from '../types';

interface SummaryCardsProps {
  netBuySell: NetBuySell;
  totalTransactions: number;
  netScore: number | null;
}

export default function SummaryCards({ netBuySell, totalTransactions, netScore }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-1">Insider Buys (12mo)</div>
        <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" />
          {netBuySell.buy.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">shares purchased</div>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-1">Insider Sales (12mo)</div>
        <div className="text-xl font-bold text-red-400 flex items-center gap-1.5">
          <TrendingDown className="w-4 h-4" />
          {netBuySell.sell.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">shares sold</div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-1">Total Transactions</div>
        <div className="text-xl font-bold text-white">{totalTransactions}</div>
        <div className="text-xs text-slate-500 mt-0.5">last 12 months</div>
      </div>
      {netScore !== null && (() => {
        const pct = ((netScore + 1) / 2) * 100;
        const isPositive = netScore >= 0;
        const label = netScore >= 0.5 ? 'Strong Buy' : netScore >= 0.1 ? 'Net Buying' : netScore <= -0.5 ? 'Strong Sell' : netScore <= -0.1 ? 'Net Selling' : 'Neutral';
        const color = netScore >= 0.1 ? 'text-emerald-400' : netScore <= -0.1 ? 'text-red-400' : 'text-slate-400';
        return (
          <div className={`border rounded-xl p-4 ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="text-xs text-slate-400 mb-1">Net Transaction Score</div>
            <div className={`text-xl font-bold ${color}`}>{netScore >= 0 ? '+' : ''}{netScore.toFixed(2)}</div>
            <div className={`text-xs font-medium mt-0.5 ${color}`}>{label}</div>
            <div className="h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-slate-600 mt-1">-1 (sell) → +1 (buy)</div>
          </div>
        );
      })()}
    </div>
  );
}
