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

export default function AssumptionSliders({
  inputs, dcf, activeScenario, onInputChange, onApplyScenario, onNewSearch
}: AssumptionSlidersProps) {
  const {
    revGrowthStart, revGrowthEnd, ebitMarginStart, ebitMarginEnd,
    termGrowth, waccAdj, erp, dnaMarginProj, wcMarginProj,
    capexMarginProj, sharesGrowthProj, forecastYears,
  } = inputs;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-500" />
          Assumptions
        </h2>
        <button
          onClick={onNewSearch}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Search className="w-3 h-3" />
          New Search
        </button>
      </div>

      <div className="space-y-6">
        {/* Scenario Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Scenario</label>
            {activeScenario === 'custom' && <span className="text-xs text-slate-600 italic">Custom</span>}
          </div>
          <div className="flex gap-2">
            {(['bear', 'base', 'bull'] as const).map(s => (
              <button
                key={s}
                onClick={() => onApplyScenario(s)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${activeScenario === s
                  ? s === 'bull' ? 'bg-emerald-600 text-white' : s === 'bear' ? 'bg-red-600 text-white' : 'bg-slate-500 text-white'
                  : 'bg-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
              >
                {s === 'bull' ? 'Bull' : s === 'bear' ? 'Bear' : 'Base'}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-600">
            {activeScenario === 'bull' ? 'High growth + margin expansion + lower WACC' :
              activeScenario === 'bear' ? 'Low growth + margin compression + higher WACC' :
                activeScenario === 'base' ? 'Historical CAGR defaults' : 'Manually adjusted'}
          </div>
        </div>

        {/* Revenue Growth — Tapered */}
        <div className="space-y-3">
          <label className="text-sm text-slate-400">Revenue Growth Rate</label>
          <div className="text-xs text-slate-500">
            CAGR 3yr: {formatPct(dcf.revCagr3yr)} | CAGR 5yr: {formatPct(dcf.revCagr5yr)}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Yr 1 (Start)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number" step="0.1" value={revGrowthStart}
                  onChange={(e) => onInputChange({ revGrowthStart: Number(e.target.value) })}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs font-mono text-emerald-400">%</span>
              </div>
            </div>
            <input type="range" min="-20" max="50" step="0.5" value={revGrowthStart}
              onChange={(e) => onInputChange({ revGrowthStart: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Yr {forecastYears} (End)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number" step="0.1" value={revGrowthEnd}
                  onChange={(e) => onInputChange({ revGrowthEnd: Number(e.target.value) })}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs font-mono text-emerald-400">%</span>
              </div>
            </div>
            <input type="range" min="-20" max="50" step="0.5" value={revGrowthEnd}
              onChange={(e) => onInputChange({ revGrowthEnd: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          {revGrowthStart !== revGrowthEnd && (
            <div className="text-xs text-slate-600 italic">
              Linear taper: {revGrowthStart}% → {revGrowthEnd}%
            </div>
          )}
        </div>

        {/* EBIT Margin — Tapered */}
        <div className="space-y-3">
          <label className="text-sm text-slate-400">EBIT Margin</label>
          <div className="text-xs text-slate-500">
            Base year: {dcf.baseEbitMargin >= 0 ? '+' : ''}{(dcf.baseEbitMargin * 100).toFixed(1)}%
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Yr 1 (Start)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number" step="0.1" value={ebitMarginStart}
                  onChange={(e) => onInputChange({ ebitMarginStart: Number(e.target.value) })}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs font-mono text-emerald-400">%</span>
              </div>
            </div>
            <input type="range" min="-30" max="60" step="0.5" value={ebitMarginStart}
              onChange={(e) => onInputChange({ ebitMarginStart: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Yr {forecastYears} (End)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number" step="0.1" value={ebitMarginEnd}
                  onChange={(e) => onInputChange({ ebitMarginEnd: Number(e.target.value) })}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs font-mono text-emerald-400">%</span>
              </div>
            </div>
            <input type="range" min="-30" max="60" step="0.5" value={ebitMarginEnd}
              onChange={(e) => onInputChange({ ebitMarginEnd: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          {ebitMarginStart !== ebitMarginEnd && (
            <div className="text-xs text-slate-600 italic">
              Linear taper: {ebitMarginStart}% → {ebitMarginEnd}%
            </div>
          )}
        </div>

        {/* D&A */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-400">D&A Margin (% of Rev)</label>
            <div className="flex items-center gap-1">
              <input type="number" step="0.1" value={dnaMarginProj}
                onChange={(e) => onInputChange({ dnaMarginProj: Number(e.target.value) })}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-xs font-mono text-emerald-400">%</span>
            </div>
          </div>
          <input type="range" min="0" max="20" step="0.1" value={dnaMarginProj}
            onChange={(e) => onInputChange({ dnaMarginProj: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="text-[10px] text-slate-600">
            Avg 5yr: {(dcf.avgDnaMargin5yr * 100).toFixed(1)}% | Avg 3yr: {(dcf.avgDnaMargin3yr * 100).toFixed(1)}%
          </div>
        </div>

        {/* NWC */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-400">NWC Margin (% of Rev)</label>
            <div className="flex items-center gap-1">
              <input type="number" step="0.1" value={wcMarginProj}
                onChange={(e) => onInputChange({ wcMarginProj: Number(e.target.value) })}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-xs font-mono text-emerald-400">%</span>
            </div>
          </div>
          <input type="range" min="-20" max="40" step="0.1" value={wcMarginProj}
            onChange={(e) => onInputChange({ wcMarginProj: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="text-[10px] text-slate-600">
            Avg 5yr: {(dcf.avgNwcMargin5yr * 100).toFixed(1)}% | Avg 3yr: {(dcf.avgNwcMargin3yr * 100).toFixed(1)}%
          </div>
        </div>

        {/* Capex */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-400">Capex Margin (% of Rev)</label>
            <div className="flex items-center gap-1">
              <input type="number" step="0.1" value={capexMarginProj}
                onChange={(e) => onInputChange({ capexMarginProj: Number(e.target.value) })}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-xs font-mono text-emerald-400">%</span>
            </div>
          </div>
          <input type="range" min="0" max="20" step="0.1" value={capexMarginProj}
            onChange={(e) => onInputChange({ capexMarginProj: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="text-[10px] text-slate-600">
            Avg 5yr: {(dcf.avgCapexMargin5yr * 100).toFixed(1)}% | Avg 3yr: {(dcf.avgCapexMargin3yr * 100).toFixed(1)}%
          </div>
        </div>

        {/* Shares Growth */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-400">Shares Growth (% YoY)</label>
            <div className="flex items-center gap-1">
              <input type="number" step="0.1" value={sharesGrowthProj}
                onChange={(e) => onInputChange({ sharesGrowthProj: Number(e.target.value) })}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-xs font-mono text-emerald-400">%</span>
            </div>
          </div>
          <input type="range" min="-10" max="20" step="0.1" value={sharesGrowthProj}
            onChange={(e) => onInputChange({ sharesGrowthProj: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="text-[10px] text-slate-600">
            5yr CAGR: {(dcf.sharesCagr5yr * 100).toFixed(1)}% | 3yr CAGR: {(dcf.sharesCagr3yr * 100).toFixed(1)}%
          </div>
        </div>

        {/* Terminal Growth */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-400">Terminal Growth Rate</label>
            <span className="text-sm font-mono text-emerald-400">{termGrowth}%</span>
          </div>
          <input type="range" min="0" max="5" step="0.5" value={termGrowth}
            onChange={(e) => onInputChange({ termGrowth: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* WACC Adjustment */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-400">WACC Adjustment</label>
            <span className="text-sm font-mono text-emerald-400">{waccAdj > 0 ? '+' : ''}{waccAdj}%</span>
          </div>
          <input type="range" min="-5" max="5" step="0.5" value={waccAdj}
            onChange={(e) => onInputChange({ waccAdj: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* ERP */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-400">Equity Risk Premium</label>
            <span className="text-sm font-mono text-emerald-400">{erp}%</span>
          </div>
          <input type="range" min="2" max="10" step="0.5" value={erp}
            onChange={(e) => onInputChange({ erp: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Forecast Period */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-400">Forecast Period</label>
            <div className="flex gap-2">
              {[3, 5, 7, 10].map(y => (
                <button
                  key={y}
                  onClick={() => onInputChange({ forecastYears: y })}
                  className={`px-2.5 py-1 text-xs rounded-md ${forecastYears === y ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  {y}yr
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700/50 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Calculated WACC</span>
          <span className="font-mono">{formatPct(dcf.wacc)}</span>
        </div>
        {dcf.rawWacc < 0.06 && (
          <div className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            ⚠ Raw WACC: {formatPct(dcf.rawWacc)} → floored to 6.0% (debt-heavy capital structure)
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Beta</span>
          <span className="font-mono">{dcf.beta.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Avg Tax Rate</span>
          <span className="font-mono">{formatPct(dcf.avgTaxRate)}</span>
        </div>
      </div>
    </div>
  );
}
