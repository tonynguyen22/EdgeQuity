# Fundra Value Screener Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ValuWise into Fundra, a static-data fundamental/value stock screener with a table-first homepage and a detailed stock page for each supported ticker.

**Architecture:** Replace the current multi-tab finance terminal shell with a focused screener app. API calls move out of the visitor path into a local data generation script that writes normalized JSON files under `public/data`, and the React app only reads those static files at runtime. The UI has two main states: a dense sortable/filterable screener table and a detail page opened from a table row.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Recharts, existing Netlify proxy for optional data refresh, local JSON files in `public/data`, `tsx` for generation scripts, Node built-in test runner or Vitest added only if needed.

---

## Product Decisions

- Product name: **Fundra**.
- Audience: value investors and portfolio/CV reviewers.
- Main page: a data table showing fundamental/value metrics for all supported stocks.
- Detail page: opened by clicking a table row.
- Runtime API calls: none for public users in the primary path.
- Data source behavior: generate data locally or in CI, save normalized JSON files, and let the app read them.
- Scope: fundamental/value metrics only. Exclude technical analysis, news, AI sentiment, earnings countdowns, market cycle, insider activity, and dividend-only modeling from version one unless the metric is already part of the fundamental/value dataset.
- Ranking: no universal composite score. Provide raw metrics, sorting, filtering, sector grouping, and optional flags such as "missing data" or "negative earnings".

## File Structure

### Create

- `scripts/fundra/build-static-data.ts`
  - Fetches supported ticker data through provider endpoints or existing proxy-compatible request helpers.
  - Normalizes raw API responses into stable Fundra JSON.
  - Writes `public/data/fundra/manifest.json` and `public/data/fundra/stocks/{TICKER}.json`.

- `scripts/fundra/normalize.ts`
  - Pure functions that convert raw FMP/Finnhub payloads into Fundra stock records.
  - No filesystem or network access.

- `scripts/fundra/normalize.test.ts`
  - Unit tests for metric calculations and missing-data behavior.

- `src/fundra/types.ts`
  - Shared TypeScript types for the static data schema, table columns, filters, and detail page.

- `src/fundra/data.ts`
  - Browser-side static JSON loading functions.

- `src/fundra/metrics.ts`
  - Browser-side formatting, column definitions, metric grouping, and filter helpers.

- `src/fundra/components/ScreenerTable.tsx`
  - Main sortable/filterable table.

- `src/fundra/components/ScreenerToolbar.tsx`
  - Search, sector filter, metric group toggles, and reset controls.

- `src/fundra/components/StockDetail.tsx`
  - Detail page for a selected ticker.

- `src/fundra/components/MetricCell.tsx`
  - Reusable numeric cell with consistent formatting and missing-data handling.

- `src/fundra/components/LoadingState.tsx`
  - Static data loading state.

- `src/fundra/components/ErrorState.tsx`
  - Static data error state.

- `public/data/fundra/manifest.json`
  - Static list of supported stocks and metadata used by the homepage.

- `public/data/fundra/stocks/AAPL.json`
  - Seed fixture so the app works before the full data job is run.

- `.github/workflows/fundra-data.yml`
  - Optional scheduled data refresh workflow for GitHub-hosted cache updates.

### Modify

- `package.json`
  - Rename package.
  - Add scripts for data generation and tests.

- `metadata.json`
  - Rename displayed app metadata from ValuWise to Fundra.

- `index.html`
  - Update title and metadata.

- `src/App.tsx`
  - Replace current tab shell with Fundra screener state.

- `src/index.css`
  - Rename visible design comments/classes only where helpful.
  - Keep useful CSS variables, but remove ValuWise-specific branding in comments and app-facing labels.

- `src/dcf/types.ts`
  - Move `SUPPORTED_TICKERS` to `src/fundra/types.ts` or `src/fundra/universe.ts`.
  - Leave a compatibility export only if old modules still import it during transition.

- `PROJECT.md`
  - Rewrite project instructions for Fundra.

- `CLAUDE.md`
  - Update project guidance if still used by local agents.

### Leave In Place Initially

- Existing feature folders such as `src/dcf`, `src/tech-analysis`, `src/news-sentiment`, and others can remain in the repo during the first rebuild if they are not imported. Removing them should be a final cleanup task after the new app builds and the user confirms the old modules are no longer needed.

---

## Static Data Schema

Use one manifest plus one stock JSON file per ticker.

`public/data/fundra/manifest.json`:

```json
{
  "app": "Fundra",
  "version": 1,
  "generatedAt": "2026-05-14T00:00:00.000Z",
  "universe": ["AAPL"],
  "stocks": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc",
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "marketCap": 3000000000000,
      "dataPath": "/data/fundra/stocks/AAPL.json"
    }
  ]
}
```

`public/data/fundra/stocks/AAPL.json`:

```json
{
  "ticker": "AAPL",
  "name": "Apple Inc",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "currency": "USD",
  "price": 190,
  "marketCap": 3000000000000,
  "enterpriseValue": 3100000000000,
  "valuation": {
    "peTTM": 28.4,
    "forwardPE": 25.1,
    "psTTM": 7.2,
    "pb": 38.5,
    "evRevenue": 7.8,
    "evEbitda": 21.6,
    "pfcf": 27.3,
    "fcfYield": 0.0366,
    "earningsYield": 0.0352
  },
  "profitability": {
    "grossMargin": 0.45,
    "operatingMargin": 0.30,
    "netMargin": 0.25,
    "roe": 1.4,
    "roa": 0.27,
    "roic": 0.55
  },
  "growth": {
    "revenueCagr3y": 0.06,
    "revenueCagr5y": 0.08,
    "epsCagr3y": 0.07,
    "fcfCagr3y": 0.05
  },
  "financialHealth": {
    "currentRatio": 1.0,
    "quickRatio": 0.9,
    "debtToEquity": 1.5,
    "netDebtToEbitda": 0.7,
    "interestCoverage": 25.0
  },
  "cashFlow": {
    "operatingCashFlow": 110000000000,
    "freeCashFlow": 95000000000,
    "fcfMargin": 0.24,
    "capexToRevenue": 0.03,
    "fcfConversion": 1.05
  },
  "dividends": {
    "dividendYield": 0.005,
    "payoutRatio": 0.15
  },
  "history": [
    {
      "year": "2025",
      "revenue": 390000000000,
      "grossProfit": 175000000000,
      "operatingIncome": 120000000000,
      "netIncome": 97000000000,
      "freeCashFlow": 95000000000,
      "totalAssets": 350000000000,
      "totalDebt": 100000000000,
      "totalEquity": 70000000000,
      "sharesDiluted": 15500000000
    }
  ],
  "warnings": []
}
```

