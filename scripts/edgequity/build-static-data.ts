import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { EDGEQUITY_SUPPORTED_TICKERS } from "../../src/edgequity/universe.ts";
import type {
  EdgequityFinancialStatementPeriod,
  EdgequityFinancialStatements,
  EdgequityManifest,
  EdgequityManifestStock,
  EdgequityStockRecord,
} from "../../src/edgequity/types.ts";
import { normalizeEdgequityRecord } from "./normalize.ts";

const EDGEQUITY_DATA_DIR = path.join("public", "data", "edgequity");
const EDGEQUITY_STOCKS_DIR = path.join(EDGEQUITY_DATA_DIR, "stocks");
const EDGEQUITY_TMP_DIR = path.join(EDGEQUITY_DATA_DIR, ".tmp");
const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const FMP_STATEMENT_LIMIT = "5";
export const FMP_CALLS_PER_TICKER = 6;
export const DEFAULT_FMP_DAILY_CALL_BUDGET = 492;
const DEFAULT_FMP_REQUEST_DELAY_MS = 350;

type BuiltStock = {
  record: EdgequityStockRecord;
  manifestStock: EdgequityManifestStock;
};

type RawObject = Record<string, unknown>;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to build Edgequity static data.`);
  }

  return value;
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized !== null) return normalized;
  }

  return null;
}

function normalizeFmpStatementPeriod(statement: RawObject): EdgequityFinancialStatementPeriod {
  const values: EdgequityFinancialStatementPeriod["values"] = {};

  for (const [key, value] of Object.entries(statement)) {
    const normalized = normalizeNumber(value);
    if (normalized !== null) values[key] = normalized;
  }

  return {
    fiscalYear: firstString(statement.fiscalYear, statement.calendarYear, normalizeString(statement.date)?.slice(0, 4)) ?? "",
    period: firstString(statement.period) ?? "FY",
    date: firstString(statement.date),
    reportedCurrency: firstString(statement.reportedCurrency, statement.currency),
    values,
  };
}

function normalizeFmpStatementPeriods(statements: RawObject[]): EdgequityFinancialStatementPeriod[] {
  return statements
    .map(normalizeFmpStatementPeriod)
    .filter((statement) => statement.fiscalYear.length > 0 && Object.keys(statement.values).length > 0);
}

function buildFinancialStatements(
  incomeStatements: RawObject[],
  balanceSheets: RawObject[],
  cashFlows: RawObject[],
  quarterlyIncomeStatements: RawObject[],
  quarterlyBalanceSheets: RawObject[],
  quarterlyCashFlows: RawObject[],
): EdgequityFinancialStatements {
  return {
    source: {
      provider: "fmp",
      endpoint: "income-statement,balance-sheet-statement,cash-flow-statement?period=annual,quarter",
      fetchedAt: new Date().toISOString(),
      status: "ok",
    },
    annual: {
      incomeStatement: normalizeFmpStatementPeriods(incomeStatements),
      balanceSheet: normalizeFmpStatementPeriods(balanceSheets),
      cashFlow: normalizeFmpStatementPeriods(cashFlows),
    },
    quarterly: {
      incomeStatement: normalizeFmpStatementPeriods(quarterlyIncomeStatements),
      balanceSheet: normalizeFmpStatementPeriods(quarterlyBalanceSheets),
      cashFlow: normalizeFmpStatementPeriods(quarterlyCashFlows),
    },
  };
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function selectedEdgequityTickers(): string[] {
  const supportedTickers: string[] = [...EDGEQUITY_SUPPORTED_TICKERS].sort();
  const supportedTickerSet = new Set<string>(supportedTickers);
  const requestedTickers = process.env.EDGEQUITY_TICKERS;
  let selectedTickers = supportedTickers;

  if (requestedTickers !== undefined) {
    const parsedTickers = requestedTickers
      .split(",")
      .map((ticker) => ticker.trim().toUpperCase())
      .filter((ticker) => ticker.length > 0);

    if (parsedTickers.length === 0) {
      throw new Error("EDGEQUITY_TICKERS must include at least one supported ticker.");
    }

    const invalidTickers = [...new Set(parsedTickers.filter((ticker) => !supportedTickerSet.has(ticker)))].sort();
    if (invalidTickers.length > 0) {
      throw new Error(
        `Unsupported EDGEQUITY_TICKERS: ${invalidTickers.join(", ")}. ` +
          `Use only EDGEQUITY_SUPPORTED_TICKERS values, for example EDGEQUITY_TICKERS=AAPL,MSFT.`,
      );
    }

    selectedTickers = [...new Set(parsedTickers)].sort();
  }

  const maxTickers = optionalPositiveIntegerEnv("EDGEQUITY_MAX_TICKERS");
  if (maxTickers !== null) {
    selectedTickers = selectedTickers.slice(0, maxTickers);
  }

  return selectedTickers;
}

function enforceFmpBudget(selectedTickers: string[]): void {
  const budget = optionalPositiveIntegerEnv("EDGEQUITY_FMP_CALL_BUDGET") ?? DEFAULT_FMP_DAILY_CALL_BUDGET;
  const plannedCalls = selectedTickers.length * FMP_CALLS_PER_TICKER;

  if (plannedCalls > budget) {
    throw new Error(
      `Edgequity FMP request budget exceeded: ${selectedTickers.length} tickers would make ${plannedCalls} FMP calls ` +
        `(${FMP_CALLS_PER_TICKER} per ticker), over the configured budget of ${budget}. ` +
        "Set EDGEQUITY_TICKERS to a comma-separated subset or EDGEQUITY_MAX_TICKERS to cap the run. " +
        "Set EDGEQUITY_FMP_CALL_BUDGET only when you intentionally want a higher budget.",
    );
  }
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    const detail = body.trim().length > 0 ? ` - ${body.trim().slice(0, 240)}` : "";
    throw new Error(`Request failed ${response.status} ${response.statusText}: ${url.origin}${url.pathname}${detail}`);
  }

  return response.json() as Promise<T>;
}

async function fetchFmpStatement(
  endpoint: string,
  ticker: string,
  apiKey: string,
  period: "annual" | "quarter",
): Promise<Record<string, unknown>[]> {
  const delayMs = optionalPositiveIntegerEnv("EDGEQUITY_FMP_REQUEST_DELAY_MS") ?? DEFAULT_FMP_REQUEST_DELAY_MS;
  await sleep(delayMs);

  const url = new URL(`${FMP_BASE_URL}/${endpoint}`);
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("period", period);
  url.searchParams.set("limit", FMP_STATEMENT_LIMIT);
  url.searchParams.set("apikey", apiKey);

  return fetchJson<Record<string, unknown>[]>(url);
}

async function readExistingStock(ticker: string): Promise<EdgequityStockRecord | null> {
  try {
    const payload = await readFile(path.join(EDGEQUITY_STOCKS_DIR, `${ticker}.json`), "utf8");
    return JSON.parse(payload) as EdgequityStockRecord;
  } catch {
    return null;
  }
}

function profileFromExistingStock(ticker: string, existing: EdgequityStockRecord | null): RawObject {
  return {
    companyName: existing?.name ?? ticker,
    name: existing?.name ?? ticker,
    currency: existing?.currency ?? "USD",
    price: existing?.price,
    mktCap: existing?.marketCap,
    sector: existing?.sector,
    industry: existing?.industry,
  };
}

async function buildStock(ticker: string, fmpApiKey: string): Promise<BuiltStock> {
  const existingStock = await readExistingStock(ticker);
  const incomeStatements = await fetchFmpStatement("income-statement", ticker, fmpApiKey, "annual");
  const balanceSheets = await fetchFmpStatement("balance-sheet-statement", ticker, fmpApiKey, "annual");
  const cashFlows = await fetchFmpStatement("cash-flow-statement", ticker, fmpApiKey, "annual");
  const quarterlyIncomeStatements = await fetchFmpStatement("income-statement", ticker, fmpApiKey, "quarter");
  const quarterlyBalanceSheets = await fetchFmpStatement("balance-sheet-statement", ticker, fmpApiKey, "quarter");
  const quarterlyCashFlows = await fetchFmpStatement("cash-flow-statement", ticker, fmpApiKey, "quarter");

  const record = normalizeEdgequityRecord({
    ticker,
    profile: profileFromExistingStock(ticker, existingStock),
    metrics: {},
    incomeStatements,
    balanceSheets,
    cashFlows,
  });
  record.price = null;
  record.financialStatements = buildFinancialStatements(
    incomeStatements,
    balanceSheets,
    cashFlows,
    quarterlyIncomeStatements,
    quarterlyBalanceSheets,
    quarterlyCashFlows,
  );
  record.sources = {
    profile: {
      provider: existingStock ? "manual" : "derived",
      fetchedAt: record.financialStatements.source.fetchedAt,
      status: existingStock ? "ok" : "partial",
      message: existingStock ? "Reused from previous static stock record" : "Fallback ticker metadata",
    },
    financialsReported: record.financialStatements.source,
    summary: {
      provider: "derived",
      fetchedAt: record.financialStatements.source.fetchedAt,
      status: "ok",
      message: "Summary metrics derived from FMP three-statement data",
    },
  };
  const dataPath = `/data/edgequity/stocks/${ticker}.json`;

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

async function writeTempStaticData(records: EdgequityStockRecord[], manifest: EdgequityManifest): Promise<string> {
  const tempDataDir = path.join(EDGEQUITY_TMP_DIR, `run-${Date.now()}-${process.pid}`);
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
  await mkdir(EDGEQUITY_DATA_DIR, { recursive: true });
  await mkdir(EDGEQUITY_TMP_DIR, { recursive: true });

  const tempStocksDir = path.join(tempDataDir, "stocks");
  const tempManifestPath = path.join(tempDataDir, "manifest.json");
  const finalManifestPath = path.join(EDGEQUITY_DATA_DIR, "manifest.json");
  const manifestSwapPath = path.join(EDGEQUITY_TMP_DIR, `manifest-${Date.now()}-${process.pid}.json`);
  const stockBackupDir = path.join(EDGEQUITY_TMP_DIR, `stocks-backup-${Date.now()}-${process.pid}`);
  const hadFinalStocks = await pathExists(EDGEQUITY_STOCKS_DIR);
  let finalStocksMoved = false;

  try {
    if (hadFinalStocks) {
      await rename(EDGEQUITY_STOCKS_DIR, stockBackupDir);
      finalStocksMoved = true;
    }

    await rename(tempStocksDir, EDGEQUITY_STOCKS_DIR);
    await rename(tempManifestPath, manifestSwapPath);
    await rename(manifestSwapPath, finalManifestPath);
  } catch (error) {
    if (finalStocksMoved) {
      await rm(EDGEQUITY_STOCKS_DIR, { recursive: true, force: true });
      await rename(stockBackupDir, EDGEQUITY_STOCKS_DIR);
    }

    throw error;
  } finally {
    await rm(manifestSwapPath, { force: true });
    await rm(stockBackupDir, { recursive: true, force: true });
    await rm(tempDataDir, { recursive: true, force: true });
  }
}

async function main() {
  const universe = selectedEdgequityTickers();
  enforceFmpBudget(universe);

  const fmpApiKey = requiredEnv("FMP_API_KEY");

  const builtStocks: BuiltStock[] = [];
  for (const ticker of universe) {
    builtStocks.push(await buildStock(ticker, fmpApiKey));
  }

  const manifest: EdgequityManifest = {
    app: "Edgequity",
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
