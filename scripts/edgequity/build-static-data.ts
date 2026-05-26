import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  EdgequityFinancialStatementPeriod,
  EdgequityFinancialStatements,
  EdgequityManifest,
  EdgequityManifestStock,
  EdgequityStockRecord,
} from "../../src/edgequity/types.ts";
import { AI_INFRASTRUCTURE_THEME_BY_TICKER, AI_INFRASTRUCTURE_UNIVERSE } from "./ai-universe.ts";
import { buildFinnhubUrl, fetchFinnhubJson, normalizeFinnhubMarketCap, type FinnhubMetricPayload, type FinnhubProfile } from "./finnhub.ts";
import { normalizeEdgequityRecord } from "./normalize.ts";
import { buildEarningsMetadata, buildTranscriptMetadata } from "./research-metadata.ts";
import { pullNormalizedSecStatements, type NormalizedStatementPayload } from "./sec-normalized.ts";

const DATA_DIR = path.join("public", "data", "edgequity");
const STOCKS_DIR = path.join(DATA_DIR, "stocks");
const TMP_DIR = path.join(DATA_DIR, ".tmp");
const DEFAULT_PROVIDER_DELAY_MS = 4_100;

type RawObject = Record<string, unknown>;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isStatementValue(value: unknown): value is number | string | null {
  return typeof value === "number" || typeof value === "string" || value === null;
}

function normalizePeriods(rows: RawObject[]): EdgequityFinancialStatementPeriod[] {
  return rows
    .map((row) => {
      const values: EdgequityFinancialStatementPeriod["values"] = {};
      for (const [key, value] of Object.entries(row)) {
        if (isStatementValue(value)) {
          values[key] = value;
        }
      }

      return {
        fiscalYear: String(row.fiscalYear ?? row.calendarYear ?? ""),
        period: String(row.period ?? "FY"),
        date: typeof row.date === "string" ? row.date : null,
        reportedCurrency: typeof row.reportedCurrency === "string" ? row.reportedCurrency : null,
        values,
      };
    })
    .filter((row) => row.fiscalYear.length > 0 && Object.keys(row.values).length > 0);
}

function buildFinancialStatements(statements: NormalizedStatementPayload): EdgequityFinancialStatements {
  return {
    source: {
      provider: statements.status === "ok" ? "sec" : "manual",
      endpoint: statements.status === "ok" ? "SEC Company Facts" : "missing",
      fetchedAt: new Date().toISOString(),
      status: statements.status === "ok" ? "ok" : "missing",
    },
    annual: {
      incomeStatement: normalizePeriods(statements.annual.incomeStatements),
      balanceSheet: normalizePeriods(statements.annual.balanceSheets),
      cashFlow: normalizePeriods(statements.annual.cashFlows),
    },
    quarterly: {
      incomeStatement: normalizePeriods(statements.quarterly.incomeStatements),
      balanceSheet: normalizePeriods(statements.quarterly.balanceSheets),
      cashFlow: normalizePeriods(statements.quarterly.cashFlows),
    },
  };
}

function emptyStatements(): NormalizedStatementPayload {
  return {
    source: "sec",
    status: "missing",
    annual: { incomeStatements: [], balanceSheets: [], cashFlows: [] },
    quarterly: { incomeStatements: [], balanceSheets: [], cashFlows: [] },
  };
}

async function safeFinnhubProfile(ticker: string, token: string): Promise<FinnhubProfile> {
  try {
    return await fetchFinnhubJson<FinnhubProfile>(buildFinnhubUrl("/stock/profile2", { symbol: ticker }, token));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`WARN ${ticker} profile: ${message}`);
    return {};
  }
}

async function safeFinnhubMetrics(ticker: string, token: string): Promise<FinnhubMetricPayload> {
  try {
    return await fetchFinnhubJson<FinnhubMetricPayload>(buildFinnhubUrl("/stock/metric", { symbol: ticker, metric: "all" }, token));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`WARN ${ticker} metrics: ${message}`);
    return { metric: {} };
  }
}

async function safeStatements(ticker: string): Promise<NormalizedStatementPayload> {
  try {
    return await pullNormalizedSecStatements(ticker);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`WARN ${ticker} statements: ${message}`);
    return emptyStatements();
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function selectedUniverse(): string[] {
  const requested = process.env.EDGEQUITY_TICKERS
    ?.split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);

  if (requested?.length) {
    const supported = new Set(AI_INFRASTRUCTURE_UNIVERSE.map((stock) => stock.ticker));
    const invalid = requested.filter((ticker) => !supported.has(ticker));
    if (invalid.length > 0) throw new Error(`Unsupported EDGEQUITY_TICKERS: ${invalid.join(", ")}`);
    return [...new Set(requested)];
  }

  return AI_INFRASTRUCTURE_UNIVERSE.map((stock) => stock.ticker);
}

