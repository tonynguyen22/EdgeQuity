import React from 'react';
import { PieChart, Search } from 'lucide-react';
import { formatPct } from '../utils/formatters';
import type { DCFInputs, DCFResult, ScenarioType } from '../types';

interface AssumptionSlidersProps {
  inputs: DCFInputs;
  dcf: DCFResult;
  activeScenario: ScenarioType;
  onInputChange: (patch: Partial<DCFInputs>) => void;
  onApplyScenario: (s: 'bull' | 'base' | 'bear') => void;
  onNewSearch: () => void;
}

/* ── Extracted & memoised compact slider ─────────────────────────────────── */
const CompactSlider = React.memo(function CompactSlider({ label, value, onChange, min, max, step, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>{label}</label>
        <div className="flex items-center gap-0.5">
          <input
            type="number" step={step} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 rounded px-1.5 py-0.5 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
            style={{ background: 'var(--vw-bg-deep)', border: '1px solid var(--vw-border)', color: 'var(--vw-accent)' }}
          />
          <span className="text-sm font-mono" style={{ color: 'var(--vw-accent)' }}>%</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      {hint && <div className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>{hint}</div>}
    </div>
  );
});

/* ── Extracted & memoised taper bar ──────────────────────────────────────── */
const TaperBar = React.memo(function TaperBar({ start, end, unit = '%' }: { start: number; end: number; unit?: string }) {
  if (start === end) return null;
  const rising = end > start;
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs font-mono w-10 text-right shrink-0" style={{ color: 'var(--vw-accent)' }}>
        {start}{unit}
      </span>
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--vw-border)' }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: rising
              ? 'linear-gradient(90deg, rgba(0, 212, 170, 0.3), rgba(0, 212, 170, 0.7))'
              : 'linear-gradient(90deg, rgba(0, 212, 170, 0.7), rgba(0, 212, 170, 0.3))',
          }}
        />
        {/* Start dot */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: 'var(--vw-accent)', boxShadow: '0 0 6px rgba(0, 212, 170, 0.5)' }} />
        {/* End dot */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: 'var(--vw-accent)', boxShadow: '0 0 6px rgba(0, 212, 170, 0.5)' }} />
      </div>
      <span className="text-xs font-mono w-10 shrink-0" style={{ color: 'var(--vw-accent)' }}>
        {end}{unit}
      </span>
    </div>
  );
});