Rules:

- Use `null` for unavailable values, not `0`.
- Store ratios as decimals, for example `0.25` for 25%.
- Store money values as full numeric units, not millions.
- Keep generated files deterministic by sorting tickers alphabetically and formatting JSON with two spaces.
- Do not store API keys in generated JSON.

---

## Task 1: Rename Project Branding To Fundra

**Files:**
- Modify: `package.json`
- Modify: `metadata.json`
- Modify: `index.html`
- Modify: `src/index.css`
- Modify: `PROJECT.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update package metadata**

Change `package.json`:

```json
{
  "name": "fundra",
  "private": true,
  "version": "0.1.0",
  "type": "module"
}
```

Keep existing dependencies and scripts until later tasks add new scripts.

- [ ] **Step 2: Update browser title and metadata**

In `index.html`, set the title to:

```html
<title>Fundra</title>
```

Replace visible `ValuWise` metadata text with:

```html
<meta name="description" content="Fundra is a static-data fundamental stock screener for value investors." />
```

- [ ] **Step 3: Update app metadata file**

Set `metadata.json` to:

```json
{
  "name": "Fundra",
  "description": "A static-data fundamental stock screener for value investors."
}
```

- [ ] **Step 4: Replace user-facing ValuWise references in docs**

Run:

```bash
rtk proxy rg "ValuWise|valuwise|vw-" .
```

Expected: matches appear in docs, CSS, storage prefixes, and old module comments.

Update only user-facing naming in `PROJECT.md`, `CLAUDE.md`, `index.html`, `metadata.json`, and visible UI strings. Keep CSS variables such as `--vw-*` for this task to avoid a wide low-value rename.

- [ ] **Step 5: Verify build metadata compiles**

Run:

```bash
rtk proxy npm run lint
```

Expected: TypeScript completes with no new errors.

- [ ] **Step 6: Commit**

```bash
rtk proxy git add package.json metadata.json index.html src/index.css PROJECT.md CLAUDE.md
rtk proxy git commit -m "chore: rename project to Fundra"
```

---

## Task 2: Define Fundra Static Data Types

**Files:**
- Create: `src/fundra/types.ts`
- Create: `src/fundra/universe.ts`
- Modify: `src/dcf/types.ts`

- [ ] **Step 1: Create the supported ticker universe**

Create `src/fundra/universe.ts`:

```ts
export const FUNDRA_SUPPORTED_TICKERS = [
  'AAPL', 'TSLA', 'AMZN', 'MSFT', 'NVDA', 'GOOGL', 'META', 'NFLX',
  'JPM', 'V', 'BAC', 'PYPL', 'DIS', 'T', 'PFE', 'COST',
  'INTC', 'KO', 'TGT', 'NKE', 'BA', 'BABA', 'XOM',
  'WMT', 'GE', 'CSCO', 'VZ', 'JNJ', 'CVX', 'PLTR', 'SQ',
  'SHOP', 'SBUX', 'SOFI', 'HOOD', 'RBLX', 'SNAP', 'AMD', 'UBER',
  'FDX', 'ABBV', 'ETSY', 'MRNA', 'LMT', 'GM', 'F', 'LCID',
  'CCL', 'DAL', 'UAL', 'AAL', 'TSM', 'SONY', 'ET', 'MRO',
  'COIN', 'RIVN', 'RIOT', 'CPRX', 'NOK', 'ROKU',
  'VIAC', 'ATVI', 'BIDU', 'DOCU', 'ZM', 'PINS', 'TLRY', 'WBA',
  'MGM', 'NIO', 'C', 'GS', 'WFC', 'ADBE', 'PEP', 'UNH',
  'CARR', 'HCA', 'TWTR', 'BILI', 'SIRI', 'FUBO', 'RKT',
] as const;

export type FundraTicker = typeof FUNDRA_SUPPORTED_TICKERS[number];
```

- [ ] **Step 2: Create Fundra data types**

Create `src/fundra/types.ts`:

```ts
export interface FundraManifestStock {
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  dataPath: string;
}

export interface FundraManifest {
  app: 'Fundra';
  version: number;
  generatedAt: string;
  universe: string[];
  stocks: FundraManifestStock[];
}

export interface FundraHistoryYear {
  year: string;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  freeCashFlow: number | null;
  totalAssets: number | null;
  totalDebt: number | null;
  totalEquity: number | null;
  sharesDiluted: number | null;
}

export interface FundraStockRecord {
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  currency: string | null;
  price: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  valuation: {
    peTTM: number | null;
    forwardPE: number | null;
    psTTM: number | null;
    pb: number | null;
    evRevenue: number | null;
    evEbitda: number | null;
    pfcf: number | null;
    fcfYield: number | null;
    earningsYield: number | null;
  };
  profitability: {
    grossMargin: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    roe: number | null;
    roa: number | null;
    roic: number | null;
  };
  growth: {
    revenueCagr3y: number | null;
    revenueCagr5y: number | null;
    epsCagr3y: number | null;
    fcfCagr3y: number | null;
  };
  financialHealth: {
    currentRatio: number | null;
    quickRatio: number | null;
    debtToEquity: number | null;
    netDebtToEbitda: number | null;
    interestCoverage: number | null;
  };
  cashFlow: {
    operatingCashFlow: number | null;
    freeCashFlow: number | null;
    fcfMargin: number | null;
    capexToRevenue: number | null;
    fcfConversion: number | null;
  };
  dividends: {
    dividendYield: number | null;
    payoutRatio: number | null;
  };
  history: FundraHistoryYear[];
  warnings: string[];
}

export type FundraMetricGroup =
  | 'profile'
  | 'valuation'
  | 'profitability'
  | 'growth'
  | 'financialHealth'
  | 'cashFlow'
  | 'dividends';

