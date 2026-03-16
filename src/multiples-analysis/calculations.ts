import type { MultiplesData, MultiplesYear, MultipleStats, MultipleKey, MultiplesResult, ValuationSignal, CurrentMetrics, QuarterlyTrendPoint } from './types';
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

function extractCurrentMetrics(metrics: any): CurrentMetrics {
  return {
    peTTM: metrics?.peTTM ?? null,
    forwardPE: metrics?.forwardPE ?? null,
    psTTM: metrics?.psTTM ?? null,
    pbQuarterly: metrics?.pbQuarterly ?? null,
    evEbitdaTTM: metrics?.evEbitdaTTM ?? null,
    evRevenueTTM: metrics?.evRevenueTTM ?? null,
    pfcfShareTTM: metrics?.pfcfShareTTM ?? null,
    pcfShareTTM: metrics?.pcfShareTTM ?? null,
  };
}

function buildQuarterlyTrend(series: MultiplesData['series']): QuarterlyTrendPoint[] {
  if (!series?.quarterly) return [];

  const q = series.quarterly;
  // Collect all unique periods from any available series
  const periodSet = new Set<string>();
  const seriesKeys = ['peTTM', 'evEbitdaTTM', 'evRevenueTTM', 'psTTM', 'pb', 'pfcfTTM'] as const;
  for (const key of seriesKeys) {
    if (q[key]) {
      for (const entry of q[key]) {
        if (entry.period) periodSet.add(entry.period);
      }
    }
  }

  const periods = [...periodSet].sort();
  // Build lookup maps for each series
  const maps: Record<string, Map<string, number>> = {};
  for (const key of seriesKeys) {
    maps[key] = new Map();
    if (q[key]) {
      for (const entry of q[key]) {
        if (entry.period && entry.v != null) maps[key].set(entry.period, entry.v);
      }
    }
  }

  return periods.map((period): QuarterlyTrendPoint => ({
    period,
    pe: maps['peTTM']?.get(period) ?? null,
    evEbitda: maps['evEbitdaTTM']?.get(period) ?? null,
    evRevenue: maps['evRevenueTTM']?.get(period) ?? null,
    ps: maps['psTTM']?.get(period) ?? null,
    pb: maps['pb']?.get(period) ?? null,
    pfcf: maps['pfcfTTM']?.get(period) ?? null,
  }));
}

/** Fallback: build MultiplesYear[] from Finnhub series.annual when FMP is unavailable */
function buildYearsFromSeries(series: MultiplesData['series'], profile: any): MultiplesYear[] {
  if (!series?.annual) return [];

  const a = series.annual;
  const seriesMap: Record<string, keyof MultiplesYear> = {
    pe: 'pe',
    evEbitda: 'evEbitda',
    evRevenue: 'evRevenue',
    pb: 'pb',
    ps: 'ps',
    pfcf: 'pfcf',
  };

  // Collect all unique periods
  const periodSet = new Set<string>();
  for (const key of Object.keys(seriesMap)) {
    if (a[key]) {
      for (const entry of a[key]) {
        if (entry.period) periodSet.add(entry.period);
      }
    }
  }

  const periods = [...periodSet].sort();
  const currentPrice = profile?.marketCapitalization && profile?.shareOutstanding
    ? (profile.marketCapitalization * 1e6) / (profile.shareOutstanding * 1e6)
    : 0;

  // Build lookup maps
  const maps: Record<string, Map<string, number>> = {};
  for (const key of Object.keys(seriesMap)) {
    maps[key] = new Map();
    if (a[key]) {
      for (const entry of a[key]) {
        if (entry.period && entry.v != null && entry.v > 0) maps[key].set(entry.period, +entry.v.toFixed(2));
      }
    }
  }

  return periods.map((period): MultiplesYear => ({
    year: period.substring(0, 4),
    date: period,
    price: currentPrice,
    marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : 0,
    ev: 0, // not available from series alone
    pe: maps['pe']?.get(period) ?? null,
    evEbitda: maps['evEbitda']?.get(period) ?? null,
    evRevenue: maps['evRevenue']?.get(period) ?? null,
    evEbit: null, // not in Finnhub series
    pb: maps['pb']?.get(period) ?? null,
    ps: maps['ps']?.get(period) ?? null,
    pfcf: maps['pfcf']?.get(period) ?? null,
  }));
}

export function computeHistoricalMultiples(data: MultiplesData): MultiplesResult | null {
  const { incomeStatements, balanceSheets, cashFlows, candles, profile } = data;

  const currentPrice = profile?.marketCapitalization && profile?.shareOutstanding
    ? (profile.marketCapitalization * 1e6) / (profile.shareOutstanding * 1e6)
    : null;
  const currentMarketCap = profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null;

  let years: MultiplesYear[] = [];

  // Primary path: compute from FMP financial statements
  if (incomeStatements?.length) {
    const sorted = [...incomeStatements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

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
  }

  // Fallback path: use Finnhub series.annual when FMP data is unavailable
  if (years.length === 0 && data.series?.annual) {
    years = buildYearsFromSeries(data.series, profile);
  }

  if (years.length === 0) return null;

  // Split: use last 5 years for primary stats, keep all for full historical view
  const RECENT_COUNT = 5;
  const allYears = years;
  const recentYears = years.length > RECENT_COUNT ? years.slice(-RECENT_COUNT) : years;

  const currentMetrics = extractCurrentMetrics(data.metrics);
  const stats = computeStats(recentYears, currentMetrics);
  const signal = computeSignal(stats);

  const quarterlyTrend = buildQuarterlyTrend(data.series);

  return {
    years: recentYears,
    allYears,
    stats,
    signal,
    companyName: profile?.name ?? '',
    industry: profile?.finnhubIndustry ?? '',
    currentPrice: currentPrice ?? recentYears[recentYears.length - 1]?.price ?? 0,
    currentMetrics,
    quarterlyTrend,
  };
}

/** Map from MultipleKey → corresponding TTM metric key in CurrentMetrics */
const TTM_MAP: Record<string, keyof CurrentMetrics> = {
  pe: 'peTTM',
  evEbitda: 'evEbitdaTTM',
  evRevenue: 'evRevenueTTM',
  pb: 'pbQuarterly',
  ps: 'psTTM',
  pfcf: 'pfcfShareTTM',
};

function computeStats(years: MultiplesYear[], currentMetrics: CurrentMetrics): MultipleStats[] {
  return MULTIPLE_KEYS.map(key => {
    const values = years.map(y => y[key]).filter((v): v is number => v !== null);
    // Prefer TTM value as "current"; fall back to most recent fiscal year
    const ttmKey = TTM_MAP[key];
    const ttmVal = ttmKey ? currentMetrics[ttmKey] : null;
    const fiscalCurrent = years.length > 0 ? years[years.length - 1][key] : null;
    const current = ttmVal ?? fiscalCurrent;

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
  const absVal = Math.abs(value).toFixed(1);
  if (value < -1) return `${absVal}% Below Avg`;
  if (value > 1) return `${absVal}% Above Avg`;
  return 'Near Avg';
}

