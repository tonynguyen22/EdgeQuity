export interface ThreeStmtInputs {
  revenueGrowths: number[];      // % growth per year
  cogsPercent: number;           // COGS as % of revenue
  sgaPercent: number;            // SG&A as % of revenue
  daPercent: number;             // D&A as % of revenue
  interestRate: number;          // Interest rate on debt %
  taxRate: number;               // Effective tax rate %
  capexPercent: number;          // CapEx as % of revenue
  dso: number;                   // Days Sales Outstanding
  dio: number;                   // Days Inventory Outstanding
  dpo: number;                   // Days Payable Outstanding
  dividendPayout: number;        // Dividends as % of Net Income
  debtRepayment: number;         // Annual debt repayment ($M)
  newDebt: number;               // New debt issuance ($M)
  forecastYears: number;
}

export interface HistoricalBase {
  year: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  sga: number;
  da: number;
  ebit: number;
  interestExpense: number;
  ebt: number;
  tax: number;
  netIncome: number;
  totalAssets: number;
  totalDebt: number;
  cash: number;
  ppe: number;
  receivables: number;
  inventory: number;
  payables: number;
  totalEquity: number;
  capex: number;
  cfo: number;
  cfi: number;
  cff: number;
}

export interface ForecastRow extends HistoricalBase {
  isProjected: boolean;
  revenueGrowth: number;
  grossMargin: number;
  ebitMargin: number;
  netMargin: number;
  fcf: number;
  wcChange: number;
}
