import assert from 'node:assert/strict';
import test from 'node:test';

import { buildNormalizedSecStatements, deriveQ4Rows } from './sec-normalized.ts';


test('keeps quarterly balance sheet instant facts', () => {
  const statements = buildNormalizedSecStatements({
    cik: 1045810,
    entityName: 'NVIDIA CORP',
    facts: {
      'us-gaap': {
        Revenues: {
          units: {
            USD: [
              { fy: 2027, fp: 'Q1', form: '10-Q', start: '2026-01-26', end: '2026-04-26', frame: 'CY2026Q1', val: 81_615_000_000 },
            ],
          },
        },
        Assets: {
          units: {
            USD: [
              { fy: 2027, fp: 'Q1', form: '10-Q', end: '2026-04-26', frame: 'CY2026Q1I', val: 259_474_000_000 },
            ],
          },
        },
        StockholdersEquity: {
          units: {
            USD: [
              { fy: 2027, fp: 'Q1', form: '10-Q', end: '2026-04-26', frame: 'CY2026Q1I', val: 195_474_000_000 },
            ],
          },
        },
      },
    },
  });

  assert.equal(statements.quarterly.balanceSheets.length, 1);
  assert.equal(statements.quarterly.balanceSheets[0]?.totalAssets, 259_474_000_000);
  assert.equal(statements.quarterly.balanceSheets[0]?.totalStockholdersEquity, 195_474_000_000);
});


test('deriveQ4Rows computes Q4 = Annual − Q1 − Q2 − Q3 for non-calendar FY', () => {
  // NVDA-like: FY ends in January, quarters in Apr/Jul/Oct/Jan
  const annualRows = [
    { fiscalYear: '2025', date: '2025-01-26', period: 'FY', revenue: 130_497_000_000, grossProfit: 97_858_000_000 },
    { fiscalYear: '2026', date: '2026-01-25', period: 'FY', revenue: 215_938_000_000, grossProfit: 153_463_000_000 },
  ];
  const quarterlyRows = [
    // FY2025 quarters (labeled by calendar year of end date)
    { fiscalYear: '2024', date: '2024-04-28', period: 'Q1', revenue: 26_044_000_000, grossProfit: 20_406_000_000 },
    { fiscalYear: '2024', date: '2024-07-28', period: 'Q2', revenue: 30_040_000_000, grossProfit: 22_574_000_000 },
    { fiscalYear: '2024', date: '2024-10-27', period: 'Q3', revenue: 35_082_000_000, grossProfit: 26_156_000_000 },
    // FY2026 quarters
    { fiscalYear: '2025', date: '2025-04-27', period: 'Q1', revenue: 44_062_000_000, grossProfit: 26_668_000_000 },
    { fiscalYear: '2025', date: '2025-07-27', period: 'Q2', revenue: 46_743_000_000, grossProfit: 33_853_000_000 },
    { fiscalYear: '2025', date: '2025-10-26', period: 'Q3', revenue: 57_006_000_000, grossProfit: 41_849_000_000 },
  ];

  const derived = deriveQ4Rows(annualRows, quarterlyRows, ['revenue', 'grossProfit']);

  assert.equal(derived.length, 2, 'should derive Q4 for both fiscal years');

  // FY2025 Q4: 130,497M - (26,044M + 30,040M + 35,082M) = 39,331M
  const fy2025Q4 = derived.find((r) => r.fiscalYear === '2024')!;
  assert.equal(fy2025Q4.period, 'Q4');
  assert.equal(fy2025Q4.date, '2025-01-26');
  assert.equal(fy2025Q4.revenue, 130_497_000_000 - (26_044_000_000 + 30_040_000_000 + 35_082_000_000));
  assert.equal(fy2025Q4.grossProfit, 97_858_000_000 - (20_406_000_000 + 22_574_000_000 + 26_156_000_000));

  // FY2026 Q4: 215,938M - (44,062M + 46,743M + 57,006M) = 68,127M
  const fy2026Q4 = derived.find((r) => r.fiscalYear === '2025')!;
  assert.equal(fy2026Q4.period, 'Q4');
  assert.equal(fy2026Q4.date, '2026-01-25');
  assert.equal(fy2026Q4.revenue, 215_938_000_000 - (44_062_000_000 + 46_743_000_000 + 57_006_000_000));
});


test('deriveQ4Rows computes Q4 for calendar-year companies', () => {
  const annualRows = [
    { fiscalYear: '2024', date: '2024-12-31', period: 'FY', revenue: 100_000, grossProfit: 60_000 },
  ];
  const quarterlyRows = [
    { fiscalYear: '2024', date: '2024-03-31', period: 'Q1', revenue: 20_000, grossProfit: 12_000 },
    { fiscalYear: '2024', date: '2024-06-30', period: 'Q2', revenue: 25_000, grossProfit: 15_000 },
    { fiscalYear: '2024', date: '2024-09-30', period: 'Q3', revenue: 28_000, grossProfit: 17_000 },
  ];

  const derived = deriveQ4Rows(annualRows, quarterlyRows, ['revenue', 'grossProfit']);

  assert.equal(derived.length, 1);
  const q4 = derived[0]!;
  assert.equal(q4.period, 'Q4');
  assert.equal(q4.fiscalYear, '2024');
  assert.equal(q4.date, '2024-12-31');
  assert.equal(q4.revenue, 100_000 - (20_000 + 25_000 + 28_000)); // 27,000
  assert.equal(q4.grossProfit, 60_000 - (12_000 + 15_000 + 17_000)); // 16,000
});


