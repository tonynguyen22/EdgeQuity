import type { EdgequityHistoryYear, EdgequityManifest, EdgequityManifestStock, EdgequityStockRecord } from './types.ts';
import { proxyFetch } from '../utils/proxyFetch.ts';

const EDGEQUITY_MANIFEST_PATH = '/data/edgequity/manifest.raw-first.json';
const INVALID_MANIFEST_ERROR = 'Invalid Edgequity manifest';
const INVALID_STOCK_ERROR = 'Invalid Edgequity stock record';
const FMP_QUOTE_BATCH_SIZE = 50;

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
] as const satisfies ReadonlyArray<Exclude<keyof EdgequityHistoryYear, 'year'>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isManifestStock(value: unknown): value is EdgequityManifestStock {
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

function isEdgequityHistoryYear(value: unknown): value is EdgequityHistoryYear {
  return isRecord(value)
    && typeof value.year === 'string'
    && historyNumberKeys.every((key) => isNullableNumber(value[key]));
}

export function assertEdgequityManifest(value: unknown): asserts value is EdgequityManifest {
  if (!isRecord(value)
    || value.app !== 'Edgequity'
    || typeof value.version !== 'number'
    || typeof value.generatedAt !== 'string'
    || !Array.isArray(value.universe)
    || !value.universe.every((ticker) => typeof ticker === 'string')
    || !Array.isArray(value.stocks)
    || !value.stocks.every(isManifestStock)) {
    throw new Error(INVALID_MANIFEST_ERROR);
  }
}

export function assertEdgequityStockRecord(value: unknown): asserts value is EdgequityStockRecord {
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
    || !value.history.every(isEdgequityHistoryYear)
    || !Array.isArray(value.warnings)
    || !value.warnings.every((warning) => typeof warning === 'string')) {
    throw new Error(INVALID_STOCK_ERROR);
  }
}

export async function loadEdgequityManifest(): Promise<EdgequityManifest> {
  const res = await fetch(EDGEQUITY_MANIFEST_PATH, { cache: 'no-cache' });

  if (!res.ok) {
    throw new Error(`Failed to load Edgequity manifest: ${res.status}`);
  }

  const manifest = await res.json();
  assertEdgequityManifest(manifest);
  return manifest;
}

export async function loadEdgequityStock(path: string): Promise<EdgequityStockRecord> {
  const res = await fetch(path, { cache: 'no-cache' });

  if (!res.ok) {
    throw new Error(`Failed to load stock data: ${res.status}`);
  }

  const stock = await res.json();
  assertEdgequityStockRecord(stock);
  return stock;
}

export async function loadAllEdgequityStocks(): Promise<EdgequityStockRecord[]> {
  const manifest = await loadEdgequityManifest();
  return await Promise.all(manifest.stocks.map((stock) => loadEdgequityStock(stock.dataPath)));
}

type FmpQuote = {
  symbol?: unknown;
  price?: unknown;
  marketCap?: unknown;
};

function tickerBatches(stocks: EdgequityStockRecord[]): string[][] {
  const tickers = stocks.map((stock) => stock.ticker.toUpperCase());
  const batches: string[][] = [];

  for (let index = 0; index < tickers.length; index += FMP_QUOTE_BATCH_SIZE) {
    batches.push(tickers.slice(index, index + FMP_QUOTE_BATCH_SIZE));
  }

  return batches;
}

async function fetchFmpQuoteBatch(tickers: string[]): Promise<FmpQuote[]> {
  const url = `https://financialmodelingprep.com/api/v3/quote/${tickers.join(',')}`;
  const response = await proxyFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to refresh realtime quotes: ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload as FmpQuote[] : [];
}

export async function refreshEdgequityRealtimeQuotes(stocks: EdgequityStockRecord[]): Promise<EdgequityStockRecord[]> {
  if (stocks.length === 0) {
    return stocks;
  }

  const quoteResults = await Promise.all(tickerBatches(stocks).map(fetchFmpQuoteBatch));
  const quotesByTicker = new Map<string, FmpQuote>();

  for (const quote of quoteResults.flat()) {
    if (typeof quote.symbol === 'string') {
      quotesByTicker.set(quote.symbol.toUpperCase(), quote);
    }
  }

  return stocks.map((stock) => {
    const quote = quotesByTicker.get(stock.ticker.toUpperCase());

    if (!quote) {
      return stock;
    }

    return {
      ...stock,
      price: isFiniteNumber(quote.price) ? quote.price : stock.price,
      marketCap: isFiniteNumber(quote.marketCap) ? quote.marketCap : stock.marketCap,
    };
  });
}
