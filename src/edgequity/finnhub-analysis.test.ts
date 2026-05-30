import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertFinnhubSnapshot,
  buildAnalysisChartSeries,
  buildCompanyDescriptionFallback,
  getFinnhubRatioCatalog,
  isInProgressFiscalYear,
} from './finnhub-analysis.ts';
import type { EdgequityFinnhubSnapshot } from './types.ts';

test('assertFinnhubSnapshot accepts a valid snapshot', () => {
  const snapshot: EdgequityFinnhubSnapshot = {
    ticker: 'NVDA',
    fetchedAt: '2026-05-27T12:00:00.000Z',
    profile: { ticker: 'NVDA', name: 'NVIDIA Corp' },
    quote: { c: 120.5, pc: 118.2 },
    metrics: { metric: { peTTM: 31.4 }, series: { annual: { eps: [{ period: '2025-12-31', v: 4.25 }] } } },
    cache: { profile: 'hit', quote: 'miss', metrics: 'stale' },
  };

  assert.deepEqual(assertFinnhubSnapshot(snapshot), snapshot);
});

test('buildCompanyDescriptionFallback returns exact NVDA fallback sentence', () => {
  assert.equal(
    buildCompanyDescriptionFallback({
      name: 'NVIDIA Corp',
      finnhubIndustry: 'Semiconductors',
      exchange: 'NASDAQ NMS - GLOBAL MARKET',
    }),
    'NVIDIA Corp is a Semiconductors company listed on NASDAQ NMS - GLOBAL MARKET.',
  );
});

test('getFinnhubRatioCatalog includes required ratio definitions', () => {
  const ids = getFinnhubRatioCatalog().map((ratio) => ratio.id);

  const requiredIds = [
    'eps',
    'ebitda',
    'grossMargin',
    'operatingMargin',
    'netMargin',
    'fcfMargin',
    'roa',
    'roe',
    'roic',
    'currentRatio',
    'quickRatio',
    'cashRatio',
    'totalDebtToEquity',
    'pe',
    'peTTM',
    'pb',
    'ps',
    'evEbitda',
    'evEbitdaTTM',
    'evRevenue',
    'pfcf',
    'bookValue',
    'salesPerShare',
  ];

  for (const id of requiredIds) {
    assert.ok(ids.includes(id), `Expected Finnhub ratio catalog to include ${id}`);
  }
});

test('buildAnalysisChartSeries returns latest five annual points oldest-to-newest', () => {
  const snapshot = buildSnapshot({
    annual: {
      eps: [
        { period: '2020-12-31', v: 1 },
        { period: '2021-12-31', v: 2 },
        { period: '2022-12-31', v: 3 },
        { period: '2023-12-31', v: 4 },
        { period: '2024-12-31', v: 5 },
        { period: '2025-12-31', v: 6 },
      ],
    },
  });

  assert.deepEqual(
    buildAnalysisChartSeries(snapshot, 'eps', 'annual', 5, new Date('2025-05-27T12:00:00Z')),
    [
      { period: '2021-12-31', value: 2, inProgress: false },
      { period: '2022-12-31', value: 3, inProgress: false },
      { period: '2023-12-31', value: 4, inProgress: false },
      { period: '2024-12-31', value: 5, inProgress: false },
      { period: '2025-12-31', value: 6, inProgress: true },
    ],
  );
});

test('buildAnalysisChartSeries returns empty array when selected series is not an array', () => {
  const snapshot = buildSnapshot({
    annual: {
      eps: { period: '2025-12-31', v: 6 },
    } as unknown as EdgequityFinnhubSnapshot['metrics']['series']['annual'],
  });

  assert.deepEqual(buildAnalysisChartSeries(snapshot, 'eps', 'annual', 5), []);
});

test('buildAnalysisChartSeries returns latest twenty quarterly points oldest-to-newest', () => {
  const points = Array.from({ length: 24 }, (_, index) => ({
    period: `202${Math.floor(index / 4)}-Q${(index % 4) + 1}`,
    v: index + 1,
  }));
  const snapshot = buildSnapshot({ quarterly: { grossMargin: points } });

  assert.deepEqual(
    buildAnalysisChartSeries(snapshot, 'grossMargin', 'quarterly', 20).map((point) => point.value),
    Array.from({ length: 20 }, (_, index) => index + 5),
  );
});

test('isInProgressFiscalYear detects current UTC fiscal year periods after now', () => {
  assert.equal(isInProgressFiscalYear('2026-12-31', new Date('2026-05-27T12:00:00Z')), true);
  assert.equal(isInProgressFiscalYear('2025-12-31', new Date('2026-05-27T12:00:00Z')), false);
});

function buildSnapshot(series: NonNullable<EdgequityFinnhubSnapshot['metrics']['series']>): EdgequityFinnhubSnapshot {
  return {
    ticker: 'NVDA',
    fetchedAt: '2026-05-27T12:00:00.000Z',
    profile: {},
    quote: {},
    metrics: { series },
    cache: { profile: 'hit', quote: 'hit', metrics: 'hit' },
  };
}
