import React from 'react';
import { DollarSign, AlertCircle, Info } from 'lucide-react';
import type { DDMInputs } from '../types';

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

interface DDMAssumptionsProps {
  ticker: string;
  data: {
    companyName: string;
    industry: string;
    dividendsPerShareAnnual: number;
    currentPrice: number;
    beta: number;
  };
  inputs: DDMInputs;
  onInputChange: (patch: Partial<DDMInputs>) => void;
  onGoBack: () => void;
  onProceed: () => void;
}

export default function DDMAssumptions({
  ticker, data, inputs, onInputChange, onGoBack, onProceed,
}: DDMAssumptionsProps) {
  return (
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
              onChange={e => onInputChange({ currentDividend: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <SliderInput label="Terminal Growth Rate" value={inputs.terminalGrowth} onChange={v => onInputChange({ terminalGrowth: v })}
            min={0} max={8} step={0.25} />
          <SliderInput label="Cost of Equity (CAPM)" value={inputs.costOfEquity} onChange={v => onInputChange({ costOfEquity: v })}
            min={4} max={20} step={0.25} />

          {inputs.modelType !== 'gordon' && (
            <>
              <SliderInput label="Short-Term Growth Rate" value={inputs.shortTermGrowth} onChange={v => onInputChange({ shortTermGrowth: v })}
                min={0} max={30} step={0.5} />
              <SliderInput label="High Growth Period (years)" value={inputs.highGrowthYears} onChange={v => onInputChange({ highGrowthYears: v })}
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
                onClick={() => onInputChange({ modelType: m.id })}
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
          onClick={onGoBack}
          className="px-6 py-3 rounded-xl text-sm font-medium border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
        >
          Back
        </button>
        <button
          onClick={onProceed}
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
  );
}
