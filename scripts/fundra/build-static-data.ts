import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { FUNDRA_SUPPORTED_TICKERS } from "../../src/fundra/universe.ts";
import type { FundraManifest, FundraManifestStock } from "../../src/fundra/types.ts";
import { normalizeFundraRecord } from "./normalize.ts";

const FUNDRA_DATA_DIR = path.join("public", "data", "fundra");
const FUNDRA_STOCKS_DIR = path.join(FUNDRA_DATA_DIR, "stocks");
const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

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
  url.searchParams.set("limit", "5");
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

async function buildStock(ticker: string, fmpApiKey: string, finnhubApiKey: string): Promise<FundraManifestStock> {
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

  await writeFile(path.join(FUNDRA_STOCKS_DIR, `${ticker}.json`), stringifyJson(record), "utf8");

  return {
    ticker: record.ticker,
    name: record.name,
    sector: record.sector,
    industry: record.industry,
    marketCap: record.marketCap,
    dataPath,
  };
}

async function main() {
  const fmpApiKey = requiredEnv("FMP_API_KEY");
  const finnhubApiKey = requiredEnv("FINNHUB_API_KEY");
  const universe = [...FUNDRA_SUPPORTED_TICKERS].sort();

  await mkdir(FUNDRA_STOCKS_DIR, { recursive: true });

  const stocks: FundraManifestStock[] = [];
  for (const ticker of universe) {
    stocks.push(await buildStock(ticker, fmpApiKey, finnhubApiKey));
  }

  const manifest: FundraManifest = {
    app: "Fundra",
    version: 1,
    generatedAt: new Date().toISOString(),
    universe,
    stocks,
  };

  await writeFile(path.join(FUNDRA_DATA_DIR, "manifest.json"), stringifyJson(manifest), "utf8");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
