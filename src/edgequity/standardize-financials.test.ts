import assert from 'node:assert/strict';
import test from 'node:test';

import type { FundamentalsChartsDocument } from './fundamentals-charts.ts';
import {
  buildFinancialStatementsFromCharts,
  coalesceFundamentalsChartsDocument,
  verifyRevenueAgainstHistory,
} from './standardize-financials.ts';
import type { EdgequityStockRecord } from './types.ts';

const nvdaCharts: FundamentalsChartsDocument = {
  schemaVersion: 2,
  ticker: 'NVDA',
  source: 'sec-edgar+finnhub',
  fetchedAt: '2026-05-22T00:00:00.000Z',
  status: 'ok',
  sections: [
    {
      id: 'growth',
      title: 'Growth',
      description: 'Growth',
      metrics: [
        {
          id: 'revenue',
          label: 'Revenue',
          description: 'Revenue',
          format: 'money',
          annual: [
            { period: '2025', value: 130_497_000_000 },
            { period: '2026', value: 215_938_000_000 },
          ],
          quarterly: [
            { period: '2026-Q1', value: 26_044_000_000 },
            { period: '2026-Q2', value: 30_040_000_000 },
          ],
        },
        {
          id: 'netIncome',
          label: 'Net income',
          description: 'Net income',
          format: 'money',
          annual: [{ period: '2026', value: 120_067_000_000 }],
          quarterly: [{ period: '2026-Q2', value: 27_000_000_000 }],
        },
      ],
    },
  ],
};

const thinStock: EdgequityStockRecord = {
  ticker: 'NVDA',
  name: 'NVIDIA Corp',
  sector: 'Technology',
  industry: 'Semiconductors',
  currency: 'USD',
  price: 200,
  marketCap: 1,
  enterpriseValue: 1,
  valuation: {
    peTTM: 50,
    forwardPE: null,
    psTTM: null,
    pb: null,
    evRevenue: null,
    evEbitda: null,
    pfcf: null,
    fcfYield: null,
    earningsYield: null,
  },
  profitability: {
    grossMargin: null,
    operatingMargin: null,
    netMargin: null,
    roe: null,
    roa: null,
    roic: null,
  },
  growth: {
    revenueCagr3y: null,
    revenueCagr5y: null,
    epsCagr3y: null,
    fcfCagr3y: null,
  },
  financialHealth: {
    currentRatio: null,
    quickRatio: null,
    debtToEquity: null,
    netDebtToEbitda: null,
    interestCoverage: null,
  },
  cashFlow: {
    operatingCashFlow: null,
    freeCashFlow: null,
    fcfMargin: null,
    capexToRevenue: null,
    fcfConversion: null,
  },
  dividends: {
    dividendYield: null,
    payoutRatio: null,
  },
  history: [
    {
      year: 'FY2026',
      revenue: 215_938_000_000,
      grossProfit: null,
      operatingIncome: null,
      netIncome: null,
      freeCashFlow: null,
      totalAssets: null,
      totalDebt: null,
      totalEquity: null,
      sharesDiluted: null,
    },
  ],
  warnings: [],
};

test('buildFinancialStatementsFromCharts maps revenue and quarterly periods', () => {
  const statements = buildFinancialStatementsFromCharts(nvdaCharts);
  assert.ok(statements);
  assert.equal(statements.annual.incomeStatement.at(-1)?.values.revenue, 215_938_000_000);
  assert.equal(statements.quarterly?.incomeStatement.at(-1)?.period, 'Q2');
  assert.equal(statements.quarterly?.incomeStatement.at(-1)?.fiscalYear, '2026');
});

test('coalesceFundamentalsChartsDocument prefers richer cached charts', () => {
  const merged = coalesceFundamentalsChartsDocument(thinStock, nvdaCharts);
  assert.equal(merged.sections[0]?.metrics[0]?.quarterly.length, 2);
});

test('verifyRevenueAgainstHistory accepts NVDA FY2026 revenue', () => {
  const result = verifyRevenueAgainstHistory(thinStock, nvdaCharts);
  assert.equal(result.ok, true);
  assert.equal(result.chartRevenue, 215_938_000_000);
  assert.equal(result.historyRevenue, 215_938_000_000);
});
