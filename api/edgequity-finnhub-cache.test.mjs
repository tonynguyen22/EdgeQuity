import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildFinnhubSnapshot,
  isValidTicker,
  readCachedPayload,
  writeCachedPayload,
} from './edgequity-finnhub-cache.js';

test('isValidTicker accepts normal symbols and rejects traversal or query strings', () => {
  assert.equal(isValidTicker('NVDA'), true);
  assert.equal(isValidTicker('BRK.B'), true);
  assert.equal(isValidTicker('nvda'), true);
  assert.equal(isValidTicker('../secret'), false);
  assert.equal(isValidTicker('NVDA?token=x'), false);
  assert.equal(isValidTicker(''), false);
});

test('readCachedPayload returns null when cache is expired', async () => {
  const cacheDir = await mkdtemp(path.join(tmpdir(), 'edgequity-finnhub-cache-'));

  try {
    await writeCachedPayload(cacheDir, 'NVDA', 'quote', { c: 100 }, new Date('2026-01-01T00:00:00.000Z'));

    assert.equal(
      await readCachedPayload(cacheDir, 'NVDA', 'quote', 500, new Date('2026-01-01T00:00:00.501Z')),
      null,
    );
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test('writeCachedPayload rejects invalid cache kinds', async () => {
  const cacheDir = await mkdtemp(path.join(tmpdir(), 'edgequity-finnhub-cache-'));

  try {
    await assert.rejects(
      writeCachedPayload(cacheDir, 'NVDA', '../x', {}, new Date('2026-01-01T00:00:00.000Z')),
      /Invalid cache kind/,
    );
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test('buildFinnhubSnapshot caches profile, quote, and metrics separately', async () => {
  const cacheDir = await mkdtemp(path.join(tmpdir(), 'edgequity-finnhub-cache-'));
  const calls = [];
  const fetchJson = async (url) => {
    calls.push(url);
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/stock/profile2')) return { name: 'NVIDIA Corp' };
    if (pathname.endsWith('/quote')) return { c: 875.25 };
    if (pathname.endsWith('/stock/metric')) return { metric: { peNormalizedAnnual: 31.2 } };
    throw new Error(`Unexpected endpoint: ${url}`);
  };

  try {
    const snapshot = await buildFinnhubSnapshot({
      ticker: 'nvda',
      token: 'test-token',
      cacheDir,
      now: new Date('2026-01-01T00:00:02.000Z'),
      fetchJson,
    });

    assert.equal(calls.length, 3);
    assert.equal(snapshot.ticker, 'NVDA');
    assert.equal(snapshot.fetchedAt, '2026-01-01T00:00:02.000Z');
    assert.deepEqual(snapshot.profile, { name: 'NVIDIA Corp' });
    assert.deepEqual(snapshot.quote, { c: 875.25 });
    assert.deepEqual(snapshot.metrics, { metric: { peNormalizedAnnual: 31.2 } });
    assert.deepEqual(snapshot.cache, { profile: 'miss', quote: 'miss', metrics: 'miss' });

    const cachedProfile = JSON.parse(await readFile(path.join(cacheDir, 'NVDA', 'profile.json'), 'utf8'));
    const cachedQuote = JSON.parse(await readFile(path.join(cacheDir, 'NVDA', 'quote.json'), 'utf8'));
    const cachedMetrics = JSON.parse(await readFile(path.join(cacheDir, 'NVDA', 'metrics.json'), 'utf8'));
    assert.equal(cachedProfile.fetchedAt, '2026-01-01T00:00:02.000Z');
    assert.deepEqual(cachedProfile.payload, snapshot.profile);
    assert.deepEqual(cachedQuote.payload, snapshot.quote);
    assert.deepEqual(cachedMetrics.payload, snapshot.metrics);
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test('buildFinnhubSnapshot returns all hits on a second call within TTL', async () => {
  const cacheDir = await mkdtemp(path.join(tmpdir(), 'edgequity-finnhub-cache-'));
  const calls = [];
  const fetchJson = async (url) => {
    calls.push(url);
    return { source: new URL(url).pathname };
  };

  try {
    await buildFinnhubSnapshot({
      ticker: 'NVDA',
      token: 'test-token',
      cacheDir,
      now: new Date('2026-01-01T00:00:03.000Z'),
      fetchJson,
    });

    calls.length = 0;
    const snapshot = await buildFinnhubSnapshot({
      ticker: 'NVDA',
      token: 'test-token',
      cacheDir,
      now: new Date('2026-01-01T00:00:04.000Z'),
      fetchJson,
    });

    assert.equal(calls.length, 0);
    assert.deepEqual(snapshot.cache, { profile: 'hit', quote: 'hit', metrics: 'hit' });
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
});
