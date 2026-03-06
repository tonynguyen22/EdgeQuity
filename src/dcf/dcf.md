# `src/dcf/` — DCF Valuation Module

This folder is the **main entry point** for ValuWise. It was refactored from a single 2,100-line `dcf.tsx` monolith into a modular structure with separated concerns: a pure calculation engine, a data-fetching hook, formatting utilities, export utilities, and focused UI components — all orchestrated by a slim `index.tsx` app shell.

---

## Folder Structure

```
src/dcf/
├── index.tsx                    # App shell — state, routing, chart JSX
├── dcf.md                       # This document
├── types.ts                     # All TypeScript interfaces & types
├── calculations.ts              # Pure computeDCF() engine (no React deps)
├── hooks/
│   └── useDCFData.ts            # Finnhub data fetching + localStorage caching
├── utils/
│   ├── formatters.ts            # parseNum, formatCurrency, formatPct, …
│   ├── storage.ts               # safeSetItem, clearAllCache
│   ├── print.ts                 # printDCF() → browser print/PDF dialog
│   └── excel.ts                 # exportToExcel() → .xlsx file download
└── components/
    ├── Sidebar.tsx              # Sticky left nav with grouped tab links
    ├── LandingPage.tsx          # Hero landing page with 9 feature cards
    ├── AssumptionSliders.tsx    # 12 DCF input sliders + scenario presets
    ├── ForecastTable.tsx        # N-year projection table + export buttons
    └── HistoricalTables.tsx     # Historical income / balance / cash flow tables
```

---

## Data Flow

```
User enters ticker
  → useDCFData(ticker)         Fetches Finnhub APIs, caches result for 24 h
  → computeDCF(data, inputs)   Pure calculation → DCFResult
  → index.tsx useMemo          Re-runs on any slider input change
  → React components           Render charts, tables, sliders
```

---

## File Reference

### `index.tsx` — App Shell

The root component exported to `src/main.tsx`. Manages all application state, routes between tabs, and renders the DCF view.

**State** (3 grouped objects replacing 22+ individual hooks):
- `appState` — `{ tickerInput, ticker, showLanding, activeTab, cacheCleared }`
- `dcfInputs` — 12 slider values (`revGrowthStart`, `revGrowthEnd`, `ebitMarginStart`, `ebitMarginEnd`, `termGrowth`, `waccAdj`, `erp`, `dnaMarginProj`, `wcMarginProj`, `capexMarginProj`, `sharesGrowthProj`, `forecastYears`)
- `uiState` — `{ formatUnit: 'M' | 'B', hiddenSeries: Record<string, boolean> }`

**Handlers:**
- `handleSearch` — validates and sets the active ticker
- `handleGoBack` — resets ticker and calls `reset()` from the data hook
- `handleTabChange` — switches the active tab
- `handleClearCache` — calls `clearAllCache()` and flags the UI
- `handleLegendClick` — toggles chart series visibility (`hiddenSeries`)
- `applyScenario(type)` — patches `dcfInputs` with Bear/Base/Bull presets
- `handleInputChange(patch)` — partial-updates `dcfInputs`

**Derived memos:**
- `dcf` — `computeDCF(data, dcfInputs)` (null when no ticker loaded)
- `activeScenario` — Bear/Base/Bull/Custom label based on current inputs
- `scenarioComparison` — runs `computeDCF` for all 3 scenarios
- `bridgeData` — valuation bridge breakdown (PV FCFFs → TV → EV → equity → per share)
- `reverseDcf` — implied terminal growth rate at current market price

**Auto-fill `useEffect`:** when a ticker first loads, populates sliders with historical metrics (5yr CAGR → `revGrowthStart`, 3yr CAGR → `revGrowthEnd`, trailing EBIT margin → both margin sliders, etc.).

**Chart JSX (inline in `index.tsx`):** FCFF bar chart, historical margin/revenue charts, capital allocation chart, valuation bridge chart, sensitivity matrix, scenario comparison table.

**Sibling tab imports** use `'../CompAnalysis'` etc. (relative to `src/dcf/`).

---

### `types.ts` — TypeScript Interfaces

All shared types for the DCF module.

