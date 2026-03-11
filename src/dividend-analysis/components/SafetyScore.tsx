import React from 'react';
import type { SafetyInfo } from '../types';

const colorMap: Record<string, string> = {
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
};

interface SafetyScoreProps {
  safety: SafetyInfo;
}

export default function SafetyScore({ safety }: SafetyScoreProps) {
  return (
    <div className={`border rounded-xl p-5 flex items-start gap-4 ${colorMap[safety.color]}`}>
      <safety.icon className={`w-8 h-8 shrink-0 mt-0.5 text-${safety.color}-400`} />
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-2xl font-bold text-${safety.color}-400`}>{safety.grade}</span>
          <span className={`text-lg font-semibold text-${safety.color}-400`}>Dividend Safety</span>
          <span className={`text-sm px-2 py-0.5 rounded-full bg-${safety.color}-500/15 text-${safety.color}-400 font-medium`}>{safety.label}</span>
        </div>
        <p className="text-sm text-slate-300">{safety.desc}</p>
      </div>
    </div>
  );
}
