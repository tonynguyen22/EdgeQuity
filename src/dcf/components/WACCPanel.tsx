import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info, Shield, TrendingUp, Percent, Building2 } from 'lucide-react';
import type { DCFResult, DCFInputs } from '../types';
import { formatPct } from '../utils/formatters';

/* ── Extracted & memoised slider ─────────────────────────────────────────── */
interface SliderInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  icon?: React.ElementType;
}

const SliderInput = React.memo(function SliderInput({
  label, value, onChange, min, max, step, suffix = '%', icon: Icon,
}: SliderInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
          {label}
        </label>
        <span className="text-xs font-mono text-emerald-400">{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
});

/* ── Panel props & overrides ─────────────────────────────────────────────── */
interface WACCPanelProps {
  dcf: DCFResult;
  inputs: DCFInputs;
  data: any;
  onInputChange: (patch: Partial<DCFInputs>) => void;
}

interface WACCOverrides {
  riskFreeRate: number;
  erp: number;
  beta: number;
  costOfDebt: number;
  taxRate: number;
  equityWeight: number;
  debtWeight: number;
}

export default function WACCPanel({ dcf, inputs, data, onInputChange }: WACCPanelProps) {
  const [overrides, setOverrides] = useState<WACCOverrides>(() => {
    const totalDebt = dcf.totalDebt;
    const marketCap = dcf.marketCap;
    const totalValue = marketCap + totalDebt;
    const interestExpense = dcf.historicalSummary.length > 0
      ? dcf.historicalSummary[dcf.historicalSummary.length - 1].interestExpense
      : 0;
    return {
      riskFreeRate: 4.0,
      erp: inputs.erp,
      beta: dcf.beta,
      costOfDebt: totalDebt > 0 ? (interestExpense / totalDebt) * 100 : 4.0,
      taxRate: dcf.avgTaxRate * 100,
      equityWeight: totalValue > 0 ? (marketCap / totalValue) * 100 : 80,
      debtWeight: totalValue > 0 ? (totalDebt / totalValue) * 100 : 20,
    };
  });

  const computed = useMemo(() => {
    const rf = overrides.riskFreeRate / 100;
    const erp = overrides.erp / 100;
    const beta = overrides.beta;
    const costOfEquity = rf + beta * erp;
    const preTaxCostOfDebt = overrides.costOfDebt / 100;
    const taxRate = overrides.taxRate / 100;
    const afterTaxCostOfDebt = preTaxCostOfDebt * (1 - taxRate);
    const we = overrides.equityWeight / 100;
    const wd = overrides.debtWeight / 100;
    const wacc = we * costOfEquity + wd * afterTaxCostOfDebt;

    return {
      costOfEquity,
      preTaxCostOfDebt,
      afterTaxCostOfDebt,
      wacc,
      rfContribution: we * rf,
      betaErpContribution: we * beta * erp,
      debtContribution: wd * afterTaxCostOfDebt,
    };
  }, [overrides]);

  const waterfallData = useMemo(() => [
    { name: 'Risk-Free Rate', value: computed.rfContribution * 100, color: '#38bdf8' },
    { name: 'Beta x ERP', value: computed.betaErpContribution * 100, color: '#a78bfa' },
    { name: 'After-Tax Debt', value: computed.debtContribution * 100, color: '#fb923c' },
    { name: 'WACC', value: computed.wacc * 100, color: '#00d4aa' },
  ], [computed]);

  const handleChange = useCallback((key: keyof WACCOverrides, value: number) => {
    setOverrides(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'equityWeight') next.debtWeight = Math.max(0, 100 - value);
      if (key === 'debtWeight') next.equityWeight = Math.max(0, 100 - value);
      return next;
    });
  }, []);

  const handleApplyToDCF = useCallback(() => {
    const newWaccAdj = (computed.wacc - dcf.baseWacc) * 100;
    onInputChange({ erp: overrides.erp, waccAdj: Math.round(newWaccAdj * 10) / 10 });
  }, [computed.wacc, dcf.baseWacc, overrides.erp, onInputChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">WACC & CAPM Assumptions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure the Weighted Average Cost of Capital and Capital Asset Pricing Model inputs</p>
        </div>
        <button
          onClick={handleApplyToDCF}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #00d4aa, #00a88a)',
            color: 'white',
            boxShadow: '0 0 16px -4px rgba(0, 212, 170, 0.4)',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.boxShadow = '0 0 28px -4px rgba(0, 212, 170, 0.7)';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.boxShadow = '0 0 16px -4px rgba(0, 212, 170, 0.4)';
          }}
        >
          Apply to DCF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CAPM — Cost of Equity */}
        <div className="vw-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(56, 189, 248, 0.15)' }}>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">CAPM — Cost of Equity</h3>
          </div>

          <SliderInput label="Risk-Free Rate (Rf)" value={overrides.riskFreeRate} onChange={v => handleChange('riskFreeRate', v)}
            min={0} max={10} step={0.1} icon={Shield} />
          <SliderInput label="Equity Risk Premium (ERP)" value={overrides.erp} onChange={v => handleChange('erp', v)}
            min={2} max={12} step={0.1} icon={TrendingUp} />
          <SliderInput label="Beta (β)" value={overrides.beta} onChange={v => handleChange('beta', v)}
            min={0} max={3} step={0.05} suffix="" icon={Percent} />

          <div className="pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Ke = Rf + β × ERP</span>
              <span className="text-sm font-mono font-semibold text-sky-400">
                {(computed.costOfEquity * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {overrides.riskFreeRate.toFixed(1)}% + {overrides.beta.toFixed(2)} × {overrides.erp.toFixed(1)}% = {(computed.costOfEquity * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Cost of Debt */}
        <div className="vw-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251, 146, 60, 0.15)' }}>
              <Building2 className="w-4 h-4 text-orange-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Cost of Debt</h3>
          </div>

          <SliderInput label="Pre-Tax Cost of Debt (Kd)" value={overrides.costOfDebt} onChange={v => handleChange('costOfDebt', v)}
            min={0} max={15} step={0.1} />
          <SliderInput label="Effective Tax Rate" value={overrides.taxRate} onChange={v => handleChange('taxRate', v)}
            min={0} max={50} step={0.5} />

          <div className="pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">After-Tax Kd = Kd × (1 − t)</span>
              <span className="text-sm font-mono font-semibold text-orange-400">
                {(computed.afterTaxCostOfDebt * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {overrides.costOfDebt.toFixed(1)}% × (1 − {overrides.taxRate.toFixed(1)}%) = {(computed.afterTaxCostOfDebt * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Capital Structure */}
        <div className="vw-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167, 139, 250, 0.15)' }}>
              <Percent className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Capital Structure</h3>
          </div>

          <SliderInput label="Equity Weight (We)" value={overrides.equityWeight} onChange={v => handleChange('equityWeight', v)}
            min={0} max={100} step={1} />
          <SliderInput label="Debt Weight (Wd)" value={overrides.debtWeight} onChange={v => handleChange('debtWeight', v)}
            min={0} max={100} step={1} />

          <div className="pt-3 border-t border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Market Cap</span>
              <span className="text-xs font-mono text-slate-300">${(dcf.marketCap / 1e9).toFixed(1)}B</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Debt</span>
              <span className="text-xs font-mono text-slate-300">${(dcf.totalDebt / 1e9).toFixed(1)}B</span>
            </div>
          </div>
        </div>
      </div>

      {/* WACC Result + Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Final WACC */}
        <div className="vw-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Computed WACC</h3>
          <div className="text-center py-4">
            <div className="text-5xl font-light font-mono tracking-tight" style={{ color: 'var(--vw-accent)' }}>
              {(computed.wacc * 100).toFixed(2)}%
            </div>
            <div className="text-xs text-slate-500 mt-2 font-mono">
              We × Ke + Wd × Kd(1-t) = {(overrides.equityWeight).toFixed(0)}% × {(computed.costOfEquity * 100).toFixed(1)}% + {(overrides.debtWeight).toFixed(0)}% × {(computed.afterTaxCostOfDebt * 100).toFixed(1)}%
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">DCF Base WACC</span>
              <span className="font-mono text-slate-400">{(dcf.baseWacc * 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Your WACC Adjustment</span>
              <span className={`font-mono ${computed.wacc > dcf.baseWacc ? 'text-red-400' : computed.wacc < dcf.baseWacc ? 'text-emerald-400' : 'text-slate-400'}`}>
                {computed.wacc >= dcf.baseWacc ? '+' : ''}{((computed.wacc - dcf.baseWacc) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">DCF Current WACC (with adj)</span>
              <span className="font-mono text-white">{formatPct(dcf.wacc)}</span>
            </div>
          </div>
        </div>

        {/* Waterfall Chart */}
        <div className="vw-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4">WACC Decomposition</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(1)}%`} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number) => [`${v.toFixed(2)}%`, 'Contribution']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {waterfallData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-500 leading-relaxed">
            <p><strong className="text-slate-400">WACC</strong> (Weighted Average Cost of Capital) represents the blended cost of financing from both equity and debt.
              <strong className="text-slate-400"> CAPM</strong> (Capital Asset Pricing Model) estimates the expected return on equity: Ke = Rf + Beta x ERP.</p>
            <p className="mt-1">Adjusting these values here will update the DCF model when you click "Apply to DCF". A higher WACC decreases intrinsic value (future cash flows are discounted more heavily).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