| Type / Interface | Description |
|---|---|
| `TabId` | Union of 10 tab identifiers |
| `FormatUnit` | `'M' \| 'B'` for currency display |
| `ScenarioType` | `'bull' \| 'base' \| 'bear' \| 'custom'` |
| `DCFInputs` | 12 slider input parameters |
| `HistoricalYear` | 60+ per-year financial metrics |
| `ProjectionYear` | 10 per-year forecast metrics (revenue, FCFF, discount factor, etc.) |
| `DCFResult` | Complete valuation output including sensitivity matrix |
| `ScenarioResult` | Implied price + upside for one scenario |
| `ScenarioComparison` | `{ bear, base, bull: ScenarioResult }` |
| `BridgeItem` | One row in the valuation bridge |
| `AnalystTarget` | `{ mean, high, low }` analyst price targets |
| `FinancialData` | `{ financials, profile, metrics }` raw Finnhub response |

---

### `calculations.ts` — Pure DCF Engine

No React imports. All exports are pure functions safe for unit testing.

**Exports:**
- `findConcept(section, concepts)` — searches an XBRL section for the first matching concept key
- `findConceptByLabel(section, keywords)` — fallback search by label string
- `REV_CONCEPTS` — ordered revenue XBRL fallback array (us-gaap + ifrs-full variants)
- `computeDCF(data: FinancialData, inputs: DCFInputs): DCFResult`

**`computeDCF` logic:**
1. Extracts 5–6 years of historical data from XBRL reports
2. Applies EBIT fallback chain: `OperatingIncomeLoss` → `EBT+IntExp-IntInc` → `GrossProfit-SGA-RD`
3. Computes WACC using CAPM (`beta × ERP + risk-free`) + after-tax debt cost
4. Projects N-year revenue/EBIT/FCFF with linearly tapering growth rates
5. Calculates terminal value via Gordon Growth Model
6. Builds 5×5 sensitivity matrix (Terminal Growth % vs WACC adjustment)
7. Returns intrinsic value per share and upside/downside %

---

### `hooks/useDCFData.ts` — Data Fetching Hook

```typescript
useDCFData(symbol: string): {
  data: FinancialData | null;
  loading: boolean;
  error: string | null;
  analystTarget: AnalystTarget | null;
  refetch: () => void;
  reset: () => void;
}
```

**Fetches (Finnhub free tier):**
- `/stock/financials-reported` — XBRL-reported income, balance, cash flow
- `/stock/profile2` — company name, industry, country
- `/stock/metric` — beta, EPS, dividend yield, etc.
- `/stock/price-target` — analyst consensus targets

**Caching:** 24-hour TTL in localStorage, key `finnhub_{symbol}_financials_v2`. Uses `safeSetItem` for quota safety.

**API key:** `process.env.FINNHUB_API_KEY` — injected by Vite `define` from `.env`.

**`reset()`** sets `data` to `null`, allowing `handleGoBack` to clear results without triggering a new fetch.

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
- **`clearAllCache()`** — removes all keys starting with: `finnhub_`, `valuwise_`, `tech_`, `earnings_`, `insider_`, `news_`, `dividend_`, `portfolio_`, `edgar_`. Reloads the page after clearing.

---

### `utils/print.ts` — Print / PDF Export

```typescript
printDCF(args: PrintDCFArgs): void
```

Generates a complete self-contained HTML document in a new browser window containing:
- Header (ValuWise logo, ticker, scenario label, date, model type)
- 3-card summary (intrinsic value, market price, upside %)
- Key assumptions table (all 12 slider values)
- Scenario comparison table (Bear / Base / Bull implied prices and upside)
- N-year forecast model table (last 3 historical + all projected years)
- Valuation bridge (PV FCFFs → Terminal Value → Enterprise Value → Equity → Per Share)
- 5×5 sensitivity matrix with green/red color coding
- Disclaimer footer

Triggers `window.print()` automatically via an inline script.

---

### `utils/excel.ts` — Excel Export

```typescript
exportToExcel(data: FinancialData, ticker: string): void
```

Uses the `xlsx` library to produce `{ticker}_Financials.xlsx` with 3 sheets:
- **Income Statement** — Revenue, COGS, Gross Profit, Operating Expenses, Operating Income, Net Income
- **Balance Sheet** — Cash, Receivables, Inventory, Assets, Payables, Liabilities, Equity
- **Cash Flow** — Net Income, D&A, Operating CF, CapEx, Investing CF, Financing CF

XBRL concept extraction uses `findConcept` imported from `calculations.ts` (no duplication).

---

### `components/Sidebar.tsx`

