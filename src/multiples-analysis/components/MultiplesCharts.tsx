import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import type { MultiplesYear, MultipleStats, QuarterlyTrendPoint } from '../types';

interface Props {
  years: MultiplesYear[];
  stats: MultipleStats[];
  hiddenSeries: Record<string, boolean>;
  onLegendClick: (d: any, chartKeys: string[]) => void;
  quarterlyTrend: QuarterlyTrendPoint[];
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

type ViewMode = 'annual' | 'quarterly';

export default function MultiplesCharts({ years, stats, hiddenSeries, onLegendClick, quarterlyTrend }: Props) {
  const [earningsView, setEarningsView] = useState<ViewMode>('annual');
  const [assetView, setAssetView] = useState<ViewMode>('annual');

  const annualChartData = useMemo(() => years.map(y => ({
    label: y.year,
    pe: y.pe,
    evEbitda: y.evEbitda,
    evEbit: y.evEbit,
    pb: y.pb,
    ps: y.ps,
    evRevenue: y.evRevenue,
    pfcf: y.pfcf,
  })), [years]);

  const quarterlyChartData = useMemo(() => quarterlyTrend.map(q => ({
    label: q.period.substring(0, 7), // YYYY-MM
    pe: q.pe,
    evEbitda: q.evEbitda,
    evEbit: null as number | null, // not available quarterly
    pb: q.pb,
    ps: q.ps,
    evRevenue: q.evRevenue,
    pfcf: q.pfcf,
  })), [quarterlyTrend]);

  const hasQuarterly = quarterlyChartData.length > 2;

  const statsMap = new Map(stats.map(s => [s.key, s]));

  if (annualChartData.length < 2 && quarterlyChartData.length < 2) return null;

  const earningsData = earningsView === 'quarterly' && hasQuarterly ? quarterlyChartData : annualChartData;
  const assetData = assetView === 'quarterly' && hasQuarterly ? quarterlyChartData : annualChartData;

  function ViewToggle({ view, setView }: { view: ViewMode; setView: (v: ViewMode) => void }) {
    if (!hasQuarterly) return null;
    return (
      <div className="flex gap-0.5 bg-slate-700/40 rounded-lg p-0.5">
        <button
          onClick={() => setView('annual')}
          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${view === 'annual' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
        >Annual</button>
        <button
          onClick={() => setView('quarterly')}
          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${view === 'quarterly' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
        >Quarterly</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Earnings Multiples Trend</h3>
          <ViewToggle view={earningsView} setView={setEarningsView} />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={earningsData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
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
                    dot={earningsView === 'annual' ? { r: 3 } : false}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Asset &amp; Revenue Multiples Trend</h3>
          <ViewToggle view={assetView} setView={setAssetView} />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={assetData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
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
                    dot={assetView === 'annual' ? { r: 3 } : false}
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
