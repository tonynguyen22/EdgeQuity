import type { MultiplesData, MultiplesYear, MultipleStats, MultipleKey, MultiplesResult, ValuationSignal } from './types';
import { MULTIPLE_KEYS, MULTIPLE_LABELS } from './types';

function findClosestPrice(candles: NonNullable<MultiplesData['candles']>, targetDate: string): number | null {
  const target = new Date(targetDate).getTime() / 1000;
  if (!candles.t?.length) return null;

  let bestIdx = 0;
  let bestDiff = Math.abs(candles.t[0] - target);

  for (let i = 1; i < candles.t.length; i++) {
    const diff = Math.abs(candles.t[i] - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }

  // Only match within 30 days
  if (bestDiff > 30 * 24 * 60 * 60) return null;
  return candles.c[bestIdx];
}

function safeDiv(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  const result = numerator / denominator;
  if (!isFinite(result) || result <= 0) return null;
  return +result.toFixed(2);
}

export function computeHistoricalMultiples(data: MultiplesData): MultiplesResult | null {
  const { incomeStatements, balanceSheets, cashFlows, candles, profile } = data;

  if (!incomeStatements?.length) return null;

  const currentPrice = profile?.marketCapitalization && profile?.shareOutstanding
    ? (profile.marketCapitalization * 1e6) / (profile.shareOutstanding * 1e6)
    : null;
  const currentMarketCap = profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null;

  const sorted = [...incomeStatements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const years: MultiplesYear[] = [];

  for (const ic of sorted) {
    const year = ic.fiscalYear || ic.date?.substring(0, 4);
    const date = ic.date;
    if (!year || !date) continue;

    const bs = balanceSheets?.find((b: any) => (b.fiscalYear || b.date?.substring(0, 4)) === year);
    const cf = cashFlows?.find((c: any) => (c.fiscalYear || c.date?.substring(0, 4)) === year);

    let price: number | null = null;
    let marketCap: number | null = null;
    let ev: number | null = null;

    const shares = ic.weightedAverageShsOutDil || ic.weightedAverageShsOut || 0;
    const totalDebt = bs?.totalDebt ?? 0;
    const cashEquiv = bs?.cashAndCashEquivalents ?? bs?.cashAndShortTermInvestments ?? 0;

    if (candles) {
      price = findClosestPrice(candles, date);
      if (price && shares) {
        marketCap = price * shares;
        ev = marketCap + totalDebt - cashEquiv;
      }
    }

    // Fallback: use current market cap when candle data is unavailable.
    // This gives "current valuation vs historical fundamentals" which is
    // still useful for seeing how today's price compares to past earnings.
    if (!marketCap && currentMarketCap) {
      marketCap = currentMarketCap;
      price = currentPrice;
      ev = marketCap + totalDebt - cashEquiv;
    }

    if (!marketCap || !ev || !price) continue;

    const rev = ic.revenue || 0;
    const ebitda = ic.ebitda || (ic.operatingIncome || 0) + (ic.depreciationAndAmortization || 0);
    const ebit = ic.operatingIncome || ic.ebit || 0;
    const netIncome = ic.netIncome || 0;
    const bookValue = bs?.totalStockholdersEquity || bs?.totalEquity || 0;
    const fcf = cf ? (cf.operatingCashFlow || cf.netCashProvidedByOperatingActivities || 0) - Math.abs(cf.capitalExpenditure || cf.investmentsInPropertyPlantAndEquipment || 0) : 0;

    years.push({
      year,
      date,
      price,
      marketCap,
      ev,
      pe: safeDiv(marketCap, netIncome),
      evEbitda: safeDiv(ev, ebitda),
      evRevenue: safeDiv(ev, rev),
      evEbit: safeDiv(ev, ebit),
      pb: safeDiv(marketCap, bookValue),
      ps: safeDiv(marketCap, rev),
      pfcf: safeDiv(marketCap, fcf),
    });
  }

  if (years.length === 0) return null;

  const stats = computeStats(years);
  const signal = computeSignal(stats);

  return {
    years,
    stats,
    signal,
    companyName: profile?.name ?? '',
    industry: profile?.finnhubIndustry ?? '',
    currentPrice: currentPrice ?? years[years.length - 1]?.price ?? 0,
  };
}

function computeStats(years: MultiplesYear[]): MultipleStats[] {
  return MULTIPLE_KEYS.map(key => {
    const values = years.map(y => y[key]).filter((v): v is number => v !== null);
    const current = years.length > 0 ? years[years.length - 1][key] : null;

    if (values.length === 0) {
      return { key, label: MULTIPLE_LABELS[key], current, avg: null, median: null, high: null, low: null, premiumDiscount: null };
    }

    const avg = +(values.reduce((s, v) => s + v, 0) / values.length).toFixed(2);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? +((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(2)
      : sorted[Math.floor(sorted.length / 2)];
    const high = Math.max(...values);
    const low = Math.min(...values);
    const premiumDiscount = current !== null && avg ? +(((current - avg) / avg) * 100).toFixed(1) : null;

    return { key, label: MULTIPLE_LABELS[key], current, avg, median, high, low, premiumDiscount };
  });
}

function computeSignal(stats: MultipleStats[]): ValuationSignal {
  const validStats = stats.filter(s => s.premiumDiscount !== null);
  if (validStats.length === 0) return 'Fair Value';

  const belowAvg = validStats.filter(s => s.premiumDiscount! < -10).length;
  const aboveAvg = validStats.filter(s => s.premiumDiscount! > 10).length;
  const ratio = belowAvg / validStats.length;
  const aboveRatio = aboveAvg / validStats.length;

  if (ratio >= 0.5) return 'Undervalued';
  if (aboveRatio >= 0.5) return 'Overvalued';
  return 'Fair Value';
}

export function formatMultiple(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(1)}x`;
}

export function formatPremiumDiscount(value: number | null): string {
  if (value === null) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
