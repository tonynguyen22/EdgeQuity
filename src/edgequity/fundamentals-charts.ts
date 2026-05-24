import type { EdgequityFinancialStatementPeriod, EdgequityStockRecord } from './types';

export type FundamentalsFormat = 'money' | 'percent' | 'multiple' | 'perShare';

export interface FundamentalsChartPoint {
  period: string;
  value: number;
}

export interface FundamentalsChartMetric {
  id: string;
  label: string;
  description: string;
  format: FundamentalsFormat;
  annual: FundamentalsChartPoint[];
  quarterly: FundamentalsChartPoint[];
}

export interface FundamentalsChartsSection {
  id: string;
  title: string;
  description: string;
  metrics: FundamentalsChartMetric[];
}

export interface FundamentalsChartsDocument {
  schemaVersion: number;
  ticker: string;
  source: 'sec-edgar+finnhub' | 'fmp' | 'static-summary';
  fetchedAt: string;
  status: 'ok' | 'partial' | 'missing';
  sections: FundamentalsChartsSection[];
}

export function fundamentalsChartsUrl(ticker: string): string {
  return `/data/edgequity/raw/${encodeURIComponent(ticker.toUpperCase())}/fundamentals-charts.json`;
}

export async function fetchFundamentalsCharts(ticker: string): Promise<FundamentalsChartsDocument> {
  const response = await fetch(fundamentalsChartsUrl(ticker));
  if (!response.ok) {
    throw new Error(`Fundamentals charts unavailable for ${ticker} (${response.status})`);
  }
  return (await response.json()) as FundamentalsChartsDocument;
}

