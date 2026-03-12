# DDM Module — Dividend Discount Model

## Overview
The DDM module provides dividend-based valuation using three model variants. It allows users to select from SUPPORTED_TICKERS, configure assumptions, and see intrinsic value with sensitivity analysis.

## File Structure
```
src/ddm/
├── index.tsx            # Main UI: ticker dropdown, assumption form, results display
├── types.ts             # DDMInputs, DDMResult, DDMSensitivityCell
├── calculations.ts      # Pure: computeDDM(), computeDDMSensitivity()
└── hooks/
    └── useDDMData.ts    # Massive API (dividends) + Finnhub (profile, metrics, quote). Cache 24h.
```

## Models
1. **Gordon Growth (single-stage):** `P = D₁ / (Ke − g)` — constant growth perpetuity
2. **H-Model (2-stage):** High growth linearly declining to terminal — `P = D₀(1+gL)/(Ke−gL) + D₀·H·(gS−gL)/(Ke−gL)`
3. **Multi-Stage DDM:** N years explicit high-growth dividends + terminal value via Gordon

## Data Flow
1. User selects ticker from SUPPORTED_TICKERS dropdown → `fetchData()` runs
2. Auto-fills dividend per share, beta, cost of equity (CAPM)
3. User adjusts assumptions → clicks "Analyze DDM"
4. `computeDDM()` runs selected model → result displayed
5. Sensitivity matrix: terminal growth × cost of equity grid

## API Endpoints
- **Massive API** (`api.massive.com/stocks/v1/dividends`) — Recent dividend payment history
- **Finnhub** (`stock/profile2`) — company name, industry
- **Finnhub** (`stock/metric?metric=all`) — dividendsPerShareAnnual, beta, EPS
- **Finnhub** (`stock/quote`) — current price
- All routed through `proxyFetch` (POST via Netlify http-proxy)
- Includes `safeJson` wrapper to handle HTML error pages from Finnhub

## Key Assumptions
| Input | Default | Range |
|-------|---------|-------|
| Terminal Growth | 3% | 0–8% |
| Cost of Equity | CAPM-derived | 4–20% |
| Short-Term Growth | 8% | 0–30% |
| High Growth Period | 5 years | 1–15 |

## Ticker Restriction
- Only SUPPORTED_TICKERS (~87 stocks) are selectable via dropdown autocomplete
- Imported from `../dcf/types`

## Sidebar
- Tab ID: `ddm`
- Group: Valuation
- Icon: DollarSign (amber)
