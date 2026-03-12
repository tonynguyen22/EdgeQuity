# `src/dcf/` — DCF Valuation Module

This folder is the **main entry point** for ValuWise. It was refactored from a single monolith into a modular structure with separated concerns: a pure calculation engine, a data-fetching hook, formatting utilities, export utilities, and focused UI components — all orchestrated by a slim `index.tsx` app shell.

**Data Sources:**
- **Financial Statements:** Financial Modeling Prep (FMP) `/stable/` API — income statement, balance sheet, cash flow (3 calls). This provides standardized field names across all companies.
- **Company Profile / Metrics:** Finnhub `/stock/profile2` and `/stock/metric` — company name, industry, beta, market cap, shares outstanding.
- **Analyst Targets:** Finnhub `/stock/price-target` (non-blocking, optional).

**Supported Tickers:** The DCF module is restricted to ~87 pre-selected tickers defined in `SUPPORTED_TICKERS` (types.ts). The search UI uses a filterable dropdown — free-text entry of unsupported tickers is not allowed.

---

## Folder Structure

```
src/dcf/
├── index.tsx                    # App shell — state, routing, chart JSX, sub-tab nav (Model | Financials | WACC | Monte Carlo)
├── dcf.md                       # This document
├── types.ts                     # All TypeScript interfaces & types + SUPPORTED_TICKERS
├── calculations.ts              # Pure computeDCF() engine (no React deps)
├── calculations/
│   └── monte-carlo.ts           # runMonteCarloSimulation() — N triangular-distribution DCF runs
├── hooks/
│   └── useDCFData.ts            # FMP + Finnhub data fetching + localStorage caching
├── utils/
│   ├── formatters.ts            # parseNum, formatCurrency, formatPct, …
│   ├── storage.ts               # safeSetItem, clearAllCache
│   ├── print.ts                 # printDCF() → browser print/PDF dialog
│   └── excel.ts                 # exportToExcel() → .xlsx file download
└── components/
    ├── Sidebar.tsx              # Sticky left nav — Analysis + Market Data groups
    ├── LandingPage.tsx          # Animated hero with market ticker bar, glassmorphism feature cards
    ├── AssumptionSliders.tsx    # 12 DCF input sliders + scenario presets
    ├── ForecastTable.tsx        # N-year projection table + export buttons
    ├── HistoricalTables.tsx     # Historical income / balance / cash flow / ratios tables
    ├── WACCPanel.tsx            # CAPM/WACC assumptions with waterfall decomposition chart
    └── MonteCarloSimulation.tsx # N-simulation histogram + confidence intervals
```

---

## Data Flow

```
User selects ticker from dropdown (SUPPORTED_TICKERS)
  → useDCFData(ticker)         Fetches FMP (3 stmt) + Finnhub (profile, metrics, analyst)
  → computeDCF(data, inputs)   Pure calculation → DCFResult
  → index.tsx useMemo          Re-runs on any slider input change
  → React components           Render charts, tables, sliders
```

---

## API Calls per Ticker (5 total)

| # | Source | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | FMP | `/stable/income-statement?period=annual&limit=5` | Revenue, EBIT, D&A, tax, net income, EPS, shares |
| 2 | FMP | `/stable/balance-sheet-statement?period=annual&limit=5` | Cash, debt, equity, receivables, inventory, payables — full detail |
| 3 | FMP | `/stable/cash-flow-statement?period=annual&limit=5` | CFO, CapEx, FCF, SBC, buybacks, dividends, investing — full detail |
| 4 | Finnhub | `/stock/profile2` | Company name, finnhubIndustry, marketCapitalization, shareOutstanding |
| 5 | Finnhub | `/stock/metric?metric=all` | Beta, additional financial metrics |
| +1 | Finnhub | `/stock/price-target` | Analyst consensus target (non-blocking, optional) |

**API Keys:** All API calls are routed through a Netlify serverless function (`netlify/functions/http-proxy.ts`) which reads keys from `process.env`. Keys are defined in `.env` and injected by `netlify dev`. Use `netlify dev` (not `npm run dev`) for local development.

**FMP Rate Limit:** 250 calls/day on free tier. With `limit=5` and 24h caching, typical usage is well within limits. Each ticker uses 3 FMP calls.

---

## File Reference

### `types.ts` — TypeScript Interfaces

All shared types for the DCF module.

