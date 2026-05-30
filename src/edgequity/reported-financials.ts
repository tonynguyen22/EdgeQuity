import type {
  EdgequityFinancialStatementPeriod,
  EdgequityHistoryYear,
  EdgequityStockRecord,
} from './types';

export type ReportedStatementId = 'ic' | 'bs' | 'cf';

export interface ReportedStatementRow {
  key: string;
  label: string;
  unit: string;
  valuesByYear: Record<number, number | null>;
}

export interface SecStatementsDocument {
  schemaVersion?: number;
  ticker: string;
  cik: string | null;
  entityName: string | null;
  source: 'sec-edgar' | 'fmp' | 'static-summary';
  fetchedAt: string;
  status: 'ok' | 'no_cik' | 'no_facts' | 'missing';
  recentFilings: Array<{ form: string; filingDate: string; reportDate: string }>;
  statements: Record<ReportedStatementId, { years: number[]; rows: ReportedStatementRow[] }>;
}

const STATEMENT_LABELS: Record<ReportedStatementId, string> = {
  ic: 'Income Statement',
  bs: 'Balance Sheet',
  cf: 'Cash Flow',
};

const FMP_STATEMENT_KEYS: Record<ReportedStatementId, keyof NonNullable<EdgequityStockRecord['financialStatements']>['annual']> = {
  ic: 'incomeStatement',
  bs: 'balanceSheet',
  cf: 'cashFlow',
};

const FMP_FIELD_ORDER: Record<ReportedStatementId, string[]> = {
  ic: [
    'revenue',
    'costOfRevenue',
    'grossProfit',
    'researchAndDevelopmentExpenses',
    'sellingGeneralAndAdministrativeExpenses',
    'operatingExpenses',
    'operatingIncome',
    'interestExpense',
    'incomeBeforeTax',
    'incomeTaxExpense',
    'netIncome',
    'eps',
    'epsdiluted',
    'weightedAverageShsOutDil',
    'ebitda',
  ],
  bs: [
    'cashAndCashEquivalents',
    'shortTermInvestments',
    'cashAndShortTermInvestments',
    'netReceivables',
    'inventory',
    'totalCurrentAssets',
    'propertyPlantEquipmentNet',
    'goodwill',
    'intangibleAssets',
    'totalAssets',
    'accountPayables',
    'shortTermDebt',
    'totalCurrentLiabilities',
    'longTermDebt',
    'totalDebt',
    'totalLiabilities',
    'totalStockholdersEquity',
  ],
  cf: [
    'netIncome',
    'depreciationAndAmortization',
    'stockBasedCompensation',
    'changeInWorkingCapital',
    'netCashProvidedByOperatingActivities',
    'operatingCashFlow',
    'capitalExpenditure',
    'freeCashFlow',
    'acquisitionsNet',
    'purchasesOfInvestments',
    'salesMaturitiesOfInvestments',
    'netCashUsedForInvestingActivites',
    'debtRepayment',
    'commonStockRepurchased',
    'dividendsPaid',
    'netCashUsedProvidedByFinancingActivities',
  ],
};

const FALLBACK_FIELD_ORDER: Record<ReportedStatementId, Array<keyof EdgequityHistoryYear>> = {
  ic: ['revenue', 'grossProfit', 'operatingIncome', 'netIncome', 'sharesDiluted'],
  bs: ['totalAssets', 'totalDebt', 'totalEquity'],
  cf: ['freeCashFlow'],
};

