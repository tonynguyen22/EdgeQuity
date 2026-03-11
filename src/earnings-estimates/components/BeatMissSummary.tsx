import React from 'react';

interface BeatMissSummaryProps {
  beats: number;
  misses: number;
  total: number;
}

export default function BeatMissSummary({ beats, misses, total }: BeatMissSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-emerald-400">{beats}</div>
        <div className="text-xs text-slate-400 mt-0.5">Beats</div>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-red-400">{misses}</div>
        <div className="text-xs text-slate-400 mt-0.5">Misses</div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-white">{total > 0 ? ((beats / total) * 100).toFixed(0) : '0'}%</div>
        <div className="text-xs text-slate-400 mt-0.5">Beat Rate</div>
      </div>
    </div>
  );
}