async function buildStock(ticker: string, token: string): Promise<{ record: EdgequityStockRecord; manifestStock: EdgequityManifestStock }> {
  const [profile, metrics, statements, earnings, transcript] = await Promise.all([
    safeFinnhubProfile(ticker, token),
    safeFinnhubMetrics(ticker, token),
    safeStatements(ticker),
    buildEarningsMetadata(ticker, token).catch((error: unknown) => ({
      recent: null,
      next: null,
      updatedAt: new Date().toISOString(),
      error,
    })).then((result) => "error" in result ? {
      recent: null,
      next: null,
      updatedAt: result.updatedAt,
    } : result),
    buildTranscriptMetadata(ticker, token),
  ]);

  const theme = AI_INFRASTRUCTURE_THEME_BY_TICKER[ticker];
  const profileForNormalize: RawObject = {
    ...profile,
    name: profile.name ?? ticker,
    companyName: profile.name ?? ticker,
    marketCapitalization: undefined,
    mktCap: normalizeFinnhubMarketCap(profile.marketCapitalization),
    sector: "AI Infrastructure",
    industry: theme,
    finnhubIndustry: profile.finnhubIndustry,
    currency: profile.currency ?? "USD",
  };
  const financialStatements = buildFinancialStatements(statements);
  const record = normalizeEdgequityRecord({
    ticker,
    profile: profileForNormalize,
    metrics,
    incomeStatements: statements.annual.incomeStatements,
    balanceSheets: statements.annual.balanceSheets,
    cashFlows: statements.annual.cashFlows,
  });

  record.price = null;
  record.aiTheme = theme;
  record.earnings = earnings;
  record.transcript = transcript;
  record.financialStatements = financialStatements;
  record.statementQuality = {
    annualPeriods: financialStatements.annual.incomeStatement.length,
    quarterlyPeriods: financialStatements.quarterly?.incomeStatement.length ?? 0,
    source: statements.status === "ok" ? "sec" : "missing",
    status: statements.status === "ok" && financialStatements.annual.incomeStatement.length >= 5 && (financialStatements.quarterly?.incomeStatement.length ?? 0) >= 5
      ? "ok"
      : statements.status === "ok" ? "partial" : "missing",
    message: statements.status === "ok"
      ? "Financials normalized from SEC Company Facts."
      : "Financial statements were not available from SEC Company Facts.",
  };
  record.sources = {
    profile: { provider: "finnhub", endpoint: "stock/profile2", fetchedAt: new Date().toISOString(), status: Object.keys(profile).length > 0 ? "ok" : "partial" },
    metrics: { provider: "finnhub", endpoint: "stock/metric", fetchedAt: new Date().toISOString(), status: Object.keys(metrics.metric ?? {}).length > 0 ? "ok" : "partial" },
    financialsReported: financialStatements.source,
    summary: { provider: "derived", fetchedAt: new Date().toISOString(), status: "ok", message: "Summary metrics derived from normalized statements." },
  };

  const dataPath = `/data/edgequity/stocks/${record.ticker}.json`;
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

async function publish(records: EdgequityStockRecord[], manifest: EdgequityManifest): Promise<void> {
  const tempDir = path.join(TMP_DIR, `run-${Date.now()}-${process.pid}`);
  const tempStocks = path.join(tempDir, "stocks");

  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempStocks, { recursive: true });

  for (const record of records) {
    await writeFile(path.join(tempStocks, `${record.ticker}.json`), stringifyJson(record), "utf8");
  }
  await writeFile(path.join(tempDir, "manifest.json"), stringifyJson(manifest), "utf8");

  await mkdir(DATA_DIR, { recursive: true });
  await rm(STOCKS_DIR, { recursive: true, force: true });
  await rename(tempStocks, STOCKS_DIR);
  await rename(path.join(tempDir, "manifest.json"), path.join(DATA_DIR, "manifest.json"));
  await rm(tempDir, { recursive: true, force: true });
}

async function main() {
  const token = requiredEnv("FINNHUB_API_KEY");
  const delayMs = Number(process.env.EDGEQUITY_PROVIDER_DELAY_MS ?? String(DEFAULT_PROVIDER_DELAY_MS));
  const universe = selectedUniverse();
  const built = [];

  console.log(`Building ${universe.length} Edgequity stocks (provider delay ${delayMs}ms)`);
  for (const [index, ticker] of universe.entries()) {
    built.push(await buildStock(ticker, token));
    console.log(`PROGRESS ${index + 1}/${universe.length}: ${ticker}`);
    if (index < universe.length - 1) await sleep(delayMs);
  }

  const manifest: EdgequityManifest = {
    app: "Edgequity",
    version: 2,
    generatedAt: new Date().toISOString(),
    universe,
    stocks: built.map((item) => item.manifestStock),
  };

  await publish(built.map((item) => item.record), manifest);
  console.log(JSON.stringify({ stocks: built.length, manifest: "public/data/edgequity/manifest.json" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
