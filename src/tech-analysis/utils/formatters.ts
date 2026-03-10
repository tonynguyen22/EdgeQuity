// ── Formatters ────────────────────────────────────────────────────────────────

import type { SignalLabel } from '../types';

export const fmtVol = (v: number) =>
  v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : `${v.toLocaleString()}`;

export const badgeCls = (bull: boolean | null) => {
  if (bull === true)  return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  if (bull === false) return 'bg-red-500/15 text-red-300 border border-red-500/30';
  return 'bg-slate-700/50 text-slate-400 border border-slate-600/40';
};

export const cardBorder = (bull: boolean | null) => {
  if (bull === true)  return 'border-emerald-500/20 hover:border-emerald-500/40';
  if (bull === false) return 'border-red-500/20 hover:border-red-500/40';
  return 'border-slate-700/50 hover:border-slate-600/60';
};

export const valueColor = (bull: boolean | null) => {
  if (bull === true)  return 'text-emerald-300';
  if (bull === false) return 'text-red-300';
  return 'text-slate-200';
};

// 5-level signal colors
export function signalColor(label: SignalLabel) {
  switch (label) {
    case 'Strong Bullish': return { text: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', ring: 'border-emerald-500' };
    case 'Bullish':        return { text: 'text-teal-400',    bg: 'bg-teal-500/5',    border: 'border-teal-500/20',    ring: 'border-teal-500' };
    case 'Neutral':        return { text: 'text-amber-400',   bg: 'bg-slate-800/50',  border: 'border-slate-700/50',   ring: 'border-amber-500' };
    case 'Bearish':        return { text: 'text-orange-400',  bg: 'bg-orange-500/5',  border: 'border-orange-500/20',  ring: 'border-orange-500' };
    case 'Strong Bearish': return { text: 'text-red-400',     bg: 'bg-red-500/5',     border: 'border-red-500/20',     ring: 'border-red-500' };
  }
}

export function signalBarGradient(score: number): string {
  if (score >= 75) return 'from-emerald-500 to-emerald-400';
  if (score >= 55) return 'from-teal-500 to-teal-400';
  if (score >= 40) return 'from-amber-500 to-amber-400';
  if (score >= 25) return 'from-orange-500 to-orange-400';
  return 'from-red-500 to-red-400';
}
