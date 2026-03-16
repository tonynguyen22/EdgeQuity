import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine, Cell } from 'recharts';
import type { PiotroskiResult, DuPontYear, WorkingCapitalYear, EarningsQualityResult } from '../types';

interface Props {
  piotroski: PiotroskiResult | null;
  dupontData: DuPontYear[];
  workingCapitalData: WorkingCapitalYear[];
  earningsQuality: EarningsQualityResult | null;
  hiddenSeries: Record<string, boolean>;
  onLegendClick: (d: any, chartKeys: string[]) => void;
}

export default function AdvancedMetrics({ piotroski, dupontData, workingCapitalData, earningsQuality, hiddenSeries, onLegendClick }: Props) {
  return (
    <>
      {piotroski && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Piotroski F-Score</h3>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${piotroski.score >= 7 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : piotroski.score >= 4 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {piotroski.score} / 9
              <span className="text-xs font-normal">{piotroski.score >= 7 ? 'Strong' : piotroski.score >= 4 ? 'Mixed' : 'Weak'}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {piotroski.signals.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-700/30 last:border-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{s.passed ? '+' : '-'}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-300 font-medium">{s.name}</span>
                  <span className="text-xs text-slate-500 ml-2">{s.detail}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">7-9: Strong fundamentals, 4-6: Mixed signals, 0-3: Weak fundamentals. Compares latest vs prior fiscal year.</p>
        </div>
      )}

      {dupontData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">DuPont Analysis — ROE Decomposition</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wide border-b border-slate-700/50">
                  <th className="text-left pb-2.5 pr-4">Year</th>
                  <th className="text-right pb-2.5 px-3">Net Margin</th>
                  <th className="text-right pb-2.5 px-3">Asset Turnover</th>
                  <th className="text-right pb-2.5 px-3">Equity Multiplier</th>
                  <th className="text-right pb-2.5 pl-3">ROE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {dupontData.map(d => (
                  <tr key={d.year}>
                    <td className="py-2 pr-4 font-mono text-slate-400 text-xs">{d.year}</td>
                    <td className="py-2 px-3 text-right font-mono text-xs text-slate-300">{(d.netMargin * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right font-mono text-xs text-slate-300">{d.assetTurnover.toFixed(2)}x</td>
                    <td className="py-2 px-3 text-right font-mono text-xs text-slate-300">{d.equityMultiplier.toFixed(2)}x</td>
                    <td className={`py-2 pl-3 text-right font-mono text-xs font-semibold ${d.roe >= 0.12 ? 'text-emerald-400' : d.roe >= 0.05 ? 'text-amber-400' : 'text-red-400'}`}>{(d.roe * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dupontData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#e2e8f0' }} formatter={(v: number, name: string) => [name === 'assetTurnover' || name === 'equityMultiplier' ? `${v.toFixed(2)}x` : `${(v * 100).toFixed(1)}%`, name === 'netMargin' ? 'Net Margin' : name === 'assetTurnover' ? 'Asset Turnover' : name === 'equityMultiplier' ? 'Equity Mult.' : 'ROE']} />
              <Legend onClick={(d: any) => onLegendClick(d, ['netMargin', 'assetTurnover', 'equityMultiplier', 'roe'])} />
              <Line type="monotone" dataKey="netMargin" name="Net Margin" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['netMargin']} />
              <Line type="monotone" dataKey="assetTurnover" name="Asset Turnover" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['assetTurnover']} />
              <Line type="monotone" dataKey="equityMultiplier" name="Equity Mult." stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['equityMultiplier']} />
              <Line type="monotone" dataKey="roe" name="ROE" stroke="#f1f5f9" strokeWidth={2.5} dot={{ r: 4 }} hide={!!hiddenSeries['roe']} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-500 mt-2">ROE = Net Margin x Asset Turnover x Equity Multiplier. Shows which lever drives profitability.</p>
        </div>
      )}

      {workingCapitalData.length > 0 && workingCapitalData.some(w => w.dso != null) && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Working Capital Efficiency</h3>
          {(() => {
            const latest = workingCapitalData[workingCapitalData.length - 1];
            const cards = [
              { label: 'DSO', value: latest.dso, unit: 'days', desc: 'Days to collect receivables' },
              { label: 'DIO', value: latest.dio, unit: 'days', desc: 'Days inventory held' },
              { label: 'DPO', value: latest.dpo, unit: 'days', desc: 'Days to pay suppliers' },
              { label: 'CCC', value: latest.ccc, unit: 'days', desc: 'Cash Conversion Cycle' },
            ];
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {cards.map(c => (
                    <div key={c.label} className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-500 mb-1">{c.label}</div>
                      <div className="text-lg font-bold font-mono text-slate-200">{c.value != null ? `${c.value.toFixed(0)}` : 'N/A'}</div>
                      <div className="text-[10px] text-slate-500">{c.value != null ? c.unit : ''}</div>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={workingCapitalData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#e2e8f0' }} formatter={(v: number) => [`${v.toFixed(1)} days`]} />
                    <Legend onClick={(d: any) => onLegendClick(d, ['dso', 'dio', 'dpo', 'ccc'])} />
                    <Line type="monotone" dataKey="dso" name="DSO" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['dso']} />
                    <Line type="monotone" dataKey="dio" name="DIO" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['dio']} />
                    <Line type="monotone" dataKey="dpo" name="DPO" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['dpo']} />
                    <Line type="monotone" dataKey="ccc" name="CCC" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4 }} hide={!!hiddenSeries['ccc']} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-500 mt-2">CCC = DSO + DIO - DPO. Lower CCC means faster cash conversion. Service companies may show N/A for inventory metrics.</p>
              </>
            );
          })()}
        </div>
      )}

      {earningsQuality && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Earnings Quality</h3>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${earningsQuality.score >= 75 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : earningsQuality.score >= 50 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : earningsQuality.score >= 30 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {earningsQuality.score}/100
              <span className="text-xs font-normal">{earningsQuality.label}</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-3">{earningsQuality.interpretation}</p>
          <div className="text-xs text-slate-500 mb-2">
            Latest accruals ratio: <span className={`font-mono font-semibold ${earningsQuality.latest < -0.03 ? 'text-emerald-400' : earningsQuality.latest < 0.05 ? 'text-amber-400' : 'text-red-400'}`}>{(earningsQuality.latest * 100).toFixed(1)}%</span>
            <span className="text-slate-500 ml-1">(lower is better)</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={earningsQuality.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#e2e8f0' }} formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Accruals Ratio']} />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              <Bar dataKey="accruals" name="Accruals Ratio" fill="#f59e0b" radius={[3, 3, 0, 0]}>
                {earningsQuality.trend.map((entry, idx) => (
                  <Cell key={idx} fill={entry.accruals < -0.03 ? '#10b981' : entry.accruals < 0.05 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-500 mt-2">Accruals ratio = (Net Income - OCF) / Total Assets. Negative values (green) indicate cash-backed earnings.</p>
        </div>
      )}
    </>
  );
}