export interface FundraColumn {
  id: string;
  label: string;
  group: FundraMetricGroup;
  accessor: (stock: FundraStockRecord) => string | number | null;
  format: 'text' | 'money' | 'number' | 'percent' | 'multiple';
  sortable: boolean;
}
```

- [ ] **Step 3: Keep compatibility for old imports**

In `src/dcf/types.ts`, replace the local `SUPPORTED_TICKERS` definition with:

```ts
export { FUNDRA_SUPPORTED_TICKERS as SUPPORTED_TICKERS } from '../fundra/universe';
export type { FundraTicker as SupportedTicker } from '../fundra/universe';
```

Do this only after checking the file does not already define conflicting `SupportedTicker` exports. If it does, remove the old duplicate at the bottom of the file.

- [ ] **Step 4: Verify types**

Run:

```bash
rtk proxy npm run lint
```

Expected: no duplicate export errors and no import errors.

- [ ] **Step 5: Commit**

```bash
rtk proxy git add src/fundra/types.ts src/fundra/universe.ts src/dcf/types.ts
rtk proxy git commit -m "feat: define Fundra stock data schema"
```

---

## Task 3: Add Static Data Normalization Logic

**Files:**
- Create: `scripts/fundra/normalize.ts`
- Create: `scripts/fundra/normalize.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add a test script**

In `package.json`, add:

```json
{
  "scripts": {
    "test:fundra": "tsx --test scripts/fundra/normalize.test.ts"
  }
}
```

Keep existing scripts.

- [ ] **Step 2: Write normalization tests**

Create `scripts/fundra/normalize.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { cagr, ratio, normalizeNumber } from './normalize';

test('ratio returns null when denominator is zero or missing', () => {
  assert.equal(ratio(10, 0), null);
  assert.equal(ratio(10, null), null);
  assert.equal(ratio(null, 10), null);
});

test('ratio returns numerator divided by denominator', () => {
  assert.equal(ratio(25, 100), 0.25);
});

test('cagr returns null when inputs are invalid', () => {
  assert.equal(cagr(0, 100, 3), null);
  assert.equal(cagr(100, 0, 3), null);
  assert.equal(cagr(100, 200, 0), null);
});

test('cagr computes annualized growth', () => {
  const result = cagr(100, 133.1, 3);
  assert.ok(result !== null);
  assert.equal(Number(result!.toFixed(3)), 0.1);
});

test('normalizeNumber converts undefined and NaN to null', () => {
  assert.equal(normalizeNumber(undefined), null);
  assert.equal(normalizeNumber(Number.NaN), null);
  assert.equal(normalizeNumber(42), 42);
});
```

- [ ] **Step 3: Run tests and confirm failure**

Run:

```bash
rtk proxy npm run test:fundra
```

Expected: failure because `scripts/fundra/normalize.ts` does not exist.

- [ ] **Step 4: Create normalization helpers**

Create `scripts/fundra/normalize.ts`:

```ts
export function normalizeNumber(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

export function ratio(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (typeof numerator !== 'number' || typeof denominator !== 'number') return null;
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator === 0) return null;
  return numerator / denominator;
}

export function cagr(start: number | null | undefined, end: number | null | undefined, years: number): number | null {
  if (typeof start !== 'number' || typeof end !== 'number') return null;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start <= 0 || end <= 0 || years <= 0) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

export function absNumber(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.abs(value);
}
```

- [ ] **Step 5: Verify tests pass**

Run:

```bash
rtk proxy npm run test:fundra
```

Expected: all five tests pass.

- [ ] **Step 6: Commit**

```bash
rtk proxy git add package.json scripts/fundra/normalize.ts scripts/fundra/normalize.test.ts
rtk proxy git commit -m "feat: add Fundra data normalization helpers"
```

---

## Task 4: Build Static Data Generator

**Files:**
- Create: `scripts/fundra/build-static-data.ts`
- Modify: `scripts/fundra/normalize.ts`
- Modify: `package.json`
- Create: `public/data/fundra/manifest.json`
- Create: `public/data/fundra/stocks/AAPL.json`

- [ ] **Step 1: Add data generation script**

In `package.json`, add:

```json
{
  "scripts": {
    "fundra:data": "tsx scripts/fundra/build-static-data.ts"
  }
}
```

- [ ] **Step 2: Extend normalize.ts with stock record builder**

Add this exported function to `scripts/fundra/normalize.ts`:

