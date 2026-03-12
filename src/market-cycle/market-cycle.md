# Market Cycle Module

## Overview
Detects the current market cycle phase using Wyckoff methodology applied to S&P 500 (SPY) daily price data. Computes probability scores for each of the four cycle phases (Accumulation, Mark-Up, Distribution, Mark-Down) and displays the most likely phase with confidence level. No ticker input required — auto-fetches SPY data on load.

## File Structure
```
src/market-cycle/
├── index.tsx            # Main UI: phase banner, donut chart, phase breakdown, educational descriptions
├── types.ts             # WyckoffPhase union type, MarketCycleResult interface
├── calculations.ts      # SPY data fetch, indicator computation, Wyckoff cycle detection, caching
└── market-cycle.md      # This file
```

## Data Flow
1. Component mounts → `fetchMarketCycle()` runs
2. Checks localStorage cache (`market_cycle_spy_v1`, 24h TTL)
3. If no valid cache: fetches SPY daily candles (up to 2 years) via Massive API (primary) or OHLCV fallback chain
4. Computes all technical indicators on SPY candles via `computeAllIndicators()` from tech-analysis module
5. Scores each Wyckoff phase based on indicator values (RSI, MACD, SMA slopes, ADX, Bollinger Width, ROC)
6. Normalizes raw scores via softmax → probability distribution summing to 100%
7. Highest-probability phase = current phase, probability = confidence %
8. Caches result in localStorage

## Data Sources
| Source | Endpoint | Data |
|--------|----------|------|
| Massive API | `/v2/aggs/ticker/SPY/range/1/day/{from}/{to}` | 2 years of daily candles (primary) |
| OHLCV fallback | Finnhub → Polygon → Twelve Data → Alpha Vantage | 1 year of daily candles (fallback) |

All requests routed through `proxyFetch` (Netlify http-proxy).

## Cache
- Key: `market_cycle_spy_v1`
- TTL: 24 hours
- Shape: `{ ts: number, data: MarketCycleResult }`

## Wyckoff Phases

| Phase | Description | Indicators |
|-------|-------------|------------|
| **Accumulation** | Market bottoming, sideways range. Institutional buying. | Price near/below SMA 200, SMA 50 slope flattening, RSI 25-45, low ADX, BB squeeze, flat ROC |
| **Mark-Up** | Sustained uptrend with healthy momentum. | Price above both SMAs, golden cross, RSI 50-70, positive MACD histogram, ADX >25, positive ROC |
| **Distribution** | Market topping, momentum fading. | Price above SMA 200 but weakening vs SMA 50, SMA 50 slope flattening, MACD divergence, high BB width |
| **Mark-Down** | Sustained downtrend with selling pressure. | Price below both SMAs, death cross, RSI <40, negative MACD, strong ADX in downtrend, negative ROC |

## Signal Scoring
Each phase accumulates a raw score from 7-8 weighted indicator checks. Scores are normalized via softmax (temperature=30) to produce a smooth probability distribution. The phase with highest probability is declared the current cycle phase.

## UI Components
- **Phase Banner:** Current phase name with color-coded background and confidence %
- **Donut Chart:** Recharts PieChart showing all 4 phase probabilities, center label with current phase/confidence
- **Phase Breakdown:** Side-by-side bars with phase name, probability %, and mini progress bar
- **Phase Descriptions:** 4 educational cards explaining each Wyckoff phase — what it is and what to do. Current phase is highlighted.

## Phase Colors
| Phase | Color | Text Class |
|-------|-------|------------|
| Accumulation | `#3b82f6` (blue) | `text-blue-400` |
| Mark-Up | `#10b981` (emerald) | `text-emerald-400` |
| Distribution | `#f59e0b` (amber) | `text-amber-400` |
| Mark-Down | `#ef4444` (red) | `text-red-400` |

## Sidebar
- Tab ID: `cycle`
- Group: Market Data
- Icon: RefreshCw (teal)

## Dependencies
- Imports `Candle` type, `computeAllIndicators`, `computeSMA`, `normalizePolygon`, `fetchOHLCV` from `../tech-analysis/`
- Imports `proxyFetch` from `../utils/proxyFetch`
- Imports `safeSetItem` from `../tech-analysis/utils/storage`
- Uses `recharts` for donut chart
