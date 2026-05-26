import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSecStatementsDocument,
  classifySecConcept,
  findConceptSeries,
  pickAnnualUsdValues,
} from './sec-edgar.ts';
import {
  formatReportedMoney,
  getAvailableStatements,
  getStatementPivot,
  type SecStatementsDocument,
} from '../../src/edgequity/reported-financials.ts';

test('buildSecStatementsDocument maps revenue and net income from SEC facts', () => {
  const facts = {
    cik: 1,
    entityName: 'Demo Corp',
    facts: {
      'us-gaap': {
        Revenues: {
          label: 'Revenues',
          units: {
            USD: [
              { fy: 2024, end: '2024-12-31', val: 100, fp: 'FY', form: '10-K' },
              { fy: 2025, end: '2025-12-31', val: 120, fp: 'FY', form: '10-K' },
            ],
          },
        },
        NetIncomeLoss: {
          label: 'Net Income',
          units: {
            USD: [{ fy: 2025, end: '2025-12-31', val: 20, fp: 'FY', form: '10-K' }],
          },
        },
        Assets: {
          label: 'Assets',
          units: {
            USD: [{ fy: 2025, end: '2025-12-31', val: 500, fp: 'FY', form: '10-K' }],
          },
        },
      },
    },
  };

  const doc = buildSecStatementsDocument('DEMO', facts, '0000000001', [
    { form: '10-K', filingDate: '2026-03-01', reportDate: '2025-12-31' },
  ]);

  assert.equal(doc.status, 'ok');
  assert.equal(doc.schemaVersion, 2);
  assert.ok(doc.statements.ic.rows.some((r) => r.label.includes('Revenue')));
  assert.equal(doc.statements.ic.rows.find((r) => r.concept === 'Revenues')?.valuesByYear[2025], 120);
});

test('classifySecConcept routes cash flow and balance sheet tags', () => {
  assert.equal(classifySecConcept('NetCashProvidedByUsedInOperatingActivities', 'Operating cash flow'), 'cf');
  assert.equal(classifySecConcept('Assets', 'Assets'), 'bs');
  assert.equal(classifySecConcept('Revenues', 'Revenues'), 'ic');
  assert.equal(classifySecConcept('EntityRegistrantName', 'Registrant'), null);
});

test('SEC dump builder classifies statement concepts from an in-memory fixture', () => {
  const facts = {
    cik: 1,
    entityName: 'Demo Corp',
    facts: {
      'us-gaap': {
        Revenues: { label: 'Revenues', units: { USD: [{ fy: 2025, end: '2025-12-31', val: 120, fp: 'FY', form: '10-K' }] } },
        GrossProfit: { label: 'Gross Profit', units: { USD: [{ fy: 2025, end: '2025-12-31', val: 70, fp: 'FY', form: '10-K' }] } },
        Assets: { label: 'Assets', units: { USD: [{ fy: 2025, end: '2025-12-31', val: 500, fp: 'FY', form: '10-K' }] } },
        StockholdersEquity: { label: 'Stockholders Equity', units: { USD: [{ fy: 2025, end: '2025-12-31', val: 300, fp: 'FY', form: '10-K' }] } },
        NetCashProvidedByUsedInOperatingActivities: { label: 'Operating Cash Flow', units: { USD: [{ fy: 2025, end: '2025-12-31', val: 40, fp: 'FY', form: '10-K' }] } },
        PaymentsToAcquirePropertyPlantAndEquipment: { label: 'Capital Expenditures', units: { USD: [{ fy: 2025, end: '2025-12-31', val: 10, fp: 'FY', form: '10-K' }] } },
      },
    },
  };
  const doc = buildSecStatementsDocument('DEMO', facts, '0000000001', []);
  assert.ok(doc.statements.ic.rows.length >= 2);
  assert.ok(doc.statements.bs.rows.length >= 2);
  assert.ok(doc.statements.cf.rows.length >= 2);
});

test('formatReportedMoney scales large USD values', () => {
  assert.equal(formatReportedMoney(2_410_000_000), '$2.41B');
  assert.equal(formatReportedMoney(null), '-');
});

test('statement pivot loads annual rows for UI', () => {
  const document: SecStatementsDocument = {
    schemaVersion: 2,
    ticker: 'ASML',
    cik: '0000937966',
    entityName: 'ASML Holding N.V.',
    source: 'sec-edgar',
    fetchedAt: '2026-05-25T00:00:00.000Z',
    status: 'ok',
    recentFilings: [],
    statements: {
      ic: {
        years: [2023, 2024, 2025],
        rows: [
          { key: 'us-gaap:Revenues', label: 'Revenues', unit: 'usd', valuesByYear: { 2023: 1, 2024: 2, 2025: 3 } },
          { key: 'us-gaap:NetIncomeLoss', label: 'Net Income', unit: 'usd', valuesByYear: { 2023: 1, 2024: 2, 2025: 3 } },
          { key: 'us-gaap:GrossProfit', label: 'Gross Profit', unit: 'usd', valuesByYear: { 2023: 1, 2024: 2, 2025: 3 } },
        ],
      },
      bs: { years: [], rows: [] },
      cf: { years: [], rows: [] },
    },
  };

  const available = getAvailableStatements(document);
  assert.ok(available.includes('ic'));
  const pivot = getStatementPivot(document, 'ic');
  assert.ok(pivot.years.length >= 3);
  assert.ok(pivot.rows.length >= 3);
});

test('findConceptSeries checks IFRS taxonomy', () => {
  const hit = findConceptSeries(
    {
      'ifrs-full': {
        ProfitLoss: {
          units: { USD: [{ fy: 2024, end: '2024-12-31', val: 1, fp: 'FY', form: '20-F' }] },
        },
      },
    },
    ['NetIncomeLoss', 'ProfitLoss'],
  );
  assert.equal(hit?.concept, 'ProfitLoss');
  assert.equal(pickAnnualUsdValues(hit?.series)[0]?.value, 1);
});