| Type / Interface | Description |
|---|---|
| `TabId` | Union of 10 tab identifiers |
| `FormatUnit` | `'M' \| 'B'` for currency display |
| `ScenarioType` | `'bull' \| 'base' \| 'bear' \| 'custom'` |
| `DCFInputs` | 12 slider input parameters |
| `HistoricalYear` | Per-year financial metrics (expanded — income stmt, balance sheet, cash flow, ratios) |
| `ProjectionYear` | Per-year forecast metrics |
| `DCFResult` | Complete valuation output including sensitivity matrix |
| `ScenarioResult` | Implied price + upside for one scenario |
| `ScenarioComparison` | `{ bear, base, bull: ScenarioResult }` |
| `BridgeItem` | One row in the valuation bridge |
| `AnalystTarget` | `{ mean, high, low }` analyst price targets |
| `FMPIncomeStatement` | Full FMP income statement response (all fields) |
| `FMPBalanceSheet` | Full FMP balance sheet response (all fields) |
| `FMPCashFlow` | Full FMP cash flow response (all fields) |
| `FinancialData` | `{ incomeStatements, balanceSheets, cashFlows, profile, metrics }` |
| `SUPPORTED_TICKERS` | Const array of ~87 allowed ticker symbols |
| `SupportedTicker` | Union type derived from SUPPORTED_TICKERS |

Note: `profile` and `metrics` are typed as `any` since they come from Finnhub (flexible shape).

---

### `calculations.ts` — Pure DCF Engine

No React imports. All exports are pure functions safe for unit testing.

**Key advantage:** FMP provides standardized field names (`revenue`, `operatingIncome`, `depreciationAndAmortization`, etc.) across all companies. No concept-matching or XBRL parsing required.

**Exports:**
- `computeDCF(data: FinancialData, inputs: DCFInputs): DCFResult`

**`computeDCF` logic:**
1. Reads up to 5 years of historical data from FMP income statements, balance sheets, and cash flows
2. Computes historical metrics (margins, ratios, CAGR) via direct field access
3. Gets beta from Finnhub `metrics`, marketCap from Finnhub `profile.marketCapitalization` (in millions, × 1e6)
4. Computes WACC using CAPM (`beta × ERP + risk-free`) + after-tax debt cost
5. Projects N-year revenue/EBIT/FCFF with linearly tapering growth rates
6. Calculates terminal value via Gordon Growth Model
7. Builds 5×5 sensitivity matrix (Terminal Growth % vs WACC adjustment)
8. Returns intrinsic value per share and upside/downside %

**Profile/Market data (Finnhub):**
- Beta: `metrics.beta`
- Market Cap: `profile.marketCapitalization * 1e6` (Finnhub reports in millions)
- Shares: `profile.shareOutstanding * 1e6` (Finnhub reports in millions)
- Industry: `profile.finnhubIndustry` (for financial sector detection)

**Historical field mapping (FMP → calculation):**
- Revenue: `ic.revenue`
- Operating Income (EBIT): `ic.operatingIncome`
- D&A: `ic.depreciationAndAmortization` (fallback: `cf.depreciationAndAmortization`)
- CapEx: `Math.abs(cf.capitalExpenditure)` (FMP reports as negative)
- Tax: `ic.incomeTaxExpense`
- Interest Expense: `Math.abs(ic.interestExpense)`
- Cash: `bs.cashAndCashEquivalents`
- Total Debt: `bs.totalDebt` (fallback: `bs.shortTermDebt + bs.longTermDebt`)
- Working Capital: `bs.netReceivables + bs.inventory - bs.accountPayables`
- Shares: `ic.weightedAverageShsOut`

---

### `hooks/useDCFData.ts` — Data Fetching Hook

```typescript
useDCFData(symbol: string): {
  data: FinancialData | null;
  loading: boolean;
  error: string;
  analystTarget: AnalystTarget | null;
  refetch: () => void;
  reset: () => void;
}
```

**Fetches (5 parallel calls):**
- FMP `/stable/income-statement` (5 years)
- FMP `/stable/balance-sheet-statement` (5 years)
- FMP `/stable/cash-flow-statement` (5 years)
- Finnhub `/stock/profile2` (company name, mktCap, shares, industry)
- Finnhub `/stock/metric?metric=all` (beta, additional metrics)

**Analyst target** (separate non-blocking call): Finnhub `/stock/price-target`

**Caching:** 24-hour TTL in localStorage, key `fmp_{symbol}_dcf_v1`. Uses `safeSetItem` for quota safety.

> **Rule: NEVER bump the cache key version.** Keep it as `v1` permanently. The same cache key is shared with CompanyGrade so both tabs benefit from a single fetch. Bumping the version would orphan cached data across the app.

**`reset()`** sets `data` to `null`, allowing `handleGoBack` to clear results without triggering a new fetch.

