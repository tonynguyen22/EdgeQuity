import React from 'react';
import { TrendingUp, TrendingDown, Shield, DollarSign, Activity } from 'lucide-react';
import { METRIC_THRESHOLDS } from '../calculations';
import type { LetterGrade, GradeResult } from '../types';

const gradeColors = {
  A: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300', bar: 'bg-emerald-500' },
  B: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300', bar: 'bg-blue-500' },
  C: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300', bar: 'bg-amber-500' },
  D: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300', bar: 'bg-red-500' },
};
export { gradeColors };

const gradeLabel = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor' };

const iconMap: Record<string, React.ReactNode> = {
  shield: <Shield className="w-5 h-5 text-emerald-400" />,
  dollar: <DollarSign className="w-5 h-5 text-blue-400" />,
  trend: <TrendingUp className="w-5 h-5 text-amber-400" />,
  activity: <Activity className="w-5 h-5 text-purple-400" />,
};

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  if (trend === 'improving') return <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />;
  if (trend === 'declining') return <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />;
  return <span className="w-3 h-3 flex-shrink-0 text-slate-600 text-xs flex items-center justify-center">&mdash;</span>;
}

interface Props {
  ticker: string;
  companyName: string;
  gradeResult: GradeResult;
}

export default function GradeOverview({ ticker, companyName, gradeResult }: Props) {
  const { rawCategories, overallGrade, overallScore, summary } = gradeResult;
  const c = gradeColors[overallGrade];

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className={`flex-shrink-0 w-28 h-28 rounded-full border-4 ${c.border} ${c.bg} flex items-center justify-center`}>
            <span className={`text-6xl font-bold ${c.text}`}>{overallGrade}</span>
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <h2 className="text-2xl font-bold text-white font-mono">{ticker}</h2>
              {companyName && <span className="text-slate-400">{companyName}</span>}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="text-3xl font-light text-slate-300">
                {overallScore}<span className="text-lg text-slate-500">/100</span>
              </span>
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${c.badge}`}>
                {gradeLabel[overallGrade]}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">{summary}</p>
          </div>
          <div className="flex sm:flex-col gap-2 flex-shrink-0">
            {rawCategories.map(cat => {
              const cc = gradeColors[cat.grade];
              return (
                <div key={cat.name} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 hidden sm:block text-right w-24 truncate">{cat.name.split(' ')[0]}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cc.bg}`}>
                    <span className={`text-sm font-bold ${cc.text}`}>{cat.grade}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6 space-y-1">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${overallScore}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-600 px-0.5">
            <span>D</span><span>C</span><span>B</span><span>A</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rawCategories.map(cat => {
          const cc = gradeColors[cat.grade];
          return (
            <div key={cat.name} className={`bg-slate-800/50 border ${cc.border} rounded-xl p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${cc.bg} flex items-center justify-center`}>{iconMap[cat.iconKey]}</div>
                  <div>
                    <div className="font-semibold text-slate-200">{cat.name}</div>
                    <div className="text-xs text-slate-500">{cat.weight}% weight</div>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full ${cc.bg} border ${cc.border} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${cc.text}`}>{cat.grade}</span>
                </div>
              </div>
              <div className="border-t border-slate-700/50" />
              <div className="space-y-2">
                {cat.metrics.map(metric => {
                  const mc = gradeColors[metric.grade];
                  return (
                    <div key={metric.name} className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <TrendIcon trend={metric.trend} />
                        <span className="text-sm text-slate-400 truncate cursor-help" title={METRIC_THRESHOLDS[metric.name]}>{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-mono text-slate-300">{metric.formattedValue}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded min-w-[28px] text-center ${mc.badge}`}>{metric.grade}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
