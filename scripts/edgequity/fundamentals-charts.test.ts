import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildFundamentalsChartsDocument } from './fundamentals-charts.ts';

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
});
