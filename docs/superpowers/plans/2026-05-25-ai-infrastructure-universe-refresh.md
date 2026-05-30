# AI Infrastructure Universe Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old broad Edgequity dataset with a focused 50-stock AI infrastructure universe, refresh earnings/transcript metadata, populate table metrics from Finnhub plus normalized financial statements, and simplify stock detail pages by making AI Analysis a Coming Soon panel and removing the Statements tab.

**Architecture:** Use Finnhub for company profile, quote, market cap, and provider metrics. Use SEC Company Facts as the primary financial statement source for US filers, with DoltHub as a fallback/supplement for statement rows and earnings calendar data. Generate one static JSON record per ticker under `public/data/edgequity/stocks`, keep realtime price refresh in the browser through the existing proxy, and keep research/report writing out of the app until the later workflow is rebuilt.

**Tech Stack:** Vite, React 19, TypeScript, Node/tsx scripts, Finnhub REST API, SEC EDGAR Company Facts, DoltHub SQL API, existing `node:test` tests, Recharts/custom SVG chart components.

---

## File Structure

- Modify `src/edgequity/universe.ts`: replace the old broad ticker list with the 50-stock AI infrastructure universe and add theme metadata.
- Modify `src/edgequity/types.ts`: add earnings metadata, transcript metadata, financial period source metadata, and make analysis data unnecessary for UI.
- Modify `src/edgequity/data.ts`: validate the new fields while preserving realtime Finnhub quote refresh.
- Modify `src/edgequity/metrics.ts`: remove static hard-coded earnings calendar notes and use stock-record earnings metadata for the table.
- Modify `src/edgequity/components/ScreenerTable.tsx`: keep current grouped table design, add/keep compact earnings columns, and ensure theme filtering can work through sector/theme values.
- Modify `src/edgequity/components/StockDetail.tsx`: remove full static AI report rendering, remove the Statements tab, keep AI Analysis as Coming Soon, and keep Financials plus Fundamentals.
- Modify `src/edgequity/components/FundamentalsPanel.tsx`: ensure annual charts use latest 5 years and quarterly charts use latest 5 quarters from the selected stock record.
- Modify `src/edgequity/components/ReportedFinancialsPanel.tsx`: stop rendering this panel from `StockDetail`; keep the file only if tests or future reuse still import it.
- Create `scripts/edgequity/ai-universe.ts`: shared universe definitions for scripts.
- Create `scripts/edgequity/dolthub.ts`: DoltHub SQL API helper for statements and earnings calendar fallback.
- Create `scripts/edgequity/finnhub.ts`: Finnhub helper for profile, metrics, quote-independent data, and earnings calendar calls.
- Create `scripts/edgequity/research-metadata.ts`: earnings date and transcript metadata builder.
- Replace `scripts/edgequity/build-static-data.ts`: generate only the 50-stock universe, using Finnhub profile/metrics, SEC/DoltHub statements, and research metadata.
- Create `scripts/edgequity/reset-static-data.ts`: safely delete old generated data folders.
- Modify `scripts/edgequity/normalize.ts`: normalize SEC/DoltHub/Finnhub fields into the current `EdgequityStockRecord` shape.
- Modify tests in `src/edgequity/components/state.test.tsx`, `src/edgequity/data.test.ts`, `scripts/edgequity/normalize.test.ts`, and add `scripts/edgequity/ai-universe.test.ts`.
- Remove generated data directories from git or regenerate them with the new 50-stock output:
  - `public/data/edgequity/raw`
  - `public/data/edgequity/stocks`
  - `public/data/edgequity/stocks-raw-first`
  - `public/data/edgequity/sec`
  - `public/data/edgequity/manifest.raw-first.json`
  - `public/data/edgequity/universe-500.json`

---

### Task 1: Lock the 50-Stock AI Infrastructure Universe

**Files:**
- Create: `scripts/edgequity/ai-universe.ts`
- Modify: `src/edgequity/universe.ts`
- Test: `scripts/edgequity/ai-universe.test.ts`

- [ ] **Step 1: Write the failing universe test**

Create `scripts/edgequity/ai-universe.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the universe test and verify it fails**

Run:

```bash
npm run test:edgequity -- scripts/edgequity/ai-universe.test.ts
```

Expected: fail because `scripts/edgequity/ai-universe.ts` does not exist.

- [ ] **Step 3: Create shared universe definitions**

Create `scripts/edgequity/ai-universe.ts`:

```ts
export type AiInfrastructureTheme =
  | "AI Semiconductors"
  | "Semiconductor Equipment"
  | "Cloud & AI Platforms"
  | "Enterprise AI Software"
  | "Cybersecurity"
  | "Data Center Networking"
  | "AI Servers & Hardware"
  | "Power & Cooling Infrastructure"
  | "Data Center REITs"
  | "AI Apps & Automation";

export interface AiInfrastructureUniverseStock {
  ticker: string;
  displayTicker: string;
  theme: AiInfrastructureTheme;
  notes?: string;
}

export const AI_INFRASTRUCTURE_UNIVERSE: AiInfrastructureUniverseStock[] = [
  { ticker: "NVDA", displayTicker: "NVDA", theme: "AI Semiconductors" },
  { ticker: "AMD", displayTicker: "AMD", theme: "AI Semiconductors" },
  { ticker: "AVGO", displayTicker: "AVGO", theme: "AI Semiconductors" },
  { ticker: "TSM", displayTicker: "TSM", theme: "AI Semiconductors", notes: "Finnhub profile resolves to the Taiwan listing; normalize currency before market-cap ranking." },
  { ticker: "ASML", displayTicker: "ASML", theme: "AI Semiconductors", notes: "Finnhub profile resolves to Amsterdam; normalize currency before market-cap ranking." },
  { ticker: "ARM", displayTicker: "ARM", theme: "AI Semiconductors" },
  { ticker: "QCOM", displayTicker: "QCOM", theme: "AI Semiconductors" },
  { ticker: "MRVL", displayTicker: "MRVL", theme: "AI Semiconductors" },
  { ticker: "MU", displayTicker: "MU", theme: "AI Semiconductors" },
  { ticker: "AMAT", displayTicker: "AMAT", theme: "Semiconductor Equipment" },
  { ticker: "LRCX", displayTicker: "LRCX", theme: "Semiconductor Equipment" },
  { ticker: "KLAC", displayTicker: "KLAC", theme: "Semiconductor Equipment" },
  { ticker: "MSFT", displayTicker: "MSFT", theme: "Cloud & AI Platforms" },
  { ticker: "GOOG", displayTicker: "GOOG", theme: "Cloud & AI Platforms" },
  { ticker: "AMZN", displayTicker: "AMZN", theme: "Cloud & AI Platforms" },
  { ticker: "META", displayTicker: "META", theme: "Cloud & AI Platforms" },
  { ticker: "ORCL", displayTicker: "ORCL", theme: "Cloud & AI Platforms" },
  { ticker: "PLTR", displayTicker: "PLTR", theme: "Enterprise AI Software" },
  { ticker: "CRM", displayTicker: "CRM", theme: "Enterprise AI Software" },
  { ticker: "NOW", displayTicker: "NOW", theme: "Enterprise AI Software" },
  { ticker: "ADBE", displayTicker: "ADBE", theme: "Enterprise AI Software" },
  { ticker: "SNOW", displayTicker: "SNOW", theme: "Enterprise AI Software" },
  { ticker: "MDB", displayTicker: "MDB", theme: "Enterprise AI Software" },
  { ticker: "DDOG", displayTicker: "DDOG", theme: "Enterprise AI Software" },
  { ticker: "INTU", displayTicker: "INTU", theme: "Enterprise AI Software" },
  { ticker: "CRWD", displayTicker: "CRWD", theme: "Cybersecurity" },
  { ticker: "PANW", displayTicker: "PANW", theme: "Cybersecurity" },
  { ticker: "ZS", displayTicker: "ZS", theme: "Cybersecurity" },
  { ticker: "FTNT", displayTicker: "FTNT", theme: "Cybersecurity" },
  { ticker: "OKTA", displayTicker: "OKTA", theme: "Cybersecurity" },
  { ticker: "NET", displayTicker: "NET", theme: "Cybersecurity" },
  { ticker: "ANET", displayTicker: "ANET", theme: "Data Center Networking" },
  { ticker: "CSCO", displayTicker: "CSCO", theme: "Data Center Networking" },
  { ticker: "DELL", displayTicker: "DELL", theme: "AI Servers & Hardware" },
  { ticker: "HPE", displayTicker: "HPE", theme: "AI Servers & Hardware" },
  { ticker: "SMCI", displayTicker: "SMCI", theme: "AI Servers & Hardware" },
  { ticker: "NTAP", displayTicker: "NTAP", theme: "AI Servers & Hardware" },
  { ticker: "WDC", displayTicker: "WDC", theme: "AI Servers & Hardware" },
  { ticker: "VRT", displayTicker: "VRT", theme: "Power & Cooling Infrastructure" },
  { ticker: "ETN", displayTicker: "ETN", theme: "Power & Cooling Infrastructure" },
  { ticker: "GEV", displayTicker: "GEV", theme: "Power & Cooling Infrastructure" },
  { ticker: "CEG", displayTicker: "CEG", theme: "Power & Cooling Infrastructure" },
  { ticker: "VST", displayTicker: "VST", theme: "Power & Cooling Infrastructure" },
  { ticker: "NRG", displayTicker: "NRG", theme: "Power & Cooling Infrastructure" },
  { ticker: "EQIX", displayTicker: "EQIX", theme: "Data Center REITs" },
  { ticker: "DLR", displayTicker: "DLR", theme: "Data Center REITs" },
  { ticker: "APP", displayTicker: "APP", theme: "AI Apps & Automation" },
  { ticker: "PATH", displayTicker: "PATH", theme: "AI Apps & Automation" },
  { ticker: "UBER", displayTicker: "UBER", theme: "AI Apps & Automation" },
  { ticker: "TSLA", displayTicker: "TSLA", theme: "AI Apps & Automation" },
];

