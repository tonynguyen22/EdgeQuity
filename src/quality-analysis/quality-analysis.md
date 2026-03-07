# `src/quality-analysis/` — Quality Analysis Module

Comprehensive financial quality scoring for individual companies. Grades A-D across four weighted categories (Financial Health, Profitability, Growth, Cash Flow Quality) with advanced analytical models — Altman Z-Score, Piotroski F-Score, DuPont decomposition, working capital efficiency, and earnings quality.

**Data Sources:**
- **Financial Statements:** Financial Modeling Prep (FMP) `/stable/` API — income statement, balance sheet, cash flow (3 FMP calls). Standardized field names.
- **Company Profile / Metrics:** Finnhub `/stock/profile2` and `/stock/metric` — company name, market cap (for Altman Z-Score).

**Supported Tickers:** Restricted to the same ~87 pre-selected tickers defined in `SUPPORTED_TICKERS` (dcf/types.ts). Uses a filterable dropdown — free-text entry of unsupported tickers is not allowed.

---

## Folder Structure

```
src/quality-analysis/
├── index.tsx                    # App shell — ticker state, derived memos, renders components
├── quality-analysis.md          # This document
├── types.ts                     # All TypeScript interfaces (leaf — no module imports)
├── calculations.ts              # Pure grading functions (no React deps)
├── hooks/
│   └── useQualityData.ts        # FMP + Finnhub data fetching + localStorage caching
├── utils/
│   ├── formatters.ts            # parseNum helper
│   └── storage.ts               # safeSetItem for quota-safe localStorage
└── components/
    ├── SearchForm.tsx            # SUPPORTED_TICKERS dropdown + About section
    ├── GradeOverview.tsx         # Overall grade circle + 4 category cards with metrics
    ├── RiskFlags.tsx             # Financial risk flag badges
    ├── HistoricalCharts.tsx      # Margin, ratio, and ROE/ROA charts + grade trend
    ├── ScoreOverview.tsx         # Radar chart + YoY grade table + Altman Z-Score
    └── AdvancedMetrics.tsx       # Piotroski + DuPont + Working Capital + Earnings Quality
```

---

## Data Flow

```
User selects ticker from SUPPORTED_TICKERS dropdown
  → useQualityData(ticker)                    Fetches FMP (3 stmts) + Finnhub (profile, metrics)
  → buildHistoricalSummary(data)              Extracts 5yr HistoricalYear[] from raw FMP
  → computeGrades(hist, revCagr3yr)           Multi-year composite grades → GradeResult
  → computeSingleYearGrades(y)                Per-year grades → YearGrade[]
  → computeAltmanZ / computePiotroski / ...   Advanced models
  → React components                          Render grades, charts, tables
```

---

## API Calls per Ticker (5 total)

| # | Source | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | FMP | `/stable/income-statement?period=annual&limit=5` | Revenue, EBIT, margins, EPS, shares |
| 2 | FMP | `/stable/balance-sheet-statement?period=annual&limit=5` | Assets, liabilities, equity, debt |
| 3 | FMP | `/stable/cash-flow-statement?period=annual&limit=5` | CFO, CapEx, FCF |
| 4 | Finnhub | `/stock/profile2` | Company name, marketCapitalization |
| 5 | Finnhub | `/stock/metric?metric=all` | Additional metrics |

**Cache:** Shared cache key `fmp_{symbol}_dcf_v1` (24h TTL). Shared with DCF module — never bump version.

**FMP calls per search: 3** (down from 12-15 in the old monolith which auto-fetched peers).

---

## File Reference

### `types.ts` — TypeScript Interfaces

| Type | Description |
|---|---|
| `LetterGrade` | `'A' \| 'B' \| 'C' \| 'D'` |
| `MetricResult` | Per-metric grade with name, value, trend |
| `CategoryResult` | Category-level grade (4 categories) |
| `GradeResult` | Complete grading output with summary text |
| `YearGrade` | Single-year grade breakdown |
| `AltmanZResult` | Z-score with zone classification |
| `PiotroskiResult` | F-score with 9 pass/fail signals |
| `DuPontYear` | ROE decomposition for one year |
| `WorkingCapitalYear` | DSO, DIO, DPO, CCC for one year |
| `EarningsQualityResult` | Accruals ratio with score and interpretation |
| `HistoricalYear` | Comprehensive per-year financial metrics |
| `QualityData` | Raw FMP + Finnhub data shape |

---

### `calculations.ts` — Pure Grading Engine

No React imports. All exports are pure functions.

**Exports:**
- `buildHistoricalSummary(data)` — Extracts HistoricalYear[] from raw FMP data
- `computeGrades(hist, revCagr3yr)` — Multi-year composite grades (3yr averages)
- `computeSingleYearGrades(y)` — Per-year grade for YoY trend table
- `computeAltmanZ(y, marketCapM)` — Altman Z-Score (safe/grey/distress)
- `computePiotroski(hist)` — Piotroski F-Score (9 binary signals)
- `computeDuPont(hist)` — ROE = Net Margin x Asset Turnover x Equity Multiplier
- `computeWorkingCapital(hist)` — DSO, DIO, DPO, Cash Conversion Cycle
- `computeEarningsQuality(hist)` — Accruals ratio analysis
- `computeRiskFlags(hist)` — Automatic risk flag detection
- `gradeToScore`, `scoreToGrade`, `scoreTo100`, `gradeToScore100` — Grade mappers
- `METRIC_THRESHOLDS` — Human-readable threshold descriptions

**Grading weights:** Financial Health 25%, Profitability 30%, Growth 25%, Cash Flow Quality 20%.

---

### `hooks/useQualityData.ts` — Data Fetching Hook

```typescript
useQualityData(symbol: string): {
  data: QualityData | null;
  loading: boolean;
  error: string;
}
```

Fetches 5 parallel calls (3 FMP + 2 Finnhub). Caches in `fmp_{symbol}_dcf_v1` with 24h TTL. Falls back to cached data on network error.

---

### `index.tsx` — App Shell

~130 lines. Manages ticker state, calls hook, computes all derived memos, renders 6 components.

---

### Components

| Component | Description |
|---|---|
| `SearchForm` | SUPPORTED_TICKERS dropdown, about section, landing state |
| `GradeOverview` | Overall grade circle, progress bar, 4 category cards with per-metric rows |
| `RiskFlags` | Risk flag badges (FCF, leverage, margins, etc.) |
| `HistoricalCharts` | 3 charts (margins, health ratios, ROE/ROA) + grade score trend |
| `ScoreOverview` | Radar chart, YoY grade table, Altman Z-Score |
| `AdvancedMetrics` | Piotroski F-Score, DuPont analysis, Working Capital, Earnings Quality |

---

## Import Dependency Graph

```
quality-analysis/index.tsx
  ├── types.ts                      (leaf)
  ├── calculations.ts               → types, utils/formatters
  ├── hooks/useQualityData.ts       → types, utils/storage
  ├── utils/formatters.ts           (leaf)
  ├── utils/storage.ts              (leaf)
  └── components/*                  → types, calculations
      └── SearchForm.tsx            → dcf/types (SUPPORTED_TICKERS)
```

Cross-module import: `SearchForm.tsx` imports `SUPPORTED_TICKERS` from `dcf/types.ts`.

No circular dependencies.
