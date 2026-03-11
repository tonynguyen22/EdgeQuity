# Dividend Analysis Module

## Overview
Analyzes dividend history, growth trends, yield, payout sustainability, and FCF safety for US-listed dividend-paying stocks. Data is sourced from the Massive API (payment history) and Finnhub (metrics, financials, price).

## File Structure
```
src/dividend-analysis/
├── index.tsx                        # Main component — orchestrates state and sub-components
├── types.ts                         # TypeScript interfaces (DividendPayment, DividendData, SafetyInfo, etc.)
├── calculations.ts                  # Pure calculation functions (CAGR, annual dividend, streak, safety grade)
├── dividend-analysis.md             # This file
├── components/
│   ├── MetricCards.tsx              # Key metric cards (yield, annual div, payout ratios)
│   ├── SafetyScore.tsx              # Safety grade badge (A–D) with icon and description
│   ├── GrowthSection.tsx            # Consecutive growth streak badge + CAGR grid
│   └── PaymentHistory.tsx           # Dividend payment history table (last 10 of up to 40)
├── hooks/
│   └── useDividendData.ts           # Data fetching, caching (TTL 6h), and state management
└── utils/
    ├── storage.ts                   # safeSetItem() with QuotaExceededError eviction, clearCache()
    └── formatters.ts                # fmtDate() — formats ISO date strings for display
```

## Data Sources
| Source | Endpoint | Data |
|--------|----------|------|
| Massive API | `/stocks/v1/dividends?ticker={sym}&limit=40&sort=ex_dividend_date.desc` | Payment history (ex-date, pay-date, amount, type) |
| Finnhub | `/stock/metric?symbol={sym}&metric=all` | Yield, EPS, payout ratio, FCF, shares outstanding |
| Finnhub | `/stock/financials-reported?symbol={sym}&freq=annual` | FCF fallback from cash flow statement |
| Finnhub | `/stock/quote?symbol={sym}` | Current price for yield calculation |

## Cache
- Key: `dividend_{symbol}_v5`
- TTL: 6 hours
- **Do not bump version** — bump only if the shape of cached data changes.

## Key Calculations (`calculations.ts`)

### `computeAnnualDividend(payments)`
Sums payments within the last 365 days (TTM window).

### `computeCagr(payments, years)`
Compares the most recent payment amount to the oldest payment within the `years` window using the compound growth formula: `(recent / old)^(1/years) - 1`. Returns `null` if fewer than 2 payments or amounts are equal.

### `computeGrowthStreak(payments)`
Groups payments by calendar year, sums annual totals, then counts consecutive years of year-over-year growth from most recent to oldest.

### `getSafetyInfo(fcfPayoutRatio, payoutRatio, payoutRatioIsComputed)`
Returns a letter grade (A–D) and descriptive label. Prefers FCF payout ratio over earnings payout ratio when available:
- **A (Safe):** FCF payout < 40% or earnings payout < 40%
- **B (Moderate):** FCF payout < 70% or earnings payout < 65%
- **C (Caution):** FCF payout < 100% or earnings payout < 90%
- **D (At Risk):** FCF payout ≥ 100% or earnings payout ≥ 90%

## Payout Ratio Logic
Special/irregular dividends are excluded from payout ratio numerator:
- If the stock pays special dividends: use recurring-only annual dividend
- Otherwise: prefer Finnhub's `dividendsPerShareAnnual` to avoid 365-day boundary counting errors (e.g., capturing 5 quarterly payments instead of 4)

## Growth Streak Badges
| Streak | Badge |
|--------|-------|
| 25+ years | Dividend Aristocrat (emerald) |
| 10–24 years | Dividend Champion (blue) |
| 3–9 years | Dividend Grower (amber) |
| < 3 years | No badge shown |

## CAGR Inputs
CAGR and growth streak calculations use **recurring-only** payments (type `'recurring'` or `''`) when at least 2 recurring payments exist. Falls back to all payments if not enough recurring data.