const FIELD_LABELS: Record<string, string> = {
  revenue: 'Revenue',
  costOfRevenue: 'Cost of Revenue',
  grossProfit: 'Gross Profit',
  researchAndDevelopmentExpenses: 'Research & Development',
  sellingGeneralAndAdministrativeExpenses: 'SG&A',
  operatingExpenses: 'Operating Expenses',
  operatingIncome: 'Operating Income',
  interestExpense: 'Interest Expense',
  incomeBeforeTax: 'Income Before Tax',
  incomeTaxExpense: 'Income Tax Expense',
  netIncome: 'Net Income',
  eps: 'EPS',
  epsdiluted: 'Diluted EPS',
  weightedAverageShsOutDil: 'Diluted Shares',
  ebitda: 'EBITDA',
  cashAndCashEquivalents: 'Cash & Cash Equivalents',
  shortTermInvestments: 'Short-Term Investments',
  cashAndShortTermInvestments: 'Cash & Short-Term Investments',
  netReceivables: 'Net Receivables',
  inventory: 'Inventory',
  totalCurrentAssets: 'Total Current Assets',
  propertyPlantEquipmentNet: 'Property, Plant & Equipment',
  goodwill: 'Goodwill',
  intangibleAssets: 'Intangible Assets',
  totalAssets: 'Total Assets',
  accountPayables: 'Accounts Payable',
  shortTermDebt: 'Short-Term Debt',
  totalCurrentLiabilities: 'Total Current Liabilities',
  longTermDebt: 'Long-Term Debt',
  totalDebt: 'Total Debt',
  totalLiabilities: 'Total Liabilities',
  totalStockholdersEquity: 'Shareholders Equity',
  totalEquity: 'Total Equity',
  depreciationAndAmortization: 'Depreciation & Amortization',
  stockBasedCompensation: 'Stock-Based Compensation',
  changeInWorkingCapital: 'Change in Working Capital',
  netCashProvidedByOperatingActivities: 'Operating Cash Flow',
  operatingCashFlow: 'Operating Cash Flow',
  capitalExpenditure: 'Capital Expenditure',
  freeCashFlow: 'Free Cash Flow',
  acquisitionsNet: 'Acquisitions, Net',
  purchasesOfInvestments: 'Purchases of Investments',
  salesMaturitiesOfInvestments: 'Sales/Maturities of Investments',
  netCashUsedForInvestingActivites: 'Net Cash Used for Investing',
  debtRepayment: 'Debt Repayment',
  commonStockRepurchased: 'Share Repurchases',
  dividendsPaid: 'Dividends Paid',
  netCashUsedProvidedByFinancingActivities: 'Net Cash From Financing',
};

export function getReportedStatementLabel(id: ReportedStatementId): string {
  return STATEMENT_LABELS[id];
}

export function secStatementsUrl(ticker: string): string {
  return `/data/edgequity/raw/${encodeURIComponent(ticker.toUpperCase())}/sec-statements.json`;
}

export async function fetchReportedFinancials(ticker: string): Promise<SecStatementsDocument> {
  const response = await fetch(secStatementsUrl(ticker));
  if (!response.ok) {
    throw new Error(`SEC statements unavailable for ${ticker} (${response.status})`);
  }
  return (await response.json()) as SecStatementsDocument;
}

export function getAvailableStatements(document: Pick<SecStatementsDocument, 'statements'>): ReportedStatementId[] {
  const ids: ReportedStatementId[] = [];
  for (const id of ['ic', 'bs', 'cf'] as const) {
    if ((document.statements[id]?.rows.length ?? 0) > 0) ids.push(id);
  }
  return ids;
}

export function getStatementPivot(document: Pick<SecStatementsDocument, 'statements'>, statementId: ReportedStatementId) {
  return document.statements[statementId] ?? { years: [], rows: [] };
}

