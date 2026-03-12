import React from 'react';
import { Activity, Users, Award, BarChart3, TrendingUp, TrendingDown, BarChart2, Eye, Newspaper, Coins, ArrowUpRight, RefreshCw, Zap, Shield, BarChart } from 'lucide-react';
import { motion } from 'motion/react';
import type { TabId } from '../types';

interface LandingPageProps {
  onTabChange: (tab: TabId) => void;
}

/* ── Simulated market data for visual richness ────────────────────────────── */
const MARKET_INDICES = [
  { name: 'S&P 500', value: '5,928.42', change: '+0.87%', up: true },
  { name: 'NASDAQ', value: '19,432.18', change: '+1.24%', up: true },
  { name: 'DOW', value: '43,856.30', change: '-0.12%', up: false },
  { name: '10Y Yield', value: '4.28%', change: '+0.03', up: true },
  { name: 'VIX', value: '14.82', change: '-1.23', up: false },
];

const FEATURES = [
  { id: 'dcf' as TabId, label: 'DCF Model', Icon: Activity, color: '#00d4aa', desc: 'Project free cash flows, WACC, and terminal value to derive intrinsic price per share.' },
  { id: 'multiples' as TabId, label: 'Multiples', Icon: BarChart3, color: '#f472b6', desc: 'Historical P/E, EV/EBITDA, P/B with 5-year trends and valuation context.' },
  { id: 'grade' as TabId, label: 'Quality', Icon: Award, color: '#f0b429', desc: 'Financial quality report (A-D) with Piotroski, Altman Z, DuPont analysis.' },
  { id: 'comp' as TabId, label: 'Peers', Icon: Users, color: '#38bdf8', desc: 'Compare EV/EBITDA, P/E and multiples against selected peer companies.' },
  { id: 'tech' as TabId, label: 'Technical', Icon: TrendingUp, color: '#a78bfa', desc: 'RSI, MACD, Bollinger Bands, moving averages, and signal score.' },
  { id: 'earnings' as TabId, label: 'Earnings', Icon: BarChart2, color: '#22d3ee', desc: 'Consensus EPS estimates, surprise history, and beat rate tracking.' },
  { id: 'insider' as TabId, label: 'Insider & Inst.', Icon: Eye, color: '#fb923c', desc: 'Recent insider buy/sell transactions and institutional ownership.' },
  { id: 'news' as TabId, label: 'News & Sentiment', Icon: Newspaper, color: '#38bdf8', desc: 'AI-powered headlines analysis with sentiment scoring.' },
  { id: 'dividend' as TabId, label: 'Dividends', Icon: Coins, color: '#fb7185', desc: 'Dividend history, growth CAGR, yield, and FCF safety score.' },
  { id: 'cycle' as TabId, label: 'Market Cycle', Icon: RefreshCw, color: '#2dd4bf', desc: 'Identify where the market is across economic and sector cycles.' },
];

const STATS = [
  { label: 'Supported Tickers', value: '87+' },
  { label: 'Analysis Modules', value: '10' },
  { label: 'Data Sources', value: '6' },
];

export default function LandingPage({ onTabChange }: LandingPageProps) {
  return (
    <div className="space-y-8 pb-8">

      {/* ── Market Ticker Bar ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-1 overflow-x-auto py-2 px-1 -mx-2 rounded-xl"
        style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-dim)' }}
      >
        <div className="flex items-center gap-1 px-2">
          <BarChart className="w-3.5 h-3.5" style={{ color: 'var(--vw-text-tertiary)' }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--vw-text-tertiary)' }}>
            Markets
          </span>
        </div>
        <div className="w-px h-5" style={{ background: 'var(--vw-border)' }} />
        {MARKET_INDICES.map((idx, i) => (
          <div key={idx.name} className="flex items-center gap-2.5 px-3 py-1 whitespace-nowrap">
            <span className="text-xs font-medium" style={{ color: 'var(--vw-text-secondary)' }}>{idx.name}</span>
            <span className="text-xs font-mono font-medium" style={{ color: 'var(--vw-text-primary)' }}>{idx.value}</span>
            <span
              className="text-[11px] font-mono font-semibold flex items-center gap-0.5"
              style={{ color: idx.up ? 'var(--vw-green)' : 'var(--vw-red)' }}
            >
              {idx.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {idx.change}
            </span>
            {i < MARKET_INDICES.length - 1 && (
              <div className="w-px h-4 ml-1" style={{ background: 'var(--vw-border-dim)' }} />
            )}
          </div>
        ))}
      </motion.div>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl p-8 lg:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.06) 0%, rgba(56, 189, 248, 0.04) 50%, rgba(167, 139, 250, 0.04) 100%)',
          border: '1px solid var(--vw-border)',
        }}
      >
        {/* Decorative mesh dots */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, var(--vw-accent) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="vw-stat vw-stat-up">
              <Zap className="w-3 h-3" />
              Real-Time Analysis
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3" style={{ color: 'var(--vw-text-primary)' }}>
            Professional{' '}
            <span className="vw-gradient-text">Equity Research</span>{' '}
            Platform
          </h1>
          <p className="text-base lg:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--vw-text-secondary)' }}>
            A comprehensive suite of stock analysis tools — DCF valuation, comparable analysis, technical indicators, insider activity, and AI-powered news sentiment.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 mt-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono" style={{ color: 'var(--vw-accent)' }}>{s.value}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--vw-text-tertiary)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Feature Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {FEATURES.map((f, i) => (
          <motion.button
            key={f.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
            onClick={() => onTabChange(f.id)}
            className="vw-card p-4 space-y-3 text-left group transition-all duration-300 hover:scale-[1.02]"
            style={{ '--hover-color': f.color } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${f.color}40`;
              e.currentTarget.style.boxShadow = `0 0 24px -6px ${f.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--vw-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                style={{ background: `${f.color}15` }}
              >
                <f.Icon className="w-4 h-4" style={{ color: f.color }} />
              </div>
              <ArrowUpRight
                className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ color: f.color }}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--vw-text-primary)' }}>{f.label}</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--vw-text-tertiary)' }}>{f.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Supported Tickers notice ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex items-start gap-3 rounded-xl px-5 py-4"
        style={{
          background: 'rgba(240, 180, 41, 0.04)',
          border: '1px solid rgba(240, 180, 41, 0.15)',
        }}
      >
        <Shield className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--vw-amber)' }} />
        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--vw-amber)' }}>Supported Tickers</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
            DCF, Quality, and Multiples use Financial Modeling Prep (~87 pre-selected tickers). Peers use Finnhub (US-listed). Market data tabs work with any supported ticker.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
