import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  assertEdgequityManifest,
  assertEdgequityStockRecord,
  loadEdgequityManifest,
  loadEdgequityStock,
  refreshEdgequityRealtimeQuotes,
} from './data.ts';
import type { EdgequityStockRecord } from './types.ts';

const stockFixture = JSON.parse(readFileSync(
  new URL('../../public/data/edgequity/stocks/AAPL.json', import.meta.url),
  'utf8',
)) as unknown;
const nvdaFixture = JSON.parse(readFileSync(
  new URL('../../public/data/edgequity/stocks/NVDA.json', import.meta.url),
  'utf8',
)) as {
  price: number;
  marketCap: number;
  history: Array<{ year: string; revenue: number }>;
};
const staticManifest = JSON.parse(readFileSync(
  new URL('../../public/data/edgequity/manifest.json', import.meta.url),
  'utf8',
)) as {
  universe: string[];
  stocks: Array<{ ticker: string; dataPath: string }>;
};

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

test('assertEdgequityManifest accepts valid manifest shape', () => {
  assert.doesNotThrow(() => assertEdgequityManifest({
    app: 'Edgequity',
    version: 1,
    generatedAt: '2026-05-14T00:00:00.000Z',
    universe: ['AAPL'],
    stocks: [{
      ticker: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 1,
      dataPath: '/data/edgequity/stocks/AAPL.json',
    }],
  }));
});

test('assertEdgequityManifest rejects wrong app name', () => {
  assert.throws(
    () => assertEdgequityManifest({
      app: 'NotEdgequity',
      version: 1,
      generatedAt: '2026-05-14T00:00:00.000Z',
      universe: ['AAPL'],
      stocks: [],
    }),
    /Invalid Edgequity manifest/,
  );
});

test('assertEdgequityManifest rejects non-number version', () => {
  assert.throws(
    () => assertEdgequityManifest({
      app: 'Edgequity',
      version: '1',
      generatedAt: '2026-05-14T00:00:00.000Z',
      universe: ['AAPL'],
      stocks: [],
    }),
    /Invalid Edgequity manifest/,
  );
});

test('assertEdgequityStockRecord accepts valid stock fixture', () => {
  assert.doesNotThrow(() => assertEdgequityStockRecord(stockFixture));
});

test('assertEdgequityStockRecord accepts earnings and transcript metadata', () => {
  const record = {
    ...(stockFixture as Record<string, unknown>),
    aiTheme: 'AI Semiconductors',
    earnings: {
      recent: {
        period: 'Q1 FY2027',
        date: '2026-05-20',
        source: 'Finnhub',
        sourceUrl: 'https://finnhub.io',
      },
      next: {
        period: 'Q2 FY2027',
        date: '2026-08-26',
        isEstimated: true,
        source: 'DoltHub',
        sourceUrl: 'https://www.dolthub.com/repositories/post-no-preference/earnings',
      },
      updatedAt: '2026-05-25T00:00:00.000Z',
    },
    transcript: {
      status: 'found',
      title: 'NVIDIA Q1 FY2027 earnings call transcript',
      date: '2026-05-20',
      source: 'Company IR',
      sourceUrl: 'https://investor.nvidia.com',
      fetchedAt: '2026-05-25T00:00:00.000Z',
    },
    statementQuality: {
      annualPeriods: 5,
      quarterlyPeriods: 5,
      source: 'sec',
      status: 'ok',
      message: 'SEC Company Facts normalized successfully',
    },
  };

  assert.doesNotThrow(() => assertEdgequityStockRecord(record));
});

test('assertEdgequityStockRecord rejects malformed earnings metadata', () => {
  assert.throws(
    () => assertEdgequityStockRecord({
      ...(stockFixture as Record<string, unknown>),
      earnings: {
        recent: {
          period: 'Q1 FY2027',
          date: 20260520,
          source: 'Finnhub',
          sourceUrl: 'https://finnhub.io',
        },
        next: null,
        updatedAt: '2026-05-25T00:00:00.000Z',
      },
    }),
    /Invalid Edgequity stock record/,
  );
});

test('NVIDIA static quote and chart history reflect the Q1 FY2027 report context', () => {
  assert.equal(nvdaFixture.price, 223.47);
  assert.equal(nvdaFixture.marketCap, 5420000000000);
  assert.equal(nvdaFixture.history.length, 5);
  assert.deepEqual(nvdaFixture.history.map((year) => year.year), [
    'FY2026',
    'FY2025',
    'FY2024',
    'FY2023',
    'FY2022',
  ]);
  assert.equal(nvdaFixture.history[0]?.revenue, 215938000000);
});

