import type { AnnualEarningsRecord, EarningsRecord, EpsMomentum, QualityScore } from './types';

export const computeEpsMomentum = (history: EarningsRecord[]): EpsMomentum | null => {
  if (history.length < 4) return null;
  const yoy = (i: number): number | null => {
    if (i + 4 >= history.length) return null;
    const base = history[i + 4]?.actual;
    const curr = history[i]?.actual;
    if (!base || base === 0 || curr == null) return null;
    return ((curr - base) / Math.abs(base)) * 100;
  };
  const g0 = yoy(0), g1 = yoy(1), g2 = yoy(2);
  if (g0 == null || g1 == null) return null;
  const recentAvg = (g0 + g1) / 2;
  const priorAvg = g2 != null ? (g1 + g2) / 2 : g1;
  const delta = recentAvg - priorAvg;
  const trend: EpsMomentum['trend'] = delta > 3 ? 'Accelerating' : delta < -3 ? 'Decelerating' : 'Stable';
  return { recentAvg, priorAvg, delta, trend };
};

export const computeAnnualMomentum = (annual: AnnualEarningsRecord[]): EpsMomentum | null => {
  if (annual.length < 4) return null;
  const yoy = (i: number): number | null => {
    const curr = annual[i]?.reportedEPS;
    const base = annual[i + 1]?.reportedEPS;
    if (!base || base === 0 || curr == null) return null;
    return ((curr - base) / Math.abs(base)) * 100;
  };
  const g0 = yoy(0), g1 = yoy(1), g2 = yoy(2);
  if (g0 == null || g1 == null) return null;
  const recentAvg = (g0 + g1) / 2;
  const priorAvg = g2 != null ? (g1 + g2) / 2 : g1;
  const delta = recentAvg - priorAvg;
  const trend: EpsMomentum['trend'] = delta > 3 ? 'Accelerating' : delta < -3 ? 'Decelerating' : 'Stable';
  return { recentAvg, priorAvg, delta, trend };
};

export const computeQualityScore = (history: EarningsRecord[]): QualityScore | null => {
  if (!history.length) return null;
  const withEstimate = history.filter(r => r.estimate != null && r.estimate !== 0);
  if (withEstimate.length === 0) return null;
  const surprises = withEstimate.map(r => r.surprisePercent ?? 0);
  const avgSurprise = surprises.reduce((a, b) => a + b, 0) / surprises.length;
  const beatRate = (surprises.filter(s => s > 0.5).length / surprises.length) * 100;
  const score = Math.round((beatRate * 0.6) + (Math.min(Math.max(avgSurprise, -20), 20) / 20) * 40 + 40);
  const clamped = Math.max(0, Math.min(100, score));
  const label = clamped >= 70 ? 'High Quality' : clamped >= 45 ? 'Average' : 'Low Quality';
  return { score: clamped, label, avgSurprise, beatRate };
};
