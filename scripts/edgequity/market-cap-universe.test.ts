import assert from "node:assert/strict";
import test from "node:test";

import { parseMarketCapLabel, parseStockAnalysisMarketCapTable } from "./market-cap-universe.ts";

test("parseMarketCapLabel converts compact market-cap labels to USD units", () => {
  assert.equal(parseMarketCapLabel("5.38T"), 5_380_000_000_000);
  assert.equal(parseMarketCapLabel("566.28B"), 566_280_000_000);
  assert.equal(parseMarketCapLabel("839.03M"), 839_030_000);
  assert.equal(parseMarketCapLabel("-"), null);
});

test("parseStockAnalysisMarketCapTable preserves market-cap rank order", () => {
  const parsed = parseStockAnalysisMarketCapTable(`
| No. | Symbol | Company Name | Market Cap | Stock Price | % Change | Revenue |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | [NVDA](https://stockanalysis.com/stocks/nvda/) | NVIDIA Corporation | 5.38T | 222.32 | -1.33% | 215.94B |
| 2 | [GOOGL](https://stockanalysis.com/stocks/googl/) | Alphabet Inc. | 4.81T | 396.94 | 0.04% | 422.50B |
| 3 | [BRK.B](https://stockanalysis.com/stocks/brk.b/) | Berkshire Hathaway Inc. | 1.04T | 488.38 | 1.18% | 375.39B |
`, 3);

  assert.deepEqual(parsed.map((stock) => stock.ticker), ["NVDA", "GOOGL", "BRK.B"]);
  assert.deepEqual(parsed.map((stock) => stock.rank), [1, 2, 3]);
  assert.equal(parsed[0]?.marketCapLabel, "5.38T");
  assert.equal(parsed[0]?.marketCapUsd, 5_380_000_000_000);
});
