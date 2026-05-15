import assert from 'node:assert/strict';
import test from 'node:test';

import { formatFundraValue } from './metrics.ts';

test('formatFundraValue returns dash for missing and invalid values', () => {
  assert.equal(formatFundraValue(null, 'number'), '-');
  assert.equal(formatFundraValue(undefined, 'number'), '-');
  assert.equal(formatFundraValue('', 'text'), '-');
  assert.equal(formatFundraValue(Number.POSITIVE_INFINITY, 'number'), '-');
});

test('formatFundraValue formats core Fundra metric types', () => {
  assert.equal(formatFundraValue('Technology', 'text'), 'Technology');
  assert.equal(formatFundraValue(3_420_000_000_000, 'money'), '$3.42T');
  assert.equal(formatFundraValue(185_000_000_000, 'money'), '$185.0B');
  assert.equal(formatFundraValue(42_500_000, 'money'), '$42.5M');
  assert.equal(formatFundraValue(850_000, 'money'), '$850,000');
  assert.equal(formatFundraValue(0.264, 'percent'), '26.4%');
  assert.equal(formatFundraValue(28.42, 'multiple'), '28.4x');
  assert.equal(formatFundraValue(3.456, 'number'), '3.46');
});

test('formatFundraValue places negative money sign before the dollar symbol', () => {
  assert.equal(formatFundraValue(-1_250_000, 'money'), '-$1.3M');
  assert.equal(formatFundraValue(-185_000_000_000, 'money'), '-$185.0B');
});

test('formatFundraValue preserves cents for small money values', () => {
  assert.equal(formatFundraValue(0.49, 'money'), '$0.49');
  assert.equal(formatFundraValue(12.34, 'money'), '$12.34');
});
