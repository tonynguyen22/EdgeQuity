import type {
  EdgequityFinancialStatementPeriod,
  EdgequityFinancialStatementSet,
  EdgequityFinancialStatements,
  EdgequityStockRecord,
} from './types';
import {
  buildFundamentalsChartsFromStock,
  type FundamentalsChartsDocument,
  type FundamentalsChartMetric,
} from './fundamentals-charts';

/** Maps standardized chart metric ids to FMP-style statement line keys. */
const CHART_METRIC_TO_STATEMENT_FIELD: Record<
  string,
  { statement: keyof EdgequityFinancialStatementSet; field: string }
> = {
  revenue: { statement: 'incomeStatement', field: 'revenue' },
  grossProfit: { statement: 'incomeStatement', field: 'grossProfit' },
  operatingIncome: { statement: 'incomeStatement', field: 'operatingIncome' },
  pretaxIncome: { statement: 'incomeStatement', field: 'incomeBeforeTax' },
  netIncome: { statement: 'incomeStatement', field: 'netIncome' },
  eps: { statement: 'incomeStatement', field: 'epsdiluted' },
  totalAssets: { statement: 'balanceSheet', field: 'totalAssets' },
  cash: { statement: 'balanceSheet', field: 'cashAndCashEquivalents' },
  receivables: { statement: 'balanceSheet', field: 'netReceivables' },
  inventory: { statement: 'balanceSheet', field: 'inventory' },
  equity: { statement: 'balanceSheet', field: 'totalStockholdersEquity' },
  shortTermDebt: { statement: 'balanceSheet', field: 'shortTermDebt' },
  longTermDebt: { statement: 'balanceSheet', field: 'longTermDebt' },
  freeCashFlow: { statement: 'cashFlow', field: 'freeCashFlow' },
  operatingCashFlow: { statement: 'cashFlow', field: 'operatingCashFlow' },
  capex: { statement: 'cashFlow', field: 'capitalExpenditure' },
};

function parseChartPeriod(period: string): { fiscalYear: string; period: string } | null {
  const quarter = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) {
    return { fiscalYear: quarter[1]!, period: `Q${quarter[2]}` };
  }

  const year = period.match(/^(\d{4})$/);
  if (year) {
    return { fiscalYear: year[1]!, period: 'FY' };
  }

  const fiscalYear = period.match(/^FY(\d{4})$/i);
  if (fiscalYear) {
    return { fiscalYear: fiscalYear[1]!, period: 'FY' };
  }

  return null;
}

function upsertPeriod(
  bucket: Map<string, EdgequityFinancialStatementPeriod>,
  periodKey: string,
  parsed: { fiscalYear: string; period: string },
): EdgequityFinancialStatementPeriod {
  const existing = bucket.get(periodKey);
  if (existing) return existing;

  const created: EdgequityFinancialStatementPeriod = {
    fiscalYear: parsed.fiscalYear,
    period: parsed.period,
    date: null,
    reportedCurrency: 'USD',
    values: {},
  };
  bucket.set(periodKey, created);
  return created;
}

function applyMetricPoints(
  buckets: Record<keyof EdgequityFinancialStatementSet, Map<string, EdgequityFinancialStatementPeriod>>,
  metric: FundamentalsChartMetric,
  cadence: 'annual' | 'quarterly',
): void {
  const mapping = CHART_METRIC_TO_STATEMENT_FIELD[metric.id];
  if (!mapping) return;

  const points = cadence === 'annual' ? metric.annual : metric.quarterly;
  for (const point of points) {
    const parsed = parseChartPeriod(point.period);
    if (!parsed || !Number.isFinite(point.value)) continue;

    const periodKey = `${parsed.fiscalYear}:${parsed.period}`;
    const row = upsertPeriod(buckets[mapping.statement], periodKey, parsed);
    row.values[mapping.field] = point.value;
  }
}

function setToSortedArray(bucket: Map<string, EdgequityFinancialStatementPeriod>): EdgequityFinancialStatementPeriod[] {
  return [...bucket.values()].sort((left, right) => {
    const leftRank = Number(left.fiscalYear) * 4 + (left.period === 'FY' ? 4 : Number(left.period.replace(/^Q/i, '')));
    const rightRank = Number(right.fiscalYear) * 4 + (right.period === 'FY' ? 4 : Number(right.period.replace(/^Q/i, '')));
    return leftRank - rightRank;
  });
}