```typescript
interface SidebarProps {
  showLanding: boolean;
  activeTab: TabId;
  cacheCleared: boolean;
  onShowLanding: () => void;
  onTabChange: (tab: TabId) => void;
  onClearCache: () => void;
}
```

Sticky `w-52` left sidebar. Logo at top. Nav links grouped into:
- **Valuation** — DCF, Comp Analysis, Company Grade
- **Market Data** — Technical, Earnings, Insider/Inst., News
- **Tools** — Portfolio, Dividends, Edgar

Clear Cache button at the bottom.

---

### `components/LandingPage.tsx`

```typescript
interface LandingPageProps {
  onTabChange: (tab: TabId) => void;
}
```

Near-static hero page shown before a ticker is searched. Displays title, subtitle, and 9 feature cards in a 3-column grid — one per analysis tab. Cards link to tabs via `onTabChange`.

---

### `components/AssumptionSliders.tsx`

```typescript
interface AssumptionSlidersProps {
  inputs: DCFInputs;
  dcf: DCFResult;
  activeScenario: ScenarioType;
  onInputChange: (patch: Partial<DCFInputs>) => void;
  onApplyScenario: (type: ScenarioType) => void;
  onNewSearch: () => void;
}
```

Left-column panel with all 12 DCF input sliders. Bear / Base / Bull scenario preset buttons auto-fill all sliders at once. `onInputChange` accepts a partial patch, keeping unrelated inputs unchanged.

---

### `components/ForecastTable.tsx`

```typescript
interface ForecastTableProps {
  dcf: DCFResult;
  formatUnit: FormatUnit;
  forecastYears: number;
  onFormatUnitChange: (unit: FormatUnit) => void;
  onPrint: () => void;
  onExport: () => void;
}
```

Tabular-nums formatted N-year projection table (Revenue, EBIT, D&A, CapEx, Tax, UFCF, Discount Factor, PV of UFCF). Header includes M/B toggle, Print button, and Excel export button.

---

### `components/HistoricalTables.tsx`

```typescript
interface HistoricalTablesProps {
  dcf: DCFResult;
  formatUnit: FormatUnit;
}
```

Purely presentational. Renders 3 tables from `dcf.historicalSummary`:
- Income Statement (Revenue through EPS)
- Balance Sheet (Assets, Liabilities, Debt, Equity, Cash, Working Capital)
- Cash Flow Statement (CFO, CFI, CFF, CapEx, Change in Cash)

---

## Import Dependency Graph

```
src/main.tsx → dcf/index.tsx
  ├── types.ts                (leaf — no imports)
  ├── calculations.ts         → types, utils/formatters
  ├── hooks/useDCFData.ts     → types, utils/storage
  ├── utils/formatters.ts     (leaf)
  ├── utils/storage.ts        (leaf)
  ├── utils/print.ts          → types
  ├── utils/excel.ts          → utils/formatters, calculations
  └── components/*            → types, utils/formatters
```

No circular dependencies.

---

## Environment Variables

| Variable | Used In | Source |
|---|---|---|
| `FINNHUB_API_KEY` | `hooks/useDCFData.ts` | `.env` → Vite `define` block |
| `GEMINI_API_KEY` | `src/NewsSentiment.tsx` | `.env` → Vite `define` block |

Both are injected at build time via `vite.config.ts`:
```typescript
define: {
  'process.env.FINNHUB_API_KEY': JSON.stringify(env.FINNHUB_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
```

---

## DCF Model Features

| Feature | Description |
|---|---|
| Intrinsic valuation | UFCF discounted at WACC + Gordon Growth terminal value |
| WACC | CAPM (beta × ERP + risk-free rate) + after-tax debt cost |
| EBIT fallback | `OperatingIncomeLoss` → `EBT+IntExp-IntInc` → `GrossProfit-SGA-RD` |
| Scenario presets | Bear / Base / Bull auto-fill all 12 sliders |
| Sensitivity matrix | 5×5 grid of implied share price vs Terminal Growth % and WACC |
| Reverse DCF | Solves for implied terminal growth at current market price |
| Valuation bridge | PV FCFFs + Terminal Value = EV → Equity → Per Share |
| Charts | FCFF, margins, revenue/EBIT, capital allocation — all with legend click isolation |
| Print/PDF | Full-page report with all outputs, auto-triggers browser print dialog |
| Excel export | 3-sheet `.xlsx` with 5–6 years of historical financials |