test('bundled FMP three-statement dataset includes only the confirmed free-tier universe', () => {
  assertEdgequityManifest(staticManifest);
  assert.equal(staticManifest.stocks.length, 82);
  assert.equal(staticManifest.universe.length, 82);
  assert.deepEqual(staticManifest.universe, staticManifest.stocks.map((stock) => stock.ticker));
  assert.equal(staticManifest.stocks.some((stock) => stock.ticker === 'AAPL'), true);
  assert.equal(staticManifest.stocks.some((stock) => stock.ticker === 'NVDA'), true);
  assert.equal(staticManifest.stocks.some((stock) => stock.ticker === 'FUBO'), false);
  assert.equal(staticManifest.stocks.some((stock) => stock.ticker === 'RKT'), false);
  assert.equal(staticManifest.stocks.every((stock) => stock.dataPath.startsWith('/data/edgequity/stocks/')), true);

  for (const stock of staticManifest.stocks) {
    const stockPath = new URL(`../../public${stock.dataPath}`, import.meta.url);

    assert.ok(existsSync(stockPath), `${stock.ticker} stock file should exist`);
    assert.doesNotThrow(() => assertEdgequityStockRecord(JSON.parse(readFileSync(stockPath, 'utf8'))));
  }
});

test('assertEdgequityStockRecord rejects missing valuation', () => {
  assert.throws(
    () => assertEdgequityStockRecord({
      ...(stockFixture as Record<string, unknown>),
      valuation: undefined,
    }),
    /Invalid Edgequity stock record/,
  );
});

test('assertEdgequityStockRecord rejects wrong metric type', () => {
  assert.throws(
    () => assertEdgequityStockRecord({
      ...(stockFixture as Record<string, unknown>),
      valuation: {
        ...((stockFixture as Record<string, unknown>).valuation as Record<string, unknown>),
        peTTM: '28',
      },
    }),
    /Invalid Edgequity stock record/,
  );
});

test('loadEdgequityManifest uses manifest path and no-cache', async () => {
  await withMockFetch({
    ok: true,
    status: 200,
    json: async () => ({
      app: 'Edgequity',
      version: 1,
      generatedAt: '2026-05-14T00:00:00.000Z',
      universe: ['AAPL'],
      stocks: [{
        ticker: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 1,
        dataPath: '/data/edgequity/stocks/AAPL.json',
      }],
    }),
  }, async (calls) => {
    const manifest = await loadEdgequityManifest();

    assert.equal(manifest.app, 'Edgequity');
    assert.deepEqual(calls, [{
      input: '/data/edgequity/manifest.json',
      init: { cache: 'no-cache' },
    }]);
  });
});

test('loadEdgequityManifest throws status on failure', async () => {
  await withMockFetch({
    ok: false,
    status: 500,
    json: async () => ({}),
  }, async () => {
    await assert.rejects(
      () => loadEdgequityManifest(),
      /Failed to load Edgequity manifest: 500/,
    );
  });
});

test('loadEdgequityStock validates stock data on success', async () => {
  await withMockFetch({
    ok: true,
    status: 200,
    json: async () => stockFixture,
  }, async (calls) => {
    const stock = await loadEdgequityStock('/data/edgequity/stocks/AAPL.json');

    assert.equal(stock.ticker, 'AAPL');
    assert.deepEqual(calls, [{
      input: '/data/edgequity/stocks/AAPL.json',
      init: { cache: 'no-cache' },
    }]);
  });
});

test('loadEdgequityStock throws status on failure', async () => {
  await withMockFetch({
    ok: false,
    status: 404,
    json: async () => ({}),
  }, async () => {
    await assert.rejects(
      () => loadEdgequityStock('/data/edgequity/stocks/MISSING.json'),
      /Failed to load stock data: 404/,
    );
  });
});

test('refreshEdgequityRealtimeQuotes pulls Finnhub quotes at runtime and merges live price fields', async () => {
  const apple = stockFixture as EdgequityStockRecord;
  const staticStocks: EdgequityStockRecord[] = [
    {
      ...apple,
      ticker: 'AAPL',
      price: 190,
      marketCap: 3_000_000_000_000,
      enterpriseValue: 3_100_000_000_000,
    },
  ];

  await withMockFetch({
    ok: true,
    status: 200,
    json: async () => ({
      c: 201.25,
    }),
  }, async (calls) => {
    const refreshed = await refreshEdgequityRealtimeQuotes(staticStocks);

    assert.equal(refreshed[0]?.price, 201.25);
    assert.equal(refreshed[0]?.marketCap, 3_000_000_000_000);
    assert.equal(refreshed[0]?.enterpriseValue, 3_100_000_000_000);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.input, '/api/http-proxy');
    assert.equal(calls[0]?.init?.method, 'POST');

    const body = JSON.parse(String(calls[0]?.init?.body)) as { url: string };
    assert.equal(body.url, 'https://finnhub.io/api/v1/quote?symbol=AAPL');
  });
});
