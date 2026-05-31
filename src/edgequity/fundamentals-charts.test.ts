import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildFundamentalsChartsFromStock } from './fundamentals-charts.ts';
import type { EdgequityStockRecord } from './types.ts';

test('NVDA quarterly revenue labels advance by fiscal year without skipping 2026', async () => {
  const stock = JSON.parse(
    await readFile('public/data/edgequity/stocks/NVDA.json', 'utf8'),
  ) as EdgequityStockRecord;
  const document = buildFundamentalsChartsFromStock(stock);
  const revenue = document.sections[0]?.metrics.find((metric) => metric.id === 'revenue');
  assert.ok(revenue);

  const labels = revenue.quarterly
    .slice()
    .sort((left, right) => (left.periodEnd ?? left.period).localeCompare(right.periodEnd ?? right.period))
    .slice(-5)
    .map((point) => point.period);

  assert.deepEqual(labels, ['2025-Q3', '2026-Q1', '2026-Q2', '2026-Q3', '2027-Q1']);
});
