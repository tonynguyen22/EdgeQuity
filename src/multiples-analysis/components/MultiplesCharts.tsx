import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import type { MultiplesYear, MultipleStats } from '../types';

interface Props {
  years: MultiplesYear[];
  stats: MultipleStats[];
  hiddenSeries: Record<string, boolean>;
  onLegendClick: (d: any, chartKeys: string[]) => void;
}

const EARNINGS_KEYS = ['pe', 'evEbitda', 'evEbit'] as const;
const ASSET_KEYS = ['pb', 'ps', 'evRevenue', 'pfcf'] as const;

const COLORS: Record<string, string> = {
  pe: '#ec4899',
  evEbitda: '#8b5cf6',
  evEbit: '#f59e0b',
  pb: '#3b82f6',
  ps: '#10b981',
  evRevenue: '#06b6d4',
  pfcf: '#f43f5e',
};

const LABELS: Record<string, string> = {
  pe: 'P/E',
  evEbitda: 'EV/EBITDA',
  evEbit: 'EV/EBIT',
  pb: 'P/B',
  ps: 'P/S',
  evRevenue: 'EV/Revenue',
  pfcf: 'P/FCF',
};

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '8px',
};

export default function MultiplesCharts({ years, stats, hiddenSeries, onLegendClick }: Props) {
  const chartData = years.map(y => ({
    year: y.year,
    pe: y.pe,
    evEbitda: y.evEbitda,
    evEbit: y.evEbit,
    pb: y.pb,
    ps: y.ps,
    evRevenue: y.evRevenue,
    pfcf: y.pfcf,
  }));

  if (chartData.length < 2) return null;

  const statsMap = new Map(stats.map(s => [s.key, s]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Earnings Multiples Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}x`} width={42} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(v: number, name: string) => [v !== null ? `${v.toFixed(1)}x` : 'N/A', name]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }}
              onClick={(d: any) => onLegendClick(d, [...EARNINGS_KEYS])}
            />
            {EARNINGS_KEYS.map(key => {
              const avg = statsMap.get(key)?.avg;
              return (
                <React.Fragment key={key}>
                  <Line
                    type="monotone"
                    dataKey={key}
                    name={LABELS[key]}
                    stroke={COLORS[key]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                    hide={!!hiddenSeries[key]}
                  />
                  {avg !== null && avg !== undefined && !hiddenSeries[key] && (
                    <ReferenceLine
                      y={avg}
                      stroke={COLORS[key]}
                      strokeDasharray="4 3"
                      strokeOpacity={0.4}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Asset &amp; Revenue Multiples Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}x`} width={42} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(v: number, name: string) => [v !== null ? `${v.toFixed(1)}x` : 'N/A', name]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }}
              onClick={(d: any) => onLegendClick(d, [...ASSET_KEYS])}
            />
            {ASSET_KEYS.map(key => {
              const avg = statsMap.get(key)?.avg;
              return (
                <React.Fragment key={key}>
                  <Line
                    type="monotone"
                    dataKey={key}
                    name={LABELS[key]}
                    stroke={COLORS[key]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                    hide={!!hiddenSeries[key]}
                  />
                  {avg !== null && avg !== undefined && !hiddenSeries[key] && (
                    <ReferenceLine
                      y={avg}
                      stroke={COLORS[key]}
                      strokeDasharray="4 3"
                      strokeOpacity={0.4}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
