// ── Formatters ────────────────────────────────────────────────────────────────

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
