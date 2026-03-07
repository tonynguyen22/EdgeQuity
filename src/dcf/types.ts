export type TabId = 'dcf' | 'financials' | 'comp' | 'grade' | 'tech' | 'earnings' | 'insider' | 'news' | 'portfolio' | 'dividend';
export type FormatUnit = 'M' | 'B';
export type ScenarioType = 'bull' | 'base' | 'bear' | 'custom';

export interface AnalystTarget {
  mean: number;
  high: number;
  low: number;
}

export interface DCFInputs {
  revGrowthStart: number;
  revGrowthEnd: number;
  ebitMarginStart: number;
  ebitMarginEnd: number;
  termGrowth: number;
  waccAdj: number;
  erp: number;
  dnaMarginProj: number;
  wcMarginProj: number;
  capexMarginProj: number;
  sharesGrowthProj: number;
  forecastYears: number;
}

export interface HistoricalYear {
  year: string;
  rev: number;
  revGrowth: number;
  gp: number;
  gpm: number;
  cogs: number;
  sga: number;
  rd: number;
  tax: number;
  interestExpense: number;
  ebit: number;
  ebitMargin: number;
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  netProfitMargin: number;
  eps: number;
  shares: number;
  totalAssets: number;
  totalLiabilities: number;
  totalDebt: number;
  totalEquity: number;
  cash: number;
  wc: number;
  cfo: number;
  cfi: number;
  cff: number;
  capex: number;
  changeInCash: number;
  dividendsPaid: number;
  debtRepayment: number;
  currentRatio: number;
  quickRatio: number;
  interestCoverage: number;
  debtToEquity: number;
  roe: number;
  roa: number;
  grossMargin: number;
  profitMargin: number;
  taxRate: number;
  ebiat: number;
  dna: number;
  deltaWc: number;
  fcff: number;
}

export interface ProjectionYear {
  year: string;
  rev: number;
  ebit: number;
  taxRate: number;
  ebiat: number;
  dna: number;
  capex: number;
  deltaWc: number;
  fcff: number;
  discountPeriod: number;
  discountedFcff: number;
  tv: number;
  discountedTv: number;
  shares: number;
}

export interface DCFResult {
  historicalSummary: HistoricalYear[];
  projections: ProjectionYear[];
  intrinsicValue: number;
  currentPrice: number;
  upside: number;
  wacc: number;
  rawWacc: number;
  baseWacc: number;
  beta: number;
  avgTaxRate: number;
  baseRev: number;
  baseEbitMargin: number;
  avgDnaMargin5yr: number;
  avgDnaMargin3yr: number;
  avgNwcMargin5yr: number;
  avgNwcMargin3yr: number;
  avgCapexMargin5yr: number;
  avgCapexMargin3yr: number;
  sharesCagr5yr: number;
  sharesCagr3yr: number;
  baseWc: number;
  ev: number;
  equityValue: number;
  marketCap: number;
  totalDebt: number;
  totalCash: number;
  sharesOut: number;
  terminalShares: number;
  revCagr3yr: number;
  revCagr5yr: number;
  maxEbitMargin5yr: number;
  sensitivityMatrix: (number | null)[][];
  waccSteps: number[];
  growthSteps: number[];
  fractionOfYear: number;
}

export interface FinancialData {
  financials: any[];
  profile: any;
  metrics: any;
}

export interface ScenarioResult {
  price: number;
  upside: number;
  ev: number;
  equityValue: number;
}

export interface ScenarioComparison {
  bear: ScenarioResult;
  base: ScenarioResult;
  bull: ScenarioResult;
}

export interface BridgeItem {
  label: string;
  value: number;
  base: number;
  type: 'add' | 'sub' | 'total';
}