---

### `index.tsx` — App Shell

The root component exported to `src/main.tsx`. Manages all application state, routes between tabs, and renders the DCF view. Uses CSS custom properties from the design system (`--vw-bg-deep` background, `--vw-text-primary` text). Content area is `max-w-7xl` with `vw-grid-bg` subtle grid background.

**Ticker Selection:** Uses a filterable dropdown combobox restricted to `SUPPORTED_TICKERS`. Users type to filter, then select a ticker. The Analyze button is disabled unless the input matches a supported ticker.

**State** (3 grouped objects):
- `appState` — `{ tickerInput, ticker, showLanding, activeTab, cacheCleared }`
- `dcfInputs` — 12 slider values
- `uiState` — `{ formatUnit: 'M' | 'B', hiddenSeries: Record<string, boolean> }`

**Auto-fill `useEffect`:** when a ticker first loads, populates sliders with historical metrics (5yr CAGR → `revGrowthStart`, 3yr CAGR → `revGrowthEnd`, trailing EBIT margin → both margin sliders, etc.).

**Chart JSX (inline):** FCFF bar chart, historical margin/revenue charts, capital allocation chart, valuation bridge chart, sensitivity matrix, scenario comparison table.

---

### `utils/formatters.ts` — Number Formatting

| Function | Output Example |
|---|---|
| `parseNum(val)` | Safely parses any value → `number` (0 on null/NaN) |
| `formatCurrency(val)` | `$1.23B` / `$45.6M` / `$1,234` |
| `formatModelCurrency(val, unit)` | `$1.23B` or `$1234.56M` based on toggle |
| `formatModelNumber(val, unit)` | Same but without `$` prefix |
| `formatPct(val)` | `12.34%` (input is decimal, e.g. `0.1234`) |

---

### `utils/storage.ts` — localStorage Helpers

- **`safeSetItem(key, value)`** — wraps `localStorage.setItem`. On `QuotaExceededError`, calls `clearAllCache()` then retries once.
- **`clearAllCache()`** — removes all keys starting with: `finnhub_`, `fmp_`, `valuwise_`, `tech_`, `earnings_`, `insider_`, `news_`, `dividend_`, `edgar_`, `multiples_`. Reloads the page after clearing.

---

### `utils/print.ts` — Print / PDF Export

Generates a complete self-contained HTML document in a new browser window containing all DCF outputs. Data source labeled as "Financial Modeling Prep".

---

### `utils/excel.ts` — Excel Export

```typescript
exportToExcel(data: FinancialData, ticker: string): void
```

Uses the `xlsx` library to produce `{ticker}_Financials.xlsx` with 3 sheets:
- **Income Statement** — Full detail: Revenue, COGS, Gross Profit, R&D, GA, SGA, Operating Expenses, Operating Income, EBIT, D&A, EBITDA, Interest, Tax, Net Income, EPS, Shares
- **Balance Sheet** — Full detail: Cash, Investments, Receivables, Inventory, Current Assets, PP&E, Goodwill, Non-Current Assets, Total Assets, Payables, Debt, Liabilities, Equity, Net Debt
- **Cash Flow** — Full detail: Net Income, D&A, SBC, Working Capital changes, CFO, CapEx, Acquisitions, Investments, CFI, Debt, Buybacks, Dividends, CFF, FCF, Taxes/Interest Paid

---

### `components/HistoricalTables.tsx`

4 comprehensive tables from `dcf.historicalSummary`:
- **Income Statement** — Revenue through EPS with section headers (Revenue, Operating Expenses, Operating Income, Below the Line, Per Share)
- **Balance Sheet** — Full detail with sections (Current Assets, Non-Current Assets, Current Liabilities, Non-Current Liabilities, Equity, Summary)
- **Cash Flow** — Full detail with sections (Operating Activities, Investing Activities, Financing Activities, Summary)
- **Key Ratios** — Liquidity (Current/Quick), Leverage (D/E, Interest Coverage), Profitability (Margins, ROE, ROA, Tax Rate)

---

### `components/Sidebar.tsx`

Sticky `w-56` left sidebar with gradient background (`linear-gradient(180deg, #0d1117, #0a0e17)`). Features:
- **Logo:** Glowing cyan gradient icon + "ValuWise" wordmark with accent color
- **Active state:** Left accent bar (3px, colored per tab) + tinted background
- **Group headers:** Uppercase labels with decorative trailing line dividers
- **Nav sections:** Valuation (DCF, DDM, Multiples), Fundamentals (Quality, 3-Statement, Peers), Market Intelligence (Technical, Earnings, Insider, News), Income & Macro (Dividends, Market Cycle)
- **Bottom:** Clear Cache button + version status indicator with pulsing dot ("v1.0 — Live")
- Hover states use `var(--vw-bg-hover)` and smooth color transitions

