import assert from "node:assert/strict";
import test from "node:test";

import { AI_INFRASTRUCTURE_UNIVERSE, AI_INFRASTRUCTURE_THEME_BY_TICKER } from "./ai-universe.ts";

test("AI infrastructure universe has exactly 50 unique tickers", () => {
  assert.equal(AI_INFRASTRUCTURE_UNIVERSE.length, 50);
  assert.equal(new Set(AI_INFRASTRUCTURE_UNIVERSE.map((item) => item.ticker)).size, 50);
});

test("AI infrastructure universe includes the anchor AI platform names", () => {
  const tickers = new Set(AI_INFRASTRUCTURE_UNIVERSE.map((item) => item.ticker));

  for (const ticker of ["NVDA", "AMD", "AVGO", "TSM", "ASML", "MSFT", "GOOG", "AMZN", "META", "ORCL"]) {
    assert.equal(tickers.has(ticker), true, `${ticker} should be included`);
  }
});

test("every ticker has a ValuWise theme", () => {
  for (const stock of AI_INFRASTRUCTURE_UNIVERSE) {
    assert.equal(AI_INFRASTRUCTURE_THEME_BY_TICKER[stock.ticker], stock.theme);
    assert.equal(typeof stock.theme, "string");
    assert.ok(stock.theme.length > 0);
  }
});