export const AI_INFRASTRUCTURE_THEME_BY_TICKER: Record<string, AiInfrastructureTheme> =
  Object.fromEntries(AI_INFRASTRUCTURE_UNIVERSE.map((stock) => [stock.ticker, stock.theme])) as Record<string, AiInfrastructureTheme>;
```

- [ ] **Step 4: Replace app supported tickers**

Modify `src/edgequity/universe.ts`:

```ts
import { AI_INFRASTRUCTURE_UNIVERSE } from "../../scripts/edgequity/ai-universe.ts";

export const EDGEQUITY_SUPPORTED_TICKERS = AI_INFRASTRUCTURE_UNIVERSE.map((stock) => stock.ticker);

export type EdgequityTicker = typeof EDGEQUITY_SUPPORTED_TICKERS[number];
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:edgequity
```

Expected: `ai-universe.test.ts` passes. Other existing tests may still fail because UI/data model changes are not implemented yet.

- [ ] **Step 6: Commit**

```bash
git add scripts/edgequity/ai-universe.ts scripts/edgequity/ai-universe.test.ts src/edgequity/universe.ts
git commit -m "feat: define ai infrastructure universe"
```

---

### Task 2: Add New Data Model for Earnings, Transcript Metadata, and Statement Quality

**Files:**
- Modify: `src/edgequity/types.ts`
- Modify: `src/edgequity/data.ts`
- Test: `src/edgequity/data.test.ts`

- [ ] **Step 1: Write failing data validator tests**

Add to `src/edgequity/data.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { assertEdgequityStockRecord } from "./data.ts";

const baseStock = {
  ticker: "NVDA",
  name: "NVIDIA Corp",
  sector: "AI Infrastructure",
  industry: "AI Semiconductors",
  currency: "USD",
  price: null,
  marketCap: 100,
  enterpriseValue: 110,
  valuation: { peTTM: null, forwardPE: null, psTTM: null, pb: null, evRevenue: null, evEbitda: null, pfcf: null, fcfYield: null, earningsYield: null },
  profitability: { grossMargin: null, operatingMargin: null, netMargin: null, roe: null, roa: null, roic: null },
  growth: { revenueCagr3y: null, revenueCagr5y: null, epsCagr3y: null, fcfCagr3y: null },
  financialHealth: { currentRatio: null, quickRatio: null, debtToEquity: null, netDebtToEbitda: null, interestCoverage: null },
  cashFlow: { operatingCashFlow: null, freeCashFlow: null, fcfMargin: null, capexToRevenue: null, fcfConversion: null },
  dividends: { dividendYield: null, payoutRatio: null },
  history: [],
  warnings: [],
};

test("assertEdgequityStockRecord accepts earnings and transcript metadata", () => {
  const record = {
    ...baseStock,
    aiTheme: "AI Semiconductors",
    earnings: {
      recent: { period: "Q1 FY2027", date: "2026-05-20", source: "Finnhub", sourceUrl: "https://finnhub.io" },
      next: { period: "Q2 FY2027", date: "2026-08-26", isEstimated: true, source: "DoltHub", sourceUrl: "https://www.dolthub.com/repositories/post-no-preference/earnings" },
      updatedAt: "2026-05-25T00:00:00.000Z",
    },
    transcript: {
      status: "found",
      title: "NVIDIA Q1 FY2027 earnings call transcript",
      date: "2026-05-20",
      source: "Company IR",
      sourceUrl: "https://investor.nvidia.com",
      fetchedAt: "2026-05-25T00:00:00.000Z",
    },
    statementQuality: {
      annualPeriods: 5,
      quarterlyPeriods: 5,
      source: "sec",
      status: "ok",
      message: "SEC Company Facts normalized successfully",
    },
  };

  assert.doesNotThrow(() => assertEdgequityStockRecord(record));
});
```

- [ ] **Step 2: Run data tests and verify failure**

Run:

```bash
npm run test:edgequity:ui -- src/edgequity/data.test.ts
```

Expected: fail because the new fields are not typed or validated.

- [ ] **Step 3: Add types**

Add to `src/edgequity/types.ts`:

```ts
export interface EdgequityEarningsEvent {
  period: string;
  date: string;
  isEstimated?: boolean;
  source: string;
  sourceUrl: string;
}

export interface EdgequityEarningsMetadata {
  recent: EdgequityEarningsEvent | null;
  next: EdgequityEarningsEvent | null;
  updatedAt: string;
}

export interface EdgequityTranscriptMetadata {
  status: "found" | "missing" | "error";
  title: string | null;
  date: string | null;
  source: string | null;
  sourceUrl: string | null;
  fetchedAt: string;
  message?: string;
}

export interface EdgequityStatementQuality {
  annualPeriods: number;
  quarterlyPeriods: number;
  source: "sec" | "dolthub" | "mixed" | "missing";
  status: "ok" | "partial" | "missing" | "error";
  message: string;
}
```

Add fields to `EdgequityStockRecord`:

```ts
  aiTheme?: string;
  earnings?: EdgequityEarningsMetadata;
  transcript?: EdgequityTranscriptMetadata;
  statementQuality?: EdgequityStatementQuality;
```

- [ ] **Step 4: Update stock record validator**

In `src/edgequity/data.ts`, add helpers:

```ts
function isOptionalString(value: unknown): value is string | undefined {
  return typeof value === "string" || value === undefined;
}

