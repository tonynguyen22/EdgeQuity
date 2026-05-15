import type { FundraManifest, FundraManifestStock, FundraStockRecord } from './types.ts';

const FUNDRA_MANIFEST_PATH = '/data/fundra/manifest.json';
const INVALID_MANIFEST_ERROR = 'Invalid Fundra manifest';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isManifestStock(value: unknown): value is FundraManifestStock {
  return isRecord(value)
    && typeof value.ticker === 'string'
    && typeof value.name === 'string'
    && isNullableString(value.sector)
    && isNullableString(value.industry)
    && isNullableNumber(value.marketCap)
    && typeof value.dataPath === 'string';
}

export function assertFundraManifest(value: unknown): asserts value is FundraManifest {
  if (!isRecord(value)
    || value.app !== 'Fundra'
    || typeof value.version !== 'number'
    || typeof value.generatedAt !== 'string'
    || !Array.isArray(value.universe)
    || !value.universe.every((ticker) => typeof ticker === 'string')
    || !Array.isArray(value.stocks)
    || !value.stocks.every(isManifestStock)) {
    throw new Error(INVALID_MANIFEST_ERROR);
  }
}

export async function loadFundraManifest(): Promise<FundraManifest> {
  const res = await fetch(FUNDRA_MANIFEST_PATH, { cache: 'no-cache' });

  if (!res.ok) {
    throw new Error(`Failed to load Fundra manifest: ${res.status}`);
  }

  const manifest = await res.json();
  assertFundraManifest(manifest);
  return manifest;
}

export async function loadFundraStock(path: string): Promise<FundraStockRecord> {
  const res = await fetch(path, { cache: 'no-cache' });

  if (!res.ok) {
    throw new Error(`Failed to load stock data: ${res.status}`);
  }

  return await res.json() as FundraStockRecord;
}

export async function loadAllFundraStocks(): Promise<FundraStockRecord[]> {
  const manifest = await loadFundraManifest();
  return await Promise.all(manifest.stocks.map((stock) => loadFundraStock(stock.dataPath)));
}