```ts
type RawFundraPayload = {
  ticker: string;
  profile: any;
  metrics: any;
  incomeStatements: any[];
  balanceSheets: any[];
  cashFlows: any[];
};

export function buildWarnings(record: {
  peTTM: number | null;
  marketCap: number | null;
  historyLength: number;
}): string[] {
  const warnings: string[] = [];
  if (record.peTTM === null) warnings.push('P/E unavailable');
  if (record.marketCap === null) warnings.push('Market cap unavailable');
  if (record.historyLength < 3) warnings.push('Less than three years of financial history');
  return warnings;
}

export function normalizeFundraRecord(raw: RawFundraPayload) {
  const latestIncome = raw.incomeStatements[0] || {};
  const latestBalance = raw.balanceSheets[0] || {};
  const latestCashFlow = raw.cashFlows[0] || {};
  const metric = raw.metrics?.metric || raw.metrics || {};

  const revenue = normalizeNumber(latestIncome.revenue);
  const grossProfit = normalizeNumber(latestIncome.grossProfit);
  const operatingIncome = normalizeNumber(latestIncome.operatingIncome ?? latestIncome.ebit);
  const netIncome = normalizeNumber(latestIncome.netIncome);
  const freeCashFlow = normalizeNumber(latestCashFlow.freeCashFlow);
  const capex = absNumber(latestCashFlow.capitalExpenditure);
  const ebitda = normalizeNumber(latestIncome.ebitda);
  const totalDebt = normalizeNumber(latestBalance.totalDebt);
  const cash = normalizeNumber(latestBalance.cashAndCashEquivalents);
  const marketCap = normalizeNumber(raw.profile?.marketCapitalization)
    ? normalizeNumber(raw.profile.marketCapitalization)! * 1_000_000
    : normalizeNumber(raw.profile?.mktCap);
  const enterpriseValue = marketCap !== null && totalDebt !== null
    ? marketCap + totalDebt - (cash || 0)
    : null;

  const history = raw.incomeStatements.map((income, index) => {
    const balance = raw.balanceSheets[index] || {};
    const cashFlow = raw.cashFlows[index] || {};
    return {
      year: String(income.fiscalYear || income.calendarYear || income.date || ''),
      revenue: normalizeNumber(income.revenue),
      grossProfit: normalizeNumber(income.grossProfit),
      operatingIncome: normalizeNumber(income.operatingIncome ?? income.ebit),
      netIncome: normalizeNumber(income.netIncome),
      freeCashFlow: normalizeNumber(cashFlow.freeCashFlow),
      totalAssets: normalizeNumber(balance.totalAssets),
      totalDebt: normalizeNumber(balance.totalDebt),
      totalEquity: normalizeNumber(balance.totalStockholdersEquity ?? balance.totalEquity),
      sharesDiluted: normalizeNumber(income.weightedAverageShsOutDil),
    };
  });

  const oldest3 = history[2];
  const latest = history[0];
  const revenueCagr3y = oldest3 && latest ? cagr(oldest3.revenue, latest.revenue, 3) : null;
  const fcfCagr3y = oldest3 && latest ? cagr(oldest3.freeCashFlow, latest.freeCashFlow, 3) : null;

  const peTTM = normalizeNumber(metric.peTTM ?? metric.peNormalizedAnnual);
  const stock = {
    ticker: raw.ticker,
    name: raw.profile?.name || raw.profile?.companyName || raw.ticker,
    sector: raw.profile?.finnhubIndustry || raw.profile?.sector || null,
    industry: raw.profile?.finnhubIndustry || raw.profile?.industry || null,
    currency: raw.profile?.currency || 'USD',
    price: normalizeNumber(raw.profile?.price ?? metric.currentPrice),
    marketCap,
    enterpriseValue,
    valuation: {
      peTTM,
      forwardPE: normalizeNumber(metric.forwardPE),
      psTTM: normalizeNumber(metric.psTTM),
      pb: normalizeNumber(metric.pbQuarterly ?? metric.pbAnnual),
      evRevenue: ratio(enterpriseValue, revenue),
      evEbitda: ratio(enterpriseValue, ebitda),
      pfcf: ratio(marketCap, freeCashFlow),
      fcfYield: ratio(freeCashFlow, marketCap),
      earningsYield: peTTM ? 1 / peTTM : null,
    },
    profitability: {
      grossMargin: ratio(grossProfit, revenue),
      operatingMargin: ratio(operatingIncome, revenue),
      netMargin: ratio(netIncome, revenue),
      roe: ratio(netIncome, normalizeNumber(latestBalance.totalStockholdersEquity ?? latestBalance.totalEquity)),
      roa: ratio(netIncome, normalizeNumber(latestBalance.totalAssets)),
      roic: normalizeNumber(metric.roicTTM ?? metric.roicAnnual),
    },
    growth: {
      revenueCagr3y,
      revenueCagr5y: null,
      epsCagr3y: null,
      fcfCagr3y,
    },
    financialHealth: {
      currentRatio: normalizeNumber(metric.currentRatioQuarterly ?? metric.currentRatioAnnual),
      quickRatio: normalizeNumber(metric.quickRatioQuarterly ?? metric.quickRatioAnnual),
      debtToEquity: normalizeNumber(metric.totalDebtToEquityQuarterly ?? metric.totalDebtToEquityAnnual),
      netDebtToEbitda: ratio(totalDebt !== null ? totalDebt - (cash || 0) : null, ebitda),
      interestCoverage: normalizeNumber(metric.interestCoverageAnnual),
    },
    cashFlow: {
      operatingCashFlow: normalizeNumber(latestCashFlow.operatingCashFlow ?? latestCashFlow.netCashProvidedByOperatingActivities),
      freeCashFlow,
      fcfMargin: ratio(freeCashFlow, revenue),
      capexToRevenue: ratio(capex, revenue),
      fcfConversion: ratio(freeCashFlow, netIncome),
    },
    dividends: {
      dividendYield: normalizeNumber(metric.dividendYieldIndicatedAnnual ?? metric.dividendYieldTTM),
      payoutRatio: normalizeNumber(metric.payoutRatioAnnual),
    },
    history,
    warnings: buildWarnings({ peTTM, marketCap, historyLength: history.length }),
  };

  return stock;
}
```

- [ ] **Step 3: Create generator script**

Create `scripts/fundra/build-static-data.ts`:

```ts
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FUNDRA_SUPPORTED_TICKERS } from '../../src/fundra/universe';
import { normalizeFundraRecord } from './normalize';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(root, 'public/data/fundra');
const stockDir = join(outDir, 'stocks');

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} failed with ${res.status}`);
  return res.json();
}

