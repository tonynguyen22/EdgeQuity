import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { assertEdgequityStockRecord } from "../../src/edgequity/data.ts";

test("generated Edgequity manifest contains the 50-stock AI universe", () => {
  const manifest = JSON.parse(readFileSync("public/data/edgequity/manifest.json", "utf8")) as {
    universe: string[];
    stocks: Array<{ ticker: string; dataPath: string }>;
  };

  assert.equal(manifest.universe.length, 50);
  assert.equal(manifest.stocks.length, 50);
  assert.equal(new Set(manifest.universe).size, 50);
  assert.equal(manifest.stocks.every((stock) => stock.dataPath.startsWith("/data/edgequity/stocks/")), true);
});

test("generated Edgequity stock files validate against the app record schema", () => {
  const manifest = JSON.parse(readFileSync("public/data/edgequity/manifest.json", "utf8")) as {
    stocks: Array<{ ticker: string; dataPath: string }>;
  };

  for (const stock of manifest.stocks) {
    const stockPath = `public${stock.dataPath}`;
    assert.equal(existsSync(stockPath), true, `${stock.ticker} data file should exist`);

    const record = JSON.parse(readFileSync(stockPath, "utf8")) as unknown;
    assert.doesNotThrow(() => assertEdgequityStockRecord(record), `${stock.ticker} should be a valid stock record`);
  }
});
