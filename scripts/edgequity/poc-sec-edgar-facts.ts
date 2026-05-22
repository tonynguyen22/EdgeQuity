/**
 * Quick SEC pull for a few tickers (delegates to sec-edgar module).
 * Usage: npx tsx scripts/edgequity/poc-sec-edgar-facts.ts TSM ASML BRK.B
 */

import { loadSecTickerMap, pullSecStatementsForTicker } from "./sec-edgar.ts";

async function main() {
  const tickers = process.argv.slice(2);
  if (tickers.length === 0) {
    console.log("Usage: npx tsx scripts/edgequity/poc-sec-edgar-facts.ts TSM ASML BRK.B");
    process.exit(1);
  }

  const map = await loadSecTickerMap();
  for (const ticker of tickers) {
    const doc = await pullSecStatementsForTicker(ticker, map, { saveRawFacts: true });
    console.log(`${ticker}: ${doc.status} · ${doc.entityName ?? "n/a"} · rows ic=${doc.statements.ic.rows.length} bs=${doc.statements.bs.rows.length} cf=${doc.statements.cf.rows.length}`);
    await new Promise((r) => setTimeout(r, 300));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