function isEarningsEvent(value: unknown): boolean {
  return isRecord(value)
    && typeof value.period === "string"
    && typeof value.date === "string"
    && (typeof value.isEstimated === "boolean" || value.isEstimated === undefined)
    && typeof value.source === "string"
    && typeof value.sourceUrl === "string";
}

function isOptionalEarningsMetadata(value: unknown): boolean {
  return value === undefined || (
    isRecord(value)
    && (value.recent === null || isEarningsEvent(value.recent))
    && (value.next === null || isEarningsEvent(value.next))
    && typeof value.updatedAt === "string"
  );
}

function isOptionalTranscriptMetadata(value: unknown): boolean {
  return value === undefined || (
    isRecord(value)
    && (value.status === "found" || value.status === "missing" || value.status === "error")
    && isNullableString(value.title)
    && isNullableString(value.date)
    && isNullableString(value.source)
    && isNullableString(value.sourceUrl)
    && typeof value.fetchedAt === "string"
    && isOptionalString(value.message)
  );
}

function isOptionalStatementQuality(value: unknown): boolean {
  return value === undefined || (
    isRecord(value)
    && typeof value.annualPeriods === "number"
    && typeof value.quarterlyPeriods === "number"
    && (value.source === "sec" || value.source === "dolthub" || value.source === "mixed" || value.source === "missing")
    && (value.status === "ok" || value.status === "partial" || value.status === "missing" || value.status === "error")
    && typeof value.message === "string"
  );
}
```

Then include these checks inside `assertEdgequityStockRecord`:

```ts
    || !(typeof value.aiTheme === "string" || value.aiTheme === undefined)
    || !isOptionalEarningsMetadata(value.earnings)
    || !isOptionalTranscriptMetadata(value.transcript)
    || !isOptionalStatementQuality(value.statementQuality)
```

- [ ] **Step 5: Run data tests**

Run:

```bash
npm run test:edgequity:ui -- src/edgequity/data.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/edgequity/types.ts src/edgequity/data.ts src/edgequity/data.test.ts
git commit -m "feat: add earnings transcript and statement metadata"
```

---

### Task 3: Safely Remove Old Generated Data

**Files:**
- Create: `scripts/edgequity/reset-static-data.ts`
- Modify: `package.json`

- [ ] **Step 1: Create a safe reset script**

Create `scripts/edgequity/reset-static-data.ts`:

```ts
import { rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataRoot = path.resolve(root, "public/data/edgequity");

const targets = [
  "raw",
  "stocks",
  "stocks-raw-first",
  "sec",
  "manifest.json",
  "manifest.raw-first.json",
  "universe-500.json",
].map((target) => path.resolve(dataRoot, target));

function assertInsideDataRoot(target: string): void {
  const relative = path.relative(dataRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove path outside public/data/edgequity: ${target}`);
  }
}

async function main() {
  for (const target of targets) {
    assertInsideDataRoot(target);
    await rm(target, { recursive: true, force: true });
    console.log(`removed ${path.relative(root, target)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Add npm script**

Add to `package.json` scripts:

```json
"edgequity:reset-data": "tsx scripts/edgequity/reset-static-data.ts"
```

- [ ] **Step 3: Run reset script**

Run:

```bash
npm run edgequity:reset-data
```

Expected output includes:

```text
removed public\data\edgequity\raw
removed public\data\edgequity\stocks
removed public\data\edgequity\stocks-raw-first
removed public\data\edgequity\sec
```

- [ ] **Step 4: Verify only generated data was removed**

Run:

```bash
git status --short
```

Expected: deleted files only under `public/data/edgequity/...`, plus the new reset script and package script.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/edgequity/reset-static-data.ts public/data/edgequity
git commit -m "chore: remove old generated edgequity data"
```

---

### Task 4: Build Finnhub and DoltHub Data Helpers

**Files:**
- Create: `scripts/edgequity/finnhub.ts`
- Create: `scripts/edgequity/dolthub.ts`
- Test: `scripts/edgequity/finnhub-raw.test.ts`

- [ ] **Step 1: Add helper tests without live API calls**

Add to `scripts/edgequity/finnhub-raw.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { buildFinnhubUrl, normalizeFinnhubMarketCap } from "./finnhub.ts";
import { buildDolthubSqlUrl, normalizeDolthubStatementValue } from "./dolthub.ts";

test("buildFinnhubUrl appends token and query params", () => {
  const url = buildFinnhubUrl("/stock/profile2", { symbol: "NVDA" }, "token123");

  assert.equal(url.toString(), "https://finnhub.io/api/v1/stock/profile2?symbol=NVDA&token=token123");
});

test("normalizeFinnhubMarketCap converts Finnhub million-dollar value to dollars", () => {
  assert.equal(normalizeFinnhubMarketCap(5210986.044312), 5_210_986_044_312);
  assert.equal(normalizeFinnhubMarketCap(null), null);
});

test("buildDolthubSqlUrl encodes the SQL query", () => {
  const url = buildDolthubSqlUrl("SELECT * FROM earnings_calendar WHERE act_symbol='NVDA'");

  assert.equal(url.origin, "https://www.dolthub.com");
  assert.equal(url.searchParams.get("q"), "SELECT * FROM earnings_calendar WHERE act_symbol='NVDA'");
});

test("normalizeDolthubStatementValue parses decimal strings", () => {
  assert.equal(normalizeDolthubStatementValue("416161000000"), 416_161_000_000);
  assert.equal(normalizeDolthubStatementValue(null), null);
});
```

- [ ] **Step 2: Create Finnhub helper**

Create `scripts/edgequity/finnhub.ts`:

```ts
export const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export type FinnhubProfile = {
  ticker?: string;
  name?: string;
  exchange?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
  currency?: string;
  shareOutstanding?: number;
  weburl?: string;
  logo?: string;
};

export type FinnhubMetricPayload = {
  metric?: Record<string, number | string | null>;
};

export function buildFinnhubUrl(pathname: string, params: Record<string, string>, token: string): URL {
  const url = new URL(`${FINNHUB_BASE_URL}${pathname}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("token", token);
  return url;
}

export function normalizeFinnhubMarketCap(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value * 1_000_000 : null;
}

export async function fetchFinnhubJson<T>(url: URL): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Finnhub request failed ${response.status}: ${body.slice(0, 200)}`);
  }
  return response.json() as Promise<T>;
}
```

- [ ] **Step 3: Create DoltHub helper**

Create `scripts/edgequity/dolthub.ts`:

```ts
export const DOLTHUB_EARNINGS_API_BASE = "https://www.dolthub.com/api/v1alpha1/post-no-preference/earnings/master";

export function buildDolthubSqlUrl(sql: string): URL {
  const url = new URL(DOLTHUB_EARNINGS_API_BASE);
  url.searchParams.set("q", sql);
  return url;
}

export function normalizeDolthubStatementValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchDolthubRows<T extends Record<string, unknown>>(sql: string): Promise<T[]> {
  const response = await fetch(buildDolthubSqlUrl(sql));
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DoltHub request failed ${response.status}: ${body.slice(0, 200)}`);
  }
  const payload = await response.json() as { query_execution_status?: string; query_execution_message?: string; rows?: T[] };
  if (payload.query_execution_status !== "Success") {
    throw new Error(payload.query_execution_message ?? "DoltHub query failed");
  }
  return payload.rows ?? [];
}
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
npm run test:edgequity -- scripts/edgequity/finnhub-raw.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/edgequity/finnhub.ts scripts/edgequity/dolthub.ts scripts/edgequity/finnhub-raw.test.ts
git commit -m "feat: add market data provider helpers"
```

---

### Task 5: Build Earnings Dates and Transcript Metadata

**Files:**
- Create: `scripts/edgequity/research-metadata.ts`
- Modify: `src/edgequity/metrics.ts`
- Test: `src/edgequity/components/state.test.tsx`

- [ ] **Step 1: Write UI test for record-driven earnings metadata**

Modify the existing `ScreenerTable keeps compact rows and shows earnings context after sector` test in `src/edgequity/components/state.test.tsx` so its `nvdaStock` includes:

```ts
earnings: {
  recent: { period: "Q1 FY2027", date: "2026-05-20", source: "Finnhub", sourceUrl: "https://finnhub.io" },
  next: { period: "Q2 FY2027", date: "2026-08-26", isEstimated: true, source: "DoltHub", sourceUrl: "https://www.dolthub.com/repositories/post-no-preference/earnings" },
  updatedAt: "2026-05-25T00:00:00.000Z",
},
transcript: {
  status: "found",
  title: "NVIDIA Q1 FY2027 earnings call transcript",
  date: "2026-05-20",
  source: "Company IR",
  sourceUrl: "https://investor.nvidia.com",
  fetchedAt: "2026-05-25T00:00:00.000Z",
},
```

Keep assertions for:

```ts
assert.match(html, /Recent[\s\S]*Q1 FY2027[\s\S]*2026-05-20/);
assert.match(html, /Next[\s\S]*Q2 FY2027[\s\S]*2026-08-26/);
```

- [ ] **Step 2: Run UI tests and verify failure**

Run:

```bash
npm run test:edgequity:ui -- src/edgequity/components/state.test.tsx
```

Expected: fail because `metrics.ts` still reads hard-coded `EARNINGS_CALENDAR_BY_TICKER`.

- [ ] **Step 3: Create research metadata script**

Create `scripts/edgequity/research-metadata.ts`:

```ts
import { fetchDolthubRows } from "./dolthub.ts";
import { buildFinnhubUrl, fetchFinnhubJson } from "./finnhub.ts";
import type { EdgequityEarningsMetadata, EdgequityTranscriptMetadata } from "../../src/edgequity/types.ts";

type DoltCalendarRow = { act_symbol: string; date: string; when: string | null };
type FinnhubEarningsRow = { symbol?: string; date?: string; hour?: string; year?: number; quarter?: number };
type FinnhubTranscriptList = { transcript?: Array<{ id?: string; title?: string; time?: string; year?: number; quarter?: number }> };

function periodFromQuarter(year: unknown, quarter: unknown): string {
  return typeof year === "number" && typeof quarter === "number" ? `Q${quarter} ${year}` : "Earnings";
}

export async function buildEarningsMetadata(ticker: string, token: string, today = new Date()): Promise<EdgequityEarningsMetadata> {
  const fetchedAt = new Date().toISOString();
  const todayText = today.toISOString().slice(0, 10);

  try {
    const url = buildFinnhubUrl("/calendar/earnings", { symbol: ticker }, token);
    const payload = await fetchFinnhubJson<{ earningsCalendar?: FinnhubEarningsRow[] }>(url);
    const rows = (payload.earningsCalendar ?? []).filter((row) => typeof row.date === "string");
    const sorted = rows.sort((left, right) => String(left.date).localeCompare(String(right.date)));
    const recent = [...sorted].reverse().find((row) => String(row.date) <= todayText);
    const next = sorted.find((row) => String(row.date) > todayText);

    if (recent || next) {
      return {
        recent: recent ? { period: periodFromQuarter(recent.year, recent.quarter), date: String(recent.date), source: "Finnhub", sourceUrl: "https://finnhub.io" } : null,
        next: next ? { period: periodFromQuarter(next.year, next.quarter), date: String(next.date), isEstimated: true, source: "Finnhub", sourceUrl: "https://finnhub.io" } : null,
        updatedAt: fetchedAt,
      };
    }
  } catch {
    // Fall through to DoltHub.
  }

  const rows = await fetchDolthubRows<DoltCalendarRow>(
    `SELECT * FROM earnings_calendar WHERE act_symbol='${ticker.replace(/'/g, "''")}' ORDER BY date DESC LIMIT 12`,
  );
  const recent = rows.find((row) => row.date <= todayText) ?? null;
  const next = [...rows].reverse().find((row) => row.date > todayText) ?? null;

  return {
    recent: recent ? { period: "Recent earnings", date: recent.date, source: "DoltHub", sourceUrl: "https://www.dolthub.com/repositories/post-no-preference/earnings" } : null,
    next: next ? { period: "Next earnings", date: next.date, isEstimated: true, source: "DoltHub", sourceUrl: "https://www.dolthub.com/repositories/post-no-preference/earnings" } : null,
    updatedAt: fetchedAt,
  };
}

