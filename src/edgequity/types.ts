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
  warnings: string[];
}

export type EdgequityMetricGroup =
  | 'profile'
  | 'valuation'
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
