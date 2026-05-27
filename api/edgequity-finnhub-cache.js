import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const TTL_MS = {
  profile: 30 * 24 * 60 * 60 * 1_000,
  quote: 60 * 1_000,
  metrics: 12 * 60 * 60 * 1_000,
};
const ALLOWED_KINDS = new Set(Object.keys(TTL_MS));

export function isValidTicker(ticker) {
  return typeof ticker === 'string' && /^[A-Za-z0-9][A-Za-z0-9.-]{0,11}$/.test(ticker);
}

function normalizeTicker(ticker) {
  return ticker.toUpperCase();
}

function isValidKind(kind) {
  return ALLOWED_KINDS.has(kind);
}

function toEpochMs(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function toIsoString(value) {
  const epochMs = toEpochMs(value);
  if (epochMs === null) throw new Error('Invalid timestamp');
  return new Date(epochMs).toISOString();
}

function cachePath(cacheDir, ticker, kind) {
  return path.join(cacheDir, normalizeTicker(ticker), `${kind}.json`);
}

export async function readCachedPayload(cacheDir, ticker, kind, ttlMs, now = Date.now()) {
  if (!isValidKind(kind)) return null;

  try {
    const cached = JSON.parse(await readFile(cachePath(cacheDir, ticker, kind), 'utf8'));
    const fetchedAtMs = toEpochMs(cached?.fetchedAt);
    const nowMs = toEpochMs(now);
    if (fetchedAtMs === null || nowMs === null) return null;
    if (nowMs - fetchedAtMs > ttlMs) return null;
    return cached.payload ?? null;
  } catch {
    return null;
  }
}

export async function writeCachedPayload(cacheDir, ticker, kind, payload, now = Date.now()) {
  if (!isValidKind(kind)) {
    throw new Error(`Invalid cache kind: ${kind}`);
  }

  const normalizedTicker = normalizeTicker(ticker);
  const tickerDir = path.join(cacheDir, normalizedTicker);
  await mkdir(tickerDir, { recursive: true });

  const targetPath = path.join(tickerDir, `${kind}.json`);
  const tempPath = path.join(
    tickerDir,
    `.${kind}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`,
  );
  await writeFile(tempPath, JSON.stringify({ fetchedAt: toIsoString(now), payload }), 'utf8');
  await rename(tempPath, targetPath);
}

async function defaultFetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub request failed with status ${response.status}`);
  }
  return response.json();
}

function buildFinnhubUrl(pathname, ticker, token, searchParams = {}) {
  const url = new URL(`${FINNHUB_BASE_URL}${pathname}`);
  url.searchParams.set('symbol', ticker);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('token', token);
  return url.toString();
}

async function loadSnapshotPart({ ticker, token, cacheDir, kind, ttlMs, url, now, fetchJson }) {
  const cached = await readCachedPayload(cacheDir, ticker, kind, ttlMs, now);
  if (cached !== null) {
    return { payload: cached, cache: 'hit' };
  }

  const payload = await fetchJson(url);
  await writeCachedPayload(cacheDir, ticker, kind, payload, now);
  return { payload, cache: 'miss' };
}

export async function buildFinnhubSnapshot({
  ticker,
  token,
  cacheDir,
  now = Date.now(),
  fetchJson = defaultFetchJson,
}) {
  const fetchedAt = toIsoString(now);

  if (!isValidTicker(ticker)) {
    throw new Error('Invalid ticker');
  }
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('Missing Finnhub token');
  }
  if (!cacheDir) {
    throw new Error('Missing cache directory');
  }

  const normalizedTicker = normalizeTicker(ticker);
  const [profile, quote, metrics] = await Promise.all([
    loadSnapshotPart({
      ticker: normalizedTicker,
      token,
      cacheDir,
      kind: 'profile',
      ttlMs: TTL_MS.profile,
      url: buildFinnhubUrl('/stock/profile2', normalizedTicker, token),
      now: fetchedAt,
      fetchJson,
    }),
    loadSnapshotPart({
      ticker: normalizedTicker,
      token,
      cacheDir,
      kind: 'quote',
      ttlMs: TTL_MS.quote,
      url: buildFinnhubUrl('/quote', normalizedTicker, token),
      now: fetchedAt,
      fetchJson,
    }),
    loadSnapshotPart({
      ticker: normalizedTicker,
      token,
      cacheDir,
      kind: 'metrics',
      ttlMs: TTL_MS.metrics,
      url: buildFinnhubUrl('/stock/metric', normalizedTicker, token, { metric: 'all' }),
      now: fetchedAt,
      fetchJson,
    }),
  ]);

  return {
    ticker: normalizedTicker,
    fetchedAt,
    profile: profile.payload,
    quote: quote.payload,
    metrics: metrics.payload,
    cache: {
      profile: profile.cache,
      quote: quote.cache,
      metrics: metrics.cache,
    },
  };
}
