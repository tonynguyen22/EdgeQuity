/**
 * Build fundamentals chart cache (SEC quarterly/annual + Finnhub metric series).
 *
 * Usage:
 *   npm run edgequity:fundamentals-charts
 *   EDGEQUITY_TICKERS=AAPL,TSM npm run edgequity:fundamentals-charts
 *   EDGEQUITY_REFRESH_FUNDAMENTALS=1
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildFundamentalsChartsDocument,
  fundamentalsChartsPath,
  FUNDAMENTALS_CHARTS_SCHEMA_VERSION,
  readJsonFile,
} from "./fundamentals-charts.ts";
import {
  EDGEQUITY_ROOT,
  fetchCompanyFacts,
  loadSecTickerMap,
  resolveCik,
  secStatementsPath,
  type CompanyFactsPayload,
  type SecStatementsDocument,
} from "./sec-edgar.ts";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadCompanyFacts(
  ticker: string,
  cik: string | null,
  refresh: boolean,
): Promise<CompanyFactsPayload | null> {
  const factsPath = path.join(EDGEQUITY_ROOT, "public/data/edgequity/raw", ticker, "sec-company-facts.json");
  if (!refresh) {
    const cached = await readJsonFile<CompanyFactsPayload>(factsPath);
    if (cached?.facts) return cached;
  }
  if (!cik) return null;

  try {
    const facts = await fetchCompanyFacts(cik);
    if (process.env.EDGEQUITY_SEC_SAVE_RAW === "1") {
      await mkdir(path.dirname(factsPath), { recursive: true });
      await writeFile(factsPath, JSON.stringify(facts, null, 2));
    }
    return facts;
  } catch {
    return null;
  }
}

async function main() {
  const manifest = await readJsonFile<{ universe: string[] }>(
    path.join(EDGEQUITY_ROOT, "public/data/edgequity/manifest.raw-first.json"),
  );
  if (!manifest?.universe?.length) throw new Error("manifest.raw-first.json missing universe");

  const tickersFromEnv = process.env.EDGEQUITY_TICKERS?.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
  const tickers = tickersFromEnv?.length ? tickersFromEnv : manifest.universe;
  const refresh = process.env.EDGEQUITY_REFRESH_FUNDAMENTALS === "1";
  const secDelayMs = Number(process.env.EDGEQUITY_SEC_DELAY_MS ?? "250");

  console.log(`Fundamentals charts build: ${tickers.length} tickers`);
  const map = await loadSecTickerMap();

  let ok = 0;
  let partial = 0;
  let missing = 0;
  let skipped = 0;

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i]!;
    const outPath = fundamentalsChartsPath(ticker);

    if (!refresh) {
      const existing = await readJsonFile<{ schemaVersion?: number; status?: string; sections?: unknown[] }>(outPath);
      if (
        existing?.schemaVersion === FUNDAMENTALS_CHARTS_SCHEMA_VERSION
        && (existing.status === "ok" || existing.status === "partial")
        && (existing.sections?.length ?? 0) > 0
      ) {
        skipped++;
        continue;
      }
    }

    const metricsPath = path.join(EDGEQUITY_ROOT, "public/data/edgequity/raw", ticker, "metrics.json");
    const metricsPayload = await readJsonFile<Record<string, unknown>>(metricsPath);

    const statements = await readJsonFile<SecStatementsDocument>(secStatementsPath(ticker));

    const resolved = resolveCik(ticker, map);
    const cik = resolved ? String(resolved.cik_str).replace(/\D/g, "").padStart(10, "0") : null;
    const facts = await loadCompanyFacts(ticker, cik, refresh);
    if (facts && i < tickers.length - 1) await sleep(secDelayMs);

    const document = buildFundamentalsChartsDocument(ticker, facts, statements, metricsPayload);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify(document, null, 2));

    if (document.status === "ok") ok++;
    else if (document.status === "partial") partial++;
    else missing++;

    if ((i + 1) % 25 === 0 || i === tickers.length - 1) {
      const metricCount = document.sections.reduce((sum, section) => sum + section.metrics.length, 0);
      console.log(`PROGRESS ${i + 1}/${tickers.length}: ${ticker} → ${document.status} (${metricCount} charts)`);
    }
  }

  console.log("\nDone.");
  console.log(JSON.stringify({ total: tickers.length, ok, partial, missing, skipped }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
