import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { FUNDRA_SUPPORTED_TICKERS } from "../../src/fundra/universe.ts";
import type { FundraManifest, FundraManifestStock, FundraStockRecord } from "../../src/fundra/types.ts";
import { normalizeFundraRecord } from "./normalize.ts";

const FUNDRA_DATA_DIR = path.join("public", "data", "fundra");
const FUNDRA_STOCKS_DIR = path.join(FUNDRA_DATA_DIR, "stocks");
const FUNDRA_TMP_DIR = path.join(FUNDRA_DATA_DIR, ".tmp");
const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FMP_STATEMENT_LIMIT = "6";
export const FMP_CALLS_PER_TICKER = 3;
export const DEFAULT_FMP_DAILY_CALL_BUDGET = 240;

type BuiltStock = {
  record: FundraStockRecord;
  manifestStock: FundraManifestStock;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to build Fundra static data.`);
  }

  return value;
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function optionalPositiveIntegerEnv(name: string): number | null {
  const value = process.env[name];
  if (!value) return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function selectedFundraTickers(): string[] {
  const supportedTickers: string[] = [...FUNDRA_SUPPORTED_TICKERS].sort();
  const supportedTickerSet = new Set<string>(supportedTickers);
  const requestedTickers = process.env.FUNDRA_TICKERS;
  let selectedTickers = supportedTickers;

  if (requestedTickers !== undefined) {
    const parsedTickers = requestedTickers
      .split(",")
      .map((ticker) => ticker.trim().toUpperCase())
      .filter((ticker) => ticker.length > 0);

    if (parsedTickers.length === 0) {
      throw new Error("FUNDRA_TICKERS must include at least one supported ticker.");
    }

    const invalidTickers = [...new Set(parsedTickers.filter((ticker) => !supportedTickerSet.has(ticker)))].sort();
    if (invalidTickers.length > 0) {
      throw new Error(
        `Unsupported FUNDRA_TICKERS: ${invalidTickers.join(", ")}. ` +
          `Use only FUNDRA_SUPPORTED_TICKERS values, for example FUNDRA_TICKERS=AAPL,MSFT.`,
      );
    }

    selectedTickers = [...new Set(parsedTickers)].sort();
  }

  const maxTickers = optionalPositiveIntegerEnv("FUNDRA_MAX_TICKERS");
  if (maxTickers !== null) {
    selectedTickers = selectedTickers.slice(0, maxTickers);
  }

  return selectedTickers;
}

function enforceFmpBudget(selectedTickers: string[]): void {
  const budget = optionalPositiveIntegerEnv("FUNDRA_FMP_CALL_BUDGET") ?? DEFAULT_FMP_DAILY_CALL_BUDGET;
  const plannedCalls = selectedTickers.length * FMP_CALLS_PER_TICKER;

  if (plannedCalls > budget) {
    throw new Error(
      `Fundra FMP request budget exceeded: ${selectedTickers.length} tickers would make ${plannedCalls} FMP calls ` +
        `(${FMP_CALLS_PER_TICKER} per ticker), over the configured budget of ${budget}. ` +
        "Set FUNDRA_TICKERS to a comma-separated subset or FUNDRA_MAX_TICKERS to cap the run. " +
        "Set FUNDRA_FMP_CALL_BUDGET only when you intentionally want a higher budget.",
    );
  }
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${response.statusText}: ${url.origin}${url.pathname}`);
  }

  return response.json() as Promise<T>;
}

async function fetchFmpStatement(endpoint: string, ticker: string, apiKey: string): Promise<Record<string, unknown>[]> {
  const url = new URL(`${FMP_BASE_URL}/${endpoint}`);
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("limit", FMP_STATEMENT_LIMIT);
  url.searchParams.set("apikey", apiKey);

  return fetchJson<Record<string, unknown>[]>(url);
}

async function fetchFinnhub(endpoint: string, ticker: string, apiKey: string): Promise<Record<string, unknown>> {
  const url = new URL(`${FINNHUB_BASE_URL}/${endpoint}`);
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("token", apiKey);
  if (endpoint === "stock/metric") {
    url.searchParams.set("metric", "all");
  }

  return fetchJson<Record<string, unknown>>(url);
}

