import assert from 'node:assert/strict';
import test from 'node:test';

import { buildFundamentalsChartsDocument, type FundamentalsChartPoint } from './fundamentals-charts.ts';

function periodSortKey(period: string): number {
  const quarter = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) return Number(quarter[1]) * 10 + Number(quarter[2]);
  return Number.parseInt(period.slice(0, 4), 10) * 10;
}

function isAscending(points: FundamentalsChartPoint[]): boolean {
  for (let i = 1; i < points.length; i++) {
    if (periodSortKey(points[i]!.period) < periodSortKey(points[i - 1]!.period)) return false;
  }
  return true;
}

test('buildFundamentalsChartsDocument merges SEC and Finnhub series', () => {
  const facts = {
    'us-gaap': {
      Revenues: {
        units: {
          USD: [
            { fy: 2024, fp: 'FY', form: '10-K', start: '2024-01-01', end: '2024-12-31', val: 100 },
            { fy: 2025, fp: 'FY', form: '10-K', start: '2025-01-01', end: '2025-12-31', val: 120 },
            { fy: 2025, fp: 'Q1', form: '10-Q', start: '2025-01-01', end: '2025-03-31', val: 25 },
          ],
        },
      },
      Assets: {
        units: {
          USD: [{ fy: 2025, fp: 'FY', form: '10-K', end: '2025-12-31', val: 500 }],
        },
      },
    },
  };
  const metrics = {
    series: {
      annual: {
        pe: [{ period: '2025-12-31', v: 28 }],
        grossMargin: [{ period: '2025-12-31', v: 0.45 }],
      },
      quarterly: {
        peTTM: [{ period: '2025-03-31', v: 30 }],
        grossMargin: [{ period: '2025-03-31', v: 0.46 }],
      },
    },
  };

  const document = buildFundamentalsChartsDocument('NVDA', { cik: 1, entityName: 'Demo Corp', facts }, null, metrics);

  assert.ok(document.sections.length >= 4);
  const growth = document.sections.find((section) => section.id === 'growth');
  const valuation = document.sections.find((section) => section.id === 'valuation');
  assert.ok(growth);
  assert.ok(valuation);
  assert.ok(valuation!.metrics.some((metric) => metric.id === 'pe' && metric.quarterly.length > 0));

  for (const section of document.sections) {
    for (const metric of section.metrics) {
      assert.ok(isAscending(metric.annual), `${metric.id} annual should be oldest→newest`);
      assert.ok(isAscending(metric.quarterly), `${metric.id} quarterly should be oldest→newest`);
    }
  }
});