export async function buildTranscriptMetadata(ticker: string, token: string): Promise<EdgequityTranscriptMetadata> {
  const fetchedAt = new Date().toISOString();

  try {
    const url = buildFinnhubUrl("/stock/transcripts/list", { symbol: ticker }, token);
    const payload = await fetchFinnhubJson<FinnhubTranscriptList>(url);
    const latest = payload.transcript?.[0];
    if (latest?.id || latest?.title) {
      return {
        status: "found",
        title: latest.title ?? `${ticker} latest earnings call transcript`,
        date: latest.time ? latest.time.slice(0, 10) : null,
        source: "Finnhub",
        sourceUrl: "https://finnhub.io",
        fetchedAt,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      title: null,
      date: null,
      source: "Finnhub",
      sourceUrl: "https://finnhub.io",
      fetchedAt,
      message,
    };
  }

  return {
    status: "missing",
    title: null,
    date: null,
    source: null,
    sourceUrl: null,
    fetchedAt,
    message: "Transcript metadata was not available from Finnhub free endpoints during refresh.",
  };
}
```

- [ ] **Step 4: Replace hard-coded earnings calendar in metrics**

In `src/edgequity/metrics.ts`, delete `EARNINGS_CALENDAR_BY_TICKER` and replace `getEarningsCalendar` with:

```ts
export function getEarningsCalendar(stock: EdgequityStockRecord) {
  return {
    recentPeriod: stock.earnings?.recent?.period ?? "Research queued",
    recentDate: stock.earnings?.recent?.date ?? "-",
    nextPeriod: stock.earnings?.next?.period ?? "Next report",
    nextDate: stock.earnings?.next?.date ?? "-",
    updatedAt: stock.earnings?.updatedAt?.slice(0, 10) ?? "-",
  };
}

function formatEarningsCalendarValue(stock: EdgequityStockRecord): string {
  const calendar = getEarningsCalendar(stock);
  return `${calendar.recentPeriod} ${calendar.recentDate} ${calendar.nextPeriod} ${calendar.nextDate}`;
}
```

Update the `earningsCalendar` column accessor:

```ts
accessor: (stock) => formatEarningsCalendarValue(stock),
```

Update `reportUpdatedAt` accessor:

```ts
accessor: (stock) => stock.earnings?.updatedAt?.slice(0, 10) ?? null,
```

- [ ] **Step 5: Run UI tests**

Run:

```bash
npm run test:edgequity:ui
```

Expected: tests pass after updating call sites that still pass ticker strings into `getEarningsCalendar`.

- [ ] **Step 6: Commit**

```bash
git add scripts/edgequity/research-metadata.ts src/edgequity/metrics.ts src/edgequity/components/state.test.tsx
git commit -m "feat: drive earnings metadata from stock records"
```

---

### Task 6: Normalize SEC/DoltHub Statements into Annual and Quarterly Fundamentals

**Files:**
- Modify: `scripts/edgequity/normalize.ts`
- Create or modify: `scripts/edgequity/sec-normalized.ts`
- Modify: `scripts/edgequity/dolthub.ts`
- Test: `scripts/edgequity/normalize.test.ts`

- [ ] **Step 1: Write failing normalize tests**

Add to `scripts/edgequity/normalize.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { buildWarnings, normalizeEdgequityRecord } from "./normalize.ts";

test("normalizeEdgequityRecord builds annual history from five statement periods", () => {
  const stock = normalizeEdgequityRecord({
    ticker: "WMT",
    profile: { name: "Walmart Inc", currency: "USD", marketCapitalization: 700000 },
    metrics: { metric: { peTTM: 38, forwardPE: 30 } },
    incomeStatements: [
      { fiscalYear: "2026", revenue: 713200000000, grossProfit: 177500000000, operatingIncome: 29900000000, netIncome: 21900000000, epsdiluted: 2.4 },
      { fiscalYear: "2025", revenue: 681000000000, grossProfit: 169000000000, operatingIncome: 27600000000, netIncome: 19400000000, epsdiluted: 2.1 },
      { fiscalYear: "2024", revenue: 648000000000, grossProfit: 157000000000, operatingIncome: 27000000000, netIncome: 15500000000, epsdiluted: 1.9 },
      { fiscalYear: "2023", revenue: 611000000000, grossProfit: 147000000000, operatingIncome: 20400000000, netIncome: 11600000000, epsdiluted: 1.4 },
      { fiscalYear: "2022", revenue: 573000000000, grossProfit: 143000000000, operatingIncome: 25900000000, netIncome: 13600000000, epsdiluted: 1.5 },
    ],
    balanceSheets: [
      { fiscalYear: "2026", totalAssets: 284700000000, totalDebt: 62000000000, totalStockholdersEquity: 105900000000, cashAndCashEquivalents: 9700000000 },
    ],
    cashFlows: [
      { fiscalYear: "2026", operatingCashFlow: 41600000000, capitalExpenditure: -23000000000, freeCashFlow: 18600000000 },
    ],
  });

  assert.equal(stock.history.length, 5);
  assert.equal(stock.history[0]?.year, "2026");
  assert.equal(stock.history[0]?.revenue, 713200000000);
  assert.equal(stock.profitability.grossMargin, 177500000000 / 713200000000);
  assert.equal(stock.cashFlow.freeCashFlow, 18600000000);
});

test("buildWarnings marks partial statement history", () => {
  assert.deepEqual(buildWarnings({ peTTM: null, marketCap: null, historyLength: 2 }), [
    "P/E unavailable",
    "Market cap unavailable",
    "Less than three years of financial history",
  ]);
});
```

- [ ] **Step 2: Run normalize tests**

Run:

```bash
npm run test:edgequity -- scripts/edgequity/normalize.test.ts
```

Expected: pass if existing normalization already supports these fields, otherwise fail on missing market cap/profile handling.

- [ ] **Step 3: Add SEC normalized concept extraction**

Create `scripts/edgequity/sec-normalized.ts`:

```ts
import {
  fetchCompanyFacts,
  fetchRecentAnnualFilings,
  loadSecTickerMap,
  pickAnnualUsdValues,
  pickQuarterlyUsdRows,
  resolveCik,
  type CompanyFactsPayload,
} from "./sec-edgar.ts";

type RawObject = Record<string, unknown>;

const CONCEPTS = {
  revenue: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"],
  grossProfit: ["GrossProfit"],
  operatingIncome: ["OperatingIncomeLoss"],
  netIncome: ["NetIncomeLoss", "ProfitLoss"],
  epsdiluted: ["EarningsPerShareDiluted"],
  totalAssets: ["Assets"],
  totalDebt: ["DebtCurrent", "LongTermDebtCurrent", "LongTermDebtNoncurrent", "LongTermDebtAndFinanceLeaseObligationsCurrent", "LongTermDebtAndFinanceLeaseObligationsNoncurrent"],
  totalStockholdersEquity: ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
  cashAndCashEquivalents: ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"],
  operatingCashFlow: ["NetCashProvidedByUsedInOperatingActivities"],
  capitalExpenditure: ["PaymentsToAcquirePropertyPlantAndEquipment"],
};

function factsBucket(facts: CompanyFactsPayload, concept: string) {
  return facts.facts?.["us-gaap"]?.[concept] ?? facts.facts?.["ifrs-full"]?.[concept];
}

function mergeByFiscalYear(rows: RawObject[], fiscalYear: string, key: string, value: number): RawObject[] {
  const existing = rows.find((row) => row.fiscalYear === fiscalYear);
  if (existing) {
    existing[key] = value;
    return rows;
  }
  rows.push({ fiscalYear, date: `${fiscalYear}-12-31`, period: "FY", [key]: value });
  return rows;
}

function addAnnualConcept(rows: RawObject[], facts: CompanyFactsPayload, targetKey: string, concepts: string[]): void {
  for (const concept of concepts) {
    const values = pickAnnualUsdValues(factsBucket(facts, concept), 5);
    if (values.length === 0) continue;
    for (const value of values) mergeByFiscalYear(rows, String(value.fy), targetKey, value.value);
    return;
  }
}

function addQuarterlyConcept(rows: RawObject[], facts: CompanyFactsPayload, targetKey: string, concepts: string[]): void {
  for (const concept of concepts) {
    const values = pickQuarterlyUsdRows(factsBucket(facts, concept), 5);
    if (values.length === 0) continue;
    for (const value of values) {
      const fiscalYear = String(value.fy ?? value.end.slice(0, 4));
      const period = value.fp ?? "Q";
      const existing = rows.find((row) => row.fiscalYear === fiscalYear && row.period === period);
      if (existing) existing[targetKey] = value.val;
      else rows.push({ fiscalYear, date: value.end, period, [targetKey]: value.val });
    }
    return;
  }
}

export async function pullNormalizedSecStatements(ticker: string): Promise<{
  source: "sec";
  status: "ok" | "missing";
  annual: { incomeStatements: RawObject[]; balanceSheets: RawObject[]; cashFlows: RawObject[] };
  quarterly: { incomeStatements: RawObject[]; balanceSheets: RawObject[]; cashFlows: RawObject[] };
}> {
  const map = await loadSecTickerMap();
  const resolved = resolveCik(ticker, map);
  if (!resolved) {
    return emptyResult("missing");
  }

  const facts = await fetchCompanyFacts(String(resolved.cik_str).padStart(10, "0"));
  await fetchRecentAnnualFilings(String(resolved.cik_str).padStart(10, "0"));

  const annualIncomeStatements: RawObject[] = [];
  const annualBalanceSheets: RawObject[] = [];
  const annualCashFlows: RawObject[] = [];
  const quarterlyIncomeStatements: RawObject[] = [];
  const quarterlyBalanceSheets: RawObject[] = [];
  const quarterlyCashFlows: RawObject[] = [];

  for (const [key, concepts] of Object.entries(CONCEPTS)) {
    const annualTarget = key === "totalAssets" || key === "totalDebt" || key === "totalStockholdersEquity" || key === "cashAndCashEquivalents"
      ? annualBalanceSheets
      : key === "operatingCashFlow" || key === "capitalExpenditure"
        ? annualCashFlows
        : annualIncomeStatements;
    const quarterlyTarget = key === "totalAssets" || key === "totalDebt" || key === "totalStockholdersEquity" || key === "cashAndCashEquivalents"
      ? quarterlyBalanceSheets
      : key === "operatingCashFlow" || key === "capitalExpenditure"
        ? quarterlyCashFlows
        : quarterlyIncomeStatements;

    addAnnualConcept(annualTarget, facts, key, concepts);
    addQuarterlyConcept(quarterlyTarget, facts, key, concepts);
  }

  for (const row of [...annualCashFlows, ...quarterlyCashFlows]) {
    const cfo = typeof row.operatingCashFlow === "number" ? row.operatingCashFlow : null;
    const capex = typeof row.capitalExpenditure === "number" ? Math.abs(row.capitalExpenditure) : null;
    row.freeCashFlow = cfo !== null && capex !== null ? cfo - capex : null;
  }

  return {
    source: "sec",
    status: annualIncomeStatements.length > 0 ? "ok" : "missing",
    annual: { incomeStatements: sortDesc(annualIncomeStatements), balanceSheets: sortDesc(annualBalanceSheets), cashFlows: sortDesc(annualCashFlows) },
    quarterly: { incomeStatements: sortQuarterDesc(quarterlyIncomeStatements), balanceSheets: sortQuarterDesc(quarterlyBalanceSheets), cashFlows: sortQuarterDesc(quarterlyCashFlows) },
  };
}

function sortDesc(rows: RawObject[]): RawObject[] {
  return rows.sort((left, right) => String(right.fiscalYear).localeCompare(String(left.fiscalYear))).slice(0, 5);
}

function sortQuarterDesc(rows: RawObject[]): RawObject[] {
  return rows.sort((left, right) => `${right.fiscalYear}-${right.period}`.localeCompare(`${left.fiscalYear}-${left.period}`)).slice(0, 5);
}

function emptyResult(status: "missing") {
  return {
    source: "sec" as const,
    status,
    annual: { incomeStatements: [], balanceSheets: [], cashFlows: [] },
    quarterly: { incomeStatements: [], balanceSheets: [], cashFlows: [] },
  };
}
```

- [ ] **Step 4: Run normalize and SEC tests**

Run:

```bash
npm run test:edgequity -- scripts/edgequity/normalize.test.ts scripts/edgequity/sec-metric-resolver.test.ts scripts/edgequity/sec-edgar.test.ts
```

Expected: existing tests either pass or reveal import path adjustments. Fix imports without changing behavior.

- [ ] **Step 5: Commit**

```bash
git add scripts/edgequity/normalize.ts scripts/edgequity/normalize.test.ts scripts/edgequity/sec-normalized.ts scripts/edgequity/dolthub.ts
git commit -m "feat: normalize statements for ai universe"
```

---

### Task 7: Rebuild Static Data Pipeline for the 50-Stock Universe

**Files:**
- Replace: `scripts/edgequity/build-static-data.ts`
- Modify: `package.json`
- Test: `scripts/edgequity/finnhub-generated.test.ts`

- [ ] **Step 1: Add generated manifest test**

Add to `scripts/edgequity/finnhub-generated.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("generated Edgequity manifest contains the 50-stock AI universe", async () => {
  const manifest = JSON.parse(await readFile("public/data/edgequity/manifest.json", "utf8")) as {
    universe: string[];
    stocks: Array<{ ticker: string; dataPath: string }>;
  };

  assert.equal(manifest.universe.length, 50);
  assert.equal(manifest.stocks.length, 50);
  assert.equal(new Set(manifest.universe).size, 50);
  assert.equal(manifest.stocks.every((stock) => stock.dataPath.startsWith("/data/edgequity/stocks/")), true);
});
```

- [ ] **Step 2: Replace builder with Finnhub plus statement pipeline**

Replace `scripts/edgequity/build-static-data.ts` with a builder that:

```ts
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { AI_INFRASTRUCTURE_THEME_BY_TICKER, AI_INFRASTRUCTURE_UNIVERSE } from "./ai-universe.ts";
import { buildEarningsMetadata, buildTranscriptMetadata } from "./research-metadata.ts";
import { buildFinnhubUrl, fetchFinnhubJson, normalizeFinnhubMarketCap, type FinnhubMetricPayload, type FinnhubProfile } from "./finnhub.ts";
import { pullNormalizedSecStatements } from "./sec-normalized.ts";
import { normalizeEdgequityRecord } from "./normalize.ts";
import type { EdgequityFinancialStatementPeriod, EdgequityFinancialStatements, EdgequityManifest, EdgequityManifestStock, EdgequityStockRecord } from "../../src/edgequity/types.ts";

const DATA_DIR = path.join("public", "data", "edgequity");
const STOCKS_DIR = path.join(DATA_DIR, "stocks");
const TMP_DIR = path.join(DATA_DIR, ".tmp");

type RawObject = Record<string, unknown>;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function normalizePeriods(rows: RawObject[]): EdgequityFinancialStatementPeriod[] {
  return rows.map((row) => ({
    fiscalYear: String(row.fiscalYear ?? ""),
    period: String(row.period ?? "FY"),
    date: typeof row.date === "string" ? row.date : null,
    reportedCurrency: typeof row.reportedCurrency === "string" ? row.reportedCurrency : null,
    values: Object.fromEntries(Object.entries(row).filter(([, value]) => typeof value === "number" || typeof value === "string" || value === null)),
  })).filter((row) => row.fiscalYear.length > 0);
}

function buildFinancialStatements(source: "sec" | "dolthub" | "missing", annual: { incomeStatements: RawObject[]; balanceSheets: RawObject[]; cashFlows: RawObject[] }, quarterly: { incomeStatements: RawObject[]; balanceSheets: RawObject[]; cashFlows: RawObject[] }): EdgequityFinancialStatements {
  return {
    source: {
      provider: source === "sec" ? "sec" : source === "dolthub" ? "derived" : "manual",
      endpoint: source === "sec" ? "SEC Company Facts" : source === "dolthub" ? "DoltHub earnings SQL API" : "missing",
      fetchedAt: new Date().toISOString(),
      status: source === "missing" ? "missing" : "ok",
    },
    annual: {
      incomeStatement: normalizePeriods(annual.incomeStatements),
      balanceSheet: normalizePeriods(annual.balanceSheets),
      cashFlow: normalizePeriods(annual.cashFlows),
    },
    quarterly: {
      incomeStatement: normalizePeriods(quarterly.incomeStatements),
      balanceSheet: normalizePeriods(quarterly.balanceSheets),
      cashFlow: normalizePeriods(quarterly.cashFlows),
    },
  };
}

async function buildStock(ticker: string, token: string): Promise<{ record: EdgequityStockRecord; manifestStock: EdgequityManifestStock }> {
  const [profile, metrics, statements, earnings, transcript] = await Promise.all([
    fetchFinnhubJson<FinnhubProfile>(buildFinnhubUrl("/stock/profile2", { symbol: ticker }, token)),
    fetchFinnhubJson<FinnhubMetricPayload>(buildFinnhubUrl("/stock/metric", { symbol: ticker, metric: "all" }, token)),
    pullNormalizedSecStatements(ticker),
    buildEarningsMetadata(ticker, token),
    buildTranscriptMetadata(ticker, token),
  ]);

  const profileForNormalize = {
    ...profile,
    name: profile.name ?? ticker,
    companyName: profile.name ?? ticker,
    marketCapitalization: undefined,
    mktCap: normalizeFinnhubMarketCap(profile.marketCapitalization),
    sector: "AI Infrastructure",
    industry: AI_INFRASTRUCTURE_THEME_BY_TICKER[ticker],
    finnhubIndustry: profile.finnhubIndustry,
  };

  const record = normalizeEdgequityRecord({
    ticker,
    profile: profileForNormalize,
    metrics,
    incomeStatements: statements.annual.incomeStatements,
    balanceSheets: statements.annual.balanceSheets,
    cashFlows: statements.annual.cashFlows,
  });

  record.price = null;
  record.aiTheme = AI_INFRASTRUCTURE_THEME_BY_TICKER[ticker];
  record.earnings = earnings;
  record.transcript = transcript;
  record.financialStatements = buildFinancialStatements(statements.status === "ok" ? "sec" : "missing", statements.annual, statements.quarterly);
  record.statementQuality = {
    annualPeriods: statements.annual.incomeStatements.length,
    quarterlyPeriods: statements.quarterly.incomeStatements.length,
    source: statements.status === "ok" ? "sec" : "missing",
    status: statements.status === "ok" && statements.annual.incomeStatements.length >= 5 && statements.quarterly.incomeStatements.length >= 5 ? "ok" : "partial",
    message: statements.status === "ok" ? "Financials normalized from SEC Company Facts." : "Financial statements were not available from SEC Company Facts.",
  };
  record.sources = {
    profile: { provider: "finnhub", endpoint: "stock/profile2", fetchedAt: new Date().toISOString(), status: "ok" },
    metrics: { provider: "finnhub", endpoint: "stock/metric", fetchedAt: new Date().toISOString(), status: "ok" },
    financialsReported: record.financialStatements.source,
    summary: { provider: "derived", fetchedAt: new Date().toISOString(), status: "ok", message: "Summary metrics derived from normalized statements." },
  };

  return {
    record,
    manifestStock: {
      ticker: record.ticker,
      name: record.name,
      sector: record.sector,
      industry: record.industry,
      marketCap: record.marketCap,
      dataPath: `/data/edgequity/stocks/${record.ticker}.json`,
    },
  };
}

async function publish(records: EdgequityStockRecord[], manifest: EdgequityManifest): Promise<void> {
  const tempDir = path.join(TMP_DIR, `run-${Date.now()}-${process.pid}`);
  const tempStocks = path.join(tempDir, "stocks");
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempStocks, { recursive: true });
  for (const record of records) await writeFile(path.join(tempStocks, `${record.ticker}.json`), stringifyJson(record), "utf8");
  await writeFile(path.join(tempDir, "manifest.json"), stringifyJson(manifest), "utf8");
  await rm(STOCKS_DIR, { recursive: true, force: true });
  await mkdir(DATA_DIR, { recursive: true });
  await rename(tempStocks, STOCKS_DIR);
  await rename(path.join(tempDir, "manifest.json"), path.join(DATA_DIR, "manifest.json"));
  await rm(tempDir, { recursive: true, force: true });
}

