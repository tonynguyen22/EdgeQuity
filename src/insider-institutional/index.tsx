import React, { useState, useCallback } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import TickerSearch from '../components/TickerSearch';
import TabLanding from '../components/TabLanding';
import { useInsiderData } from './hooks/useInsiderData';
import { computeNetBuySell, computeNetScore, computeBuyerClusters } from './calculations';
import { clearCache } from './utils/storage';
import SummaryCards from './components/SummaryCards';
import TransactionTable from './components/TransactionTable';
import InstitutionalTable from './components/InstitutionalTable';

export default function InsiderInstitutional() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const { data, loading, error, fetchData } = useInsiderData();

  const handleAnalyze = useCallback((s: string) => {
    setSym(s);
    setShowLoading(true);
    fetchData(s);
    setTimeout(() => setShowLoading(false), 2500);
  }, [fetchData]);

  const handleGoBack = () => {
    setSym('');
    setInput('');
    setShowLoading(false);
  };

  const netBuySell = data ? computeNetBuySell(data.transactions) : null;
  const netScore = netBuySell ? computeNetScore(netBuySell) : null;
  const buyerClusters = data ? computeBuyerClusters(data.transactions) : [];
  const isLoading = loading || showLoading;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Landing — shown when no results */}
      {!data && !isLoading && !error && (
        <TabLanding
          title="Insider &"
          accentTitle="Institutional"
          subtitle="Recent insider transactions and top institutional holders"
          aboutItems={[
            'Tracks recent stock purchases and sales by company executives and board members',
            'Shows whether insiders are net buying or selling — often a strong conviction signal',
            'Lists top institutional holders (mutual funds, hedge funds) and their ownership stakes',
            'Detects coordinated buying clusters — when multiple insiders buy in the same month',
          ]}
          searchInput={input}
          setSearchInput={setInput}
          onAnalyze={handleAnalyze}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading insider data…</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
            <button onClick={clearCache} className="mt-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors">Clear Cache & Retry</button>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !isLoading && (
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">{sym}</h2>
          </div>

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
    </div>
  );
}
