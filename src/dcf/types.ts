export type TabId = 'dcf' | 'ddm' | 'comp' | 'grade' | 'multiples' | 'three-stmt' | 'tech' | 'cycle' | 'earnings' | 'insider' | 'news' | 'dividend';
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
  // Income Statement
  rev: number;
  revGrowth: number;
  cogs: number;
  gp: number;
  gpm: number;
  rd: number;
  sga: number;
  otherExpenses: number;
  operatingExpenses: number;
  ebit: number;
  ebitMargin: number;
  dna: number;
  ebitda: number;
  ebitdaMargin: number;
  interestIncome: number;
  interestExpense: number;
  incomeBeforeTax: number;
  tax: number;
  netIncome: number;
  netProfitMargin: number;
  eps: number;
  epsDiluted: number;
  shares: number;
  sharesDiluted: number;
  // Balance Sheet
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  ppNet: number;
  goodwill: number;
  intangibleAssets: number;
  longTermInvestments: number;
  totalNonCurrentAssets: number;
  totalAssets: number;
  accountPayables: number;
  shortTermDebt: number;
  deferredRevenue: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  totalNonCurrentLiabilities: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  totalDebt: number;
  netDebt: number;
  cash: number;
  wc: number;
  // Cash Flow
  cfNetIncome: number;
  cfDna: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  cfo: number;
  capex: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  cfi: number;
  debtRepayment: number;
  commonStockRepurchased: number;
  dividendsPaid: number;
  cff: number;
  freeCashFlow: number;
  changeInCash: number;
  // Derived ratios
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
  warnings: string[];
  sensitivityMatrix: (number | null)[][];
  waccSteps: number[];
  growthSteps: number[];
  fractionOfYear: number;
}

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  filingDate: string;
  acceptedDate: string;
  fiscalYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  netInterestIncome: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebit: number;
  nonOperatingIncomeExcludingInterest: number;
  operatingIncome: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeTaxExpense: number;
  netIncomeFromContinuingOperations: number;
  netIncomeFromDiscontinuedOperations: number;
  otherAdjustmentsToNetIncome: number;
  netIncome: number;
  netIncomeDeductions: number;
  bottomLineNetIncome: number;
  eps: number;
  epsDiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
}

export interface FMPBalanceSheet {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  filingDate: string;
  acceptedDate: string;
  fiscalYear: string;
  period: string;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  accountsReceivables: number;
  otherReceivables: number;
  inventory: number;
  prepaids: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  propertyPlantEquipmentNet: number;
  goodwill: number;
  intangibleAssets: number;
  goodwillAndIntangibleAssets: number;
  longTermInvestments: number;
  taxAssets: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  otherAssets: number;
  totalAssets: number;
  totalPayables: number;
  accountPayables: number;
  otherPayables: number;
  accruedExpenses: number;
  shortTermDebt: number;
  capitalLeaseObligationsCurrent: number;
  taxPayables: number;
  deferredRevenue: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  deferredRevenueNonCurrent: number;
  deferredTaxLiabilitiesNonCurrent: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  otherLiabilities: number;
  capitalLeaseObligations: number;
  totalLiabilities: number;
  treasuryStock: number;
  preferredStock: number;
  commonStock: number;
  retainedEarnings: number;
  additionalPaidInCapital: number;
  accumulatedOtherComprehensiveIncomeLoss: number;
  otherTotalStockholdersEquity: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  minorityInterest: number;
  totalLiabilitiesAndTotalEquity: number;
  totalInvestments: number;
  totalDebt: number;
  netDebt: number;
}

export interface FMPCashFlow {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  filingDate: string;
  acceptedDate: string;
  fiscalYear: string;
  period: string;
  netIncome: number;
  depreciationAndAmortization: number;
  deferredIncomeTax: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  accountsReceivables: number;
  inventory: number;
  accountsPayables: number;
  otherWorkingCapital: number;
  otherNonCashItems: number;
  netCashProvidedByOperatingActivities: number;
  investmentsInPropertyPlantAndEquipment: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  otherInvestingActivities: number;
  netCashProvidedByInvestingActivities: number;
  netDebtIssuance: number;
  longTermNetDebtIssuance: number;
  shortTermNetDebtIssuance: number;
  netStockIssuance: number;
  netCommonStockIssuance: number;
  commonStockIssuance: number;
  commonStockRepurchased: number;
  netPreferredStockIssuance: number;
  netDividendsPaid: number;
  commonDividendsPaid: number;
  preferredDividendsPaid: number;
  otherFinancingActivities: number;
  netCashProvidedByFinancingActivities: number;
  effectOfForexChangesOnCash: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  incomeTaxesPaid: number;
  interestPaid: number;
}

export interface FinancialData {
  incomeStatements: FMPIncomeStatement[];
  balanceSheets: FMPBalanceSheet[];
  cashFlows: FMPCashFlow[];
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

export const SUPPORTED_TICKERS = [
  'AAPL', 'TSLA', 'AMZN', 'MSFT', 'NVDA', 'GOOGL', 'META', 'NFLX',
  'JPM', 'V', 'BAC', 'PYPL', 'DIS', 'T', 'PFE', 'COST',
  'INTC', 'KO', 'TGT', 'NKE', 'SPY', 'BA', 'BABA', 'XOM',
  'WMT', 'GE', 'CSCO', 'VZ', 'JNJ', 'CVX', 'PLTR', 'SQ',
  'SHOP', 'SBUX', 'SOFI', 'HOOD', 'RBLX', 'SNAP', 'AMD', 'UBER',
  'FDX', 'ABBV', 'ETSY', 'MRNA', 'LMT', 'GM', 'F', 'LCID',
  'CCL', 'DAL', 'UAL', 'AAL', 'TSM', 'SONY', 'ET', 'MRO',
  'COIN', 'RIVN', 'RIOT', 'CPRX', 'VWO', 'SPYG', 'NOK', 'ROKU',
  'VIAC', 'ATVI', 'BIDU', 'DOCU', 'ZM', 'PINS', 'TLRY', 'WBA',
  'MGM', 'NIO', 'C', 'GS', 'WFC', 'ADBE', 'PEP', 'UNH',
  'CARR', 'HCA', 'TWTR', 'BILI', 'SIRI', 'FUBO', 'RKT',
] as const;

export type SupportedTicker = typeof SUPPORTED_TICKERS[number];
