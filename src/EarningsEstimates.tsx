import React, { useState } from 'react';
import { Search, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      const prefixes = ['finnhub_', 'valuwise_', 'tech_', 'earnings_', 'insider_', 'news_', 'dividend_', 'multiples_'];
      Object.keys(localStorage)
        .filter(k => prefixes.some(p => k.startsWith(p)))
        .forEach(k => localStorage.removeItem(k));
      try { localStorage.setItem(key, value); } catch { /* skip */ }
    }
  }
}

const fmtQuarter = (period: string, quarter: number, year: number) => {
  if (quarter && year) return `Q${quarter} ${year}`;
  if (!period) return '-';
  const d = new Date(period);
  if (isNaN(d.getTime())) return period;
  return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
};

interface EarningsRecord {
  actual: number | null;
  estimate: number | null;
  period: string;
  quarter: number;
  surprise: number | null;
  surprisePercent: number | null;
  symbol: string;
  year: number;
}

export default function EarningsEstimates() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<EarningsRecord[]>([]);

  const fetchData = async (symbol: string) => {
    setLoading(true);
    setError('');
    try {
      const cacheKey = `earnings_${symbol}_v4`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, d } = JSON.parse(cached);
          if (Date.now() - ts < 6 * 60 * 60 * 1000 && Array.isArray(d) && d.length > 0) {
            setHistory(d);
            return;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const res = await fetch(`${FINNHUB_URL}/stock/earnings?symbol=${symbol}&limit=8&token=${FINNHUB_KEY}`);
      if (!res.ok) throw new Error(`Finnhub request failed (${res.status}).`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No earnings data found for ${symbol}. Ensure it is a US-listed ticker.`);
      }

      // Finnhub returns newest first by default
      const sorted = [...data].sort(
        (a: EarningsRecord, b: EarningsRecord) => new Date(b.period).getTime() - new Date(a.period).getTime(),
      );

      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), d: sorted }));
      setHistory(sorted);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch earnings data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (s) { setSym(s); fetchData(s); }
  };

  const SurpriseBadge = ({ pct }: { pct: number | null }) => {
    if (pct == null) return <span className="text-slate-600">-</span>;
    if (Math.abs(pct) < 0.5) return <span className="text-slate-400 text-xs flex items-center gap-1"><Minus className="w-3 h-3" />In-line</span>;
    if (pct > 0) return <span className="text-emerald-400 text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" />+{pct.toFixed(1)}%</span>;
    return <span className="text-red-400 text-xs flex items-center gap-1"><TrendingDown className="w-3 h-3" />{pct.toFixed(1)}%</span>;
  };

  const beats = history.filter(r => r.surprisePercent != null && r.surprisePercent > 0.5).length;
  const misses = history.filter(r => r.surprisePercent != null && r.surprisePercent < -0.5).length;
  const total = history.length;

  // EPS Momentum: compare YoY growth of 2 most recent quarters vs 2 prior
  const epsMomentum = (() => {
    if (history.length < 4) return null;
    const yoy = (i: number) => {
      if (i + 4 >= history.length) return null;
      const base = history[i + 4]?.actual;
      const curr = history[i]?.actual;
      if (!base || base === 0 || curr == null) return null;
      return ((curr - base) / Math.abs(base)) * 100;
    };
    const g0 = yoy(0), g1 = yoy(1), g2 = yoy(2);
    if (g0 == null || g1 == null) return null;
    const recentAvg = (g0 + g1) / 2;
    const priorAvg = g2 != null ? (g1 + g2) / 2 : g1;
    const delta = recentAvg - priorAvg;
    const trend: 'Accelerating' | 'Stable' | 'Decelerating' =
      delta > 3 ? 'Accelerating' : delta < -3 ? 'Decelerating' : 'Stable';
    return { recentAvg, priorAvg, delta, trend };
  })();

  // Earnings Quality Score
  const qualityScore = (() => {
    if (!history.length) return null;
    const withEstimate = history.filter(r => r.estimate != null && r.estimate !== 0);
    if (withEstimate.length === 0) return null;
    const surprises = withEstimate.map(r => r.surprisePercent ?? 0);
    const avgSurprise = surprises.reduce((a, b) => a + b, 0) / surprises.length;
    const beatRate = (surprises.filter(s => s > 0.5).length / surprises.length) * 100;
    const score = Math.round((beatRate * 0.6) + (Math.min(Math.max(avgSurprise, -20), 20) / 20) * 40 + 40);
    const clamped = Math.max(0, Math.min(100, score));
    const label = clamped >= 70 ? 'High Quality' : clamped >= 45 ? 'Average' : 'Low Quality';
    return { score: clamped, label, avgSurprise, beatRate };
  })();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">Earnings Estimates</h2>
        <p className="text-slate-400 text-sm">Recent EPS results and surprise history via Finnhub.</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter ticker (e.g. AAPL, MSFT)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent uppercase transition-all"
        />
        <button type="submit" disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Analyze
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-8 max-w-xl mx-auto">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading earnings data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {history.length > 0 && !loading && (
        <div className="space-y-8">
          {/* Beat/Miss Summary */}
          {total > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{beats}</div>
                <div className="text-xs text-slate-400 mt-0.5">Beats</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{misses}</div>
                <div className="text-xs text-slate-400 mt-0.5">Misses</div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{total > 0 ? ((beats / total) * 100).toFixed(0) : '0'}%</div>
                <div className="text-xs text-slate-400 mt-0.5">Beat Rate</div>
              </div>
            </div>
          )}

          {/* EPS Momentum + Quality */}
          {(epsMomentum || qualityScore) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {epsMomentum && (() => {
                const tColor = epsMomentum.trend === 'Accelerating' ? 'text-emerald-400'
                  : epsMomentum.trend === 'Decelerating' ? 'text-red-400' : 'text-amber-400';
                const tBg = epsMomentum.trend === 'Accelerating' ? 'bg-emerald-500/10 border-emerald-500/20'
                  : epsMomentum.trend === 'Decelerating' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20';
                return (
                  <div className={`border rounded-xl p-4 ${tBg}`}>
                    <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-medium">EPS Momentum</div>
                    <div className={`text-xl font-bold ${tColor} flex items-center gap-2`}>
                      {epsMomentum.trend === 'Accelerating' ? <TrendingUp className="w-5 h-5" /> : epsMomentum.trend === 'Decelerating' ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                      {epsMomentum.trend}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-400">
                      <div>Recent YoY growth: <span className={`font-semibold ${epsMomentum.recentAvg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{epsMomentum.recentAvg >= 0 ? '+' : ''}{epsMomentum.recentAvg.toFixed(1)}%</span></div>
                      <div>Prior period: <span className="text-slate-300">{epsMomentum.priorAvg >= 0 ? '+' : ''}{epsMomentum.priorAvg.toFixed(1)}%</span></div>
                      <div className={`${Math.abs(epsMomentum.delta) > 3 ? tColor : 'text-slate-500'}`}>
                        {epsMomentum.delta >= 0 ? '+' : ''}{epsMomentum.delta.toFixed(1)}pp change
                      </div>
                    </div>
                  </div>
                );
              })()}
              {qualityScore && (() => {
                const qColor = qualityScore.score >= 70 ? 'text-emerald-400' : qualityScore.score >= 45 ? 'text-amber-400' : 'text-red-400';
                const qBg = qualityScore.score >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : qualityScore.score >= 45 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
                return (
                  <div className={`border rounded-xl p-4 ${qBg}`}>
                    <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-medium">Earnings Quality</div>
                    <div className={`text-xl font-bold ${qColor}`}>{qualityScore.label}</div>
                    <div className="h-1.5 bg-slate-700 rounded-full mt-2 mb-2 overflow-hidden">
                      <div className={`h-full rounded-full ${qualityScore.score >= 70 ? 'bg-emerald-500' : qualityScore.score >= 45 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${qualityScore.score}%` }} />
                    </div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div>Beat rate: <span className="text-slate-200 font-medium">{qualityScore.beatRate.toFixed(0)}%</span></div>
                      <div>Avg EPS surprise: <span className={`font-medium ${qualityScore.avgSurprise >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{qualityScore.avgSurprise >= 0 ? '+' : ''}{qualityScore.avgSurprise.toFixed(1)}%</span></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* EPS Surprise History Table */}
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
                  {history.map((r, i) => {
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
                          ) : <span className="text-slate-600">-</span>}
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
            <p className="text-xs text-slate-600">Showing {history.length} most recent quarters. Data via Finnhub.</p>
          </div>
        </div>
      )}

      {history.length === 0 && !loading && !error && (
        <div className="max-w-xl mx-auto bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-2">
          <p className="text-sm font-medium text-slate-300">What you'll see here</p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">*</span>Historical EPS surprise -- Beat/Miss/In-line vs. consensus</li>
            <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">*</span>Actual vs. estimated EPS per quarter</li>
            <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">*</span>Beat rate summary across recent quarters</li>
            <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">*</span>EPS momentum and earnings quality score</li>
          </ul>
        </div>
      )}
    </div>
  );
}
