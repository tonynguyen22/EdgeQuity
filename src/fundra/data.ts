import type { FundraHistoryYear, FundraManifest, FundraManifestStock, FundraStockRecord } from './types.ts';

const FUNDRA_MANIFEST_PATH = '/data/fundra/manifest.json';
const INVALID_MANIFEST_ERROR = 'Invalid Fundra manifest';
const INVALID_STOCK_ERROR = 'Invalid Fundra stock record';

const valuationKeys = [
  'peTTM',
  'forwardPE',
  'psTTM',
  'pb',
  'evRevenue',
  'evEbitda',
  'pfcf',
  'fcfYield',
  'earningsYield',
] as const;

const profitabilityKeys = [
  'grossMargin',
  'operatingMargin',
  'netMargin',
  'roe',
  'roa',
  'roic',
] as const;

const growthKeys = [
  'revenueCagr3y',
  'revenueCagr5y',
  'epsCagr3y',
  'fcfCagr3y',
] as const;

const financialHealthKeys = [
  'currentRatio',
  'quickRatio',
  'debtToEquity',
  'netDebtToEbitda',
  'interestCoverage',
] as const;

const cashFlowKeys = [
  'operatingCashFlow',
  'freeCashFlow',
  'fcfMargin',
  'capexToRevenue',
  'fcfConversion',
] as const;

const dividendKeys = [
  'dividendYield',
  'payoutRatio',
] as const;

const historyNumberKeys = [
  'revenue',
  'grossProfit',
  'operatingIncome',
  'netIncome',
  'freeCashFlow',
  'totalAssets',
  'totalDebt',
  'totalEquity',
  'sharesDiluted',
] as const satisfies ReadonlyArray<Exclude<keyof FundraHistoryYear, 'year'>>;

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

function hasNullableNumberFields<T extends readonly string[]>(
  value: unknown,
  keys: T,
): value is Record<T[number], number | null> {
  return isRecord(value) && keys.every((key) => isNullableNumber(value[key]));
}

function isFundraHistoryYear(value: unknown): value is FundraHistoryYear {
  return isRecord(value)
    && typeof value.year === 'string'
    && historyNumberKeys.every((key) => isNullableNumber(value[key]));
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

export function assertFundraStockRecord(value: unknown): asserts value is FundraStockRecord {
  if (!isRecord(value)
    || typeof value.ticker !== 'string'
    || typeof value.name !== 'string'
    || !isNullableString(value.sector)
    || !isNullableString(value.industry)
    || !isNullableString(value.currency)
    || !isNullableNumber(value.price)
    || !isNullableNumber(value.marketCap)
    || !isNullableNumber(value.enterpriseValue)
    || !hasNullableNumberFields(value.valuation, valuationKeys)
    || !hasNullableNumberFields(value.profitability, profitabilityKeys)
    || !hasNullableNumberFields(value.growth, growthKeys)
    || !hasNullableNumberFields(value.financialHealth, financialHealthKeys)
    || !hasNullableNumberFields(value.cashFlow, cashFlowKeys)
    || !hasNullableNumberFields(value.dividends, dividendKeys)
    || !Array.isArray(value.history)
    || !value.history.every(isFundraHistoryYear)
    || !Array.isArray(value.warnings)
    || !value.warnings.every((warning) => typeof warning === 'string')) {
    throw new Error(INVALID_STOCK_ERROR);
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

  const stock = await res.json();
  assertFundraStockRecord(stock);
  return stock;
}

export async function loadAllFundraStocks(): Promise<FundraStockRecord[]> {
  const manifest = await loadFundraManifest();
  return await Promise.all(manifest.stocks.map((stock) => loadFundraStock(stock.dataPath)));
}