function fmp(path: string, params: Record<string, string>) {
  const url = new URL(`https://financialmodelingprep.com/stable/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('apikey', process.env.FMP_API_KEY || '');
  return url.toString();
}

function finnhub(path: string, params: Record<string, string>) {
  const url = new URL(`https://finnhub.io/api/v1/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('token', process.env.FINNHUB_API_KEY || '');
  return url.toString();
}

async function buildTicker(ticker: string) {
  const [incomeStatements, balanceSheets, cashFlows, profile, metrics] = await Promise.all([
    fetchJson(fmp('income-statement', { symbol: ticker, limit: '5' })),
    fetchJson(fmp('balance-sheet-statement', { symbol: ticker, limit: '5' })),
    fetchJson(fmp('cash-flow-statement', { symbol: ticker, limit: '5' })),
    fetchJson(finnhub('stock/profile2', { symbol: ticker })),
    fetchJson(finnhub('stock/metric', { symbol: ticker, metric: 'all' })),
  ]);

  return normalizeFundraRecord({
    ticker,
    profile,
    metrics,
    incomeStatements,
    balanceSheets,
    cashFlows,
  });
}

async function main() {
  if (!process.env.FMP_API_KEY) throw new Error('FMP_API_KEY is required');
  if (!process.env.FINNHUB_API_KEY) throw new Error('FINNHUB_API_KEY is required');

  await mkdir(stockDir, { recursive: true });

  const stocks = [];
  for (const ticker of [...FUNDRA_SUPPORTED_TICKERS].sort()) {
    const stock = await buildTicker(ticker);
    const file = join(stockDir, `${ticker}.json`);
    await writeFile(file, `${JSON.stringify(stock, null, 2)}\n`, 'utf8');
    stocks.push({
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      industry: stock.industry,
      marketCap: stock.marketCap,
      dataPath: `/data/fundra/stocks/${ticker}.json`,
    });
  }

  const manifest = {
    app: 'Fundra',
    version: 1,
    generatedAt: new Date().toISOString(),
    universe: [...FUNDRA_SUPPORTED_TICKERS].sort(),
    stocks,
  };

  await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 4: Add seed static files**

Create `public/data/fundra/manifest.json` with one AAPL entry using the schema above.

Create `public/data/fundra/stocks/AAPL.json` using the schema above. The values can be sample values, but every key in the schema must exist and unavailable values must be `null`.

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
rtk proxy npm run test:fundra
rtk proxy npm run lint
```

Expected: tests pass and TypeScript passes.

- [ ] **Step 6: Do not run the full generator until API keys are configured**

Run:

```bash
rtk proxy powershell -NoProfile -Command "$env:FMP_API_KEY; $env:FINNHUB_API_KEY"
```

Expected: if either output is empty, skip `npm run fundra:data` and note that data generation requires keys.

- [ ] **Step 7: Commit**

```bash
rtk proxy git add package.json scripts/fundra public/data/fundra
rtk proxy git commit -m "feat: add Fundra static data generator"
```

---

## Task 5: Add Browser-Side Static Data Loader

**Files:**
- Create: `src/fundra/data.ts`
- Create: `src/fundra/data.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add data loader test script**

In `package.json`, add:

```json
{
  "scripts": {
    "test:fundra:ui": "tsx --test src/fundra/data.test.ts"
  }
}
```

- [ ] **Step 2: Write loader tests for response validation**

Create `src/fundra/data.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertFundraManifest } from './data';

test('assertFundraManifest accepts valid manifest shape', () => {
  assert.doesNotThrow(() => assertFundraManifest({
    app: 'Fundra',
    version: 1,
    generatedAt: '2026-05-14T00:00:00.000Z',
    universe: ['AAPL'],
    stocks: [{ ticker: 'AAPL', name: 'Apple Inc', sector: 'Technology', industry: 'Consumer Electronics', marketCap: 1, dataPath: '/data/fundra/stocks/AAPL.json' }],
  }));
});

test('assertFundraManifest rejects wrong app name', () => {
  assert.throws(() => assertFundraManifest({ app: 'ValuWise' }), /Invalid Fundra manifest/);
});
```

- [ ] **Step 3: Create data loader**

Create `src/fundra/data.ts`:

```ts
import type { FundraManifest, FundraStockRecord } from './types';

export function assertFundraManifest(value: unknown): asserts value is FundraManifest {
  const manifest = value as Partial<FundraManifest>;
  if (
    !manifest ||
    manifest.app !== 'Fundra' ||
    typeof manifest.version !== 'number' ||
    !Array.isArray(manifest.stocks)
  ) {
    throw new Error('Invalid Fundra manifest');
  }
}

export async function loadFundraManifest(): Promise<FundraManifest> {
  const res = await fetch('/data/fundra/manifest.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load Fundra manifest: ${res.status}`);
  const json = await res.json();
  assertFundraManifest(json);
  return json;
}

