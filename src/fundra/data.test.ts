import assert from 'node:assert/strict';
import test from 'node:test';

import { assertFundraManifest } from './data.ts';

test('assertFundraManifest accepts valid manifest shape', () => {
  assert.doesNotThrow(() => assertFundraManifest({
    app: 'Fundra',
    version: 1,
    generatedAt: '2026-05-14T00:00:00.000Z',
    universe: ['AAPL'],
    stocks: [{
      ticker: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 1,
      dataPath: '/data/fundra/stocks/AAPL.json',
    }],
  }));
});

test('assertFundraManifest rejects wrong app name', () => {
  assert.throws(
    () => assertFundraManifest({
      app: 'ValuWise',
      version: 1,
      generatedAt: '2026-05-14T00:00:00.000Z',
      universe: ['AAPL'],
      stocks: [],
    }),
    /Invalid Fundra manifest/,
  );
});

test('assertFundraManifest rejects non-number version', () => {
  assert.throws(
    () => assertFundraManifest({
      app: 'Fundra',
      version: '1',
      generatedAt: '2026-05-14T00:00:00.000Z',
      universe: ['AAPL'],
      stocks: [],
    }),
    /Invalid Fundra manifest/,
  );
});
