import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  assertFundraManifest,
  assertFundraStockRecord,
  loadFundraManifest,
  loadFundraStock,
} from './data.ts';

const stockFixture = JSON.parse(readFileSync(
  new URL('../../public/data/fundra/stocks/AAPL.json', import.meta.url),
  'utf8',
)) as unknown;

type MockFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

async function withMockFetch<T>(
  response: MockFetchResponse,
  callback: (calls: Array<{ input: Parameters<typeof fetch>[0]; init: Parameters<typeof fetch>[1] }>) => Promise<T>,
): Promise<T> {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ input: Parameters<typeof fetch>[0]; init: Parameters<typeof fetch>[1] }> = [];

  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return response as Response;
  }) as typeof fetch;

  try {
    return await callback(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

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

test('assertFundraStockRecord accepts valid stock fixture', () => {
  assert.doesNotThrow(() => assertFundraStockRecord(stockFixture));
});

test('assertFundraStockRecord rejects missing valuation', () => {
  assert.throws(
    () => assertFundraStockRecord({
      ...(stockFixture as Record<string, unknown>),
      valuation: undefined,
    }),
    /Invalid Fundra stock record/,
  );
});

test('assertFundraStockRecord rejects wrong metric type', () => {
  assert.throws(
    () => assertFundraStockRecord({
      ...(stockFixture as Record<string, unknown>),
      valuation: {
        ...((stockFixture as Record<string, unknown>).valuation as Record<string, unknown>),
        peTTM: '28',
      },
    }),
    /Invalid Fundra stock record/,
  );
});

test('loadFundraManifest uses manifest path and no-cache', async () => {
  await withMockFetch({
    ok: true,
    status: 200,
    json: async () => ({
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
    }),
  }, async (calls) => {
    const manifest = await loadFundraManifest();

    assert.equal(manifest.app, 'Fundra');
    assert.deepEqual(calls, [{
      input: '/data/fundra/manifest.json',
      init: { cache: 'no-cache' },
    }]);
  });
});

test('loadFundraManifest throws status on failure', async () => {
  await withMockFetch({
    ok: false,
    status: 500,
    json: async () => ({}),
  }, async () => {
    await assert.rejects(
      () => loadFundraManifest(),
      /Failed to load Fundra manifest: 500/,
    );
  });
});

test('loadFundraStock validates stock data on success', async () => {
  await withMockFetch({
    ok: true,
    status: 200,
    json: async () => stockFixture,
  }, async (calls) => {
    const stock = await loadFundraStock('/data/fundra/stocks/AAPL.json');

    assert.equal(stock.ticker, 'AAPL');
    assert.deepEqual(calls, [{
      input: '/data/fundra/stocks/AAPL.json',
      init: { cache: 'no-cache' },
    }]);
  });
});

test('loadFundraStock throws status on failure', async () => {
  await withMockFetch({
    ok: false,
    status: 404,
    json: async () => ({}),
  }, async () => {
    await assert.rejects(
      () => loadFundraStock('/data/fundra/stocks/MISSING.json'),
      /Failed to load stock data: 404/,
    );
  });
});
