import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { useInsiderData } from './hooks/useInsiderData';
import { computeNetBuySell, computeNetScore, computeBuyerClusters } from './calculations';
import { clearCache } from './utils/storage';
import SummaryCards from './components/SummaryCards';
import TransactionTable from './components/TransactionTable';
import InstitutionalTable from './components/InstitutionalTable';

export default function InsiderInstitutional() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const { data, loading, error, fetchData } = useInsiderData();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (s) { setSym(s); fetchData(s); }
  };

  const netBuySell = data ? computeNetBuySell(data.transactions) : null;
  const netScore = netBuySell ? computeNetScore(netBuySell) : null;
  const buyerClusters = data ? computeBuyerClusters(data.transactions) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">Insider &amp; Institutional</h2>
        <p className="text-slate-400 text-sm">Recent insider transactions and top institutional holders.</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter ticker (e.g. AAPL, MSFT)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase transition-all"
        />
        <button type="submit" disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Analyze
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-8 max-w-xl mx-auto">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading insider data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
            <button onClick={clearCache} className="mt-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors">Clear Cache & Retry</button>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {netBuySell && (
            <SummaryCards
              netBuySell={netBuySell}
              totalTransactions={data.transactions.length}
              netScore={netScore}
            />
          )}

          {buyerClusters.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <div className="text-xs text-emerald-400/70 uppercase tracking-wide font-medium mb-2">Coordinated Buying Signal</div>
              <p className="text-sm text-slate-300 mb-2">Multiple insiders bought in the same month — often a stronger conviction signal:</p>
              <div className="flex flex-wrap gap-2">
                {buyerClusters.map(c => (
                  <span key={c.month} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-medium">
                    {c.month} — {c.count} buyers
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.transactions.length > 0 && <TransactionTable transactions={data.transactions} sym={sym} />}
          <InstitutionalTable institutions={data.institutions} sym={sym} />
        </div>
      )}

      {!data && !loading && !error && (
        <div className="max-w-xl mx-auto bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-2">
          <p className="text-sm font-medium text-slate-300">What you'll see here</p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span>Recent insider transactions — purchases, sales, and grants over the last 12 months</li>
            <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span>Net insider sentiment — whether insiders are net buyers or sellers</li>
            <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span>Top institutional holders by ownership percentage (where available)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
