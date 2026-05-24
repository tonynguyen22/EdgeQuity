export interface EdgequityManifestStock {
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  dataPath: string;
}

export interface EdgequityManifest {
  app: 'Edgequity';
  version: number;
  generatedAt: string;
  universe: string[];
  stocks: EdgequityManifestStock[];
}

export interface EdgequityHistoryYear {
  year: string;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  freeCashFlow: number | null;
  totalAssets: number | null;
  totalDebt: number | null;
  totalEquity: number | null;
  sharesDiluted: number | null;
}

export interface EdgequityFinancialStatementPeriod {
  fiscalYear: string;
  period: string;
  date: string | null;
  reportedCurrency: string | null;
  values: Record<string, number | string | null>;
}

export interface EdgequityFinancialStatementSet {
  incomeStatement: EdgequityFinancialStatementPeriod[];
  balanceSheet: EdgequityFinancialStatementPeriod[];
  cashFlow: EdgequityFinancialStatementPeriod[];
}

export interface EdgequityFinancialStatements {
  source: EdgequityDataSource;
  annual: EdgequityFinancialStatementSet;
  quarterly?: EdgequityFinancialStatementSet;
}

export interface EdgequityStockRecord {
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  currency: string | null;
  price: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  valuation: {
    peTTM: number | null;
    forwardPE: number | null;
    psTTM: number | null;
    pb: number | null;
    evRevenue: number | null;
    evEbitda: number | null;
    pfcf: number | null;
    fcfYield: number | null;
    earningsYield: number | null;
  };
  profitability: {
    grossMargin: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    roe: number | null;
    roa: number | null;
    roic: number | null;
  };
  growth: {
    revenueCagr3y: number | null;
    revenueCagr5y: number | null;
    epsCagr3y: number | null;
    fcfCagr3y: number | null;
  };
  financialHealth: {
    currentRatio: number | null;
    quickRatio: number | null;
    debtToEquity: number | null;
    netDebtToEbitda: number | null;
    interestCoverage: number | null;
  };
  cashFlow: {
    operatingCashFlow: number | null;
    freeCashFlow: number | null;
    fcfMargin: number | null;
    capexToRevenue: number | null;
    fcfConversion: number | null;
  };
  dividends: {
    dividendYield: number | null;
    payoutRatio: number | null;
  };
  history: EdgequityHistoryYear[];
  financialStatements?: EdgequityFinancialStatements;
  warnings: string[];
  sources?: {
    profile?: EdgequityDataSource;
    metrics?: EdgequityDataSource;
    financialsReported?: EdgequityDataSource;
    summary?: EdgequityDataSource;
  };
}

export interface EdgequityDataSource {
  provider: 'fmp' | 'finnhub' | 'sec' | 'manual' | 'derived';
  endpoint?: string;
  fetchedAt?: string;
  status: 'ok' | 'partial' | 'missing' | 'error';
  message?: string;
}

export interface EdgequityAnalysisNote {
  ticker: string;
  quickTake: string;
  strengths: string[];
  watchItems: string[];
  valuationRead: string;
  bottomLine: string;
  updatedAt: string;
  research?: EdgequityResearchReportNote;
}

export interface EdgequityResearchReportNote {
  sourceLabel: string;
  sourceUrl: string;
  earningsTitle: string;
  earningsDate: string;
  earningsTakeaways: string[];
  businessSummary: string[];
  coreSegmentTitle: string;
  coreSegmentBody: string[];
  industryContext: string[];
  moatPoints: Array<{
    title: string;
    body: string;
  }>;
  forecastSummary: string;
  valuationNarrative: string;
  valuationModel?: {
    targetYears: number;
    basePriceTarget: number;
    bearPriceTarget: number;
    bullPriceTarget: number;
    method: string;
    assumptions: string[];
  };
  riskPoints: Array<{
    title: string;
    body: string;
  }>;
  finalVerdict: string;
}

export type EdgequityMetricGroup =
  | 'profile'
  | 'valuation'
  | 'margin'
  | 'profitability'
  | 'growth'
  | 'financialHealth'
  | 'cashFlow'
  | 'dividends';

export interface EdgequityColumn {
  id: string;
  label: string;
  group: EdgequityMetricGroup;
  accessor: (stock: EdgequityStockRecord) => string | number | null;
  format: 'text' | 'money' | 'number' | 'percent' | 'multiple';
  sortable: boolean;
}
