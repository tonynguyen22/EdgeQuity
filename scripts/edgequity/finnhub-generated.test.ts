import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { assertEdgequityStockRecord } from "../../src/edgequity/data.ts";

const universe500 = JSON.parse(readFileSync(
  new URL("../../public/data/edgequity/universe-500.json", import.meta.url),
  "utf8",
)) as {
  count: number;
  source: { provider: string; sort: string };
  stocks: Array<{ ticker: string; type: string; source: string; marketCapRank: number; marketCapLabel: string }>;
};

const rawFirstManifest = JSON.parse(readFileSync(
  new URL("../../public/data/edgequity/manifest.raw-first.json", import.meta.url),
  "utf8",
)) as {
  universe: string[];
  stocks: Array<{ ticker: string; dataPath: string }>;
  source: { provider: string; mode: string; rawCachePath: string };
};

test("generated market-cap universe contains 500 ranked common-stock tickers", () => {
  assert.equal(universe500.count, 500);
  assert.equal(universe500.stocks.length, 500);
  assert.equal(universe500.source.provider, "stockanalysis");
  assert.equal(universe500.source.sort, "marketCapDescending");

  const tickers = universe500.stocks.map((stock) => stock.ticker);
  assert.equal(new Set(tickers).size, 500);
  assert.deepEqual(tickers.slice(0, 5), ["NVDA", "GOOGL", "AAPL", "MSFT", "AMZN"]);

  for (const [index, stock] of universe500.stocks.entries()) {
    assert.match(stock.ticker, /^[A-Z][A-Z0-9.-]{0,9}$/);
    assert.equal(stock.type, "Common Stock");
    assert.equal(stock.source, "stockanalysis:biggest-companies");
    assert.equal(stock.marketCapRank, index + 1);
    assert.match(stock.marketCapLabel, /^\d+(\.\d+)?[BTM]$/);
  }
});

test("generated raw cache includes source metadata and as-reported financials", () => {
  for (const ticker of ["AAPL", "NVDA"]) {
    const rawDir = new URL(`../../public/data/edgequity/raw/${ticker}/`, import.meta.url);
    const source = JSON.parse(readFileSync(new URL("source.json", rawDir), "utf8")) as { status: string; provider: string };
    const financials = JSON.parse(readFileSync(new URL("financials-reported-annual.json", rawDir), "utf8")) as { data?: unknown[] };

    assert.equal(source.provider, "finnhub");
    assert.match(source.status, /^(ok|partial)$/);
    assert.ok(Array.isArray(financials.data), `${ticker} should include annual reported financial filings`);
  }
});

test("generated thin summaries are isolated from curated stock files", () => {
  assert.equal(rawFirstManifest.source.provider, "finnhub");
  assert.equal(rawFirstManifest.source.mode, "raw-first");
  assert.equal(rawFirstManifest.source.rawCachePath, "/data/edgequity/raw/{TICKER}/");

  for (const stock of rawFirstManifest.stocks) {
    assert.match(stock.dataPath, /^\/data\/edgequity\/stocks-raw-first\//);

    const stockPath = new URL(`../../public${stock.dataPath}`, import.meta.url);
    assert.ok(existsSync(stockPath), `${stock.ticker} thin summary should exist`);

    const record = JSON.parse(readFileSync(stockPath, "utf8")) as unknown;
    assert.doesNotThrow(() => assertEdgequityStockRecord(record));
  }
});
