import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  const metrics = JSON.parse(
    readFileSync(new URL('../../public/data/edgequity/raw/AAPL/metrics.json', import.meta.url), 'utf8'),
  ) as Record<string, unknown>;

  const document = buildFundamentalsChartsDocument('AAPL', null, null, metrics);

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