---

### `components/LandingPage.tsx`

Animated hero landing page shown when no tab is selected. Uses `motion` library for staggered entry animations. Features:
- **Market ticker bar:** Simulated market indices (S&P 500, NASDAQ, DOW, 10Y Yield, VIX) with green/red trend indicators and micro sparklines
- **Hero section:** Animated gradient orbs background with "Real-Time Analysis" shimmer pill, gradient text title, description, and stats banner (87+ tickers, 12 modules, 6 data sources)
- **Feature grid:** 12 feature cards grouped by category (Valuation, Fundamentals, Market Intelligence, Income & Macro) with responsive grids. Each card has icon, title, description, and animated arrow on hover with per-card accent color
- **Supported tickers notice:** Amber-bordered warning about FMP ticker restrictions

---

### `components/AssumptionSliders.tsx`

Left-column panel with all 12 DCF input sliders. Bear / Base / Bull scenario preset buttons.

---

### `components/ForecastTable.tsx`

N-year projection table with M/B toggle, Print button, and Excel export button.

---

## Import Dependency Graph

```
src/main.tsx → dcf/index.tsx
  ├── types.ts                (leaf — no imports except const exports)
  ├── calculations.ts         → types, utils/formatters
  ├── hooks/useDCFData.ts     → types, utils/storage
  ├── utils/formatters.ts     (leaf)
  ├── utils/storage.ts        (leaf)
  ├── utils/print.ts          → types
  ├── utils/excel.ts          → types
  └── components/*            → types, utils/formatters
```

No circular dependencies.

---

## Environment Variables

All API keys are injected server-side via the Netlify proxy function (`netlify/functions/http-proxy.ts`). They are **never** exposed to the browser. Keys are read from `process.env` which is populated from `.env` by `netlify dev`.

| Variable | Used By Proxy For | Source |
|---|---|---|
| `FMP_API_KEY` | Financial Modeling Prep requests | `.env` → `netlify dev` |
| `FINNHUB_API_KEY` | Finnhub requests (all modules) | `.env` → `netlify dev` |
| `GEMINI_API_KEY` | Gemini AI sentiment analysis | `.env` → `netlify dev` |
| `API_NINJAS_KEY` | API Ninjas (earnings, stock price) | `.env` → `netlify dev` |
| `MASSIVE_API_KEY` | Massive API (dividends) | `.env` → `netlify dev` |
| `TAAPI_API_KEY` | TAAPI.io (technical indicators) | `.env` → `netlify dev` |
| `TWELVE_API_KEY` | Twelve Data (OHLCV fallback) | `.env` → `netlify dev` |
| `ALPHAVANTAGE_API_KEY` | Alpha Vantage (earnings, OHLCV fallback) | `.env` → `netlify dev` |

---

## Supported Tickers

The DCF module only supports a curated list of ~87 tickers. This restriction:
1. Ensures FMP API call budget stays within the 250/day free tier limit (3 FMP calls per ticker)
2. Guarantees standardized financial statement data is available for all tickers
3. Covers major large-cap, mid-cap, and popular retail-investor stocks

The full list is exported as `SUPPORTED_TICKERS` from `types.ts`.

---

## DCF Model Features

| Feature | Description |
|---|---|
| Intrinsic valuation | UFCF discounted at WACC + Gordon Growth terminal value |
| WACC | CAPM (beta × ERP + risk-free rate) + after-tax debt cost |
| Standardized data | FMP provides consistent field names — no XBRL concept matching |
| Hybrid sourcing | FMP for financial statements, Finnhub for profile/beta/market data |
| Scenario presets | Bear / Base / Bull auto-fill sliders; scenario comparison is dynamic (offsets from current inputs) |
| Sensitivity matrix | 5×5 grid of implied share price vs Terminal Growth % and WACC |
| Reverse DCF | Solves for implied terminal growth at current market price |
| Valuation bridge | PV FCFFs + Terminal Value = EV → Equity → Per Share |
| Charts | FCFF, margins, revenue/EBIT — all with legend click isolation |
| Print/PDF | Full-page report with all outputs, auto-triggers browser print dialog |
| Excel export | 3-sheet `.xlsx` with full financial statement detail |
| Historical tables | 4 detailed tables: Income Stmt, Balance Sheet, Cash Flow, Key Ratios |