export function formatFundamentalsValue(value: number | null, format: FundamentalsFormat): string {
  if (value === null || !Number.isFinite(value)) return '-';

  switch (format) {
    case 'money': {
      const abs = Math.abs(value);
      const prefix = value < 0 ? '-$' : '$';
      if (abs >= 1_000_000_000) return `${prefix}${(abs / 1_000_000_000).toFixed(2)}B`;
      if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(1)}K`;
      return `${prefix}${abs.toFixed(0)}`;
    }
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'multiple':
      return `${value.toFixed(2)}x`;
    case 'perShare':
      return `$${value.toFixed(2)}`;
    default:
      return String(value);
  }
}

export function latestPoint(metric: FundamentalsChartMetric): FundamentalsChartPoint | null {
  return metric.quarterly.at(-1) ?? metric.annual.at(-1) ?? null;
}

export function buildFundamentalsChartsFromStock(stock: EdgequityStockRecord): FundamentalsChartsDocument {
  const source = stock.financialStatements?.annual ? 'fmp' : 'static-summary';
  const sections: FundamentalsChartsSection[] = [
    {
      id: 'growth',
      title: 'Growth',
      description: 'Revenue, earnings, and cash flow across recent reporting periods.',
      metrics: [
        buildMetric(stock, 'revenue', 'Revenue', 'Revenue shows business scale and demand momentum.', 'money'),
        buildMetric(stock, 'grossProfit', 'Gross profit', 'Gross profit tracks pricing power and direct cost structure.', 'money'),
        buildMetric(stock, 'netIncome', 'Net income', 'Net income shows reported earnings after expenses and taxes.', 'money'),
        buildMetric(stock, 'freeCashFlow', 'Free cash flow', 'Free cash flow shows cash left after capital spending.', 'money'),
      ].filter((metric): metric is FundamentalsChartMetric => metric !== null),
    },
    {
      id: 'margin',
      title: 'Margins',
      description: 'Profitability ratios derived from the same FMP statement periods.',
      metrics: [
        buildMarginMetric(stock, 'grossMargin', 'Gross margin', 'Gross profit divided by revenue.'),
        buildMarginMetric(stock, 'operatingMargin', 'Operating margin', 'Operating income divided by revenue.'),
        buildMarginMetric(stock, 'netMargin', 'Net margin', 'Net income divided by revenue.'),
        buildMarginMetric(stock, 'fcfMargin', 'FCF margin', 'Free cash flow divided by revenue.'),
      ].filter((metric): metric is FundamentalsChartMetric => metric !== null),
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Assets, debt, and equity from the balance sheet.',
      metrics: [
        buildMetric(stock, 'totalAssets', 'Total assets', 'Total assets show the size of the balance sheet.', 'money'),
        buildMetric(stock, 'totalDebt', 'Total debt', 'Total debt tracks financial leverage.', 'money'),
        buildMetric(stock, 'totalEquity', 'Total equity', 'Book equity belongs to common shareholders.', 'money'),
      ].filter((metric): metric is FundamentalsChartMetric => metric !== null),
    },
  ].filter((section) => section.metrics.length > 0);

  return {
    schemaVersion: 2,
    ticker: stock.ticker,
    source,
    fetchedAt: stock.financialStatements?.source.fetchedAt ?? stock.sources?.summary?.fetchedAt ?? '',
    status: sections.length > 0 ? 'ok' : 'missing',
    sections,
  };
}

type StatementMetricKey =
  | 'revenue'
  | 'grossProfit'
  | 'operatingIncome'
  | 'netIncome'
  | 'freeCashFlow'
  | 'totalAssets'
  | 'totalDebt'
  | 'totalEquity';

function buildMetric(
  stock: EdgequityStockRecord,
  id: StatementMetricKey,
  label: string,
  description: string,
  format: FundamentalsFormat,
): FundamentalsChartMetric | null {
  const annual = pointsForMetric(stock, 'annual', id);
  const quarterly = pointsForMetric(stock, 'quarterly', id);
  if (annual.length === 0 && quarterly.length === 0) return null;

  return { id, label, description, format, annual, quarterly };
}

function buildMarginMetric(
  stock: EdgequityStockRecord,
  id: 'grossMargin' | 'operatingMargin' | 'netMargin' | 'fcfMargin',
  label: string,
  description: string,
): FundamentalsChartMetric | null {
  const annual = marginPoints(stock, 'annual', id);
  const quarterly = marginPoints(stock, 'quarterly', id);
  if (annual.length === 0 && quarterly.length === 0) return null;

  return { id, label, description, format: 'percent', annual, quarterly };
}

function pointsForMetric(
  stock: EdgequityStockRecord,
  cadence: 'annual' | 'quarterly',
  key: StatementMetricKey,
): FundamentalsChartPoint[] {
  const periods = getStatementPeriods(stock, cadence, key);
  if (periods.length > 0) {
    return periods
      .map((period) => ({ period: periodLabel(period), value: metricValueFromPeriod(period, key) }))
      .filter((point): point is FundamentalsChartPoint => point.value !== null)
      .sort(comparePeriods);
  }

  if (cadence === 'quarterly') return [];

  return stock.history
    .map((period) => ({ period: period.year, value: numeric(period[key]) }))
    .filter((point): point is FundamentalsChartPoint => point.value !== null)
    .sort(comparePeriods);
}

function marginPoints(
  stock: EdgequityStockRecord,
  cadence: 'annual' | 'quarterly',
  key: 'grossMargin' | 'operatingMargin' | 'netMargin' | 'fcfMargin',
): FundamentalsChartPoint[] {
  const revenuePoints = pointsForMetric(stock, cadence, 'revenue');
  const numeratorKey =
    key === 'grossMargin' ? 'grossProfit'
      : key === 'operatingMargin' ? 'operatingIncome'
        : key === 'netMargin' ? 'netIncome'
          : 'freeCashFlow';
  const numeratorByPeriod = new Map(pointsForMetric(stock, cadence, numeratorKey).map((point) => [point.period, point.value]));

  return revenuePoints
    .map((point) => {
      const numerator = numeratorByPeriod.get(point.period);
      return numerator !== undefined && point.value !== 0
        ? { period: point.period, value: (numerator / point.value) * 100 }
        : null;
    })
    .filter((point): point is FundamentalsChartPoint => point !== null);
}

function getStatementPeriods(
  stock: EdgequityStockRecord,
  cadence: 'annual' | 'quarterly',
  key: StatementMetricKey,
): EdgequityFinancialStatementPeriod[] {
  const statementKey = key === 'totalAssets' || key === 'totalDebt' || key === 'totalEquity'
    ? 'balanceSheet'
    : key === 'freeCashFlow'
      ? 'cashFlow'
      : 'incomeStatement';
  return stock.financialStatements?.[cadence]?.[statementKey] ?? [];
}

function metricValueFromPeriod(period: EdgequityFinancialStatementPeriod, key: StatementMetricKey): number | null {
  if (key === 'totalEquity') {
    return firstNumber(period.values.totalStockholdersEquity, period.values.totalEquity);
  }
  if (key === 'operatingIncome') {
    return firstNumber(period.values.operatingIncome, period.values.ebit);
  }
  return firstNumber(period.values[key]);
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const next = numeric(value);
    if (next !== null) return next;
  }
  return null;
}

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function periodLabel(period: EdgequityFinancialStatementPeriod): string {
  if (period.period && period.period !== 'FY') return `${period.fiscalYear}-Q${period.period.replace(/^Q/i, '')}`;
  return period.fiscalYear;
}

function comparePeriods(a: FundamentalsChartPoint, b: FundamentalsChartPoint): number {
  return sortablePeriod(a.period).localeCompare(sortablePeriod(b.period));
}

function sortablePeriod(period: string): string {
  const quarter = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) return `${quarter[1]}-${quarter[2]}`;
  return `${period}-0`;
}
