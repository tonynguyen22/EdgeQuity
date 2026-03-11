import type { InsiderTransaction, BuyerCluster, NetBuySell } from './types';

export const TRANS_CODE_LABELS: Record<string, string> = {
  P: 'Purchase',
  S: 'Sale',
  A: 'Award/Grant',
  D: 'Sale to Issuer',
  F: 'Tax Withholding',
  I: 'Discretionary Tx',
  M: 'Option Exercise',
  C: 'Conversion',
  W: 'Will/Inheritance',
  X: 'Option Exercise',
  G: 'Gift',
};

export const computeNetBuySell = (transactions: InsiderTransaction[]): NetBuySell => {
  return transactions.reduce<NetBuySell>((acc, t) => {
    const shares = Math.abs(t.change ?? t.share ?? 0);
    if (t.transactionCode === 'P') acc.buy += shares;
    else if (t.transactionCode === 'S' || t.transactionCode === 'D') acc.sell += shares;
    return acc;
  }, { buy: 0, sell: 0 });
};

export const computeNetScore = (netBuySell: NetBuySell): number | null => {
  const total = netBuySell.buy + netBuySell.sell;
  if (total === 0) return null;
  return (netBuySell.buy - netBuySell.sell) / total;
};

export const computeBuyerClusters = (transactions: InsiderTransaction[]): BuyerCluster[] => {
  const byMonth: Record<string, Set<string>> = {};
  transactions.forEach(t => {
    if (t.transactionCode !== 'P') return;
    const month = (t.transactionDate || t.filingDate || '').substring(0, 7);
    if (!month) return;
    if (!byMonth[month]) byMonth[month] = new Set();
    byMonth[month].add(t.name || 'unknown');
  });
  return Object.entries(byMonth)
    .filter(([, names]) => names.size >= 2)
    .map(([month, names]) => ({ month, count: names.size }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 3);
};