export async function loadFundraStock(path: string): Promise<FundraStockRecord> {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load stock data: ${res.status}`);
  return res.json();
}

export async function loadAllFundraStocks(): Promise<FundraStockRecord[]> {
  const manifest = await loadFundraManifest();
  return Promise.all(manifest.stocks.map(stock => loadFundraStock(stock.dataPath)));
}
```

- [ ] **Step 4: Verify tests**

Run:

```bash
rtk proxy npm run test:fundra:ui
rtk proxy npm run lint
```

Expected: tests pass and TypeScript passes.

- [ ] **Step 5: Commit**

```bash
rtk proxy git add package.json src/fundra/data.ts src/fundra/data.test.ts
rtk proxy git commit -m "feat: load Fundra static stock data"
```

---

## Task 6: Replace App Shell With Fundra Screener

**Files:**
- Modify: `src/App.tsx`
- Create: `src/fundra/components/LoadingState.tsx`
- Create: `src/fundra/components/ErrorState.tsx`

- [ ] **Step 1: Add simple loading and error components**

Create `src/fundra/components/LoadingState.tsx`:

```tsx
export default function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--vw-text-secondary)' }}>
      Loading Fundra data...
    </div>
  );
}
```

Create `src/fundra/components/ErrorState.tsx`:

```tsx
interface ErrorStateProps {
  message: string;
}

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ color: 'var(--vw-text-primary)' }}>
      <div className="vw-card max-w-lg p-6">
        <h1 className="text-xl font-semibold mb-2">Fundra data could not load</h1>
        <p style={{ color: 'var(--vw-text-secondary)' }}>{message}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/App.tsx` with static screener state**

Use this structure:

```tsx
import { useEffect, useState } from 'react';
import { loadAllFundraStocks } from './fundra/data';
import type { FundraStockRecord } from './fundra/types';
import LoadingState from './fundra/components/LoadingState';
import ErrorState from './fundra/components/ErrorState';
import ScreenerTable from './fundra/components/ScreenerTable';
import StockDetail from './fundra/components/StockDetail';

export default function App() {
  const [stocks, setStocks] = useState<FundraStockRecord[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllFundraStocks()
      .then(setStocks)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown data loading error'))
      .finally(() => setLoading(false));
  }, []);

  const selectedStock = selectedTicker
    ? stocks.find(stock => stock.ticker === selectedTicker) || null
    : null;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--vw-bg-deep)', color: 'var(--vw-text-primary)' }}>
      <header className="border-b" style={{ borderColor: 'var(--vw-border)' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fundra</h1>
            <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
              Fundamental stock screener for value investors
            </p>
          </div>
          <div className="font-mono text-sm" style={{ color: 'var(--vw-text-tertiary)' }}>
            {stocks.length} stocks
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedStock ? (
          <StockDetail stock={selectedStock} onBack={() => setSelectedTicker(null)} />
        ) : (
          <ScreenerTable stocks={stocks} onSelectStock={setSelectedTicker} />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Add temporary placeholder components if table/detail are not built yet**

If `ScreenerTable` and `StockDetail` do not exist yet, create temporary components that compile:

```tsx
import type { FundraStockRecord } from '../types';

interface Props {
  stocks: FundraStockRecord[];
  onSelectStock: (ticker: string) => void;
}

export default function ScreenerTable({ stocks, onSelectStock }: Props) {
  return (
    <div className="vw-card p-6">
      {stocks.map(stock => (
        <button key={stock.ticker} onClick={() => onSelectStock(stock.ticker)} className="block font-mono">
          {stock.ticker}
        </button>
      ))}
    </div>
  );
}
```

```tsx
import type { FundraStockRecord } from '../types';

interface Props {
  stock: FundraStockRecord;
  onBack: () => void;
}

export default function StockDetail({ stock, onBack }: Props) {
  return (
    <div className="vw-card p-6">
      <button onClick={onBack}>Back</button>
      <h2>{stock.ticker}</h2>
    </div>
  );
}
```

- [ ] **Step 4: Verify compile**

Run:

```bash
rtk proxy npm run lint
rtk proxy npm run build
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```bash
rtk proxy git add src/App.tsx src/fundra/components
rtk proxy git commit -m "feat: replace app shell with Fundra screener"
```

---

## Task 7: Build Metric Definitions And Formatting

**Files:**
- Create: `src/fundra/metrics.ts`
- Create: `src/fundra/components/MetricCell.tsx`

- [ ] **Step 1: Create metric columns**

Create `src/fundra/metrics.ts`:

```ts
import type { FundraColumn, FundraStockRecord } from './types';

export const FUNDRA_COLUMNS: FundraColumn[] = [
  { id: 'ticker', label: 'Ticker', group: 'profile', accessor: s => s.ticker, format: 'text', sortable: true },
  { id: 'name', label: 'Company', group: 'profile', accessor: s => s.name, format: 'text', sortable: true },
  { id: 'sector', label: 'Sector', group: 'profile', accessor: s => s.sector, format: 'text', sortable: true },
  { id: 'marketCap', label: 'Market Cap', group: 'profile', accessor: s => s.marketCap, format: 'money', sortable: true },
  { id: 'peTTM', label: 'P/E', group: 'valuation', accessor: s => s.valuation.peTTM, format: 'multiple', sortable: true },
  { id: 'forwardPE', label: 'Forward P/E', group: 'valuation', accessor: s => s.valuation.forwardPE, format: 'multiple', sortable: true },
  { id: 'psTTM', label: 'P/S', group: 'valuation', accessor: s => s.valuation.psTTM, format: 'multiple', sortable: true },
  { id: 'pb', label: 'P/B', group: 'valuation', accessor: s => s.valuation.pb, format: 'multiple', sortable: true },
  { id: 'evEbitda', label: 'EV/EBITDA', group: 'valuation', accessor: s => s.valuation.evEbitda, format: 'multiple', sortable: true },
  { id: 'fcfYield', label: 'FCF Yield', group: 'valuation', accessor: s => s.valuation.fcfYield, format: 'percent', sortable: true },
  { id: 'grossMargin', label: 'Gross Margin', group: 'profitability', accessor: s => s.profitability.grossMargin, format: 'percent', sortable: true },
  { id: 'operatingMargin', label: 'Op. Margin', group: 'profitability', accessor: s => s.profitability.operatingMargin, format: 'percent', sortable: true },
  { id: 'netMargin', label: 'Net Margin', group: 'profitability', accessor: s => s.profitability.netMargin, format: 'percent', sortable: true },
  { id: 'roe', label: 'ROE', group: 'profitability', accessor: s => s.profitability.roe, format: 'percent', sortable: true },
  { id: 'roa', label: 'ROA', group: 'profitability', accessor: s => s.profitability.roa, format: 'percent', sortable: true },
  { id: 'revenueCagr3y', label: 'Revenue CAGR 3Y', group: 'growth', accessor: s => s.growth.revenueCagr3y, format: 'percent', sortable: true },
  { id: 'fcfCagr3y', label: 'FCF CAGR 3Y', group: 'growth', accessor: s => s.growth.fcfCagr3y, format: 'percent', sortable: true },
  { id: 'currentRatio', label: 'Current Ratio', group: 'financialHealth', accessor: s => s.financialHealth.currentRatio, format: 'number', sortable: true },
  { id: 'debtToEquity', label: 'Debt/Equity', group: 'financialHealth', accessor: s => s.financialHealth.debtToEquity, format: 'number', sortable: true },
  { id: 'netDebtToEbitda', label: 'Net Debt/EBITDA', group: 'financialHealth', accessor: s => s.financialHealth.netDebtToEbitda, format: 'multiple', sortable: true },
  { id: 'fcfMargin', label: 'FCF Margin', group: 'cashFlow', accessor: s => s.cashFlow.fcfMargin, format: 'percent', sortable: true },
  { id: 'fcfConversion', label: 'FCF Conversion', group: 'cashFlow', accessor: s => s.cashFlow.fcfConversion, format: 'percent', sortable: true },
  { id: 'dividendYield', label: 'Dividend Yield', group: 'dividends', accessor: s => s.dividends.dividendYield, format: 'percent', sortable: true },
];

export function formatFundraValue(value: string | number | null, format: FundraColumn['format']): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return '-';
  if (format === 'money') {
    if (Math.abs(value) >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toFixed(0)}`;
  }
  if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (format === 'multiple') return `${value.toFixed(1)}x`;
  return value.toFixed(2);
}

export function getColumnValue(stock: FundraStockRecord, column: FundraColumn) {
  return column.accessor(stock);
}
```

- [ ] **Step 2: Create metric cell component**

Create `src/fundra/components/MetricCell.tsx`:

```tsx
import type { FundraColumn, FundraStockRecord } from '../types';
import { formatFundraValue, getColumnValue } from '../metrics';

interface MetricCellProps {
  stock: FundraStockRecord;
  column: FundraColumn;
}

export default function MetricCell({ stock, column }: MetricCellProps) {
  const value = getColumnValue(stock, column);
  return (
    <td className="px-3 py-2 text-sm whitespace-nowrap font-mono text-right" style={{ color: value === null ? 'var(--vw-text-tertiary)' : 'var(--vw-text-primary)' }}>
      {formatFundraValue(value, column.format)}
    </td>
  );
}
```

- [ ] **Step 3: Verify compile**

Run:

```bash
rtk proxy npm run lint
```

Expected: TypeScript passes.

- [ ] **Step 4: Commit**

```bash
rtk proxy git add src/fundra/metrics.ts src/fundra/components/MetricCell.tsx
rtk proxy git commit -m "feat: define Fundra screener metrics"
```

---

## Task 8: Build Table-First Screener UI

**Files:**
- Create or replace: `src/fundra/components/ScreenerToolbar.tsx`
- Replace: `src/fundra/components/ScreenerTable.tsx`

- [ ] **Step 1: Create toolbar**

Create `src/fundra/components/ScreenerToolbar.tsx`:

```tsx
interface ScreenerToolbarProps {
  query: string;
  sector: string;
  sectors: string[];
  onQueryChange: (value: string) => void;
  onSectorChange: (value: string) => void;
  onReset: () => void;
}

