# `src/peer-analysis/` — Peer Analysis Module

This folder was refactored from a single 967-line `CompAnalysis.tsx` monolith into a modular structure with separated concerns: a pure calculation engine, a data-fetching hook, formatting utilities, export utilities, and focused UI components — all orchestrated by a slim `index.tsx` app shell.

---

## Folder Structure

```
src/peer-analysis/
├── index.tsx                    # App shell — state, derived memos, component orchestration
├── peer-analysis.md             # This document
├── types.ts                     # All TypeScript interfaces & types
├── calculations.ts              # Pure calculation functions (no React deps)
├── hooks/
│   └── usePeerData.ts           # Finnhub data fetching + localStorage caching + state
├── utils/
│   ├── formatters.ts            # formatCurrency, formatPct, fmtX
│   ├── storage.ts               # safeSetItem (localStorage quota safety)
│   └── excel.ts                 # exportToExcel() → .xlsx file download
└── components/
    ├── PeerControls.tsx          # Search form, peer finder panel, selected tags, about hint
    ├── ComparisonTable.tsx       # Main comparison table + SortTh + Sparkline + stats rows
    ├── ImpliedValuation.tsx      # Football-field implied price chart
    ├── EvEbitdaTrend.tsx         # EV/EBITDA multi-line history chart
    ├── PeerRanking.tsx           # Relative bar ranking (4 metrics)
    ├── RadarScore.tsx            # Radar chart + composite relative value score
    └── BubbleChart.tsx           # Valuation vs Growth scatter/bubble chart
```

---

## Data Flow

```
User enters ticker + selects peers
  → usePeerData()              Manages all state; fetches Finnhub APIs, caches 24h
  → calculations.ts            Pure functions compute stats, percentiles, radar, rankings
  → index.tsx useMemo           Re-runs derived data on state changes
  → React components            Render table, charts, football field
```

---

## File Reference

### `index.tsx` — App Shell

Slim orchestrator (~140 lines). Imports the `usePeerData` hook, computes all derived values via `useMemo` + pure functions from `calculations.ts`, and renders the 7 components.

**Derived memos:**
- `stats` — `computeAllStats(data, selectedPeers)`
- `displayData` — sorted table data (target always index 0)
- `impliedPrices` — implied share price from 6 peer median multiples
- `targetPercentiles` — percentile ranking of target vs all peers
- `compositeScore` — average of all percentile rankings (0–100)
- `radarScores` — radar chart data points
- `rankingData` — relative bar ranking for 4 metrics
- `bubbleData` — scatter chart data points
- `multiHistData` — 3-year EV/EBITDA history across all companies

---

### `types.ts` — TypeScript Interfaces

| Type / Interface | Description |
|---|---|
| `PeerSuggestion` | `{ symbol, name, isUS }` from Finnhub peer endpoint |
| `HistEvEbitda` | `{ year, evEbitda }` for sparkline & trend chart |
| `PeerData` | 22-field result from `fetchStockData()` |
| `StatsResult` | `{ mean, median, p25, p75 }` |
| `AllStats` | Map of 14 metric keys → `StatsResult` |
| `ImpliedPrice` | `{ label, price }` for football field |
| `TargetPercentiles` | 8 percentile values for target stock |
| `RadarScorePoint` | `{ subject, target, median }` for radar chart |
| `RankingRow` | `{ symbol, value, isTarget }` for bar ranking |
| `RankingData` | 4 metric keys → `RankingRow[]` |
| `BubblePoint` | `{ x, y, z, symbol, isTarget }` for scatter chart |

---

### `calculations.ts` — Pure Calculation Engine

No React imports. All exports are pure functions.

| Function | Description |
|---|---|
| `calcStats(data, selected, key)` | Percentile statistics for one metric |
| `computeAllStats(data, selected)` | All 14 metric stats in one call |
| `getHeatmapColor(val, key, data)` | RGBA green gradient for table cells |
| `computeImpliedPrices(data, stats)` | 6 implied share prices from peer medians |
| `computeTargetPercentiles(data)` | Target's rank across 8 metrics |
| `computeCompositeScore(percentiles)` | Average percentile (0–100) |
| `computeRadarScores(pct, data, stats)` | Radar chart data |
| `computeRankingData(data)` | Sorted rankings for 4 metrics |
| `computeBubbleData(data)` | Scatter chart points |
| `computeMultiHistData(data)` | Multi-line EV/EBITDA history |
| `computeDisplayData(data, sort, dir)` | Sort peers, keep target at index 0 |
| `ordinal(n)` | `1st`, `2nd`, `3rd`, etc. |

---

### `hooks/usePeerData.ts` — Data Fetching Hook

Custom hook managing all peer analysis state and API calls.

**State managed:** `tickerInput`, `ticker`, `showPeerFinder`, `peerFinderLoading`, `peerSuggestions`, `selectedPeerSymbols`, `customPeerInput`, `loading`, `error`, `data`, `selectedPeers`, `sortKey`, `sortDir`, `hiddenSeries`.

**Fetches (Finnhub free tier):**
- `/stock/financials-reported` — XBRL-reported income, balance, cash flow
- `/stock/profile2` — company name, industry, country
- `/stock/metric` — beta, EPS, dividend yield, etc.
- `/stock/peers` — suggested industry peers

**Caching:** 24-hour TTL in localStorage, key `finnhub_{symbol}_comp_data_v5`.

---

### Utils

| File | Exports |
|---|---|
| `formatters.ts` | `formatCurrency`, `formatPct`, `fmtX` |
| `storage.ts` | `safeSetItem` (localStorage quota handling) |
| `excel.ts` | `exportToExcel(data, stats, ticker)` → `.xlsx` download |

---

### Components

| Component | Lines | Description |
|---|---|---|
| `PeerControls.tsx` | ~170 | Search form, peer finder panel, peer tags, about hint, error |
| `ComparisonTable.tsx` | ~160 | Full table with SortTh, Sparkline, stats rows, percentile row |
| `ImpliedValuation.tsx` | ~55 | Football-field implied price bars |
| `EvEbitdaTrend.tsx` | ~40 | Multi-line EV/EBITDA history chart |
| `PeerRanking.tsx` | ~55 | Relative bar ranking for 4 metrics |
| `RadarScore.tsx` | ~55 | Radar chart + composite value score card |
| `BubbleChart.tsx` | ~55 | Valuation vs growth scatter chart |

---

## Import Dependency Graph

```
src/dcf/index.tsx → peer-analysis/index.tsx
  ├── types.ts                (leaf — no imports)
  ├── calculations.ts         → types
  ├── hooks/usePeerData.ts    → types, utils/storage
  ├── utils/formatters.ts     (leaf)
  ├── utils/storage.ts        (leaf)
  ├── utils/excel.ts          → types, utils/formatters
  └── components/*            → types, utils/formatters, calculations
```

No circular dependencies.