test('deriveQ4Rows skips when Q4 already exists', () => {
  const annualRows = [
    { fiscalYear: '2024', date: '2024-12-31', period: 'FY', revenue: 100_000 },
  ];
  const quarterlyRows = [
    { fiscalYear: '2024', date: '2024-03-31', period: 'Q1', revenue: 20_000 },
    { fiscalYear: '2024', date: '2024-06-30', period: 'Q2', revenue: 25_000 },
    { fiscalYear: '2024', date: '2024-09-30', period: 'Q3', revenue: 28_000 },
    { fiscalYear: '2024', date: '2024-12-31', period: 'Q4', revenue: 27_000 },
  ];

  const derived = deriveQ4Rows(annualRows, quarterlyRows, ['revenue']);

  assert.equal(derived.length, 0, 'should not create duplicate Q4');
});


test('deriveQ4Rows skips when a quarter metric is missing', () => {
  const annualRows = [
    { fiscalYear: '2024', date: '2024-12-31', period: 'FY', revenue: 100_000, grossProfit: 60_000 },
  ];
  const quarterlyRows = [
    { fiscalYear: '2024', date: '2024-03-31', period: 'Q1', revenue: 20_000 },
    { fiscalYear: '2024', date: '2024-06-30', period: 'Q2', revenue: 25_000, grossProfit: 15_000 },
    { fiscalYear: '2024', date: '2024-09-30', period: 'Q3', revenue: 28_000, grossProfit: 17_000 },
  ];

  const derived = deriveQ4Rows(annualRows, quarterlyRows, ['revenue', 'grossProfit']);

  assert.equal(derived.length, 1);
  const q4 = derived[0]!;
  assert.equal(q4.revenue, 100_000 - (20_000 + 25_000 + 28_000)); // revenue still derived
  assert.equal(q4.grossProfit, undefined, 'grossProfit not derived when Q1 is missing it');
});


test('buildNormalizedSecStatements derives Q4 income and cash flow for NVDA-like FY', () => {
  // Simulate NVDA FY2026 (ends Jan 2026) with 1 annual + 3 quarterly revenue facts
  const statements = buildNormalizedSecStatements({
    cik: 1045810,
    entityName: 'NVIDIA CORP',
    facts: {
      'us-gaap': {
        Revenues: {
          units: {
            USD: [
              // Annual FY2026
              { fy: 2026, fp: 'FY', form: '10-K', start: '2025-01-27', end: '2026-01-25', val: 215_938_000_000 },
              // Q1-Q3 of FY2026
              { fy: 2026, fp: 'Q1', form: '10-Q', start: '2025-01-27', end: '2025-04-27', frame: 'CY2025Q1', val: 44_062_000_000 },
              { fy: 2026, fp: 'Q2', form: '10-Q', start: '2025-04-28', end: '2025-07-27', frame: 'CY2025Q2', val: 46_743_000_000 },
              { fy: 2026, fp: 'Q3', form: '10-Q', start: '2025-07-28', end: '2025-10-26', frame: 'CY2025Q3', val: 57_006_000_000 },
            ],
          },
        },
        NetCashProvidedByUsedInOperatingActivities: {
          units: {
            USD: [
              // Annual FY2026
              { fy: 2026, fp: 'FY', form: '10-K', start: '2025-01-27', end: '2026-01-25', val: 102_718_000_000 },
              // Q1 only (SEC usually only has Q1 cumulative)
              { fy: 2026, fp: 'Q1', form: '10-Q', start: '2025-01-27', end: '2025-04-27', frame: 'CY2025Q1', val: 27_414_000_000 },
              { fy: 2026, fp: 'Q2', form: '10-Q', start: '2025-04-28', end: '2025-07-27', frame: 'CY2025Q2', val: 30_000_000_000 },
              { fy: 2026, fp: 'Q3', form: '10-Q', start: '2025-07-28', end: '2025-10-26', frame: 'CY2025Q3', val: 20_000_000_000 },
            ],
          },
        },
      },
    },
  });

  // Check Q4 income was derived
  const q4Income = statements.quarterly.incomeStatements.find((r) => r.period === 'Q4');
  assert.ok(q4Income, 'Q4 income statement row should exist');
  assert.equal(q4Income.fiscalYear, '2025');
  assert.equal(q4Income.date, '2026-01-25');
  const expectedQ4Revenue = 215_938_000_000 - (44_062_000_000 + 46_743_000_000 + 57_006_000_000);
  assert.equal(q4Income.revenue, expectedQ4Revenue, 'Q4 revenue = Annual − Q1 − Q2 − Q3');

  // Check Q4 cash flow was derived
  const q4CF = statements.quarterly.cashFlows.find((r) => r.period === 'Q4');
  assert.ok(q4CF, 'Q4 cash flow row should exist');
  assert.equal(q4CF.operatingCashFlow, 102_718_000_000 - (27_414_000_000 + 30_000_000_000 + 20_000_000_000));
});
