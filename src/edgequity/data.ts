import type {
  EdgequityEarningsEvent,
  EdgequityEarningsMetadata,
  EdgequityHistoryYear,
  EdgequityManifest,
  EdgequityManifestStock,
  EdgequityStatementQuality,
  EdgequityStockRecord,
  EdgequityTranscriptMetadata,
} from './types.ts';
import { proxyFetch } from '../utils/proxyFetch.ts';

const EDGEQUITY_MANIFEST_PATH = '/data/edgequity/manifest.json';
const INVALID_MANIFEST_ERROR = 'Invalid Edgequity manifest';
const INVALID_STOCK_ERROR = 'Invalid Edgequity stock record';

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

const transcriptStatuses = ['found', 'missing', 'error'] as const;
const statementQualitySources = ['sec', 'dolthub', 'mixed', 'missing'] as const;
const statementQualityStatuses = ['ok', 'partial', 'missing', 'error'] as const;

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

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
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

function isEdgequityEarningsEvent(value: unknown): value is EdgequityEarningsEvent {
  return isRecord(value)
    && typeof value.period === 'string'
    && typeof value.date === 'string'
    && (value.isEstimated === undefined || typeof value.isEstimated === 'boolean')
    && typeof value.source === 'string'
    && typeof value.sourceUrl === 'string';
}

function isNullableEarningsEvent(value: unknown): value is EdgequityEarningsEvent | null {
  return value === null || isEdgequityEarningsEvent(value);
}

function isEdgequityEarningsMetadata(value: unknown): value is EdgequityEarningsMetadata {
  return isRecord(value)
    && isNullableEarningsEvent(value.recent)
    && isNullableEarningsEvent(value.next)
    && typeof value.updatedAt === 'string';
}

function isEdgequityTranscriptMetadata(value: unknown): value is EdgequityTranscriptMetadata {
  return isRecord(value)
    && typeof value.status === 'string'
    && transcriptStatuses.includes(value.status as EdgequityTranscriptMetadata['status'])
    && isNullableString(value.title)
    && isNullableString(value.date)
    && isNullableString(value.source)
    && isNullableString(value.sourceUrl)
    && typeof value.fetchedAt === 'string'
    && isOptionalString(value.message);
}

function isEdgequityStatementQuality(value: unknown): value is EdgequityStatementQuality {
  return isRecord(value)
    && isFiniteNumber(value.annualPeriods)
    && isFiniteNumber(value.quarterlyPeriods)
    && typeof value.source === 'string'
    && statementQualitySources.includes(value.source as EdgequityStatementQuality['source'])
    && typeof value.status === 'string'
    && statementQualityStatuses.includes(value.status as EdgequityStatementQuality['status'])
    && typeof value.message === 'string';
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
    || (value.aiTheme !== undefined && typeof value.aiTheme !== 'string')
    || (value.earnings !== undefined && !isEdgequityEarningsMetadata(value.earnings))
    || (value.transcript !== undefined && !isEdgequityTranscriptMetadata(value.transcript))
    || (value.statementQuality !== undefined && !isEdgequityStatementQuality(value.statementQuality))
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

type FinnhubQuote = {
  c?: unknown;
};

async function fetchFinnhubQuote(ticker: string): Promise<FinnhubQuote> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}`;
  const response = await proxyFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to refresh realtime quotes: ${response.status}`);
  }

  const payload = await response.json();
  return isRecord(payload) ? payload as FinnhubQuote : {};
}

export async function refreshEdgequityRealtimeQuotes(stocks: EdgequityStockRecord[]): Promise<EdgequityStockRecord[]> {
  if (stocks.length === 0) {
    return stocks;
  }

  const quoteResults = await Promise.all(stocks.map(async (stock) => ({
    ticker: stock.ticker.toUpperCase(),
    quote: await fetchFinnhubQuote(stock.ticker.toUpperCase()),
  })));
  const quotesByTicker = new Map(quoteResults.map((result) => [result.ticker, result.quote]));

  return stocks.map((stock) => {
    const quote = quotesByTicker.get(stock.ticker.toUpperCase());

    if (!quote) {
      return stock;
    }

    return {
      ...stock,
      price: isFiniteNumber(quote.c) ? quote.c : stock.price,
    };
  });
}