async function main() {
  const token = requiredEnv("FINNHUB_API_KEY");
  const requested = process.env.EDGEQUITY_TICKERS?.split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean);
  const universe = requested?.length ? requested : AI_INFRASTRUCTURE_UNIVERSE.map((stock) => stock.ticker);
  const built = [];
  for (const ticker of universe) {
    built.push(await buildStock(ticker, token));
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.EDGEQUITY_PROVIDER_DELAY_MS ?? "250")));
  }
  const manifest: EdgequityManifest = {
    app: "Edgequity",
    version: 2,
    generatedAt: new Date().toISOString(),
    universe,
    stocks: built.map((item) => item.manifestStock),
  };
  await publish(built.map((item) => item.record), manifest);
  console.log(JSON.stringify({ stocks: built.length, manifest: "public/data/edgequity/manifest.json" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 3: Keep npm data command**

Confirm `package.json` keeps:

```json
"edgequity:data": "tsx scripts/edgequity/build-static-data.ts"
```

- [ ] **Step 4: Run a 3-stock smoke refresh**

Run:

```bash
$env:FINNHUB_API_KEY="<set locally>"; $env:EDGEQUITY_TICKERS="NVDA,MSFT,GOOG"; npm run edgequity:data
```

Expected: generated manifest with 3 stocks and no TypeScript runtime errors.

- [ ] **Step 5: Run full 50-stock refresh**

Run:

```bash
$env:FINNHUB_API_KEY="<set locally>"; Remove-Item Env:\EDGEQUITY_TICKERS -ErrorAction SilentlyContinue; npm run edgequity:data
```

Expected: generated manifest with 50 stocks.

- [ ] **Step 6: Run generated data tests**

Run:

```bash
npm run test:edgequity -- scripts/edgequity/finnhub-generated.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add scripts/edgequity/build-static-data.ts scripts/edgequity/finnhub-generated.test.ts package.json public/data/edgequity
git commit -m "feat: generate ai universe static data"
```

---

### Task 8: Simplify Stock Detail Tabs and Remove Static AI Reports

**Files:**
- Modify: `src/edgequity/components/StockDetail.tsx`
- Modify: `src/edgequity/analysis.ts`
- Test: `src/edgequity/components/state.test.tsx`

- [ ] **Step 1: Replace AI report tests with Coming Soon assertions**

In `src/edgequity/components/state.test.tsx`, replace the full report test with:

```ts
test("StockDetail defaults to AI Analysis Coming Soon and keeps financial tabs", () => {
  const html = renderToStaticMarkup(<StockDetail stock={stock} onBack={() => undefined} />);

  assert.match(html, /AI Analysis/);
  assert.match(html, /aria-selected="true"[\s\S]*AI Analysis/);
  assert.match(html, /Coming Soon/);
  assert.match(html, /Financials/);
  assert.match(html, /Fundamentals/);
  assert.doesNotMatch(html, />Statements</);
  assert.doesNotMatch(html, /Equity Research: Apple Inc\. \(AAPL\)/);
  assert.doesNotMatch(html, /analysis-detail-container/);
});
```

Delete or rewrite tests that assert:

```ts
Equity Research:
02 -- Recent News & Earnings
scenario-comparison-grid
sensitivity-table
final-verdict-box
Apple pairs fortress-like cash generation
```

- [ ] **Step 2: Run UI tests and verify failure**

Run:

```bash
npm run test:edgequity:ui -- src/edgequity/components/state.test.tsx
```

Expected: fail because `StockDetail` still renders the old report and Statements tab.

- [ ] **Step 3: Replace AnalysisPanel with Coming Soon**

In `src/edgequity/components/StockDetail.tsx`, remove:

```ts
import { getEdgequityAnalysisNote } from '../analysis';
```

Change tab state:

```ts
const [activeTab, setActiveTab] = useState<'analysis' | 'financials' | 'fundamentals'>('analysis');
```

Remove Statements tab button and panel.

Replace `AnalysisPanel` with:

```tsx
function AnalysisPanel({ stock }: { stock: EdgequityStockRecord }) {
  return (
    <article className="eq-analysis-panel">
      <div>
        <p className="text-xs font-semibold uppercase text-[var(--vw-accent)]">AI Analysis</p>
        <h3 className="mt-1 text-lg font-semibold">{stock.ticker} research workflow</h3>
      </div>
      <div className="eq-coming-soon-panel">
        <strong>Coming Soon</strong>
        <p>
          Full research reports are paused while the new earnings transcript and financial statement workflow is rebuilt.
          Financials and Fundamentals are available now.
        </p>
      </div>
    </article>
  );
}
```

Render it as:

```tsx
<AnalysisPanel stock={stock} />
```

Delete `TonivestResearchReport` and report-only helper functions from `StockDetail.tsx` when no longer referenced.

- [ ] **Step 4: Make `analysis.ts` inert**

Replace `src/edgequity/analysis.ts` with:

```ts
import type { EdgequityAnalysisNote } from "./types.ts";

export function getEdgequityAnalysisNote(_ticker: string): EdgequityAnalysisNote | null {
  return null;
}
```

Keep this compatibility shim until all imports are removed.

- [ ] **Step 5: Run UI tests**

Run:

```bash
npm run test:edgequity:ui
```

Expected: pass after removing stale report assertions.

- [ ] **Step 6: Commit**

```bash
git add src/edgequity/components/StockDetail.tsx src/edgequity/analysis.ts src/edgequity/components/state.test.tsx
git commit -m "feat: simplify stock detail analysis tab"
```

---

### Task 9: Update Financials and Fundamentals Views

**Files:**
- Modify: `src/edgequity/components/FundamentalsPanel.tsx`
- Modify: `src/edgequity/components/MetricTrendChart.tsx`
- Modify: `src/edgequity/components/StockDetail.tsx`
- Test: `src/edgequity/components/state.test.tsx`

- [ ] **Step 1: Add tests for annual and quarterly fundamentals**

Keep or add these assertions in `src/edgequity/components/state.test.tsx`:

```ts
test("FundamentalsPanel renders annual and quarterly sections from stock statements", () => {
  const html = renderToStaticMarkup(<FundamentalsPanel stock={fmpStatementStock} />);

  assert.match(html, /Annual/);
  assert.match(html, /Quarterly/);
  assert.match(html, /5Y/);
  assert.match(html, /5Q/);
  assert.match(html, /Revenue/);
  assert.match(html, /Gross profit/);
  assert.match(html, /Free cash flow/);
  assert.match(html, /26 Q1/);
  assert.match(html, /26 Q2/);
});
```

- [ ] **Step 2: Run UI tests**

Run:

```bash
npm run test:edgequity:ui -- src/edgequity/components/state.test.tsx
```

Expected: fail if current Fundamentals panel still references FMP-specific labels or leaves blank chart columns.

- [ ] **Step 3: Make provider labels generic**

In `FundamentalsPanel.tsx`, change user-facing copy from FMP-specific wording to:

```tsx
<h3>Fundamentals</h3>
<p>Annual and quarterly trends from normalized financial statements.</p>
```

Use `stock.financialStatements?.source.provider` only in small source metadata, not in the title.

- [ ] **Step 4: Ensure annual/quarterly chart limits**

Confirm annual chart points are normalized by `MetricTrendChart` to latest 5 years and quarterly points to latest 5 quarters. If not, update the selection logic to:

```ts
const maxPoints = cadence === "Annual" ? 5 : 5;
const visiblePoints = points
  .filter((point) => point.value !== null)
  .slice()
  .sort((left, right) => left.period.localeCompare(right.period))
  .slice(-maxPoints);
```

- [ ] **Step 5: Remove blank chart columns**

In `FundamentalsPanel.tsx`, keep the existing single-column behavior:

```tsx
const gridClass = quarterlyPoints.length > 0 ? "eq-fundamentals-chart-grid" : "eq-fundamentals-chart-grid is-single";
```

Only render quarterly chart when there is at least one quarterly point:

```tsx
{quarterlyPoints.length > 0 && (
  <MetricTrendChart title={metric.label} cadence="Quarterly" format={metric.format} points={quarterlyPoints} />
)}
```

- [ ] **Step 6: Run UI tests**

Run:

```bash
npm run test:edgequity:ui
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/edgequity/components/FundamentalsPanel.tsx src/edgequity/components/MetricTrendChart.tsx src/edgequity/components/StockDetail.tsx src/edgequity/components/state.test.tsx
git commit -m "feat: show annual and quarterly fundamentals"
```

---

### Task 10: Verify Realtime Data Still Pulls on User Visit

**Files:**
- Modify: `src/edgequity/data.ts`
- Test: `src/edgequity/data.test.ts`

- [ ] **Step 1: Add quote refresh test with mocked fetch path**

Add to `src/edgequity/data.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { refreshEdgequityRealtimeQuotes } from "./data.ts";
import type { EdgequityStockRecord } from "./types.ts";

test("refreshEdgequityRealtimeQuotes updates price without changing static financials", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ c: 123.45 }), { status: 200 }) as Response;

  try {
    const stock = {
      ticker: "NVDA",
      name: "NVIDIA Corp",
      sector: "AI Infrastructure",
      industry: "AI Semiconductors",
      currency: "USD",
      price: null,
      marketCap: 100,
      enterpriseValue: 90,
      valuation: { peTTM: null, forwardPE: null, psTTM: null, pb: null, evRevenue: null, evEbitda: null, pfcf: null, fcfYield: null, earningsYield: null },
      profitability: { grossMargin: null, operatingMargin: null, netMargin: null, roe: null, roa: null, roic: null },
      growth: { revenueCagr3y: null, revenueCagr5y: null, epsCagr3y: null, fcfCagr3y: null },
      financialHealth: { currentRatio: null, quickRatio: null, debtToEquity: null, netDebtToEbitda: null, interestCoverage: null },
      cashFlow: { operatingCashFlow: null, freeCashFlow: null, fcfMargin: null, capexToRevenue: null, fcfConversion: null },
      dividends: { dividendYield: null, payoutRatio: null },
      history: [{ year: "2025", revenue: 1, grossProfit: 1, operatingIncome: 1, netIncome: 1, freeCashFlow: 1, totalAssets: 1, totalDebt: 1, totalEquity: 1, sharesDiluted: 1 }],
      warnings: [],
    } satisfies EdgequityStockRecord;

    const refreshed = await refreshEdgequityRealtimeQuotes([stock]);
    assert.equal(refreshed[0]?.price, 123.45);
    assert.equal(refreshed[0]?.history[0]?.revenue, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Run data tests**

Run:

```bash
npm run test:edgequity:ui -- src/edgequity/data.test.ts
```

Expected: pass.

- [ ] **Step 3: Confirm implementation still uses Finnhub quote endpoint**

In `src/edgequity/data.ts`, keep:

```ts
const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}`;
const response = await proxyFetch(url);
```

This keeps current price realtime on page visit instead of baking it into static JSON.

- [ ] **Step 4: Commit**

```bash
git add src/edgequity/data.ts src/edgequity/data.test.ts
git commit -m "test: preserve realtime quote refresh"
```

---

### Task 11: Full Verification and Browser Check

**Files:**
- No code changes unless verification finds defects.

- [ ] **Step 1: Run all Edgequity script tests**

Run:

```bash
npm run test:edgequity
```

Expected: all script tests pass.

- [ ] **Step 2: Run all UI tests**

Run:

```bash
npm run test:edgequity:ui
```

Expected: all UI tests pass.

- [ ] **Step 3: Run type check**

Run:

```bash
npm run lint
```

Expected: TypeScript exits with code 0.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: Vite build succeeds and writes `dist`.

- [ ] **Step 5: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Vite runs on `http://localhost:3000`.

- [ ] **Step 6: Browser smoke test**

Open `http://localhost:3000` and verify:

- Table loads 50 stocks.
- Sector/theme filter shows AI infrastructure themes.
- Table earnings column shows recent and next dates for populated stocks.
- Price starts static/null and updates through realtime quote fetch after page load.
- Clicking `NVDA` opens AI Analysis by default and shows Coming Soon.
- Detail tabs show `AI Analysis`, `Financials`, and `Fundamentals`.
- Detail tabs do not show `Statements`.
- Fundamentals shows annual 5Y charts and quarterly 5Q charts when available.
- No blank chart column appears when quarterly data is unavailable.

- [ ] **Step 7: Commit fixes if verification required changes**

```bash
git add .
git commit -m "fix: verify ai universe refresh"
```

Skip this commit if verification required no changes.

---

## Self-Review

- Spec coverage: The plan covers old generated data removal, 50-stock AI universe, current/next earnings date refresh, recent transcript metadata search through Finnhub metadata, table metric population, simplified clicked-stock detail, AI Analysis Coming Soon, Statements removal, and annual/quarterly Fundamentals.
- Placeholder scan: No unresolved placeholder tokens are intentionally left in the plan. The only future workflow is explicitly out of scope and represented as Coming Soon UI.
- Type consistency: `aiTheme`, `earnings`, `transcript`, and `statementQuality` are introduced in `types.ts`, validated in `data.ts`, generated in `build-static-data.ts`, and consumed by `metrics.ts` and UI tests.
- Scope check: This is one coherent rebuild of the Edgequity static data universe and detail view. Full equity research report writing is intentionally excluded.

