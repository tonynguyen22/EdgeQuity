import type { EdgequityFinnhubMetricSeriesPoint, EdgequityFinnhubProfile, EdgequityFinnhubSnapshot } from './types.ts';

export type FinnhubAnalysisCadence = 'annual' | 'quarterly';
export type FinnhubAnalysisFormat = 'currency' | 'number' | 'percent' | 'multiple';

export interface FinnhubRatioDefinition {
  id: string;
  label: string;
  metricKey: string;
  format: FinnhubAnalysisFormat;
}

export interface FinnhubAnalysisChartPoint {
  period: string;
  value: number;
  inProgress?: boolean;
}

const FINNHUB_RATIO_CATALOG: FinnhubRatioDefinition[] = [
  { id: 'eps', label: 'EPS', metricKey: 'eps', format: 'currency' },
  { id: 'ebitda', label: 'EBITDA', metricKey: 'ebitda', format: 'currency' },
  { id: 'grossMargin', label: 'Gross Margin', metricKey: 'grossMargin', format: 'percent' },
  { id: 'operatingMargin', label: 'Operating Margin', metricKey: 'operatingMargin', format: 'percent' },
  { id: 'netMargin', label: 'Net Margin', metricKey: 'netMargin', format: 'percent' },
  { id: 'fcfMargin', label: 'Free Cash Flow Margin', metricKey: 'fcfMargin', format: 'percent' },
  { id: 'roa', label: 'Return on Assets', metricKey: 'roa', format: 'percent' },
  { id: 'roe', label: 'Return on Equity', metricKey: 'roe', format: 'percent' },
  { id: 'roic', label: 'Return on Invested Capital', metricKey: 'roic', format: 'percent' },
  { id: 'currentRatio', label: 'Current Ratio', metricKey: 'currentRatio', format: 'number' },
  { id: 'quickRatio', label: 'Quick Ratio', metricKey: 'quickRatio', format: 'number' },
  { id: 'cashRatio', label: 'Cash Ratio', metricKey: 'cashRatio', format: 'number' },
  { id: 'totalDebtToEquity', label: 'Debt to Equity', metricKey: 'totalDebtToEquity', format: 'number' },
  { id: 'pe', label: 'P/E', metricKey: 'pe', format: 'multiple' },
  { id: 'peTTM', label: 'P/E TTM', metricKey: 'peTTM', format: 'multiple' },
  { id: 'pb', label: 'Price to Book', metricKey: 'pb', format: 'multiple' },
  { id: 'ps', label: 'Price to Sales', metricKey: 'ps', format: 'multiple' },
  { id: 'evEbitda', label: 'EV / EBITDA', metricKey: 'evEbitda', format: 'multiple' },
  { id: 'evEbitdaTTM', label: 'EV / EBITDA TTM', metricKey: 'evEbitdaTTM', format: 'multiple' },
  { id: 'evRevenue', label: 'EV / Revenue', metricKey: 'evRevenue', format: 'multiple' },
  { id: 'pfcf', label: 'Price to Free Cash Flow', metricKey: 'pfcf', format: 'multiple' },
  { id: 'bookValue', label: 'Book Value', metricKey: 'bookValue', format: 'currency' },
  { id: 'salesPerShare', label: 'Sales per Share', metricKey: 'salesPerShare', format: 'currency' },
];

const CACHE_STATES = new Set(['hit', 'miss', 'stale']);

export function getFinnhubRatioCatalog(): FinnhubRatioDefinition[] {
  return FINNHUB_RATIO_CATALOG;
}

export function assertFinnhubSnapshot(value: unknown): EdgequityFinnhubSnapshot {
  if (!isRecord(value)) {
    throw new Error('Invalid Finnhub snapshot: expected object');
  }

  if (typeof value.ticker !== 'string' || typeof value.fetchedAt !== 'string') {
    throw new Error('Invalid Finnhub snapshot: missing ticker or fetchedAt');
  }

  if (!isRecord(value.profile) || !isRecord(value.quote) || !isRecord(value.metrics) || !isRecord(value.cache)) {
    throw new Error('Invalid Finnhub snapshot: missing payload sections');
  }

  for (const key of ['profile', 'quote', 'metrics']) {
    if (!CACHE_STATES.has(value.cache[key])) {
      throw new Error(`Invalid Finnhub snapshot: cache.${key} must be hit, miss, or stale`);
    }
  }

  return value as EdgequityFinnhubSnapshot;
}

export function buildCompanyDescriptionFallback(profile: EdgequityFinnhubProfile): string {
  const name = profile.name ?? profile.ticker ?? 'This company';
  const industry = profile.finnhubIndustry ?? 'public';
  const exchange = profile.exchange ?? 'its primary exchange';

  return `${name} is a ${industry} company listed on ${exchange}.`;
}

export async function fetchFinnhubSnapshot(ticker: string): Promise<EdgequityFinnhubSnapshot> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const response = await fetch(`/api/edgequity/finnhub-snapshot?ticker=${encodeURIComponent(normalizedTicker)}`, {
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(`Finnhub snapshot request failed: ${response.status}`);
  }

  return assertFinnhubSnapshot(await response.json());
}

export function buildAnalysisChartSeries(
  snapshot: EdgequityFinnhubSnapshot,
  ratioId: string,
  cadence: FinnhubAnalysisCadence,
  limit: number,
  now = new Date(),
): FinnhubAnalysisChartPoint[] {
  const ratio = FINNHUB_RATIO_CATALOG.find((item) => item.id === ratioId);

  if (!ratio || limit <= 0) {
    return [];
  }

  const rawSeries = snapshot.metrics.series?.[cadence]?.[ratio.metricKey];
  const points = Array.isArray(rawSeries) ? rawSeries : [];
  const latestPoints = points.filter(isValidSeriesPoint).sort((a, b) => a.period.localeCompare(b.period)).slice(-limit);

  return latestPoints.map((point) => ({
    period: point.period,
    value: point.v,
    ...(cadence === 'annual' ? { inProgress: isInProgressFiscalYear(point.period, now) } : {}),
  }));
}

export function isInProgressFiscalYear(period: string, now = new Date()): boolean {
  const currentYear = String(now.getUTCFullYear());

  if (!period.startsWith(currentYear)) {
    return false;
  }

  const parsedPeriod = new Date(period);
  return Number.isFinite(parsedPeriod.getTime()) && parsedPeriod.getTime() > now.getTime();
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidSeriesPoint(point: EdgequityFinnhubMetricSeriesPoint): boolean {
  return typeof point.period === 'string' && Number.isFinite(point.v);
}
