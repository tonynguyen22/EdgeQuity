# Multiples Analysis Module

## Overview
Historical valuation multiples analysis for individual stocks. Computes 7 key valuation ratios across up to 6 recent fiscal years (or more in full-history view), displays current vs. historical averages, and produces an overall valuation signal (Undervalued / Fair Value / Overvalued). Data sourced from FMP (financial statements), Finnhub (profile, metrics, candles, series), with a Finnhub-only fallback path.

## File Structure
```
src/multiples-analysis/
├── index.tsx                        # Main component — search, state, legend click, full-history toggle
├── types.ts                         # TypeScript interfaces (MultiplesYear, MultipleStats, MultiplesResult, etc.)
├── calculations.ts                  # Pure functions (computeHistoricalMultiples, computeStats, computeSignal, formatters)
├── multiples-analysis.md            # This file
├── components/
│   ├── SearchForm.tsx              # Landing page search with SUPPORTED_TICKERS dropdown + "What you'll see" hints
│   ├── MultiplesCards.tsx          # 7 metric cards: current value, avg, premium/discount badge
│   ├── MultiplesTable.tsx          # Historical multiples table (years × 7 ratios) with heatmap coloring
│   ├── MultiplesCharts.tsx         # Line charts for each multiple over time + quarterly trend
│   └── ValuationContext.tsx        # Valuation signal card with interpretation and per-multiple breakdown
├── hooks/
│   └── useMultiplesData.ts         # Data fetching (FMP + Finnhub), shared DCF cache, candle prices, state
└── utils/
    └── storage.ts                  # safeSetItem() with QuotaExceededError eviction
```

## Data Flow
1. User selects ticker from SUPPORTED_TICKERS dropdown → `useMultiplesData(ticker)` triggers
2. Checks shared FMP cache (`fmp_{sym}_dcf_v1`) first — reuses if valid (24h TTL)
3. If no cache: fetches FMP financial statements (3 calls) + Finnhub profile/metrics (2 calls) in parallel
4. Fetches 6 years of historical candle prices from Finnhub for point-in-time pricing
5. `computeHistoricalMultiples()` builds yearly multiple snapshots using fiscal-year financials + historical price
6. Computes stats (avg, median, high, low, premium/discount) from most recent 6 years
7. Determines overall `ValuationSignal` from how many multiples are above/below their averages
8. Extracts TTM snapshot metrics from Finnhub `/stock/metric`
9. Builds quarterly trend from Finnhub series data
10. Results rendered across 4 component sections + optional full-history section

## Data Sources
| Source | Endpoint | Data |
|--------|----------|------|
| FMP | `/stable/income-statement?period=annual&limit=6` | Revenue, EBIT, EBITDA, Net Income, EPS, shares |
| FMP | `/stable/balance-sheet-statement?period=annual&limit=6` | Book value, debt, cash |
| FMP | `/stable/cash-flow-statement?period=annual&limit=6` | Operating cash flow, CapEx, FCF |
| Finnhub | `/stock/profile2` | Company name, industry, market cap, shares |
| Finnhub | `/stock/metric?metric=all` | TTM multiples (P/E, P/S, P/B, EV/EBITDA, etc.), series data |
| Finnhub | `/stock/candle?resolution=D` | 6 years of daily prices for historical multiple computation |

## Cache
- **FMP data:** Shared cache key `fmp_{symbol}_dcf_v1` (24h TTL) — shared with DCF and Quality Analysis. NEVER bump version.
- **Candle data:** `multiples_{symbol}_candle_v1` (24h TTL)

## Valuation Multiples
| Key | Label | Formula |
|-----|-------|---------|
| `pe` | P/E | Market Cap ÷ Net Income |
| `evEbitda` | EV/EBITDA | Enterprise Value ÷ EBITDA |
| `evRevenue` | EV/Revenue | Enterprise Value ÷ Revenue |
| `evEbit` | EV/EBIT | Enterprise Value ÷ Operating Income |
| `pb` | P/B | Market Cap ÷ Book Value |
| `ps` | P/S | Market Cap ÷ Revenue |
| `pfcf` | P/FCF | Market Cap ÷ Free Cash Flow |

All multiples exclude negative values (returns `null` if denominator ≤ 0).

## Key Calculations (`calculations.ts`)

### `computeHistoricalMultiples(data)`
Main entry. Builds `MultiplesYear[]` from FMP statements + historical candle prices. Falls back to Finnhub `series.annual` if FMP data is unavailable. Computes stats from most recent 6 years, determines valuation signal.

### `computeStats(years)`
For each of the 7 multiples: average, median, high, low, and premium/discount vs. average (%).

### `computeSignal(stats)`
- **Undervalued:** ≥50% of multiples are >10% below their average
- **Overvalued:** ≥50% of multiples are >10% above their average
- **Fair Value:** Otherwise

### `buildQuarterlyTrend(series)`
Extracts quarterly trend data from Finnhub metric series for P/E, EV/EBITDA, EV/Revenue, P/S, P/B, P/FCF.

### `extractCurrentMetrics(metrics)`
Extracts TTM snapshot values from Finnhub metric object: P/E TTM, Forward P/E, P/S TTM, P/B Quarterly, EV/EBITDA TTM, EV/Revenue TTM, P/FCF TTM, P/CF TTM.

## Types (`types.ts`)

| Type | Description |
|------|-------------|
| `MultiplesYear` | Per-year snapshot: price, market cap, EV, 7 multiples |
| `MultipleKey` | Union of 7 multiple identifiers |
| `MultipleStats` | Per-multiple stats: current, avg, median, high, low, premium/discount |
| `ValuationSignal` | `'Undervalued' \| 'Fair Value' \| 'Overvalued'` |
| `QuarterlyTrendPoint` | Per-quarter trend snapshot from Finnhub series |
| `CurrentMetrics` | TTM/current snapshot metrics from Finnhub |
| `MultiplesResult` | Full result object with years, stats, signal, company info |
| `MultiplesData` | Raw fetched data shape (FMP + Finnhub) |
| `MULTIPLE_LABELS` | Human-readable labels for each multiple key |
| `MULTIPLE_KEYS` | Ordered array of all 7 multiple keys |

## Components

| Component | Description |
|-----------|-------------|
| `SearchForm` | SUPPORTED_TICKERS autocomplete dropdown with "What you'll see" hints on landing |
| `MultiplesCards` | 7 metric cards showing current value, historical avg, and premium/discount badge (green=below avg, red=above) |
| `MultiplesTable` | Year-by-year table of all 7 multiples with color-coded cells + current TTM row |
| `MultiplesCharts` | Line charts for each multiple over time with legend click isolation, plus quarterly trend chart |
| `ValuationContext` | Overall valuation signal (Undervalued/Fair/Overvalued) with per-multiple assessment breakdown |

## Full Historical Data
When more than 6 years of data are available, a collapsible "Full Historical Data" section shows the complete history with its own table and charts.

## Sidebar
- Tab ID: `multiples`
- Group: Valuation
- Icon: BarChart3 (pink)

## Ticker Restriction
- Only SUPPORTED_TICKERS (~84 stocks) are selectable via dropdown autocomplete
- Imported from `../dcf/types`
