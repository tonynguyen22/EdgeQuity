import assert from 'node:assert/strict';
import test from 'node:test';

import { formatEdgequityValue, getEarningsCalendar } from './metrics.ts';
import type { EdgequityStockRecord } from './types.ts';

test('formatEdgequityValue returns dash for missing and invalid values', () => {
  assert.equal(formatEdgequityValue(null, 'number'), '-');
  assert.equal(formatEdgequityValue(undefined, 'number'), '-');
  assert.equal(formatEdgequityValue('', 'text'), '-');
  assert.equal(formatEdgequityValue(Number.POSITIVE_INFINITY, 'number'), '-');
});

test('formatEdgequityValue formats core Edgequity metric types', () => {
  assert.equal(formatEdgequityValue('Technology', 'text'), 'Technology');
  assert.equal(formatEdgequityValue(3_420_000_000_000, 'money'), '$3.42T');
  assert.equal(formatEdgequityValue(185_000_000_000, 'money'), '$185.0B');
  assert.equal(formatEdgequityValue(42_500_000, 'money'), '$42.5M');
  assert.equal(formatEdgequityValue(850_000, 'money'), '$850,000');
  assert.equal(formatEdgequityValue(0.264, 'percent'), '26.4%');
  assert.equal(formatEdgequityValue(28.42, 'multiple'), '28.4x');
  assert.equal(formatEdgequityValue(3.456, 'number'), '3.46');
});

test('formatEdgequityValue places negative money sign before the dollar symbol', () => {
  assert.equal(formatEdgequityValue(-1_250_000, 'money'), '-$1.3M');
  assert.equal(formatEdgequityValue(-185_000_000_000, 'money'), '-$185.0B');
});

test('formatEdgequityValue preserves cents for small money values', () => {
  assert.equal(formatEdgequityValue(0.49, 'money'), '$0.49');
  assert.equal(formatEdgequityValue(12.34, 'money'), '$12.34');
});

test('getEarningsCalendar reads stock record earnings metadata', () => {
  const calendar = getEarningsCalendar({
    ...baseStock,
    earnings: {
      recent: { period: 'Q1 FY2027', date: '2026-05-20', source: 'Finnhub', sourceUrl: 'https://finnhub.io' },
      next: { period: 'Q2 FY2027', date: '2026-08-26', isEstimated: true, source: 'DoltHub', sourceUrl: 'https://www.dolthub.com/repositories/post-no-preference/earnings' },
      updatedAt: '2026-05-25T00:00:00.000Z',
    },
  });

  assert.deepEqual(calendar, {
    recentPeriod: 'Q1 FY2027',
    recentDate: '2026-05-20',
    nextPeriod: 'Q2 FY2027',
    nextDate: '2026-08-26',
    updatedAt: '2026-05-25',
  });
});

test('getEarningsCalendar returns queued labels when earnings metadata is missing', () => {
  assert.deepEqual(getEarningsCalendar(baseStock), {
    recentPeriod: 'Research queued',
    recentDate: '-',
    nextPeriod: 'Next report',
    nextDate: '-',
    updatedAt: '-',
  });
});

const baseStock: EdgequityStockRecord = {
  ticker: 'NVDA',
  name: 'NVIDIA Corp',
  sector: 'AI Infrastructure',
  industry: 'AI Semiconductors',
  currency: 'USD',
  price: null,
  marketCap: 100,
  enterpriseValue: 110,
  valuation: { peTTM: null, forwardPE: null, psTTM: null, pb: null, evRevenue: null, evEbitda: null, pfcf: null, fcfYield: null, earningsYield: null },
  profitability: { grossMargin: null, operatingMargin: null, netMargin: null, roe: null, roa: null, roic: null },
  growth: { revenueCagr3y: null, revenueCagr5y: null, epsCagr3y: null, fcfCagr3y: null },
  financialHealth: { currentRatio: null, quickRatio: null, debtToEquity: null, netDebtToEbitda: null, interestCoverage: null },
  cashFlow: { operatingCashFlow: null, freeCashFlow: null, fcfMargin: null, capexToRevenue: null, fcfConversion: null },
  dividends: { dividendYield: null, payoutRatio: null },
  history: [],
  warnings: [],
};
