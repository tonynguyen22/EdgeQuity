import React from 'react';
import { Activity, Users, Award, BarChart3, TrendingUp, TrendingDown, BarChart2, Eye, Newspaper, Coins, ArrowUpRight, RefreshCw, Zap, Shield, BarChart, DollarSign, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';
import type { TabId } from '../types';
import { useMarketData } from '../hooks/useMarketData';
import type { MarketIndex } from '../hooks/useMarketData';

interface LandingPageProps {
  onTabChange: (tab: TabId) => void;
}



const FEATURE_SECTIONS = [
  {
    group: 'Valuation',
    items: [
      { id: 'dcf' as TabId, label: 'DCF Model', Icon: Activity, color: '#00d4aa', desc: 'Project free cash flows, WACC, and terminal value to derive intrinsic price per share.' },
      { id: 'ddm' as TabId, label: 'DDM', Icon: DollarSign, color: '#f59e0b', desc: 'Dividend discount model with Gordon Growth, H-Model, and multi-stage variants.' },
      { id: 'multiples' as TabId, label: 'Multiples', Icon: BarChart3, color: '#f472b6', desc: 'Historical P/E, EV/EBITDA, P/B with 5-year trends and valuation context.' },
    ],
  },
  {
    group: 'Fundamentals',
    items: [
      { id: 'grade' as TabId, label: 'Quality', Icon: Award, color: '#f0b429', desc: 'Financial quality report (A–D) with Piotroski, Altman Z, DuPont analysis.' },
      { id: 'three-stmt' as TabId, label: '3-Statement', Icon: FileSpreadsheet, color: '#06b6d4', desc: 'Linked income statement, balance sheet, and cash flow model with Excel export.' },
      { id: 'comp' as TabId, label: 'Peers', Icon: Users, color: '#38bdf8', desc: 'Compare EV/EBITDA, P/E and multiples against selected peer companies.' },
    ],
  },
  {
    group: 'Market Intelligence',
    items: [
      { id: 'tech' as TabId, label: 'Technical', Icon: TrendingUp, color: '#a78bfa', desc: 'RSI, MACD, Bollinger Bands, moving averages, and signal score.' },
      { id: 'earnings' as TabId, label: 'Earnings', Icon: BarChart2, color: '#22d3ee', desc: 'Consensus EPS estimates, surprise history, and beat rate tracking.' },
      { id: 'insider' as TabId, label: 'Insider & Inst.', Icon: Eye, color: '#fb923c', desc: 'Recent insider buy/sell transactions and institutional ownership.' },
      { id: 'news' as TabId, label: 'News & Sentiment', Icon: Newspaper, color: '#38bdf8', desc: 'AI-powered headlines analysis with sentiment scoring.' },
    ],
  },
  {
    group: 'Income & Macro',
    items: [
      { id: 'dividend' as TabId, label: 'Dividends', Icon: Coins, color: '#fb7185', desc: 'Dividend history, growth CAGR, yield, and FCF safety score.' },
      { id: 'cycle' as TabId, label: 'Market Cycle', Icon: RefreshCw, color: '#2dd4bf', desc: 'Identify where the market is across economic and sector cycles.' },
    ],
  },
];

const STATS = [
  { label: 'Supported Tickers', value: '87+' },
  { label: 'Analysis Modules', value: '12' },
  { label: 'Data Sources', value: '6' },
];

/* ── Micro sparkline for ticker bar ─────────────────────────────────────── */
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const h = 16, w = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? 'var(--vw-green)' : 'var(--vw-red)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.7 }}
      />
    </svg>
  );
}

/* ── Decorative hero chart SVG ──────────────────────────────────────────── */
function HeroChart() {
  return (
    <svg
      className="vw-hero-chart absolute bottom-0 right-0 w-[55%] h-[70%] pointer-events-none"
      viewBox="0 0 400 200"
      preserveAspectRatio="none"
      style={{ opacity: 0.4 }}
    >
      <defs>
        <linearGradient id="hero-chart-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--vw-accent)" stopOpacity="0" />
          <stop offset="30%" stopColor="var(--vw-accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--vw-accent)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--vw-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,160 C20,155 40,140 60,145 C80,150 100,120 130,100 C160,80 180,110 200,90 C220,70 240,85 260,60 C280,35 300,55 330,30 C350,15 370,25 400,10"
        fill="none"
        stroke="url(#hero-chart-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M0,160 C20,155 40,140 60,145 C80,150 100,120 130,100 C160,80 180,110 200,90 C220,70 240,85 260,60 C280,35 300,55 330,30 C350,15 370,25 400,10 L400,200 L0,200 Z"
        fill="url(#hero-chart-fill)"
        style={{ opacity: 0.5 }}
      />
    </svg>
  );
}

