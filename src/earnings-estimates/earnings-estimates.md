# Earnings Estimates Module

## Overview
Displays historical EPS results vs. consensus estimates, beat/miss statistics, EPS momentum trend, and an earnings quality score. Data sourced from Alpha Vantage. Supports a **Quarterly / Annual tab toggle**:
- **Quarterly**: Last 20 quarters — actual vs. estimated EPS, surprise %, beat/miss result, quality score
- **Annual**: Last 5 fiscal years — reported EPS only (no estimate data available), annual momentum trend

## File Structure
```
src/earnings-estimates/
├── index.tsx                        # Main component — search, view state, tab switcher, composition
├── types.ts                         # TypeScript types (EarningsView, AnnualEarningsRecord, EarningsRecord, EpsMomentum, QualityScore)
├── calculations.ts                  # Pure functions (computeEpsMomentum, computeAnnualMomentum, computeQualityScore)
├── earnings-estimates.md            # This file
├── components/
│   ├── BeatMissSummary.tsx          # 3-card grid: Beats / Misses / Beat Rate % (quarterly only)
│   ├── MomentumQuality.tsx          # Momentum card(s) + Earnings Quality card (view-aware)
│   └── EarningsTable.tsx            # EPS history table — 6 columns quarterly, 2 columns annual
├── hooks/
│   └── useEarningsData.ts           # Fetch, cache (TTL 24h), returns { quarterly, annual }
└── utils/
    ├── storage.ts                   # safeSetItem() with QuotaExceededError eviction
    └── formatters.ts                # fmtQuarter() + fmtYear()
```

## Data Source
| Source | Endpoint | Data |
|--------|----------|------|
| Alpha Vantage | `GET /query?function=EARNINGS&symbol={sym}` | `quarterlyEarnings` (up to 100 quarters) + `annualEarnings` (up to 30 years) |

Alpha Vantage quarterly fields: `fiscalDateEnding`, `reportedEPS`, `estimatedEPS`, `surprise`, `surprisePercentage`.
Annual fields: `fiscalDateEnding`, `reportedEPS` only (no estimate/surprise).
Missing values are returned as the string `"None"` and parsed to `null`.

## Cache
- Key: `earnings_{symbol}_v5`
- TTL: 24 hours
- Shape: `{ ts: number, d: { quarterly: EarningsRecord[], annual: AnnualEarningsRecord[] } }`
- Validates that `d.quarterly` is a non-empty array before reusing from cache.

## Types (`types.ts`)

### `EarningsView`
`'quarterly' | 'annual'` — controls which tab is active.

### `AnnualEarningsRecord`
```typescript
{ fiscalYear: string; reportedEPS: number | null }
```

### `EarningsRecord`
```typescript
{ actual, estimate, period, quarter, surprise, surprisePercent, symbol, year }
```
Mapped from Alpha Vantage quarterly fields. `period` = `fiscalDateEnding` ISO string; `quarter` and `year` derived from it.

### `EpsMomentum`
```typescript
{ recentAvg: number; priorAvg: number; delta: number; trend: 'Accelerating' | 'Stable' | 'Decelerating' }
```

### `QualityScore`
```typescript
{ score: number; label: string; avgSurprise: number; beatRate: number }
```

## Key Calculations (`calculations.ts`)

### `computeEpsMomentum(history: EarningsRecord[])`
Quarterly mode. Computes YoY EPS growth for quarters 0, 1, and 2 (each vs. the same quarter 4 periods prior). Compares the average of the two most recent YoY figures to the average of the prior two. Delta > 3pp = Accelerating; < -3pp = Decelerating; else Stable. Returns `null` if fewer than 4 records or missing actuals (requires 8+ records for full calculation).

### `computeAnnualMomentum(annual: AnnualEarningsRecord[])`
Annual mode. Computes YoY EPS growth between consecutive years (newest-first). `recentAvg` = avg(yoy[0], yoy[1]); `priorAvg` = avg(yoy[1], yoy[2]); same delta/trend logic as quarterly momentum. Returns `null` if fewer than 4 years.

### `computeQualityScore(history: EarningsRecord[])`
Quarterly only (requires estimate data). Scores 0–100:
- 60% weight on beat rate (% of quarters beating by > 0.5%)
- 40% weight on average surprise magnitude (clamped to ±20%)
- Base offset of 40

Label thresholds: ≥70 → High Quality, ≥45 → Average, <45 → Low Quality.

## Views

### Quarterly (default)
- `BeatMissSummary`: total beats, misses, beat rate %
- `MomentumQuality`: `epsMomentum` card + `qualityScore` card (2-col grid)
- `EarningsTable`: 6 columns — Period (Q# YYYY), Actual EPS, Estimate, Surprise, Surprise %, Result badge

### Annual
- `MomentumQuality`: `annualMomentum` card only (1-col, labeled "Annual EPS Momentum")
- `EarningsTable`: 2 columns — Fiscal Year, Reported EPS

View resets to `'quarterly'` on each new ticker search.

## Beat/Miss Definition
- **Beat:** surprisePercent > +0.5%
- **Miss:** surprisePercent < -0.5%
- **In-line:** |surprisePercent| ≤ 0.5%
