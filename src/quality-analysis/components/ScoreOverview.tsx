import React from 'react';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { scoreTo100 } from '../calculations';
import { gradeColors } from './GradeOverview';
import type { LetterGrade, GradeResult, YearGrade, AltmanZResult } from '../types';

interface Props {
  ticker: string;
  gradeResult: GradeResult;
  yoyGrades: YearGrade[];
  altmanZ: AltmanZResult | null;
}

export default function ScoreOverview({ ticker, gradeResult, yoyGrades, altmanZ }: Props) {
  const radarData = [
    { subject: 'Health', score: scoreTo100(gradeResult.rawCategories[0].score), fullMark: 100 },
    { subject: 'Profit', score: scoreTo100(gradeResult.rawCategories[1].score), fullMark: 100 },
    { subject: 'Growth', score: scoreTo100(gradeResult.rawCategories[2].score), fullMark: 100 },
    { subject: 'Cash Flow', score: scoreTo100(gradeResult.rawCategories[3].score), fullMark: 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Category Profile</h3>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Max" dataKey="fullMark" stroke="#334155" fill="none" strokeDasharray="3 2" />
            <Radar name={ticker} dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} formatter={(v: number) => [`${v}/100`]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {yoyGrades.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Year-over-Year Grade History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wide border-b border-slate-700/50">
                  <th className="text-left pb-2.5 pr-4">Year</th>
                  <th className="text-center pb-2.5 px-2">Health</th>
                  <th className="text-center pb-2.5 px-2">Profit</th>
                  <th className="text-center pb-2.5 px-2">Growth</th>
                  <th className="text-center pb-2.5 px-2">Cash</th>
                  <th className="text-center pb-2.5 pl-2">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {yoyGrades.map(yg => (
                  <tr key={yg.year}>
                    <td className="py-2.5 pr-4 font-mono text-slate-400 text-xs">{yg.year}</td>
                    {(['health', 'prof', 'growth', 'cf'] as const).map(cat => {
                      const g = yg[cat] as LetterGrade;
                      const cc = gradeColors[g];
                      return (<td key={cat} className="text-center py-2.5 px-2"><span className={`text-xs font-bold px-2 py-0.5 rounded ${cc.badge}`}>{g}</span></td>);
                    })}
                    <td className="text-center py-2.5 pl-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeColors[yg.overall].badge}`}>{yg.overall}</span>
                        <span className="text-[10px] text-slate-600">{yg.score}/100</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {altmanZ && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Altman Z-Score</h3>
          <div className="flex items-start gap-5">
            <div className={`flex-shrink-0 w-24 h-24 rounded-xl flex flex-col items-center justify-center border ${altmanZ.zone === 'safe' ? 'bg-emerald-500/10 border-emerald-500/30' : altmanZ.zone === 'grey' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <span className={`text-3xl font-bold font-mono ${altmanZ.zone === 'safe' ? 'text-emerald-400' : altmanZ.zone === 'grey' ? 'text-amber-400' : 'text-red-400'}`}>{altmanZ.z.toFixed(2)}</span>
              <span className="text-xs text-slate-500 mt-1">Z-Score</span>
            </div>
            <div className="flex-1 space-y-3">
              <span className={`text-sm font-semibold ${altmanZ.zone === 'safe' ? 'text-emerald-400' : altmanZ.zone === 'grey' ? 'text-amber-400' : 'text-red-400'}`}>
                {altmanZ.zone === 'safe' ? 'Safe Zone' : altmanZ.zone === 'grey' ? 'Grey Zone' : 'Distress Zone'}
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`rounded-lg px-2 py-1.5 text-center ${altmanZ.zone === 'safe' ? 'bg-emerald-500/20 ring-1 ring-emerald-500/40' : 'bg-emerald-500/10'}`}><div className="font-semibold text-emerald-400">Safe</div><div className="text-slate-500">&gt; 2.99</div></div>
                <div className={`rounded-lg px-2 py-1.5 text-center ${altmanZ.zone === 'grey' ? 'bg-amber-500/20 ring-1 ring-amber-500/40' : 'bg-amber-500/10'}`}><div className="font-semibold text-amber-400">Grey</div><div className="text-slate-500">1.81-2.99</div></div>
                <div className={`rounded-lg px-2 py-1.5 text-center ${altmanZ.zone === 'distress' ? 'bg-red-500/20 ring-1 ring-red-500/40' : 'bg-red-500/10'}`}><div className="font-semibold text-red-400">Distress</div><div className="text-slate-500">&lt; 1.81</div></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Standard Altman Z-Score using market cap. Directional signal — not a definitive bankruptcy predictor.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
