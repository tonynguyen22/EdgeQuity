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
  source: 'sec-edgar+finnhub';
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