async function buildStock(ticker: string, fmpApiKey: string, finnhubApiKey: string): Promise<BuiltStock> {
  const [incomeStatements, balanceSheets, cashFlows, profile, metrics] = await Promise.all([
    fetchFmpStatement("income-statement", ticker, fmpApiKey),
    fetchFmpStatement("balance-sheet-statement", ticker, fmpApiKey),
    fetchFmpStatement("cash-flow-statement", ticker, fmpApiKey),
    fetchFinnhub("stock/profile2", ticker, finnhubApiKey),
    fetchFinnhub("stock/metric", ticker, finnhubApiKey),
  ]);

  const record = normalizeFundraRecord({
    ticker,
    profile,
    metrics,
    incomeStatements,
    balanceSheets,
    cashFlows,
  });
  const dataPath = `/data/fundra/stocks/${ticker}.json`;

  return {
    record,
    manifestStock: {
      ticker: record.ticker,
      name: record.name,
      sector: record.sector,
      industry: record.industry,
      marketCap: record.marketCap,
      dataPath,
    },
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeTempStaticData(records: FundraStockRecord[], manifest: FundraManifest): Promise<string> {
  const tempDataDir = path.join(FUNDRA_TMP_DIR, `run-${Date.now()}-${process.pid}`);
  const tempStocksDir = path.join(tempDataDir, "stocks");

  await rm(tempDataDir, { recursive: true, force: true });
  await mkdir(tempStocksDir, { recursive: true });

  for (const record of records) {
    await writeFile(path.join(tempStocksDir, `${record.ticker}.json`), stringifyJson(record), "utf8");
  }

  await writeFile(path.join(tempDataDir, "manifest.json"), stringifyJson(manifest), "utf8");

  return tempDataDir;
}

async function publishStaticData(tempDataDir: string): Promise<void> {
  await mkdir(FUNDRA_DATA_DIR, { recursive: true });
  await mkdir(FUNDRA_TMP_DIR, { recursive: true });

  const tempStocksDir = path.join(tempDataDir, "stocks");
  const tempManifestPath = path.join(tempDataDir, "manifest.json");
  const finalManifestPath = path.join(FUNDRA_DATA_DIR, "manifest.json");
  const manifestSwapPath = path.join(FUNDRA_TMP_DIR, `manifest-${Date.now()}-${process.pid}.json`);
  const stockBackupDir = path.join(FUNDRA_TMP_DIR, `stocks-backup-${Date.now()}-${process.pid}`);
  const hadFinalStocks = await pathExists(FUNDRA_STOCKS_DIR);
  let finalStocksMoved = false;

  try {
    if (hadFinalStocks) {
      await rename(FUNDRA_STOCKS_DIR, stockBackupDir);
      finalStocksMoved = true;
    }

    await rename(tempStocksDir, FUNDRA_STOCKS_DIR);
    await rename(tempManifestPath, manifestSwapPath);
    await rename(manifestSwapPath, finalManifestPath);
  } catch (error) {
    if (finalStocksMoved) {
      await rm(FUNDRA_STOCKS_DIR, { recursive: true, force: true });
      await rename(stockBackupDir, FUNDRA_STOCKS_DIR);
    }

    throw error;
  } finally {
    await rm(manifestSwapPath, { force: true });
    await rm(stockBackupDir, { recursive: true, force: true });
    await rm(tempDataDir, { recursive: true, force: true });
  }
}

async function main() {
  const universe = selectedFundraTickers();
  enforceFmpBudget(universe);

  const fmpApiKey = requiredEnv("FMP_API_KEY");
  const finnhubApiKey = requiredEnv("FINNHUB_API_KEY");

  const builtStocks: BuiltStock[] = [];
  for (const ticker of universe) {
    builtStocks.push(await buildStock(ticker, fmpApiKey, finnhubApiKey));
  }

  const manifest: FundraManifest = {
    app: "Fundra",
    version: 1,
    generatedAt: new Date().toISOString(),
    universe,
    stocks: builtStocks.map((stock) => stock.manifestStock),
  };

  const tempDataDir = await writeTempStaticData(
    builtStocks.map((stock) => stock.record),
    manifest,
  );

  await publishStaticData(tempDataDir);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
