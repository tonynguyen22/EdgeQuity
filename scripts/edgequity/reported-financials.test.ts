import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('full SEC dump includes many classified concepts for AAPL cache', () => {
  const factsPath = new URL('../../public/data/edgequity/raw/AAPL/sec-company-facts.json', import.meta.url);
  const facts = JSON.parse(readFileSync(factsPath, 'utf8'));
  const doc = buildSecStatementsDocument('AAPL', facts, '0000320193', []);
  assert.ok(doc.statements.ic.rows.length >= 40);
  assert.ok(doc.statements.bs.rows.length >= 60);
  assert.ok(doc.statements.cf.rows.length >= 30);
});

test('formatReportedMoney scales large USD values', () => {
  assert.equal(formatReportedMoney(2_410_000_000), '$2.41B');
  assert.equal(formatReportedMoney(null), '-');
});

test('cached ASML sec-statements loads pivot for UI', () => {
  const path = new URL('../../public/data/edgequity/raw/ASML/sec-statements.json', import.meta.url);
  let document: SecStatementsDocument;
  try {
    document = JSON.parse(readFileSync(path, 'utf8')) as SecStatementsDocument;
  } catch {
    // Build on the fly from company facts if statements not generated yet
    const factsPath = new URL('../../public/data/edgequity/raw/ASML/sec-company-facts.json', import.meta.url);
    const facts = JSON.parse(readFileSync(factsPath, 'utf8'));
    document = buildSecStatementsDocument('ASML', facts, '0000937966', []);
  }

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
