import React from 'react';
import { Activity, Users, Award, TrendingUp, BarChart2, Eye, Newspaper, Briefcase, Coins } from 'lucide-react';
import type { TabId } from '../types';

interface LandingPageProps {
  onTabChange: (tab: TabId) => void;
}

export default function LandingPage({ onTabChange }: LandingPageProps) {
  return (
    <div className="max-w-4xl mx-auto text-center py-16 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Professional <span className="text-emerald-500">Equity Research</span> Platform
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          A full suite of stock analysis tools — valuation models, market data, insider activity, news sentiment, portfolio tracking, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
        <button onClick={() => onTabChange('dcf')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-emerald-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-white">DCF Model</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Project free cash flows, terminal value, and WACC to get an intrinsic price per share.</p>
        </button>

        <button onClick={() => onTabChange('comp')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-blue-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-base font-semibold text-white">Peer Analysis</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Compare EV/EBITDA, P/E and other multiples against manually selected peers.</p>
        </button>

        <button onClick={() => onTabChange('grade')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-amber-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-white">Company Grade</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Letter-grade report card (A–D) across financial health, profitability, growth, and cash flow.</p>
        </button>

        <button onClick={() => onTabChange('tech')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-violet-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
            <TrendingUp className="w-5 h-5 text-violet-500" />
          </div>
          <h3 className="text-base font-semibold text-white">Technical Analysis</h3>
          <p className="text-slate-400 text-xs leading-relaxed">RSI, MACD, Bollinger Bands, moving averages, and a bullish/bearish signal score.</p>
        </button>

        <button onClick={() => onTabChange('earnings')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-cyan-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
            <BarChart2 className="w-5 h-5 text-cyan-500" />
          </div>
          <h3 className="text-base font-semibold text-white">Earnings Estimates</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Consensus EPS and revenue estimates for next 4 quarters + FY with surprise history.</p>
        </button>

        <button onClick={() => onTabChange('insider')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-orange-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
            <Eye className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-base font-semibold text-white">Insider &amp; Institutional</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Recent insider buy/sell transactions and top institutional ownership holders.</p>
        </button>

        <button onClick={() => onTabChange('news')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-sky-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-sky-500/10 rounded-lg flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
            <Newspaper className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-base font-semibold text-white">News & Sentiment</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Latest headlines with AI-powered news summary and sentiment analysis.</p>
        </button>

        <button onClick={() => onTabChange('portfolio')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-indigo-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
            <Briefcase className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-base font-semibold text-white">Portfolio Tracker</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Track multiple holdings with live prices, weights, P&amp;L, and diversification grade.</p>
        </button>

        <button onClick={() => onTabChange('dividend')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-2.5 hover:bg-slate-800 hover:border-rose-500/50 transition-all group text-left">
          <div className="w-9 h-9 bg-rose-500/10 rounded-lg flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
            <Coins className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-base font-semibold text-white">Dividend Analysis</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Dividend history, 3/5/10yr growth CAGR, yield, and FCF safety score.</p>
        </button>
      </div>

      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-4 text-left max-w-2xl mx-auto">
        <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-400 mb-0.5">US-Listed Stocks Only (DCF, Peers, Grade)</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            Valuation tools require SEC filings (NYSE / NASDAQ). Market data tabs (Technical, Earnings, News, Dividends) work with any Finnhub-supported ticker.
          </p>
        </div>
      </div>
    </div>
  );
}
