/**
 * Embed standardized financialStatements on stock records from fundamentals-charts.json.
 *
 * Usage:
 *   npx tsx scripts/edgequity/patch-stock-financials-from-charts.ts
 *   EDGEQUITY_TICKERS=NVDA npx tsx scripts/edgequity/patch-stock-financials-from-charts.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildFinancialStatementsFromCharts,
  verifyRevenueAgainstHistory,
} from "../../src/edgequity/standardize-financials.ts";
import type { FundamentalsChartsDocument } from "../../src/edgequity/fundamentals-charts.ts";
import type { EdgequityStockRecord } from "../../src/edgequity/types.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const STOCKS_DIR = path.join(ROOT, "public/data/edgequity/stocks");
const RAW_DIR = path.join(ROOT, "public/data/edgequity/raw");

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function patchTicker(ticker: string): Promise<void> {
  const chartsPath = path.join(RAW_DIR, ticker, "fundamentals-charts.json");
  const stockPath = path.join(STOCKS_DIR, `${ticker}.json`);

  const [charts, stock] = await Promise.all([
    readJson<FundamentalsChartsDocument>(chartsPath),
    readJson<EdgequityStockRecord>(stockPath),
  ]);

  const financialStatements = buildFinancialStatementsFromCharts(charts);
  if (!financialStatements) {
    console.warn(`${ticker}: no statement periods derived from charts`);
    return;
  }

  const verification = verifyRevenueAgainstHistory(stock, charts);
  if (!verification.ok) {
    console.warn(
      `${ticker}: revenue mismatch charts=${verification.chartRevenue} history=${verification.historyRevenue}`,
    );
  } else {
    console.log(
      `${ticker}: revenue OK $${((verification.chartRevenue ?? 0) / 1e9).toFixed(1)}B (charts vs stock history)`,
    );
  }

  const nextStock: EdgequityStockRecord = { ...stock, financialStatements };
  await writeFile(stockPath, `${JSON.stringify(nextStock, null, 2)}\n`, "utf8");
  console.log(`${ticker}: patched ${stockPath}`);
}

async function main() {
  const tickers =
    process.env.EDGEQUITY_TICKERS?.split(",")
      .map((ticker) => ticker.trim().toUpperCase())
      .filter(Boolean) ?? ["NVDA"];

  for (const ticker of tickers) {
    await patchTicker(ticker);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
