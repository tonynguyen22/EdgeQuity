import type { DividendPayment, SafetyInfo, StreakBadge } from './types';
import { CheckCircle, Shield, AlertTriangle, XCircle } from 'lucide-react';

export const computeCagr = (payments: DividendPayment[], years: number): number | null => {
  if (!payments || payments.length < 2) return null;
  const sorted = [...payments].sort((a, b) => new Date(a.date || a.exDate).getTime() - new Date(b.date || b.exDate).getTime());
  const recent = sorted[sorted.length - 1]?.amount ?? 0;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  const old = sorted.find(p => new Date(p.date || p.exDate) <= cutoff || sorted.indexOf(p) === 0);
  const oldAmt = old?.amount ?? 0;
  if (!oldAmt || !recent || oldAmt === recent) return null;
  return (Math.pow(recent / oldAmt, 1 / years) - 1) * 100;
};

export const computeAnnualDividend = (payments: DividendPayment[]): number => {
  if (!payments?.length) return 0;
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const recent = payments.filter(p => new Date(p.date || p.exDate) >= oneYearAgo);
  return recent.reduce((s, p) => s + (p.amount ?? 0), 0);
};

export const computeGrowthStreak = (payments: DividendPayment[]): number => {
  if (payments.length < 2) return 0;
  const byYear: Record<string, number> = {};
  payments.forEach(p => {
    const yr = (p.date || p.exDate || '').substring(0, 4);
    if (yr) byYear[yr] = (byYear[yr] ?? 0) + (p.amount ?? 0);
  });
  const years = Object.keys(byYear).sort().reverse();
  let streak = 0;
  for (let i = 0; i < years.length - 1; i++) {
    if (byYear[years[i]] > byYear[years[i + 1]]) streak++;
    else break;
  }
  return streak;
};

export const getStreakBadge = (growthStreak: number): StreakBadge | null => {
  if (growthStreak >= 25) return { label: 'Dividend Aristocrat', color: 'emerald', desc: '25+ consecutive years of growth' };
  if (growthStreak >= 10) return { label: 'Dividend Champion', color: 'blue', desc: '10+ consecutive years of growth' };
  if (growthStreak >= 3) return { label: 'Dividend Grower', color: 'amber', desc: `${growthStreak} consecutive years of growth` };
  return null;
};

export const getSafetyInfo = (
  fcfPayoutRatio: number | null,
  payoutRatio: number | null,
  payoutRatioIsComputed: boolean,
): SafetyInfo | null => {
  if (fcfPayoutRatio !== null) {
    if (fcfPayoutRatio < 40) return { label: 'Safe', grade: 'A', color: 'emerald', icon: CheckCircle, desc: `FCF payout ratio of ${fcfPayoutRatio.toFixed(0)}% is well-covered by free cash flow.` };
    if (fcfPayoutRatio < 70) return { label: 'Moderate', grade: 'B', color: 'blue', icon: Shield, desc: `FCF payout ratio of ${fcfPayoutRatio.toFixed(0)}% — dividend is adequately covered but monitor FCF trends.` };
    if (fcfPayoutRatio < 100) return { label: 'Caution', grade: 'C', color: 'amber', icon: AlertTriangle, desc: `FCF payout ratio of ${fcfPayoutRatio.toFixed(0)}% — dividend is consuming most free cash flow.` };
    return { label: 'At Risk', grade: 'D', color: 'red', icon: XCircle, desc: `FCF payout ratio of ${fcfPayoutRatio.toFixed(0)}% exceeds free cash flow — dividend may be unsustainable.` };
  }
  if (payoutRatio !== null) {
    const src = payoutRatioIsComputed ? 'Regular dividend payout ratio' : 'Earnings payout ratio';
    if (payoutRatio < 40) return { label: 'Safe', grade: 'A', color: 'emerald', icon: CheckCircle, desc: `${src} of ${payoutRatio.toFixed(0)}% leaves ample earnings cushion.` };
    if (payoutRatio < 65) return { label: 'Moderate', grade: 'B', color: 'blue', icon: Shield, desc: `${src} of ${payoutRatio.toFixed(0)}% — dividend is covered by earnings.` };
    if (payoutRatio < 90) return { label: 'Caution', grade: 'C', color: 'amber', icon: AlertTriangle, desc: `${src} of ${payoutRatio.toFixed(0)}% — high relative to earnings.` };
    return { label: 'At Risk', grade: 'D', color: 'red', icon: XCircle, desc: `${src} of ${payoutRatio.toFixed(0)}% — dividend exceeds or is near earnings.` };
  }
  return null;
};
