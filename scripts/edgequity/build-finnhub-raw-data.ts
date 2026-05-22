import "dotenv/config";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EdgequityManifest, EdgequityManifestStock, EdgequityStockRecord } from "../../src/edgequity/types.ts";
import {
  buildThinStockRecordFromFinnhub,
  buildUniverseFromFinnhubSymbols,
  type EdgequityUniverseStock,
  type FinnhubReportedFinancials,
  type FinnhubSymbol,
} from "./finnhub-raw.ts";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const EDGEQUITY_DATA_DIR = path.join("public", "data", "edgequity");
const EDGEQUITY_RAW_DIR = path.join(EDGEQUITY_DATA_DIR, "raw");
const EDGEQUITY_THIN_STOCKS_DIR = path.join(EDGEQUITY_DATA_DIR, "stocks-raw-first");
const UNIVERSE_500_PATH = path.join(EDGEQUITY_DATA_DIR, "universe-500.json");
const DEFAULT_UNIVERSE_LIMIT = 500;
const DEFAULT_FINNHUB_DELAY_MS = 13_000;

type RawStockCache = {
  ticker: string;
  profile: Record<string, unknown>;
  metrics: Record<string, unknown>;
  financialsReportedAnnual: FinnhubReportedFinancials;
};

type RawFirstUniverseStock = EdgequityUniverseStock & {
  marketCapUsd?: number;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Set it locally or in Netlify/GitHub secrets.`);
  }

  return value;
}

function optionalPositiveIntegerEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return parsed;
}

function parseTickerList(value: string | undefined): string[] | null {
  if (!value) return null;

  const tickers = value
    .split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);

  return [...new Set(tickers)];
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  if (!(await pathExists(filePath))) return null;
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, stringifyJson(value), "utf8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class FinnhubClient {
  private requests = 0;

  constructor(
    private readonly apiKey: string,
    private readonly delayMs: number,
  ) {}

  async fetchJson<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    if (this.requests > 0 && this.delayMs > 0) {
      await sleep(this.delayMs);
    }
    this.requests += 1;

    const url = new URL(`${FINNHUB_BASE_URL}/${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set("token", this.apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Finnhub ${endpoint} failed ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}

async function loadOrFetchUniverse(client: FinnhubClient, limit: number): Promise<RawFirstUniverseStock[]> {
  const cachedUniverse = await readJsonFile<{ stocks?: RawFirstUniverseStock[] }>(UNIVERSE_500_PATH);
  if (cachedUniverse?.stocks?.length === limit && process.env.EDGEQUITY_REFRESH_UNIVERSE !== "1") {
    return cachedUniverse.stocks;
  }

  const symbols = await client.fetchJson<FinnhubSymbol[]>("stock/symbol", { exchange: "US" });
  const universe = buildUniverseFromFinnhubSymbols(symbols, limit);

  await writeJsonFile(UNIVERSE_500_PATH, {
    app: "Edgequity",
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      provider: "finnhub",
      endpoint: "stock/symbol",
      exchange: "US",
      filter: "US common stocks on major US equity MICs, excluding ETFs/funds/warrants/units/preferreds",
      sort: "ticker",
    },
    count: universe.length,
    stocks: universe,
    rejectedPolicy: [
      "Exclude non-common-stock instrument types returned by Finnhub.",
      "Exclude warrant/unit/preferred/right-like ticker suffixes.",
      "Deduplicate by ticker.",
    ],
  });

  return universe;
}

async function fetchRawStock(client: FinnhubClient, ticker: string): Promise<RawStockCache> {
  const profile = await client.fetchJson<Record<string, unknown>>("stock/profile2", { symbol: ticker });
  const metrics = await client.fetchJson<Record<string, unknown>>("stock/metric", { symbol: ticker, metric: "all" });
  const financialsReportedAnnual = await client.fetchJson<FinnhubReportedFinancials>("stock/financials-reported", {
    symbol: ticker,
    freq: "annual",
  });

  return {
    ticker,
    profile,
    metrics,
    financialsReportedAnnual,
  };
}

async function loadOrFetchRawStock(client: FinnhubClient, ticker: string): Promise<RawStockCache> {
  const rawTickerDir = path.join(EDGEQUITY_RAW_DIR, ticker);
  const sourcePath = path.join(rawTickerDir, "source.json");
  const profilePath = path.join(rawTickerDir, "profile.json");
  const metricsPath = path.join(rawTickerDir, "metrics.json");
  const financialsPath = path.join(rawTickerDir, "financials-reported-annual.json");

  const [cachedProfile, cachedMetrics, cachedFinancials] = await Promise.all([
    readJsonFile<Record<string, unknown>>(profilePath),
    readJsonFile<Record<string, unknown>>(metricsPath),
    readJsonFile<FinnhubReportedFinancials>(financialsPath),
  ]);

  if (cachedProfile && cachedMetrics && cachedFinancials && process.env.EDGEQUITY_REFRESH_RAW !== "1") {
    return {
      ticker,
      profile: cachedProfile,
      metrics: cachedMetrics,
      financialsReportedAnnual: cachedFinancials,
    };
  }

  try {
    const raw = await fetchRawStock(client, ticker);
    const fetchedAt = new Date().toISOString();

    await Promise.all([
      writeJsonFile(profilePath, raw.profile),
      writeJsonFile(metricsPath, raw.metrics),
      writeJsonFile(financialsPath, raw.financialsReportedAnnual),
      writeJsonFile(sourcePath, {
        ticker,
        provider: "finnhub",
        fetchedAt,
        endpoints: {
          profile: "stock/profile2",
          metrics: "stock/metric?metric=all",
          financialsReportedAnnual: "stock/financials-reported?freq=annual",
        },
        status: raw.financialsReportedAnnual.data?.length ? "ok" : "partial",
        warnings: raw.financialsReportedAnnual.data?.length ? [] : ["No annual as-reported filings returned by Finnhub"],
      }),
    ]);

    return raw;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeJsonFile(sourcePath, {
      ticker,
      provider: "finnhub",
      fetchedAt: new Date().toISOString(),
      status: "error",
      error: message,
    });
    throw error;
  }
}

async function buildThinRecord(client: FinnhubClient, stock: RawFirstUniverseStock): Promise<EdgequityStockRecord> {
  const ticker = stock.ticker;
  const raw = await loadOrFetchRawStock(client, ticker);
  const sourceFetchedAt = new Date().toISOString();
  const record = buildThinStockRecordFromFinnhub({
    ticker,
    profile: raw.profile,
    metrics: raw.metrics,
    reported: raw.financialsReportedAnnual,
    sourceFetchedAt,
    marketCapUsdOverride: stock.marketCapUsd ?? null,
  });

  await writeJsonFile(path.join(EDGEQUITY_THIN_STOCKS_DIR, `${ticker}.json`), record);
  await writeJsonFile(path.join(EDGEQUITY_RAW_DIR, ticker, "summary.json"), record);

  return record;
}

function manifestStockFromRecord(record: EdgequityStockRecord): EdgequityManifestStock {
  return {
    ticker: record.ticker,
    name: record.name,
    sector: record.sector,
    industry: record.industry,
    marketCap: record.marketCap,
    dataPath: `/data/edgequity/stocks-raw-first/${record.ticker}.json`,
  };
}

async function writeRawFirstManifest(records: EdgequityStockRecord[], rejected: Array<{ ticker: string; error: string }>): Promise<void> {
  const manifest: EdgequityManifest = {
    app: "Edgequity",
    version: 1,
    generatedAt: new Date().toISOString(),
    universe: records.map((record) => record.ticker),
    stocks: records.map(manifestStockFromRecord),
  };

  await writeJsonFile(path.join(EDGEQUITY_DATA_DIR, "manifest.raw-first.json"), {
    ...manifest,
    source: {
      provider: "finnhub",
      mode: "raw-first",
      rawCachePath: "/data/edgequity/raw/{TICKER}/",
      rejected,
    },
  });
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log([
      "Build Edgequity Finnhub raw-first data.",
      "",
      "Environment:",
      "  FINNHUB_API_KEY                 Required Finnhub API key.",
      "  EDGEQUITY_UNIVERSE_ONLY=1       Only write public/data/edgequity/universe-500.json.",
      "  EDGEQUITY_UNIVERSE_LIMIT=500    Universe size, defaults to 500.",
      "  EDGEQUITY_TICKERS=AAPL,MSFT     Fetch raw cache only for selected tickers.",
      "  EDGEQUITY_RAW_MAX_TICKERS=500   Cap raw cache fetch count when EDGEQUITY_TICKERS is not set.",
      "  EDGEQUITY_FINNHUB_DELAY_MS=13000 Delay between uncached Finnhub requests.",
      "  EDGEQUITY_REFRESH_UNIVERSE=1    Refetch stock/symbol even if universe cache exists.",
      "  EDGEQUITY_REFRESH_RAW=1         Refetch raw files even if cached.",
    ].join("\n"));
    return;
  }

  const apiKey = requiredEnv("FINNHUB_API_KEY");
  const limit = optionalPositiveIntegerEnv("EDGEQUITY_UNIVERSE_LIMIT", DEFAULT_UNIVERSE_LIMIT);
  const rawMaxTickers = optionalPositiveIntegerEnv("EDGEQUITY_RAW_MAX_TICKERS", limit);
  const delayMs = optionalPositiveIntegerEnv("EDGEQUITY_FINNHUB_DELAY_MS", DEFAULT_FINNHUB_DELAY_MS);
  const client = new FinnhubClient(apiKey, delayMs);
  const universe = await loadOrFetchUniverse(client, limit);
  const requestedTickers = parseTickerList(process.env.EDGEQUITY_TICKERS);
  const selectedUniverse = requestedTickers
    ? requestedTickers.map((ticker) => universe.find((stock) => stock.ticker === ticker) ?? {
        ticker,
        name: ticker,
        currency: null,
        exchangeMic: null,
        type: null,
        source: "finnhub:stock/symbol" as const,
      })
    : universe.slice(0, rawMaxTickers);

  if (process.env.EDGEQUITY_UNIVERSE_ONLY === "1") {
    console.log(`Wrote ${UNIVERSE_500_PATH} with ${universe.length} stocks.`);
    return;
  }

  const records: EdgequityStockRecord[] = [];
  const rejected: Array<{ ticker: string; error: string }> = [];

  for (const stock of selectedUniverse) {
    try {
      records.push(await buildThinRecord(client, stock));
      await writeRawFirstManifest(records, rejected);
      console.log(`PROGRESS ${records.length}/${selectedUniverse.length}: cached raw Finnhub data and thin summary for ${stock.ticker}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      rejected.push({ ticker: stock.ticker, error: message });
      await writeRawFirstManifest(records, rejected);
      console.warn(`Skipping ${stock.ticker}: ${message}`);
    }
  }

  await writeRawFirstManifest(records, rejected);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
