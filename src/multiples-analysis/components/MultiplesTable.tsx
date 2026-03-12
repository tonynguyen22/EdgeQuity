import React from 'react';
import type { MultiplesYear, MultipleStats, MultipleKey, CurrentMetrics } from '../types';
import { MULTIPLE_KEYS, MULTIPLE_LABELS } from '../types';
import { formatMultiple } from '../calculations';

interface Props {
  years: MultiplesYear[];
  stats: MultipleStats[];
  currentMetrics: CurrentMetrics;
}

/** Map from MultipleKey → corresponding TTM metric key in CurrentMetrics */
const TTM_MAP: Record<string, keyof CurrentMetrics> = {
  pe: 'peTTM',
  evEbitda: 'evEbitdaTTM',
  evRevenue: 'evRevenueTTM',
  pb: 'pbQuarterly',
  ps: 'psTTM',
  pfcf: 'pfcfShareTTM',
};

function cellColor(value: number | null, avg: number | null): string {
  if (value === null || avg === null) return '';
  const pct = ((value - avg) / avg) * 100;
  if (pct < -15) return 'text-emerald-400 bg-emerald-500/10';
  if (pct < -5) return 'text-emerald-300';
  if (pct > 15) return 'text-red-400 bg-red-500/10';
  if (pct > 5) return 'text-red-300';
  return '';
}

export default function MultiplesTable({ years, stats, currentMetrics }: Props) {
  const statsMap = new Map(stats.map(s => [s.key, s]));

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300">Historical Multiples</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase w-28">Multiple</th>
              {years.map(y => (
                <th key={y.year} className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400 tabular-nums">{y.year}</th>
              ))}
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-pink-400">TTM</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-pink-400">Avg</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400">Median</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400">High</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400">Low</th>
            </tr>
          </thead>
          <tbody>
            {MULTIPLE_KEYS.map((key: MultipleKey) => {
              const s = statsMap.get(key);
              const ttmKey = TTM_MAP[key];
              const ttmVal = ttmKey ? currentMetrics[ttmKey] : null;
              return (
                <tr key={key} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-semibold text-slate-300">{MULTIPLE_LABELS[key]}</td>
                  {years.map(y => (
                    <td key={y.year} className={`text-right px-3 py-2.5 tabular-nums ${cellColor(y[key], s?.avg ?? null)}`}>
                      {formatMultiple(y[key])}
                    </td>
                  ))}
                  <td className={`text-right px-3 py-2.5 tabular-nums font-medium ${ttmVal !== null ? cellColor(ttmVal, s?.avg ?? null) || 'text-pink-300' : 'text-slate-500'}`}>
                    {ttmVal !== null ? `${ttmVal.toFixed(1)}x` : '-'}
                  </td>
                  <td className="text-right px-3 py-2.5 tabular-nums font-medium text-pink-300">{formatMultiple(s?.avg ?? null)}</td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-slate-300">{formatMultiple(s?.median ?? null)}</td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-red-300">{formatMultiple(s?.high ?? null)}</td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-emerald-300">{formatMultiple(s?.low ?? null)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
