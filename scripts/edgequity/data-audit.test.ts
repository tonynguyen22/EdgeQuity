import assert from 'node:assert/strict';
import test from 'node:test';

import { compareNumber, compareStatementRows, latestAnnualRowsForAudit, latestQuarterlyRowsForAudit, type AuditStatementRow } from './data-audit.ts';

test('compareNumber accepts exact and tolerance matches', () => {
  assert.equal(compareNumber('NVDA revenue', 100, 100, 0).ok, true);
  assert.equal(compareNumber('NVDA revenue', 100, 100.4, 0.01).ok, true);
  assert.equal(compareNumber('NVDA revenue', 100, 103, 0.01).ok, false);
});

test('compareStatementRows reports missing generated rows', () => {
  const publicRows: AuditStatementRow[] = [{ period: '2026', values: { revenue: 10 } }];
  const generatedRows: AuditStatementRow[] = [];
  const results = compareStatementRows('NVDA', 'annual', generatedRows, publicRows, ['revenue'], 0);
  assert.equal(results[0]?.ok, false);
  assert.match(results[0]?.message ?? '', /missing generated row/);
});

test('latestAnnualRowsForAudit maps generated annual periods', () => {
  const rows = latestAnnualRowsForAudit([
    { fiscalYear: '2026', period: 'FY', date: '2026-01-25', reportedCurrency: null, values: { revenue: 20, netIncome: 5 } },
    { fiscalYear: '2025', period: 'FY', date: '2025-01-26', reportedCurrency: null, values: { revenue: 10, netIncome: 2 } },
  ], 2);
  assert.deepEqual(rows, [
    { period: '2026', values: { revenue: 20, netIncome: 5 } },
    { period: '2025', values: { revenue: 10, netIncome: 2 } },
  ]);
});

test('latestQuarterlyRowsForAudit maps generated quarterly periods', () => {
  const rows = latestQuarterlyRowsForAudit([
    { fiscalYear: '2026', period: 'Q1', date: '2026-04-26', reportedCurrency: null, values: { totalAssets: 30 } },
  ], 1);
  assert.deepEqual(rows, [
    { period: '2026-Q1', values: { totalAssets: 30 } },
  ]);
});