export function formatReportedMoney(value: number | null, unit = 'usd'): string {
  if (value === null) return '-';
  if (unit === 'per-share') return `$${value.toFixed(2)}`;

  const abs = Math.abs(value);
  const prefix = unit.toLowerCase() === 'usd' ? '$' : '';
  if (abs >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`;
  return `${prefix}${value.toFixed(0)}`;
}

export function formatSecSourceLine(document: SecStatementsDocument): string {
  if (document.source === 'fmp') {
    return 'annual statements from Financial Modeling Prep';
  }

  if (document.source === 'static-summary') {
    return 'summary line items from the static stock record';
  }

  const latest = document.recentFilings[0];
  const filing = latest
    ? `${latest.form} filed ${latest.filingDate.slice(0, 10)} - FY ended ${latest.reportDate.slice(0, 10)}`
    : 'annual metrics from SEC XBRL company facts';
  const cik = document.cik ? ` - CIK ${document.cik}` : '';
  return `${filing}${cik}`;
}

export function buildReportedFinancialsFromStock(stock: EdgequityStockRecord): SecStatementsDocument {
  const hasNormalizedStatements = Boolean(stock.financialStatements?.annual);
  const statements = {} as SecStatementsDocument['statements'];

  for (const statementId of ['ic', 'bs', 'cf'] as const) {
    const statementKey = FMP_STATEMENT_KEYS[statementId];
    const statementPeriods = stock.financialStatements?.annual[statementKey] ?? [];
    statements[statementId] = statementPeriods.length > 0
      ? buildRowsFromFmpPeriods(statementId, statementPeriods)
      : buildRowsFromHistory(statementId, stock.history);
  }

  const document: SecStatementsDocument = {
    schemaVersion: 3,
    ticker: stock.ticker,
    cik: null,
    entityName: stock.name,
    source: hasNormalizedStatements
      ? stock.financialStatements?.source.provider === 'sec' ? 'sec-edgar' : 'fmp'
      : 'static-summary',
    fetchedAt: stock.financialStatements?.source.fetchedAt ?? stock.sources?.summary?.fetchedAt ?? '',
    status: 'missing',
    recentFilings: [],
    statements,
  };
  document.status = getAvailableStatements(document).length > 0 ? 'ok' : 'missing';
  return document;
}

function buildRowsFromFmpPeriods(statementId: ReportedStatementId, periods: EdgequityFinancialStatementPeriod[]) {
  const years = [...new Set(periods.map(yearFromPeriod).filter((year): year is number => year !== null))]
    .sort((a, b) => b - a);
  const keys = new Set<string>();

  for (const period of periods) {
    for (const [key, value] of Object.entries(period.values)) {
      if (numericValue(value) !== null) keys.add(key);
    }
  }

  const preferred = FMP_FIELD_ORDER[statementId].filter((key) => keys.has(key));
  const remaining = [...keys].filter((key) => !preferred.includes(key)).sort();

  return {
    years,
    rows: [...preferred, ...remaining].map((key) => {
      const valuesByYear: Record<number, number | null> = {};

      for (const period of periods) {
        const year = yearFromPeriod(period);
        if (year !== null) valuesByYear[year] = numericValue(period.values[key]);
      }

      return {
        key,
        label: labelForField(key),
        unit: key.toLowerCase().includes('eps') ? 'per-share' : periodCurrency(periods),
        valuesByYear,
      };
    }),
  };
}

function buildRowsFromHistory(statementId: ReportedStatementId, history: EdgequityHistoryYear[]) {
  const years = history
    .map((period) => Number(period.year))
    .filter((year) => Number.isInteger(year))
    .sort((a, b) => b - a);

  return {
    years,
    rows: FALLBACK_FIELD_ORDER[statementId].map((key) => {
      const valuesByYear: Record<number, number | null> = {};

      for (const period of history) {
        const year = Number(period.year);
        if (Number.isInteger(year)) valuesByYear[year] = numericValue(period[key]);
      }

      return {
        key,
        label: labelForField(key),
        unit: 'usd',
        valuesByYear,
      };
    }),
  };
}

function labelForField(key: string): string {
  return FIELD_LABELS[key] ?? key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function numericValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function yearFromPeriod(period: EdgequityFinancialStatementPeriod): number | null {
  const parsed = Number(period.fiscalYear || period.date?.slice(0, 4));
  return Number.isInteger(parsed) ? parsed : null;
}

function periodCurrency(periods: EdgequityFinancialStatementPeriod[]): string {
  return periods.find((period) => period.reportedCurrency)?.reportedCurrency?.toLowerCase() ?? 'usd';
}
