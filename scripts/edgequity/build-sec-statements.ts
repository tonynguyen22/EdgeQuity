/**
 * Build SEC EDGAR statement cache for Edgequity universe (BCTC tab source of truth).
 *
 * Usage:
 *   npm run edgequity:sec-statements
 *   EDGEQUITY_TICKERS=AAPL,TSM,BRK.B npm run edgequity:sec-statements
 *   EDGEQUITY_REFRESH_SEC=1 npm run edgequity:sec-statements
 *   EDGEQUITY_SEC_DELAY_MS=250
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  EDGEQUITY_ROOT,
  loadSecTickerMap,
  pullSecStatementsForTicker,
  SEC_STATEMENTS_SCHEMA_VERSION,
  secStatementsPath,
} from "./sec-edgar.ts";

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const manifest = await readJsonFile<{ universe: string[] }>(
    path.join(EDGEQUITY_ROOT, "public/data/edgequity/manifest.raw-first.json"),
  );

  const tickersFromEnv = process.env.EDGEQUITY_TICKERS?.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
  const tickers = tickersFromEnv?.length ? tickersFromEnv : manifest.universe;
  const delayMs = Number(process.env.EDGEQUITY_SEC_DELAY_MS ?? "250");
  const refresh = process.env.EDGEQUITY_REFRESH_SEC === "1";

  console.log(`SEC statements build: ${tickers.length} tickers (delay ${delayMs}ms)`);
  const map = await loadSecTickerMap();
  console.log(`SEC ticker map: ${map.size} symbols`);

  let ok = 0;
  let noCik = 0;
  let noFacts = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i]!;
    const outPath = secStatementsPath(ticker);

    if (!refresh) {
      try {
        const existing = await readJsonFile<{ status?: string; schemaVersion?: number }>(outPath);
        if (existing.status === "ok" && existing.schemaVersion === SEC_STATEMENTS_SCHEMA_VERSION) {
          skipped++;
          if ((i + 1) % 50 === 0) console.log(`PROGRESS ${i + 1}/${tickers.length} (skipped cache hit)`);
          continue;
        }
      } catch {
        // fetch fresh
      }
    }

    try {
      const doc = await pullSecStatementsForTicker(ticker, map, { saveRawFacts: process.env.EDGEQUITY_SEC_SAVE_RAW === "1" });
      if (doc.status === "ok") ok++;
      else if (doc.status === "no_cik") noCik++;
      else noFacts++;

      if ((i + 1) % 25 === 0 || i === tickers.length - 1) {
        console.log(`PROGRESS ${i + 1}/${tickers.length}: ${ticker} → ${doc.status} (${doc.entityName ?? "n/a"})`);
      }
    } catch (error) {
      errors++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${ticker}: ${message}`);
    }

    if (i < tickers.length - 1) await sleep(delayMs);
  }

  console.log("\nDone.");
  console.log(JSON.stringify({ total: tickers.length, ok, noCik, noFacts, skipped, errors }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