export default function ScreenerToolbar({
  query,
  sector,
  sectors,
  onQueryChange,
  onSectorChange,
  onReset,
}: ScreenerToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
      <input
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        placeholder="Search ticker or company"
        className="w-full md:max-w-sm rounded-lg px-4 py-2 text-sm outline-none"
        style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border)', color: 'var(--vw-text-primary)' }}
      />
      <div className="flex gap-2">
        <select
          value={sector}
          onChange={event => onSectorChange(event.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border)', color: 'var(--vw-text-primary)' }}
        >
          <option value="">All sectors</option>
          {sectors.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--vw-bg-surface)', border: '1px solid var(--vw-border)', color: 'var(--vw-text-secondary)' }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement screener table**

Replace `src/fundra/components/ScreenerTable.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { FundraStockRecord } from '../types';
import { FUNDRA_COLUMNS, getColumnValue } from '../metrics';
import MetricCell from './MetricCell';
import ScreenerToolbar from './ScreenerToolbar';

interface ScreenerTableProps {
  stocks: FundraStockRecord[];
  onSelectStock: (ticker: string) => void;
}

type SortState = {
  columnId: string;
  direction: 'asc' | 'desc';
};

export default function ScreenerTable({ stocks, onSelectStock }: ScreenerTableProps) {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [sort, setSort] = useState<SortState>({ columnId: 'marketCap', direction: 'desc' });

  const sectors = useMemo(
    () => Array.from(new Set(stocks.map(stock => stock.sector).filter((value): value is string => Boolean(value)))).sort(),
    [stocks],
  );

  const visibleStocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const column = FUNDRA_COLUMNS.find(item => item.id === sort.columnId) || FUNDRA_COLUMNS[0];
    return stocks
      .filter(stock => !q || stock.ticker.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q))
      .filter(stock => !sector || stock.sector === sector)
      .sort((a, b) => {
        const av = getColumnValue(a, column);
        const bv = getColumnValue(b, column);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        const result = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sort.direction === 'asc' ? result : -result;
      });
  }, [stocks, query, sector, sort]);

  const toggleSort = (columnId: string) => {
    setSort(current => ({
      columnId,
      direction: current.columnId === columnId && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <section>
      <ScreenerToolbar
        query={query}
        sector={sector}
        sectors={sectors}
        onQueryChange={setQuery}
        onSectorChange={setSector}
        onReset={() => {
          setQuery('');
          setSector('');
          setSort({ columnId: 'marketCap', direction: 'desc' });
        }}
      />

      <div className="overflow-auto rounded-lg" style={{ border: '1px solid var(--vw-border)' }}>
        <table className="min-w-full border-collapse">
          <thead style={{ background: 'var(--vw-bg-raised)' }}>
            <tr>
              {FUNDRA_COLUMNS.map(column => (
                <th key={column.id} className="sticky top-0 px-3 py-2 text-xs font-semibold text-left whitespace-nowrap">
                  <button type="button" onClick={() => toggleSort(column.id)} className="font-inherit">
                    {column.label}{sort.columnId === column.id ? (sort.direction === 'desc' ? ' ↓' : ' ↑') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleStocks.map(stock => (
              <tr
                key={stock.ticker}
                onClick={() => onSelectStock(stock.ticker)}
                className="cursor-pointer"
                style={{ borderTop: '1px solid var(--vw-border)' }}
              >
                {FUNDRA_COLUMNS.map(column => column.id === 'ticker' || column.id === 'name' || column.id === 'sector' ? (
                  <td key={column.id} className="px-3 py-2 text-sm whitespace-nowrap">
                    {String(getColumnValue(stock, column) || '-')}
                  </td>
                ) : (
                  <MetricCell key={column.id} stock={stock} column={column} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify build**

Run:

```bash
rtk proxy npm run lint
rtk proxy npm run build
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
rtk proxy git add src/fundra/components/ScreenerToolbar.tsx src/fundra/components/ScreenerTable.tsx
rtk proxy git commit -m "feat: build Fundra screener table"
```

---

## Task 9: Build Stock Detail Page

**Files:**
- Replace: `src/fundra/components/StockDetail.tsx`

- [ ] **Step 1: Implement detail layout**

Replace `src/fundra/components/StockDetail.tsx`:

```tsx
import type { FundraStockRecord } from '../types';
import { FUNDRA_COLUMNS, formatFundraValue, getColumnValue } from '../metrics';

interface StockDetailProps {
  stock: FundraStockRecord;
  onBack: () => void;
}

const groups = ['valuation', 'profitability', 'growth', 'financialHealth', 'cashFlow', 'dividends'] as const;

export default function StockDetail({ stock, onBack }: StockDetailProps) {
  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 rounded-lg px-3 py-2 text-sm"
        style={{ background: 'var(--vw-bg-surface)', border: '1px solid var(--vw-border)', color: 'var(--vw-text-secondary)' }}
      >
        Back to screener
      </button>

      <div className="mb-6">
        <h2 className="text-3xl font-semibold">{stock.ticker}</h2>
        <p style={{ color: 'var(--vw-text-secondary)' }}>{stock.name}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--vw-text-tertiary)' }}>
          {[stock.sector, stock.industry].filter(Boolean).join(' / ')}
        </p>
      </div>

      {stock.warnings.length > 0 && (
        <div className="vw-card p-4 mb-6">
          <h3 className="text-sm font-semibold mb-2">Data notes</h3>
          <ul className="text-sm space-y-1" style={{ color: 'var(--vw-text-secondary)' }}>
            {stock.warnings.map(warning => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {groups.map(group => {
          const columns = FUNDRA_COLUMNS.filter(column => column.group === group);
          return (
            <div key={group} className="vw-card p-4">
              <h3 className="text-sm font-semibold uppercase mb-3" style={{ color: 'var(--vw-text-secondary)' }}>{group}</h3>
              <div className="space-y-2">
                {columns.map(column => (
                  <div key={column.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>{column.label}</span>
                    <span className="font-mono text-sm">{formatFundraValue(getColumnValue(stock, column), column.format)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="vw-card p-4 overflow-auto">
        <h3 className="text-sm font-semibold mb-3">Historical fundamentals</h3>
        <table className="min-w-full">
          <thead>
            <tr>
              {['Year', 'Revenue', 'Gross Profit', 'Operating Income', 'Net Income', 'Free Cash Flow', 'Total Debt', 'Equity'].map(header => (
                <th key={header} className="px-3 py-2 text-xs text-left">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stock.history.map(year => (
              <tr key={year.year} style={{ borderTop: '1px solid var(--vw-border)' }}>
                <td className="px-3 py-2 font-mono text-sm">{year.year}</td>
                <td className="px-3 py-2 font-mono text-sm">{formatFundraValue(year.revenue, 'money')}</td>
                <td className="px-3 py-2 font-mono text-sm">{formatFundraValue(year.grossProfit, 'money')}</td>
                <td className="px-3 py-2 font-mono text-sm">{formatFundraValue(year.operatingIncome, 'money')}</td>
                <td className="px-3 py-2 font-mono text-sm">{formatFundraValue(year.netIncome, 'money')}</td>
                <td className="px-3 py-2 font-mono text-sm">{formatFundraValue(year.freeCashFlow, 'money')}</td>
                <td className="px-3 py-2 font-mono text-sm">{formatFundraValue(year.totalDebt, 'money')}</td>
                <td className="px-3 py-2 font-mono text-sm">{formatFundraValue(year.totalEquity, 'money')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run:

```bash
rtk proxy npm run lint
rtk proxy npm run build
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
rtk proxy git add src/fundra/components/StockDetail.tsx
rtk proxy git commit -m "feat: add Fundra stock detail page"
```

---

## Task 10: Add GitHub Data Refresh Workflow

**Files:**
- Create: `.github/workflows/fundra-data.yml`

- [ ] **Step 1: Create workflow**

Create `.github/workflows/fundra-data.yml`:

```yaml
name: Refresh Fundra static data

on:
  workflow_dispatch:
  schedule:
    - cron: "0 9 * * 1"

permissions:
  contents: write

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run fundra:data
        env:
          FMP_API_KEY: ${{ secrets.FMP_API_KEY }}
          FINNHUB_API_KEY: ${{ secrets.FINNHUB_API_KEY }}
      - run: npm run lint
      - run: npm run build
      - name: Commit updated data
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add public/data/fundra
          git diff --cached --quiet || git commit -m "chore: refresh Fundra static data"
          git push
```

- [ ] **Step 2: Document required secrets**

Add a short section to `PROJECT.md`:

```md
## Static Data Refresh

Fundra reads static JSON from `public/data/fundra` at runtime. To refresh the data in GitHub Actions, configure repository secrets:

- `FMP_API_KEY`
- `FINNHUB_API_KEY`

The workflow can be run manually from GitHub Actions and also runs weekly.
```

- [ ] **Step 3: Commit**

```bash
rtk proxy git add .github/workflows/fundra-data.yml PROJECT.md
rtk proxy git commit -m "ci: refresh Fundra static data"
```

---

## Task 11: Remove Old Navigation And Dead Imports

**Files:**
- Modify: `src/App.tsx`
- Delete only after confirmation: old feature folders not imported by Fundra

- [ ] **Step 1: Check old modules are not imported**

Run:

```bash
rtk proxy rg "dcf|ddm|tech-analysis|news-sentiment|market-cycle|earnings-estimates|insider-institutional|dividend-analysis|peer-analysis|quality-analysis|multiples-analysis|three-statement" src/App.tsx src/fundra
```

Expected: no imports from old modules in `src/App.tsx` or `src/fundra`.

- [ ] **Step 2: Verify Vite ignores unused source folders**

Run:

```bash
rtk proxy npm run build
```

Expected: build passes even if old folders remain because they are not imported.

- [ ] **Step 3: Ask user before deleting old folders**

Stop here and ask:

```text
Fundra builds without the old ValuWise modules. Do you want to delete the unused module folders now, or keep them in the repo for reference until the new screener is complete?
```

- [ ] **Step 4: If approved, delete old folders with PowerShell**

Only if user explicitly approves deletion, run:

```bash
rtk proxy powershell -NoProfile -Command "Remove-Item -Recurse -Force src\\dcf,src\\ddm,src\\tech-analysis,src\\news-sentiment,src\\market-cycle,src\\earnings-estimates,src\\insider-institutional,src\\dividend-analysis,src\\peer-analysis,src\\quality-analysis,src\\multiples-analysis,src\\three-statement"
```

- [ ] **Step 5: Verify build after deletion**

Run:

```bash
rtk proxy npm run lint
rtk proxy npm run build
```

Expected: both pass.

- [ ] **Step 6: Commit**

If old folders are kept:

```bash
rtk proxy git add src/App.tsx
rtk proxy git commit -m "refactor: detach Fundra from legacy modules"
```

If old folders are deleted:

```bash
rtk proxy git add -A src
rtk proxy git commit -m "refactor: remove legacy ValuWise modules"
```

---

## Task 12: Final Verification

**Files:**
- Modify as needed only if verification reveals issues.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
rtk proxy npm run test:fundra
rtk proxy npm run test:fundra:ui
rtk proxy npm run lint
rtk proxy npm run build
```

Expected: all pass.

- [ ] **Step 2: Start the app**

Run:

```bash
rtk proxy npm run dev
```

Expected: Vite starts on port 3000.

- [ ] **Step 3: Manual browser verification**

Open:

```text
http://localhost:3000
```

Verify:

- Header says Fundra.
- Main page shows the screener table.
- Search filters by ticker and company name.
- Sector dropdown filters rows.
- Clicking column headers sorts ascending and descending.
- Clicking a stock row opens the detail page.
- Back button returns to the screener.
- Missing metric values display as `-`.
- No public page requires API keys.

- [ ] **Step 4: Check for remaining user-facing ValuWise labels**

Run:

```bash
rtk proxy rg "ValuWise|valuwise" .
```

Expected: no user-facing references remain. It is acceptable if the only remaining matches are old commit messages or intentionally retained legacy module comments.

- [ ] **Step 5: Commit final fixes**

```bash
rtk proxy git add -A
rtk proxy git commit -m "chore: finalize Fundra screener rebuild"
```

---

## Self-Review

- Spec coverage: The plan covers the rename to Fundra, table-first fundamental/value screener, local/static JSON data, detail page on row click, and API-limit avoidance by moving calls into a generator and GitHub workflow.
- Placeholder scan: No task uses unfinished placeholder wording. The only conditional task is explicit user approval before deleting legacy folders.
- Type consistency: `FundraManifest`, `FundraStockRecord`, `FundraColumn`, `FUNDRA_COLUMNS`, and data loader signatures are defined before use.
- Scope check: The rebuild is large but coherent. It is split into independently testable tasks: branding, schema, generator, loader, app shell, table, detail page, workflow, cleanup, verification.
