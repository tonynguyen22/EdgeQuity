/**
 * Rebuild + validate fundamentals charts for a random sample of tickers.
 *
 * Usage:
 *   npx tsx scripts/edgequity/validate-fundamentals-sample.ts
 *   EDGEQUITY_SAMPLE_SIZE=3 npx tsx scripts/edgequity/validate-fundamentals-sample.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { FUNDAMENTALS_CATALOG } from "./fundamentals-catalog.ts";
import {
  buildFundamentalsChartsDocument,
  fundamentalsChartsPath,
  readJsonFile,
  type FundamentalsChartPoint,
  type FundamentalsChartsDocument,
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

const SAMPLE_SIZE = Number(process.env.EDGEQUITY_SAMPLE_SIZE ?? "3");
const SAMPLE_TICKERS = process.env.EDGEQUITY_SAMPLE_TICKERS?.split(",")
  .map((t) => t.trim().toUpperCase())
  .filter(Boolean);

function periodSortKey(period: string): number {
  const quarter = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) return Number(quarter[1]) * 10 + Number(quarter[2]);
  const year = Number.parseInt(period.slice(0, 4), 10);
  return Number.isFinite(year) ? year * 10 : 0;
}

function isAscending(points: FundamentalsChartPoint[]): boolean {
  for (let i = 1; i < points.length; i++) {
    if (periodSortKey(points[i]!.period) < periodSortKey(points[i - 1]!.period)) return false;
  }
  return true;
}

function looksLikeYtdQuarterlyRevenue(points: FundamentalsChartPoint[]): string | null {
  if (points.length < 2) return null;
  const last = points.at(-1)!;
  const prev = points.at(-2)!;
  if (prev.value > 0 && last.value > prev.value * 2.25) {
    return `QoQ jump ${last.period} ${last.value} vs ${prev.period} ${prev.value} (possible YTD)`;
  }
  return null;
}

function validateDocument(doc: FundamentalsChartsDocument): string[] {
  const issues: string[] = [];
  const catalogIds = new Set(
    FUNDAMENTALS_CATALOG.flatMap((section) => section.metrics.map((metric) => metric.id)),
  );

  for (const section of doc.sections) {
    for (const metric of section.metrics) {
      if (!isAscending(metric.annual)) {
        issues.push(`${doc.ticker} ${metric.id} annual not ascending: ${metric.annual.map((p) => p.period).join(", ")}`);
      }
      if (!isAscending(metric.quarterly)) {
        issues.push(`${doc.ticker} ${metric.id} quarterly not ascending: ${metric.quarterly.map((p) => p.period).join(", ")}`);
      }
      for (const point of [...metric.annual, ...metric.quarterly]) {
        if (!Number.isFinite(point.value)) {
          issues.push(`${doc.ticker} ${metric.id} invalid value at ${point.period}`);
        }
      }
      if (metric.id === "revenue") {
        const ytd = looksLikeYtdQuarterlyRevenue(metric.quarterly);
        if (ytd) issues.push(`${doc.ticker} revenue: ${ytd}`);
      }
    }
  }

  const builtIds = new Set(doc.sections.flatMap((s) => s.metrics.map((m) => m.id)));
  const missing = [...catalogIds].filter((id) => !builtIds.has(id));
  if (missing.length > 0) {
    console.warn(`${doc.ticker} optional metrics without data: ${missing.join(", ")}`);
  }

  return issues;
}

function pickRandomTickers(universe: string[], count: number): string[] {
  const copy = universe.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}

async function main() {
  const manifestPath = path.join(EDGEQUITY_ROOT, "public/data/edgequity/manifest.raw-first.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { universe: string[] };
  const tickers =
    SAMPLE_TICKERS?.length
      ? SAMPLE_TICKERS
      : pickRandomTickers(manifest.universe, SAMPLE_SIZE);

  console.log(`Sample tickers (${SAMPLE_SIZE}): ${tickers.join(", ")}`);
  const map = await loadSecTickerMap();

  const allIssues: string[] = [];

  for (const ticker of tickers) {
    const metricsPath = path.join(EDGEQUITY_ROOT, "public/data/edgequity/raw", ticker, "metrics.json");
    const metricsPayload = await readJsonFile<Record<string, unknown>>(metricsPath);
    const statements = await readJsonFile<SecStatementsDocument>(secStatementsPath(ticker));
    const resolved = resolveCik(ticker, map);
    let facts: CompanyFactsPayload | null = null;
    if (resolved) {
      try {
        facts = await fetchCompanyFacts(String(resolved.cik_str).replace(/\D/g, "").padStart(10, "0"));
      } catch {
        facts = null;
      }
    }

    const document = buildFundamentalsChartsDocument(ticker, facts, statements, metricsPayload);
    const outPath = fundamentalsChartsPath(ticker);
    await writeFile(outPath, JSON.stringify(document, null, 2));

    const metricCount = document.sections.reduce((sum, s) => sum + s.metrics.length, 0);
    console.log(`\n${ticker}: ${document.status}, ${metricCount} metrics`);
    for (const section of document.sections) {
      for (const metric of section.metrics) {
        const a = metric.annual.map((p) => p.period).join(" → ");
        const q = metric.quarterly.length
          ? metric.quarterly.map((p) => p.period).join(" → ")
          : "(none)";
        console.log(`  ${metric.id}: annual [${a}] | quarterly [${q}]`);
      }
    }

    allIssues.push(...validateDocument(document));
  }

  console.log("\n--- Validation ---");
  if (allIssues.length === 0) {
    console.log("PASS — all sample metrics ascending and present.");
  } else {
    console.log(`FAIL — ${allIssues.length} issue(s):`);
    for (const issue of allIssues) console.log(`  - ${issue}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
