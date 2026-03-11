import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { SentimentData } from '../types';

function SentimentBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${color}`}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color === 'text-emerald-400' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

interface SentimentOverviewProps {
  sent: SentimentData;
  sym: string;
}

export default function SentimentOverview({ sent, sym }: SentimentOverviewProps) {
  const bullish = sent?.sentiment?.bullishPercent ?? null;
  const bearish = sent?.sentiment?.bearishPercent ?? null;
  const buzz = sent?.buzz?.buzz ?? null;
  const compScore = sent?.companyNewsScore ?? null;
  const sectorScore = sent?.sectorAverageNewsScore ?? null;

  if (bullish === null && compScore === null && buzz === null) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(bullish !== null || bearish !== null) && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">News Sentiment</h3>
            {bullish !== null && <SentimentBar value={bullish} label="Bullish" color="text-emerald-400" />}
            {bearish !== null && <SentimentBar value={bearish} label="Bearish" color="text-red-400" />}
            <div className="pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2">
                {(bullish ?? 0) > 0.6
                  ? <><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 text-sm font-medium">Bullish sentiment</span></>
                  : (bullish ?? 0) < 0.4
                    ? <><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-red-400 text-sm font-medium">Bearish sentiment</span></>
                    : <span className="text-slate-400 text-sm">Neutral sentiment</span>
                }
              </div>
              {sent.sectorAverageBullishPercent != null && (
                <p className="text-xs text-slate-500 mt-1">
                  Sector avg bullish: {(sent.sectorAverageBullishPercent * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">News Metrics</h3>
          {compScore !== null && (
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">Company News Score</span>
              <span className={`text-sm font-semibold ${compScore > 0.6 ? 'text-emerald-400' : compScore < 0.4 ? 'text-red-400' : 'text-slate-300'}`}>
                {(compScore * 100).toFixed(0)} / 100
              </span>
            </div>
          )}
          {sectorScore !== null && (
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">Sector Avg Score</span>
              <span className="text-sm font-semibold text-slate-300">{(sectorScore * 100).toFixed(0)} / 100</span>
            </div>
          )}
          {buzz !== null && (
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">Buzz Index</span>
              <span className={`text-sm font-semibold ${buzz > 1.2 ? 'text-amber-400' : 'text-slate-300'}`}>
                {buzz.toFixed(2)}x {buzz > 1.2 ? '(high)' : buzz < 0.8 ? '(low)' : '(normal)'}
              </span>
            </div>
          )}
          {sent?.buzz?.articlesInLastWeek != null && (
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 text-sm">Articles Last Week</span>
              <span className="text-sm font-semibold text-slate-300">{sent.buzz.articlesInLastWeek}</span>
            </div>
          )}
        </div>
      </div>

      {compScore !== null && sectorScore !== null && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Relative Sentiment</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{sym} News Score</span>
                  <span className={`font-semibold ${compScore > sectorScore ? 'text-emerald-400' : compScore < sectorScore ? 'text-red-400' : 'text-slate-300'}`}>
                    {(compScore * 100).toFixed(0)}
                  </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.min(compScore * 100, 100)}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sector Average</span>
                  <span className="font-semibold text-slate-400">{(sectorScore * 100).toFixed(0)}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-slate-500 transition-all" style={{ width: `${Math.min(sectorScore * 100, 100)}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {compScore > sectorScore * 1.05 ? (
                <><TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Above sector average</span>
                <span className="text-slate-500 text-xs">(+{((compScore - sectorScore) * 100).toFixed(0)} pts)</span></>
              ) : compScore < sectorScore * 0.95 ? (
                <><TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">Below sector average</span>
                <span className="text-slate-500 text-xs">({((compScore - sectorScore) * 100).toFixed(0)} pts)</span></>
              ) : (
                <span className="text-slate-400">In line with sector average</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
