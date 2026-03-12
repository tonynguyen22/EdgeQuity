export interface MultiplesYear {
  year: string;
  date: string;
  price: number;
  marketCap: number;
  ev: number;
  pe: number | null;
  evEbitda: number | null;
  evRevenue: number | null;
  evEbit: number | null;
  pb: number | null;
  ps: number | null;
  pfcf: number | null;
}

export type MultipleKey = 'pe' | 'evEbitda' | 'evRevenue' | 'evEbit' | 'pb' | 'ps' | 'pfcf';

export interface MultipleStats {
  key: MultipleKey;
  label: string;
  current: number | null;
  avg: number | null;
  median: number | null;
  high: number | null;
  low: number | null;
  premiumDiscount: number | null;
}

export type ValuationSignal = 'Undervalued' | 'Fair Value' | 'Overvalued';

/** Quarterly trend data point from Finnhub series */
export interface QuarterlyTrendPoint {
  period: string;
  pe: number | null;
  evEbitda: number | null;
  evRevenue: number | null;
  ps: number | null;
  pb: number | null;
  pfcf: number | null;
}

/** Snapshot TTM / current metrics from Finnhub metric object */
export interface CurrentMetrics {
  peTTM: number | null;
  forwardPE: number | null;
  psTTM: number | null;
  pbQuarterly: number | null;
  evEbitdaTTM: number | null;
  evRevenueTTM: number | null;
  pfcfShareTTM: number | null;
  pcfShareTTM: number | null;
}

export interface MultiplesResult {
  years: MultiplesYear[];
  allYears: MultiplesYear[];
  stats: MultipleStats[];
  signal: ValuationSignal;
  companyName: string;
  industry: string;
  currentPrice: number;
  currentMetrics: CurrentMetrics;
  quarterlyTrend: QuarterlyTrendPoint[];
}

export interface MultiplesData {
  incomeStatements: any[];
  balanceSheets: any[];
  cashFlows: any[];
  profile: any;
  metrics: any;
  series: { annual?: Record<string, { period: string; v: number }[]>; quarterly?: Record<string, { period: string; v: number }[]> } | null;
  candles: { t: number[]; c: number[]; s: string } | null;
}

export const MULTIPLE_LABELS: Record<MultipleKey, string> = {
  pe: 'P/E',
  evEbitda: 'EV/EBITDA',
  evRevenue: 'EV/Revenue',
  evEbit: 'EV/EBIT',
  pb: 'P/B',
  ps: 'P/S',
  pfcf: 'P/FCF',
};

export const MULTIPLE_KEYS: MultipleKey[] = ['pe', 'evEbitda', 'evRevenue', 'evEbit', 'pb', 'ps', 'pfcf'];
