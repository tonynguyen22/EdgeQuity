/**
 * Refresh SEC-normalized financialStatements on existing stock JSON files
 * without calling Finnhub (no FINNHUB_API_KEY required).
 *
 *   EDGEQUITY_TICKERS=NVDA npx tsx scripts/edgequity/refresh-stock-statements.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  EdgequityFinancialStatementPeriod,
  EdgequityFinancialStatements,
  EdgequityStockRecord,
} from "../../src/edgequity/types.ts";
import { AI_INFRASTRUCTURE_UNIVERSE } from "./ai-universe.ts";
import { pullNormalizedSecStatements, type NormalizedStatementPayload } from "./sec-normalized.ts";

const STOCKS_DIR = path.join("public", "data", "edgequity", "stocks");

type RawObject = Record<string, unknown>;

function isStatementValue(value: unknown): value is number | string | null {
  return typeof value === "number" || typeof value === "string" || value === null;
}

function normalizePeriods(rows: RawObject[]): EdgequityFinancialStatementPeriod[] {
  return rows
    .map((row) => {
      const values: EdgequityFinancialStatementPeriod["values"] = {};
      for (const [key, value] of Object.entries(row)) {
        if (isStatementValue(value)) values[key] = value;
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
  const fetchedAt = new Date().toISOString();
  return {
    source: {
      provider: statements.status === "ok" ? "sec" : "manual",
      endpoint: statements.status === "ok" ? "SEC Company Facts" : "missing",
      fetchedAt,
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

function selectedTickers(): string[] {
  const requested = process.env.EDGEQUITY_TICKERS
    ?.split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);
  if (requested?.length) return [...new Set(requested)];
  return AI_INFRASTRUCTURE_UNIVERSE.map((stock) => stock.ticker);
}

async function refreshTicker(ticker: string): Promise<void> {
  const filePath = path.join(STOCKS_DIR, `${ticker}.json`);
  const record = JSON.parse(await readFile(filePath, "utf8")) as EdgequityStockRecord;
  const statements = await pullNormalizedSecStatements(ticker);
  const financialStatements = buildFinancialStatements(statements);

  record.financialStatements = financialStatements;
  record.statementQuality = {
    annualPeriods: financialStatements.annual.incomeStatement.length,
    quarterlyPeriods: financialStatements.quarterly?.incomeStatement.length ?? 0,
    source: statements.status === "ok" ? "sec" : "missing",
    status:
      statements.status === "ok"
      && financialStatements.annual.incomeStatement.length >= 5
      && (financialStatements.quarterly?.incomeStatement.length ?? 0) >= 5
        ? "ok"
        : statements.status === "ok"
          ? "partial"
          : "missing",
    message: statements.status === "ok"
      ? "Financials normalized from SEC Company Facts."
      : "Financial statements were not available from SEC Company Facts.",
  };
  if (record.sources?.financialsReported) {
    record.sources.financialsReported = financialStatements.source;
  }

  await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  const latest = financialStatements.quarterly?.incomeStatement[0];
  console.log(
    `${ticker}: ${statements.status} — ${financialStatements.quarterly?.incomeStatement.length ?? 0} quarterly income rows; newest ${latest?.fiscalYear}-${latest?.period} ${latest?.date} rev=${latest?.values.revenue ?? "n/a"}`,
  );
}

async function main() {
  const tickers = selectedTickers();
  console.log(`Refreshing SEC statements for ${tickers.length} ticker(s)`);
  for (const ticker of tickers) {
    await refreshTicker(ticker);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