export function buildFinancialStatementsFromCharts(
  document: FundamentalsChartsDocument,
): EdgequityFinancialStatements | null {
  const annualBuckets: Record<keyof EdgequityFinancialStatementSet, Map<string, EdgequityFinancialStatementPeriod>> = {
    incomeStatement: new Map(),
    balanceSheet: new Map(),
    cashFlow: new Map(),
  };
  const quarterlyBuckets: Record<keyof EdgequityFinancialStatementSet, Map<string, EdgequityFinancialStatementPeriod>> = {
    incomeStatement: new Map(),
    balanceSheet: new Map(),
    cashFlow: new Map(),
  };

  for (const section of document.sections) {
    for (const metric of section.metrics) {
      applyMetricPoints(annualBuckets, metric, 'annual');
      applyMetricPoints(quarterlyBuckets, metric, 'quarterly');
    }
  }

  const annual: EdgequityFinancialStatementSet = {
    incomeStatement: setToSortedArray(annualBuckets.incomeStatement),
    balanceSheet: setToSortedArray(annualBuckets.balanceSheet),
    cashFlow: setToSortedArray(annualBuckets.cashFlow),
  };
  const quarterly: EdgequityFinancialStatementSet = {
    incomeStatement: setToSortedArray(quarterlyBuckets.incomeStatement),
    balanceSheet: setToSortedArray(quarterlyBuckets.balanceSheet),
    cashFlow: setToSortedArray(quarterlyBuckets.cashFlow),
  };

  const hasAnnual =
    annual.incomeStatement.length > 0 || annual.balanceSheet.length > 0 || annual.cashFlow.length > 0;
  if (!hasAnnual) return null;

  const hasQuarterly =
    quarterly.incomeStatement.length > 0 || quarterly.balanceSheet.length > 0 || quarterly.cashFlow.length > 0;

  return {
    source: {
      provider: 'sec',
      endpoint: 'fundamentals-charts.json',
      fetchedAt: document.fetchedAt,
      status: document.status === 'missing' ? 'missing' : 'ok',
    },
    annual,
    quarterly: hasQuarterly ? quarterly : undefined,
  };
}

function countChartPoints(document: FundamentalsChartsDocument): number {
  return document.sections.reduce(
    (total, section) =>
      total + section.metrics.reduce((metricTotal, metric) => metricTotal + metric.annual.length + metric.quarterly.length, 0),
    0,
  );
}

export function coalesceFundamentalsChartsDocument(
  stock: EdgequityStockRecord,
  cached: FundamentalsChartsDocument,
): FundamentalsChartsDocument {
  const fromStock = buildFundamentalsChartsFromStock(stock);
  if (fromStock.sections.length === 0) return cached;
  if (countChartPoints(cached) >= countChartPoints(fromStock)) return cached;
  return fromStock;
}

export function enrichStockWithChartsFinancials(
  stock: EdgequityStockRecord,
  charts: FundamentalsChartsDocument,
): EdgequityStockRecord {
  const fromCharts = buildFinancialStatementsFromCharts(charts);
  if (!fromCharts) return stock;

  const existingPoints = stock.financialStatements
    ? countChartPoints(buildFundamentalsChartsFromStock({ ...stock, financialStatements: stock.financialStatements }))
    : 0;
  const chartPoints = countChartPoints(charts);
  if (stock.financialStatements && existingPoints >= chartPoints) {
    return stock;
  }

  return {
    ...stock,
    financialStatements: fromCharts,
  };
}

export function latestAnnualRevenueFromCharts(charts: FundamentalsChartsDocument): number | null {
  const revenue = charts.sections
    .find((section) => section.id === 'growth')
    ?.metrics.find((metric) => metric.id === 'revenue');
  const latest = revenue?.annual.at(-1);
  return latest && Number.isFinite(latest.value) ? latest.value : null;
}

export function verifyRevenueAgainstHistory(
  stock: EdgequityStockRecord,
  charts: FundamentalsChartsDocument,
  toleranceRatio = 0.02,
): { ok: boolean; chartRevenue: number | null; historyRevenue: number | null } {
  const chartRevenue = latestAnnualRevenueFromCharts(charts);
  const historyRevenue = stock.history[0]?.revenue ?? null;
  if (chartRevenue === null || historyRevenue === null) {
    return { ok: chartRevenue === historyRevenue, chartRevenue, historyRevenue };
  }

  const delta = Math.abs(chartRevenue - historyRevenue) / Math.max(historyRevenue, 1);
  return { ok: delta <= toleranceRatio, chartRevenue, historyRevenue };
}
