import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface MarketCapUniverseStock {
  rank: number;
  ticker: string;
  name: string;
  marketCapLabel: string;
  marketCapUsd: number;
  source: "stockanalysis:biggest-companies";
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

export function parseMarketCapLabel(label: string): number | null {
  const match = label.trim().match(/^(\d+(?:\.\d+)?)([TBM])$/i);
  if (!match) return null;

  const value = Number(match[1]);
  const suffix = match[2]?.toUpperCase();
  if (!Number.isFinite(value)) return null;

  if (suffix === "T") return value * 1_000_000_000_000;
  if (suffix === "B") return value * 1_000_000_000;
  if (suffix === "M") return value * 1_000_000;

  return null;
}

export function parseStockAnalysisMarketCapTable(markdown: string, limit = 500): MarketCapUniverseStock[] {
  const rows: MarketCapUniverseStock[] = [];
  const rowPattern =
    /^\|\s*(\d+)\s*\|\s*\[([A-Za-z0-9.-]+)\]\([^)]+\)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(markdown)) !== null && rows.length < limit) {
    const rank = Number(match[1]);
    const ticker = normalizeTicker(match[2] ?? "");
    const name = (match[3] ?? "").trim();
    const marketCapLabel = (match[4] ?? "").trim();
    const marketCapUsd = parseMarketCapLabel(marketCapLabel);

    if (!Number.isInteger(rank) || !ticker || !name || marketCapUsd === null) {
      continue;
    }

    rows.push({
      rank,
      ticker,
      name,
      marketCapLabel,
      marketCapUsd,
      source: "stockanalysis:biggest-companies",
    });
  }

  return rows;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log([
      "Build Edgequity top-500 market-cap universe from a StockAnalysis markdown export.",
      "",
      "Environment:",
      "  EDGEQUITY_MARKET_CAP_SOURCE_FILE   Required path to StockAnalysis biggest-companies page text.",
      "  EDGEQUITY_UNIVERSE_LIMIT=500       Universe size, defaults to 500.",
    ].join("\n"));
    return;
  }

  const sourcePath = requiredEnv("EDGEQUITY_MARKET_CAP_SOURCE_FILE");
  const limit = Number(process.env.EDGEQUITY_UNIVERSE_LIMIT ?? "500");
  const sourceText = await readFile(sourcePath, "utf8");
  const stocks = parseStockAnalysisMarketCapTable(sourceText, limit);

  if (stocks.length !== limit) {
    throw new Error(`Expected ${limit} ranked market-cap stocks, parsed ${stocks.length}.`);
  }

  const outputPath = path.join("public", "data", "edgequity", "universe-500.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, stringifyJson({
    app: "Edgequity",
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      provider: "stockanalysis",
      endpoint: "https://stockanalysis.com/list/biggest-companies",
      filter: "US-listed stocks ranked by market cap; excludes OTC/private per source",
      sort: "marketCapDescending",
    },
    count: stocks.length,
    stocks: stocks.map((stock) => ({
      ticker: stock.ticker,
      name: stock.name,
      currency: "USD",
      exchangeMic: null,
      type: "Common Stock",
      marketCapRank: stock.rank,
      marketCapLabel: stock.marketCapLabel,
      marketCapUsd: stock.marketCapUsd,
      source: stock.source,
    })),
  }), "utf8");

  console.log(`Wrote ${outputPath} with ${stocks.length} market-cap ranked stocks.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