export default function AssumptionSliders({
  inputs, dcf, activeScenario, onInputChange, onApplyScenario, onNewSearch
}: AssumptionSlidersProps) {
  const {
    revGrowthStart, revGrowthEnd, ebitMarginStart, ebitMarginEnd,
    termGrowth, waccAdj, erp, dnaMarginProj, wcMarginProj,
    capexMarginProj, sharesGrowthProj, forecastYears,
  } = inputs;

  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--vw-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium flex items-center gap-2">
          <PieChart className="w-4 h-4" style={{ color: 'var(--vw-accent)' }} />
          Assumptions
        </h2>
        <button
          onClick={onNewSearch}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors"
          style={{ background: 'var(--vw-bg-hover)', color: 'var(--vw-text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--vw-text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--vw-text-secondary)'}
        >
          <Search className="w-3 h-3" />
          New Search
        </button>
      </div>

      <div className="space-y-4">
        {/* Scenario Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase font-semibold tracking-wide" style={{ color: 'var(--vw-text-tertiary)' }}>Scenario</label>
            {activeScenario === 'custom' && <span className="text-xs italic" style={{ color: 'var(--vw-text-tertiary)' }}>Custom</span>}
          </div>
          <div className="flex gap-1.5">
            {(['bear', 'base', 'bull'] as const).map(s => (
              <button
                key={s}
                onClick={() => onApplyScenario(s)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-lg capitalize transition-colors ${activeScenario === s
                  ? s === 'bull' ? 'bg-emerald-600 text-white' : s === 'bear' ? 'bg-red-600 text-white' : 'bg-slate-500 text-white'
                  : 'bg-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
              >
                {s === 'bull' ? 'Bull' : s === 'bear' ? 'Bear' : 'Base'}
              </button>
            ))}
          </div>
          <div className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>
            {activeScenario === 'bull' ? 'High growth + margin expansion + lower WACC' :
              activeScenario === 'bear' ? 'Low growth + margin compression + higher WACC' :
                activeScenario === 'base' ? 'Historical CAGR defaults' : 'Manually adjusted'}
          </div>
        </div>

        {/* Revenue Growth — Tapered */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--vw-text-secondary)' }}>Revenue Growth Rate</label>
          </div>
          <div className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>
            CAGR 3yr: {formatPct(dcf.revCagr3yr)} | 5yr: {formatPct(dcf.revCagr5yr)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>Yr 1</span>
                <div className="flex items-center gap-0.5">
                  <input
                    type="number" step="0.1" value={revGrowthStart}
                    onChange={(e) => onInputChange({ revGrowthStart: Number(e.target.value) })}
                    className="w-16 rounded px-1.5 py-0.5 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    style={{ background: 'var(--vw-bg-deep)', border: '1px solid var(--vw-border)', color: 'var(--vw-accent)' }}
                  />
                  <span className="text-sm font-mono" style={{ color: 'var(--vw-accent)' }}>%</span>
                </div>
              </div>
              <input type="range" min="-20" max="50" step="0.5" value={revGrowthStart}
                onChange={(e) => onInputChange({ revGrowthStart: Number(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>Yr {forecastYears}</span>
                <div className="flex items-center gap-0.5">
                  <input
                    type="number" step="0.1" value={revGrowthEnd}
                    onChange={(e) => onInputChange({ revGrowthEnd: Number(e.target.value) })}
                    className="w-16 rounded px-1.5 py-0.5 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    style={{ background: 'var(--vw-bg-deep)', border: '1px solid var(--vw-border)', color: 'var(--vw-accent)' }}
                  />
                  <span className="text-sm font-mono" style={{ color: 'var(--vw-accent)' }}>%</span>
                </div>
              </div>
              <input type="range" min="-20" max="50" step="0.5" value={revGrowthEnd}
                onChange={(e) => onInputChange({ revGrowthEnd: Number(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
          <TaperBar start={revGrowthStart} end={revGrowthEnd} />
        </div>

        {/* EBIT Margin — Tapered */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--vw-text-secondary)' }}>EBIT Margin</label>
          </div>
          <div className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>
            Base year: {dcf.baseEbitMargin >= 0 ? '+' : ''}{(dcf.baseEbitMargin * 100).toFixed(1)}%
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>Yr 1</span>
                <div className="flex items-center gap-0.5">
                  <input
                    type="number" step="0.1" value={ebitMarginStart}
                    onChange={(e) => onInputChange({ ebitMarginStart: Number(e.target.value) })}
                    className="w-16 rounded px-1.5 py-0.5 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    style={{ background: 'var(--vw-bg-deep)', border: '1px solid var(--vw-border)', color: 'var(--vw-accent)' }}
                  />
                  <span className="text-sm font-mono" style={{ color: 'var(--vw-accent)' }}>%</span>
                </div>
              </div>
              <input type="range" min="-30" max="60" step="0.5" value={ebitMarginStart}
                onChange={(e) => onInputChange({ ebitMarginStart: Number(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>Yr {forecastYears}</span>
                <div className="flex items-center gap-0.5">
                  <input
                    type="number" step="0.1" value={ebitMarginEnd}
                    onChange={(e) => onInputChange({ ebitMarginEnd: Number(e.target.value) })}
                    className="w-16 rounded px-1.5 py-0.5 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    style={{ background: 'var(--vw-bg-deep)', border: '1px solid var(--vw-border)', color: 'var(--vw-accent)' }}
                  />
                  <span className="text-sm font-mono" style={{ color: 'var(--vw-accent)' }}>%</span>
                </div>
              </div>
              <input type="range" min="-30" max="60" step="0.5" value={ebitMarginEnd}
                onChange={(e) => onInputChange({ ebitMarginEnd: Number(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
          <TaperBar start={ebitMarginStart} end={ebitMarginEnd} />
        </div>

        {/* Separator */}
        <div className="h-px" style={{ background: 'var(--vw-border-dim)' }} />

        {/* Secondary inputs — 2-column grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <CompactSlider
            label="D&A (% Rev)"
            value={dnaMarginProj}
            onChange={v => onInputChange({ dnaMarginProj: v })}
            min={0} max={20} step={0.1}
            hint={`5yr: ${(dcf.avgDnaMargin5yr * 100).toFixed(1)}%`}
          />
          <CompactSlider
            label="NWC (% Rev)"
            value={wcMarginProj}
            onChange={v => onInputChange({ wcMarginProj: v })}
            min={-20} max={40} step={0.1}
            hint={`5yr: ${(dcf.avgNwcMargin5yr * 100).toFixed(1)}%`}
          />
          <CompactSlider
            label="Capex (% Rev)"
            value={capexMarginProj}
            onChange={v => onInputChange({ capexMarginProj: v })}
            min={0} max={20} step={0.1}
            hint={`5yr: ${(dcf.avgCapexMargin5yr * 100).toFixed(1)}%`}
          />
          <CompactSlider
            label="Shares (% YoY)"
            value={sharesGrowthProj}
            onChange={v => onInputChange({ sharesGrowthProj: v })}
            min={-10} max={20} step={0.1}
            hint={`5yr: ${(dcf.sharesCagr5yr * 100).toFixed(1)}%`}
          />
        </div>

        {/* Separator */}
        <div className="h-px" style={{ background: 'var(--vw-border-dim)' }} />

        {/* Terminal Growth + Forecast Period — side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>Terminal Growth</label>
              <span className="text-sm font-mono" style={{ color: 'var(--vw-accent)' }}>{termGrowth}%</span>
            </div>
            <input type="range" min="0" max="5" step="0.5" value={termGrowth}
              onChange={(e) => onInputChange({ termGrowth: Number(e.target.value) })}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>Forecast Period</label>
            <div className="flex gap-1.5">
              {[3, 5, 7, 10].map(y => (
                <button
                  key={y}
                  onClick={() => onInputChange({ forecastYears: y })}
                  className="flex-1 py-1 text-xs rounded-md font-medium transition-colors"
                  style={{
                    background: forecastYears === y ? 'var(--vw-accent)' : 'var(--vw-bg-hover)',
                    color: forecastYears === y ? 'white' : 'var(--vw-text-secondary)',
                  }}
                >
                  {y}yr
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 space-y-1.5" style={{ borderTop: '1px solid var(--vw-border-dim)' }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--vw-text-secondary)' }}>WACC</span>
          <span className="font-mono">{formatPct(dcf.wacc)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--vw-text-secondary)' }}>Beta</span>
          <span className="font-mono">{dcf.beta.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--vw-text-secondary)' }}>Avg Tax Rate</span>
          <span className="font-mono">{formatPct(dcf.avgTaxRate)}</span>
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--vw-text-tertiary)' }}>
          Adjust WACC & CAPM in the dedicated sub-tab
        </div>
      </div>
    </div>
  );
}
