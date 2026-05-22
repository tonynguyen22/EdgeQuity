import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { formatEdgequityValue, getEarningsCalendar } from './metrics.ts';

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

test('earnings calendar covers every stock in the screener universe', () => {
  const manifest = JSON.parse(readFileSync('public/data/edgequity/manifest.json', 'utf8')) as { universe: string[] };

  const missing = manifest.universe.filter((ticker) => {
    const calendar = getEarningsCalendar(ticker);
    return [
      calendar.recentPeriod,
      calendar.recentDate,
      calendar.nextPeriod,
      calendar.nextDate,
    ].some((value) => value === '-' || value === 'Research queued' || value === 'Next report');
  });

  assert.deepEqual(missing, []);
});
