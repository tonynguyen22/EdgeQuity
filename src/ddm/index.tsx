import React, { useState, useMemo, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, Info, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { computeDDM, computeDDMSensitivity } from './calculations';
import { useDDMData } from './hooks/useDDMData';
import { SUPPORTED_TICKERS } from '../dcf/types';
import type { DDMInputs, DDMResult } from './types';
import SupportedTickersBySector from '../components/SupportedTickersBySector';

/* ── Extracted & memoised slider ─────────────────────────────────────────── */
const SliderInput = React.memo(function SliderInput({ label, value, onChange, min, max, step, suffix = '%' }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className="text-xs font-mono text-slate-300">{value.toFixed(step < 1 ? 2 : 1)}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
      />
    </div>
  );
});

export default function DDM() {
  const [tickerInput, setTickerInput] = useState('');
  const [ticker, setTicker] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [inputs, setInputs] = useState<DDMInputs>({
    currentDividend: 0,
    shortTermGrowth: 8,
    terminalGrowth: 3,
    costOfEquity: 10,
    highGrowthYears: 5,
    modelType: 'gordon',
  });

  const { data, loading, error, fetchData, reset } = useDDMData();

  const filteredTickers = useMemo(() => {
    const q = tickerInput.trim().toUpperCase();
    if (!q) return [...SUPPORTED_TICKERS];
    return SUPPORTED_TICKERS.filter(t => t.includes(q));
  }, [tickerInput]);

  // Auto-fill dividend when data loads
  React.useEffect(() => {
    if (data && data.dividendsPerShareAnnual > 0) {
      setInputs(prev => ({
        ...prev,
        currentDividend: Math.round(data.dividendsPerShareAnnual * 100) / 100,
        costOfEquity: Math.round((0.04 + data.beta * 0.055) * 10000) / 100,
      }));
    }
  }, [data]);

  const result = useMemo((): DDMResult | null => {
    if (!showResults || !data || inputs.currentDividend <= 0) return null;
    try {
      return computeDDM(inputs, data.currentPrice);
    } catch {
      return null;
    }
  }, [showResults, data, inputs]);

  const sensitivity = useMemo(() => {
    if (!result || !data) return null;
    const gSteps = [-0.01, -0.005, 0, 0.005, 0.01].map(d => inputs.terminalGrowth / 100 + d);
    const coeSteps = [-0.02, -0.01, 0, 0.01, 0.02].map(d => inputs.costOfEquity / 100 + d);
    return { matrix: computeDDMSensitivity(inputs, data.currentPrice, gSteps, coeSteps), gSteps, coeSteps };
  }, [result, data, inputs]);

  const [showLoading, setShowLoading] = useState(false);

  /** Dropdown click only populates input — does NOT trigger fetch */
  const handleDropdownPick = (sym: string) => {
    setTickerInput(sym);
    setShowDropdown(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = tickerInput.trim().toUpperCase();
    if (sym && (SUPPORTED_TICKERS as readonly string[]).includes(sym)) {
      setTickerInput(sym);
      setTicker(sym);
      setShowDropdown(false);
      setShowResults(false);
      setShowLoading(true);
      fetchData(sym);
      setTimeout(() => setShowLoading(false), 2500);
    }
  };

  const handleProceed = () => {
    setShowResults(true);
  };

  const handleGoBack = () => {
    reset();
    setTicker('');
    setTickerInput('');
    setShowResults(false);
  };

  const isValid = tickerInput.trim() && (SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase());
  const isLoading = loading || showLoading;

  return (
    <div className="space-y-6">

      {/* Hero title + search — shown when no ticker selected */}
      {!ticker && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
              Dividend Discount <span style={{ color: 'var(--vw-accent)' }}>Model</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
              Value stocks based on projected future dividend payments
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--vw-text-tertiary)' }} />
            <input
              type="text"
              value={tickerInput}
              onChange={e => { setTickerInput(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search supported tickers (e.g. KO, JNJ, PEP)"
              className="w-full rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none uppercase transition-all"
              style={{
                background: 'var(--vw-bg-raised)',
                border: '1px solid var(--vw-border-lit)',
                color: 'var(--vw-text-primary)',
                boxShadow: '0 0 30px -6px rgba(0, 212, 170, 0.15), 0 8px 24px -8px rgba(0,0,0,0.5)',
              }}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!isValid}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all z-10"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #00a88a)' }}
            >
              Analyze
            </button>

            {showDropdown && (
              <div className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-2xl max-h-48 overflow-y-auto"
                style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)' }}
              >
                {filteredTickers.length > 0 ? (
                  filteredTickers.slice(0, 20).map(t => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={() => handleDropdownPick(t)}
                      className="w-full text-left px-4 py-2.5 text-sm font-mono transition-colors first:rounded-t-xl last:rounded-b-xl"
                      style={{ color: 'var(--vw-text-primary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--vw-bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>
                    No matching ticker. Only {SUPPORTED_TICKERS.length} pre-selected stocks are supported.
                  </div>
                )}
              </div>
            )}
          </form>
          <div className="w-full max-w-2xl mt-8 rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
            <ul className="space-y-2.5">
              {[
                'Values a stock based on the dividends it pays out to shareholders',
                'Best suited for stable, mature companies with consistent dividend histories',
                'Offers three models: simple growth, gradual slowdown, and multi-stage forecasting',
                'Shows a sensitivity table so you can see how small changes in assumptions affect the result',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: 'rgba(0,212,170,0.12)', color: 'var(--vw-accent)' }}>
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <SupportedTickersBySector className="mt-4" />
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Analyzing dividend data…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-500 font-medium">Error loading data</h3>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Assumption Form (before Proceed) */}
      {data && !showResults && !isLoading && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-white">{ticker}</h2>
            <span className="text-sm text-slate-400">{data.companyName}</span>
            {data.industry && <span className="text-xs text-slate-500">{data.industry}</span>}
          </div>

          {data.dividendsPerShareAnnual <= 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">This stock does not appear to pay dividends. You can still enter a hypothetical dividend amount below to explore valuations.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="vw-card rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                DDM Assumptions
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Current Annual Dividend ($/share)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.currentDividend}
                  onChange={e => setInputs(prev => ({ ...prev, currentDividend: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <SliderInput label="Terminal Growth Rate" value={inputs.terminalGrowth} onChange={v => setInputs(p => ({ ...p, terminalGrowth: v }))}
                min={0} max={8} step={0.25} />
              <SliderInput label="Cost of Equity (CAPM)" value={inputs.costOfEquity} onChange={v => setInputs(p => ({ ...p, costOfEquity: v }))}
                min={4} max={20} step={0.25} />

              {inputs.modelType !== 'gordon' && (
                <>
                  <SliderInput label="Short-Term Growth Rate" value={inputs.shortTermGrowth} onChange={v => setInputs(p => ({ ...p, shortTermGrowth: v }))}
                    min={0} max={30} step={0.5} />
                  <SliderInput label="High Growth Period (years)" value={inputs.highGrowthYears} onChange={v => setInputs(p => ({ ...p, highGrowthYears: v }))}
                    min={1} max={15} step={1} suffix=" yrs" />
                </>
              )}
            </div>

            {/* Model Selection */}
            <div className="vw-card rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Model Type</h3>
              <div className="space-y-2">
                {([
                  {
                    id: 'gordon' as const,
                    label: 'Gordon Growth (Single-Stage)',
                    desc: 'P = D₁ / (Ke − g). Assumes constant dividend growth forever.',
                    tooltip: {
                      how: 'Assumes a company\'s dividend grows at a single, steady rate forever. You take next year\'s expected dividend and divide by the difference between your required return and the growth rate.',
                      example: 'If a stock pays $2.00/share and dividends grow 3% per year, and you require a 10% return: Value = $2.06 / (10% − 3%) = $29.43.',
                      bestFor: 'Mature, stable dividend payers with consistent histories — utilities (Duke Energy), consumer staples (Coca-Cola, Procter & Gamble), telecoms.',
                    },
                  },
                  {
                    id: 'hmodel' as const,
                    label: 'H-Model (2-Stage)',
                    desc: 'Growth declines linearly from short-term to terminal rate.',
                    tooltip: {
                      how: 'Assumes dividends are currently growing fast but that growth gradually slows down in a straight line until it reaches a stable long-term rate. It smooths the transition instead of an abrupt shift.',
                      example: 'A company growing dividends at 12%/yr that will taper to 3% over 10 years. The H-Model blends both phases into one formula for a smoother, more realistic estimate.',
                      bestFor: 'Companies transitioning from growth to maturity — established tech firms starting dividends (Apple, Microsoft), maturing industrials, healthcare giants (Johnson & Johnson).',
                    },
                  },
                  {
                    id: 'multistage' as const,
                    label: 'Multi-Stage DDM',
                    desc: 'Explicit high-growth period then terminal perpetuity.',
                    tooltip: {
                      how: 'Models each year of a high-growth period individually, projecting exact dividend amounts. After that period ends, it assumes dividends grow at a stable rate forever (terminal value). Most flexible and detailed approach.',
                      example: 'A company paying $1.50/share growing dividends 15%/yr for 5 years, then 3% forever. Each of the 5 high-growth dividends is calculated and discounted, plus the terminal value.',
                      bestFor: 'Companies with clearly distinct growth phases — newer dividend payers (Visa, Home Depot), cyclical firms recovering, companies with announced dividend growth plans.',
                    },
                  },
                ]).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setInputs(p => ({ ...p, modelType: m.id }))}
                    className="w-full text-left p-3 rounded-lg border transition-all relative"
                    style={{
                      background: inputs.modelType === m.id ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                      borderColor: inputs.modelType === m.id ? 'rgba(245, 158, 11, 0.4)' : 'var(--vw-border-dim)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-medium" style={{ color: inputs.modelType === m.id ? '#f59e0b' : 'var(--vw-text-primary)' }}>
                        {m.label}
                      </div>
                      <span
                        className="relative shrink-0 group/info"
                        onClick={e => e.stopPropagation()}
                      >
                        <Info className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400 cursor-help transition-colors" />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 rounded-xl bg-slate-800 border border-slate-600/60 shadow-2xl text-left z-[100] opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 pointer-events-none"
                          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                        >
                          <div className="text-[11px] leading-relaxed space-y-2">
                            <div>
                              <span className="font-semibold text-amber-400">How it works:</span>
                              <span className="text-slate-300 ml-1">{m.tooltip.how}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-emerald-400">Example:</span>
                              <span className="text-slate-300 ml-1">{m.tooltip.example}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-400">Best for:</span>
                              <span className="text-slate-300 ml-1">{m.tooltip.bestFor}</span>
                            </div>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-600/60 rotate-45 -mt-1" />
                        </div>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="pt-3 border-t border-slate-700/50 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Current Price</span>
                  <span className="font-mono text-slate-300">${data.currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Annual Dividend</span>
                  <span className="font-mono text-slate-300">${data.dividendsPerShareAnnual.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Dividend Yield</span>
                  <span className="font-mono text-slate-300">{data.currentPrice > 0 ? ((data.dividendsPerShareAnnual / data.currentPrice) * 100).toFixed(2) : '0.00'}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Beta</span>
                  <span className="font-mono text-slate-300">{data.beta.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Proceed Button */}
          <div className="flex justify-center gap-3">
            <button
              onClick={handleGoBack}
              className="px-6 py-3 rounded-xl text-sm font-medium border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleProceed}
              disabled={inputs.currentDividend <= 0}
              className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #00d4aa, #00a88a)',
                boxShadow: '0 0 24px -4px rgba(0, 212, 170, 0.4)',
              }}
            >
              Analyze DDM
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && data && showResults && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold text-white">{ticker}</h2>
              <span className="text-sm text-slate-400">{data.companyName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                {result.modelLabel}
              </span>
            </div>
            <button onClick={handleGoBack} className="text-sm text-slate-500 hover:text-white transition-colors">
              New Search
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="text-sm text-slate-400 mb-1">Intrinsic Value</div>
              <div className="text-3xl font-light tracking-tight">${result.intrinsicValue.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="text-sm text-slate-400 mb-1">Current Price</div>
              <div className="text-3xl font-light tracking-tight">${result.currentPrice.toFixed(2)}</div>
            </div>
            <div className={`bg-slate-800/50 border rounded-xl p-5 ${result.upside >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
              <div className="text-sm text-slate-400 mb-1">Upside / Downside</div>
              <div className={`text-3xl font-light tracking-tight flex items-center gap-2 ${result.upside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.upside >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                {(result.upside * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="text-sm text-slate-400 mb-1">Implied Yield</div>
              <div className="text-3xl font-light tracking-tight">{(result.impliedYield * 100).toFixed(2)}%</div>
            </div>
          </div>

          {/* Valuation Bridge */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="vw-card rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Valuation Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">PV of Dividends</span>
                  <span className="text-sm font-mono text-white">${result.pvDividends.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">PV of Terminal Value</span>
                  <span className="text-sm font-mono text-white">${result.pvTerminalValue.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-700/50 pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Intrinsic Value</span>
                  <span className="text-sm font-mono font-semibold" style={{ color: '#f59e0b' }}>${result.intrinsicValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Dividend Stream */}
            {result.dividendStream.length > 0 && (
              <div className="vw-card rounded-xl p-5">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Projected Dividends</h3>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="pb-2 text-left">Period</th>
                        <th className="pb-2 text-right">Dividend</th>
                        <th className="pb-2 text-right">PV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.dividendStream.map((d, i) => (
                        <tr key={i} className="border-t border-slate-700/20">
                          <td className="py-1.5 text-slate-400">{d.year}</td>
                          <td className="py-1.5 text-right font-mono text-slate-300">${d.dividend.toFixed(2)}</td>
                          <td className="py-1.5 text-right font-mono text-slate-500">${d.pv.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sensitivity Table */}
          {sensitivity && (
            <div className="vw-card rounded-xl p-6 overflow-x-auto">
              <h3 className="text-sm font-medium text-slate-300 mb-1">Sensitivity Analysis</h3>
              <p className="text-xs text-slate-500 mb-4">Implied value — rows: terminal growth, columns: cost of equity</p>
              <table className="w-full text-sm font-mono text-center">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-slate-500 pb-3 pr-4">g \ Ke</th>
                    {sensitivity.coeSteps.map(coe => (
                      <th key={coe} className={`pb-3 px-3 text-xs font-medium ${Math.abs(coe - inputs.costOfEquity / 100) < 0.0001 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {(coe * 100).toFixed(1)}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivity.matrix.map((row, ri) => {
                    const g = sensitivity.gSteps[ri];
                    const isCurrentG = Math.abs(g - inputs.terminalGrowth / 100) < 0.0001;
                    return (
                      <tr key={ri} className="border-t border-slate-700/30">
                        <td className={`text-left py-2.5 pr-4 text-xs ${isCurrentG ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
                          {(g * 100).toFixed(1)}%
                        </td>
                        {row.map((iv, ci) => {
                          const coe = sensitivity.coeSteps[ci];
                          const isCurrentCell = isCurrentG && Math.abs(coe - inputs.costOfEquity / 100) < 0.0001;
                          const pct = iv !== null && data.currentPrice > 0 ? (iv - data.currentPrice) / data.currentPrice : null;
                          const bg = iv === null ? '' : pct !== null && pct >= 0.10 ? 'bg-emerald-500/25' : pct !== null && pct >= 0 ? 'bg-emerald-500/10' : pct !== null && pct >= -0.10 ? 'bg-red-500/10' : 'bg-red-500/25';
                          const textColor = iv === null ? 'text-slate-500' : pct !== null && pct >= 0 ? 'text-emerald-400' : 'text-red-400';
                          return (
                            <td key={ci} className={`py-2.5 px-3 rounded ${bg} ${textColor} ${isCurrentCell ? 'ring-2 ring-amber-500' : ''}`}>
                              {iv === null ? '—' : `$${iv.toFixed(0)}`}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Assumptions Summary */}
          <div className="vw-card rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Model Assumptions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Annual Dividend</span>
                <div className="font-mono text-slate-300 mt-0.5">${inputs.currentDividend.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-slate-500">Terminal Growth</span>
                <div className="font-mono text-slate-300 mt-0.5">{inputs.terminalGrowth.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-slate-500">Cost of Equity</span>
                <div className="font-mono text-slate-300 mt-0.5">{inputs.costOfEquity.toFixed(1)}%</div>
              </div>
              {inputs.modelType !== 'gordon' && (
                <>
                  <div>
                    <span className="text-slate-500">High Growth Rate</span>
                    <div className="font-mono text-slate-300 mt-0.5">{inputs.shortTermGrowth.toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-slate-500">High Growth Period</span>
                    <div className="font-mono text-slate-300 mt-0.5">{inputs.highGrowthYears} years</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Adjust Assumptions */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowResults(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all"
            >
              Adjust Assumptions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