/* ═════════════════════════════════════════════════════════════════════════ */

export default function LandingPage({ onTabChange }: LandingPageProps) {
  const { indices } = useMarketData();

  /* Render a single set of ticker items (used twice for seamless marquee) */
  const renderTickerItems = (items: MarketIndex[], keyPrefix: string) => (
    <>
      {items.map((idx, i) => (
        <div key={`${keyPrefix}-${idx.name}`} className="flex items-center gap-2 px-3 py-0.5 whitespace-nowrap shrink-0">
          <span className="text-xs font-medium" style={{ color: 'var(--vw-text-secondary)' }}>{idx.name}</span>
          <span className="text-xs font-mono font-medium" style={{ color: 'var(--vw-text-primary)' }}>{idx.value}</span>
          <Sparkline data={idx.spark} up={idx.up} />
          <span
            className="text-[11px] font-mono font-semibold flex items-center gap-0.5"
            style={{ color: idx.up ? 'var(--vw-green)' : 'var(--vw-red)' }}
          >
            {idx.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {idx.change}
          </span>
          <div className="w-px h-4 ml-1 shrink-0" style={{ background: 'var(--vw-border-dim)' }} />
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-6 pb-10">

      {/* ── Market Ticker Bar — Infinite Marquee ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative overflow-hidden py-2.5 -mx-2 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(12, 18, 32, 0.8) 100%)',
          border: '1px solid var(--vw-border-dim)',
        }}
      >
        {/* Ambient glow line at bottom */}
        <div
          className="absolute bottom-0 left-[10%] right-[10%] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.15), transparent)' }}
        />

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(12, 18, 32, 0.9), transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgba(12, 18, 32, 0.9), transparent)' }} />

        {/* Scrolling marquee — content duplicated for seamless loop */}
        <div className="vw-marquee">
          {/* First copy */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1 px-3 shrink-0">
              <BarChart className="w-3.5 h-3.5" style={{ color: 'var(--vw-accent)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--vw-text-tertiary)' }}>
                Live Markets
              </span>
            </div>
            <div className="w-px h-5 shrink-0" style={{ background: 'var(--vw-border)' }} />
            {renderTickerItems(indices, 'a')}
          </div>
          {/* Second copy (creates the infinite loop) */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1 px-3 shrink-0">
              <BarChart className="w-3.5 h-3.5" style={{ color: 'var(--vw-accent)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--vw-text-tertiary)' }}>
                Live Markets
              </span>
            </div>
            <div className="w-px h-5 shrink-0" style={{ background: 'var(--vw-border)' }} />
            {renderTickerItems(indices, 'b')}
          </div>
        </div>
      </motion.div>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative overflow-hidden rounded-2xl"
        style={{ border: '1px solid var(--vw-border)' }}
      >
        {/* ── Layered Background ─ */}
        {/* Base gradient */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(160deg, #0d1424 0%, #0c1220 40%, #101828 100%)',
        }} />

        {/* Floating orbs */}
        <div
          className="vw-orb absolute -top-20 -left-20 w-72 h-72 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 212, 170, 0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="vw-orb vw-orb-delay absolute top-10 right-[15%] w-56 h-56 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="vw-orb vw-orb-delay-2 absolute -bottom-10 right-[5%] w-48 h-48 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)',
            filter: 'blur(45px)',
          }}
        />

        {/* Dot matrix */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'radial-gradient(circle, var(--vw-accent) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Decorative chart */}
        <HeroChart />

        {/* ── Content ─ */}
        <div className="relative z-10 p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-3xl"
          >
            {/* Badge */}
            <div className="flex items-center gap-2 mb-5">
              <div
                className="vw-shimmer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
                style={{
                  background: 'rgba(0, 212, 170, 0.1)',
                  border: '1px solid rgba(0, 212, 170, 0.2)',
                  color: 'var(--vw-accent)',
                }}
              >
                <Zap className="w-3 h-3" />
                Real-Time Analysis
              </div>
            </div>

            {/* Heading */}
            <h1
              className="text-4xl lg:text-5xl font-bold mb-4"
              style={{
                letterSpacing: '-0.03em',
                lineHeight: '1.15',
                color: 'var(--vw-text-primary)',
              }}
            >
              Professional{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #00d4aa 0%, #38bdf8 50%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Equity Research
              </span>
              <br />
              Platform
            </h1>

            {/* Subtitle */}
            <p
              className="text-base lg:text-lg max-w-2xl"
              style={{
                color: 'var(--vw-text-secondary)',
                lineHeight: '1.7',
              }}
            >
              A comprehensive suite of stock analysis tools — DCF valuation, comparable analysis, technical indicators, insider activity, and AI-powered news sentiment.
            </p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="flex flex-wrap items-center gap-4 mt-8"
            >
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline gap-2 px-4 py-2.5 rounded-xl"
                  style={{
                    background: 'rgba(0, 212, 170, 0.06)',
                    border: '1px solid rgba(0, 212, 170, 0.12)',
                  }}
                >
                  <span className="text-2xl font-bold font-mono" style={{ color: 'var(--vw-accent)' }}>{s.value}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--vw-text-tertiary)' }}>{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Feature Grid — Grouped by Category ──────────────────────── */}
      {FEATURE_SECTIONS.map((section, sectionIdx) => {
        // Calculate cumulative item index for staggered animation
        const prevItems = FEATURE_SECTIONS.slice(0, sectionIdx).reduce((sum, s) => sum + s.items.length, 0);
        return (
          <div key={section.group} className="space-y-3">
            {/* Section Label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + sectionIdx * 0.12 }}
              className="flex items-center gap-3 pt-1"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--vw-text-tertiary)' }}>
                {section.group}
              </span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, var(--vw-border-lit), transparent)' }} />
            </motion.div>

            {/* Cards */}
            <div className={`grid gap-3 ${
              section.items.length === 4
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : section.items.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-3'
            }`}>
              {section.items.map((f, i) => (
                <motion.button
                  key={f.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.65 + (prevItems + i) * 0.04,
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                  }}
                  onClick={() => onTabChange(f.id)}
                  className="group relative text-left transition-all duration-300"
                  style={{
                    background: 'var(--vw-bg-raised)',
                    borderRadius: '14px',
                    border: '1px solid var(--vw-border)',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = `${f.color}50`;
                    el.style.boxShadow = `0 0 0 1px ${f.color}18, 0 4px 24px -4px ${f.color}25, 0 8px 32px -8px rgba(0, 0, 0, 0.4)`;
                    el.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = 'var(--vw-border)';
                    el.style.boxShadow = 'none';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Color accent top line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 opacity-40 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }}
                  />

                  <div className="p-4 space-y-3">
                    {/* Icon row */}
                    <div className="flex items-center justify-between">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${f.color}18, ${f.color}08)`,
                          boxShadow: `0 0 12px -4px ${f.color}20`,
                        }}
                      >
                        <f.Icon className="w-4 h-4" style={{ color: f.color }} />
                      </div>
                      <ArrowUpRight
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300"
                        style={{ color: f.color }}
                      />
                    </div>

                    {/* Text */}
                    <div>
                      <h3
                        className="text-sm font-semibold mb-1 transition-colors duration-300"
                        style={{ color: 'var(--vw-text-primary)' }}
                      >
                        {f.label}
                      </h3>
                      <p
                        className="text-[11px] leading-relaxed transition-colors duration-300 group-hover:text-slate-300"
                        style={{ color: 'var(--vw-text-tertiary)' }}
                      >
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Supported Tickers Notice ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="relative flex items-start gap-3 rounded-xl px-5 py-4 overflow-hidden"
        style={{
          background: 'rgba(240, 180, 41, 0.03)',
          border: '1px solid rgba(240, 180, 41, 0.1)',
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ background: 'linear-gradient(180deg, var(--vw-amber), rgba(240, 180, 41, 0.3))' }}
        />

        <Shield className="w-4 h-4 mt-0.5 shrink-0 ml-1" style={{ color: 'var(--vw-amber)' }} />
        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--vw-amber)' }}>Supported Tickers</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
            DCF, Quality, and Multiples use Financial Modeling Prep (~87 pre-selected tickers). Peers use Finnhub (US-listed). Market data tabs work with any supported ticker.
          </p>
        </div>
      </motion.div>

      {/* ── Footer tagline ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="flex items-center justify-center gap-3 pt-2 pb-2"
      >
        <div className="w-8 h-px" style={{ background: 'var(--vw-border-dim)' }} />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--vw-text-muted)' }}>
          Built for professional investors
        </span>
        <div className="w-8 h-px" style={{ background: 'var(--vw-border-dim)' }} />
      </motion.div>
    </div>
  );
}
