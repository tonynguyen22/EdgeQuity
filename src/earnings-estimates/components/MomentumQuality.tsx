import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { EpsMomentum, EarningsView, QualityScore } from '../types';

interface MomentumQualityProps {
  epsMomentum: EpsMomentum | null;
  annualMomentum: EpsMomentum | null;
  qualityScore: QualityScore | null;
  view: EarningsView;
}

function MomentumCard({ momentum, label }: { momentum: EpsMomentum; label: string }) {
  const tColor = momentum.trend === 'Accelerating' ? 'text-emerald-400'
    : momentum.trend === 'Decelerating' ? 'text-red-400' : 'text-amber-400';
  const tBg = momentum.trend === 'Accelerating' ? 'bg-emerald-500/10 border-emerald-500/20'
    : momentum.trend === 'Decelerating' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20';
  return (
    <div className={`border rounded-xl p-4 ${tBg}`}>
      <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-medium">{label}</div>
      <div className={`text-xl font-bold ${tColor} flex items-center gap-2`}>
        {momentum.trend === 'Accelerating' ? <TrendingUp className="w-5 h-5" /> : momentum.trend === 'Decelerating' ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
        {momentum.trend}
      </div>
      <div className="mt-2 space-y-1 text-xs text-slate-400">
        <div>Recent YoY growth: <span className={`font-semibold ${momentum.recentAvg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{momentum.recentAvg >= 0 ? '+' : ''}{momentum.recentAvg.toFixed(1)}%</span></div>
        <div>Prior period: <span className="text-slate-300">{momentum.priorAvg >= 0 ? '+' : ''}{momentum.priorAvg.toFixed(1)}%</span></div>
        <div className={`${Math.abs(momentum.delta) > 3 ? tColor : 'text-slate-500'}`}>
          {momentum.delta >= 0 ? '+' : ''}{momentum.delta.toFixed(1)}pp change
        </div>
      </div>
    </div>
  );
}

export default function MomentumQuality({ epsMomentum, annualMomentum, qualityScore, view }: MomentumQualityProps) {
  if (view === 'annual') {
    if (!annualMomentum) return null;
    return (
      <div className="grid grid-cols-1 gap-4">
        <MomentumCard momentum={annualMomentum} label="Annual EPS Momentum" />
      </div>
    );
  }

  if (!epsMomentum && !qualityScore) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {epsMomentum && <MomentumCard momentum={epsMomentum} label="EPS Momentum" />}

      {qualityScore && (() => {
        const qColor = qualityScore.score >= 70 ? 'text-emerald-400' : qualityScore.score >= 45 ? 'text-amber-400' : 'text-red-400';
        const qBg = qualityScore.score >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : qualityScore.score >= 45 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
        return (
          <div className={`border rounded-xl p-4 ${qBg}`}>
            <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-medium">Earnings Quality</div>
            <div className={`text-xl font-bold ${qColor}`}>{qualityScore.label}</div>
            <div className="h-1.5 bg-slate-700 rounded-full mt-2 mb-2 overflow-hidden">
              <div className={`h-full rounded-full ${qualityScore.score >= 70 ? 'bg-emerald-500' : qualityScore.score >= 45 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${qualityScore.score}%` }} />
            </div>
            <div className="space-y-1 text-xs text-slate-400">
              <div>Beat rate: <span className="text-slate-200 font-medium">{qualityScore.beatRate.toFixed(0)}%</span></div>
              <div>Avg EPS surprise: <span className={`font-medium ${qualityScore.avgSurprise >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{qualityScore.avgSurprise >= 0 ? '+' : ''}{qualityScore.avgSurprise.toFixed(1)}%</span></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
