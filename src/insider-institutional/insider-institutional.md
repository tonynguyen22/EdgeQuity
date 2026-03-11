# Insider & Institutional Module

## Overview
Displays insider transaction history (12-month window), a net buy/sell score, coordinated buying signals, and top institutional holders. Data sourced entirely from Finnhub.

## File Structure
```
src/insider-institutional/
├── index.tsx                        # Main component — search, state, composition
├── types.ts                         # TypeScript interfaces (InsiderTransaction, Institution, InsiderData, etc.)
├── calculations.ts                  # Pure functions (computeNetBuySell, computeNetScore, computeBuyerClusters, TRANS_CODE_LABELS)
├── insider-institutional.md         # This file
├── components/
│   ├── SummaryCards.tsx             # 4-card grid: Buys / Sales / Total / Net Score gauge
│   ├── TransactionTable.tsx         # Insider transaction table (up to 30 rows)
│   └── InstitutionalTable.tsx       # Top institutional holders table (graceful fallback if premium-gated)
├── hooks/
│   └── useInsiderData.ts            # Fetch, cache (TTL 6h), state management
└── utils/
    ├── storage.ts                   # safeSetItem() with eviction, clearCache()
    └── formatters.ts                # fmtDate(), fmtNum() ($B/$M/$K formatting)
```

## Data Sources
| Source | Endpoint | Data |
|--------|----------|------|
| Finnhub | `/stock/insider-transactions?symbol={sym}&from={from}&to={to}` | Raw insider transactions (12-month window) |
| Finnhub | `/stock/ownership?symbol={sym}&limit=10` | Top 10 institutional holders (premium, fails gracefully) |
| Finnhub | `/stock/insider-sentiment?symbol={sym}&from={from}&to={to}` | Insider sentiment aggregate (stored but not displayed currently) |

## Cache
- Key: `insider_{symbol}_v1`
- TTL: 6 hours

## Key Calculations (`calculations.ts`)

### `computeNetBuySell(transactions)`
Aggregates total shares purchased (code `P`) and sold (codes `S` or `D`) across all transactions. Returns `{ buy, sell }`.

### `computeNetScore(netBuySell)`
Normalizes to a -1 to +1 score: `(buy - sell) / (buy + sell)`. Returns `null` if no buy or sell volume. Score labels:
- ≥ +0.5: Strong Buy
- +0.1 to +0.5: Net Buying
- -0.1 to +0.1: Neutral
- -0.5 to -0.1: Net Selling
- ≤ -0.5: Strong Sell

### `computeBuyerClusters(transactions)`
Detects months where 2 or more distinct insiders made open-market purchases (code `P`). Returns up to 3 most recent clustering months sorted descending. Used to surface "coordinated buying" signals.

## Transaction Code Labels
| Code | Label |
|------|-------|
| P | Purchase |
| S | Sale |
| A | Award/Grant |
| D | Sale to Issuer |
| F | Tax Withholding |
| M / X | Option Exercise |
| C | Conversion |
| W | Will/Inheritance |
| G | Gift |

## Filtering
- Derivative transactions (`isDerivative === true`) are excluded from the transaction table and all calculations.
- Only the 30 most recent non-derivative transactions in the 12-month window are shown.
