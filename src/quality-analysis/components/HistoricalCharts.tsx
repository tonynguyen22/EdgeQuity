import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import { gradeToScore100 } from '../calculations';
import type { HistoricalYear, YearGrade } from '../types';

interface Props {
  historicalSummary: HistoricalYear[];
  yoyGrades: YearGrade[];
  hiddenSeries: Record<string, boolean>;
  onLegendClick: (d: any, chartKeys: string[]) => void;
}

export default function HistoricalCharts({ historicalSummary, yoyGrades, hiddenSeries, onLegendClick }: Props) {
  const chartData = historicalSummary.map(y => ({
    year: String(y.year).substring(0, 4),
    grossMargin: +(y.grossMargin * 100).toFixed(1),
    ebitdaMargin: +(y.ebitdaMargin * 100).toFixed(1),
    netProfitMargin: +(y.netProfitMargin * 100).toFixed(1),
    currentRatio: +y.currentRatio.toFixed(2),
    quickRatio: +y.quickRatio.toFixed(2),
    debtToEquity: +y.debtToEquity.toFixed(2),
    interestCoverage: +Math.min(y.interestCoverage, 30).toFixed(1),
    roe: +(y.roe * 100).toFixed(1),
    roa: +(y.roa * 100).toFixed(1),
  }));

  const trendData = yoyGrades.map(yg => ({
    year: yg.year,
    Health: gradeToScore100(yg.health),
    Profitability: gradeToScore100(yg.prof),
    Growth: gradeToScore100(yg.growth),
    'Cash Flow': gradeToScore100(yg.cf),
    Overall: yg.score,
  }));

  if (chartData.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Historical Margins</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} width={40} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(v: number, name: string) => [`${v}%`, name]} />
              <Legend wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} onClick={(d: any) => onLegendClick(d, ['grossMargin', 'ebitdaMargin', 'netProfitMargin'])} />
              <Line type="monotone" dataKey="grossMargin" name="Gross" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['grossMargin']} />
              <Line type="monotone" dataKey="ebitdaMargin" name="EBITDA" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['ebitdaMargin']} />
              <Line type="monotone" dataKey="netProfitMargin" name="Net" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['netProfitMargin']} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Financial Health Ratios</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={36} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(v: number, name: string) => [`${v}x`, name]} />
              <Legend wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} onClick={(d: any) => onLegendClick(d, ['currentRatio', 'quickRatio', 'debtToEquity'])} />
              <ReferenceLine y={1} stroke="#64748b" strokeDasharray="4 2" />
              <Bar dataKey="currentRatio" name="Current" fill="#10b981" opacity={0.85} radius={[3, 3, 0, 0]} hide={!!hiddenSeries['currentRatio']} />
              <Bar dataKey="quickRatio" name="Quick" fill="#3b82f6" opacity={0.85} radius={[3, 3, 0, 0]} hide={!!hiddenSeries['quickRatio']} />
              <Bar dataKey="debtToEquity" name="D/E" fill="#f59e0b" opacity={0.85} radius={[3, 3, 0, 0]} hide={!!hiddenSeries['debtToEquity']} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Return on Equity &amp; Assets</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} width={40} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(v: number, name: string) => [`${v}%`, name]} />
              <Legend wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} onClick={(d: any) => onLegendClick(d, ['roe', 'roa'])} />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="roe" name="ROE" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['roe']} />
              <Line type="monotone" dataKey="roa" name="ROA" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['roa']} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {trendData.length >= 2 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Grade Score Trend</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}`} width={36} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(v: number, name: string) => [`${v}/100`, name]} />
              <Legend wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} onClick={(d: any) => onLegendClick(d, ['Health', 'Profitability', 'Growth', 'Cash Flow', 'Overall'])} />
              <Line type="monotone" dataKey="Health" stroke="#10b981" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" hide={!!hiddenSeries['Health']} />
              <Line type="monotone" dataKey="Profitability" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" hide={!!hiddenSeries['Profitability']} />
              <Line type="monotone" dataKey="Growth" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" hide={!!hiddenSeries['Growth']} />
              <Line type="monotone" dataKey="Cash Flow" stroke="#a78bfa" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" hide={!!hiddenSeries['Cash Flow']} />
              <Line type="monotone" dataKey="Overall" stroke="#f1f5f9" strokeWidth={2.5} dot={{ r: 4 }} hide={!!hiddenSeries['Overall']} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
