import assert from 'node:assert/strict';
import test from 'node:test';

import { pickAuditSample } from './audit-sample.ts';

test('pickAuditSample is deterministic for a seed', () => {
  const universe = ['NVDA', 'AMD', 'MSFT', 'GOOG', 'AMZN', 'META', 'PLTR', 'TSLA'];
  assert.deepEqual(pickAuditSample(universe, 4, '2026-05-31'), pickAuditSample(universe, 4, '2026-05-31'));
});

test('pickAuditSample always keeps required tickers first when present', () => {
  const universe = ['AMD', 'MSFT', 'NVDA', 'GOOG', 'AMZN', 'META'];
  assert.deepEqual(pickAuditSample(universe, 3, 'seed', ['NVDA', 'MSFT']).slice(0, 2), ['NVDA', 'MSFT']);
});

test('pickAuditSample dedupes and caps size', () => {
  const universe = ['A', 'A', 'B', 'C', 'D'];
  const sample = pickAuditSample(universe, 3, 'seed', ['B', 'B']);
  assert.equal(sample.length, 3);
  assert.equal(new Set(sample).size, 3);
});
