# `src/financials/` — SEC Financial Statements

## Folder Structure

```
src/financials/
├── index.tsx                # App shell — imports hook, memos, renders components
├── financials.md            # This file
├── types.ts                 # Interfaces (StatementLineItem, FinancialsResponse, etc.)
├── calculations.ts          # Pure functions (growth rates)
├── hooks/
│   └── useFinancialsData.ts # Custom hook: ticker→CIK lookup, SEC EDGAR fetch, cache
├── utils/
│   ├── formatters.ts        # Currency/number formatting (formatCompact, formatGrowth, etc.)
│   └── storage.ts           # localStorage helpers (getCached, setCache, TTL)
└── components/
    ├── FinancialsControls.tsx # Ticker search + statement type tabs + loading/error
    └── StatementTable.tsx     # Financial statement table with YoY growth toggle
```

## Data Flow

```
User types ticker → handleSearch()
        ↓
useFinancialsData hook
  → check localStorage cache (edgar_{symbol}_financials_v1, 24h TTL)
  → if miss:
      1. Fetch /sec-api/files/company_tickers.json → build ticker→CIK map
      2. Fetch /edgar-facts/api/xbrl/companyfacts/CIK{cik}.json
      3. Parse us-gaap facts → extract income, balance, cashflow line items
      4. Determine fiscal years by scanning all revenue concepts + Assets
  → cache result in localStorage
        ↓
index.tsx (App Shell)
  → useMemo: currentItems based on activeStatement
  → useMemo: statementTitle / periods
        ↓
Components render:
  FinancialsControls  → search form, statement type tabs, loading/error
  StatementTable      → line items × periods with optional YoY growth
```

## Data Source

All financial data is fetched **directly from SEC EDGAR** — no Python backend needed.

- **Company tickers**: `https://www.sec.gov/files/company_tickers.json`
- **Company facts**: `https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json`

Requests are proxied through Vite dev server to bypass CORS:

| Proxy Path | Target |
|---|---|
| `/sec-api/*` | `https://www.sec.gov/*` |
| `/edgar-search/*` | `https://efts.sec.gov/*` |
| `/edgar-facts/*` | `https://data.sec.gov/*` |

## XBRL Concept Mapping

The hook maps US-GAAP XBRL concept names to human-readable labels for each statement:

- **Income**: `Revenues`, `CostOfRevenue`, `GrossProfit`, `OperatingIncomeLoss`, `NetIncomeLoss`, EPS, shares outstanding, etc.
- **Balance Sheet**: `AssetsCurrent`, `Assets`, `LiabilitiesCurrent`, `Liabilities`, `StockholdersEquity`, etc.
- **Cash Flow**: `NetCashProvidedByUsedInOperatingActivities`, CapEx, dividends, share repurchases, etc.

Each label has multiple concept fallbacks (e.g. Revenue checks `Revenues`, `RevenueFromContractWithCustomerExcludingAssessedTax`, `SalesRevenueNet`).

## Import Dependency Graph

```
types.ts              (leaf — no imports)
utils/formatters.ts   (leaf — no imports)
utils/storage.ts      (leaf — no imports)
calculations.ts       ← types.ts
hooks/useFinancialsData.ts  ← types.ts, utils/storage.ts
components/FinancialsControls.tsx  ← types.ts
components/StatementTable.tsx      ← types.ts, utils/formatters.ts, calculations.ts
index.tsx             ← hooks/*, components/*
```

## Caching

| Cache Key | TTL | Storage |
|---|---|---|
| `edgar_ticker_map_v2` | 7 days | localStorage |
| `edgar_{symbol}_financials_v1` | 24 hours | localStorage |

Quota-exceeded errors are handled by evicting oldest cache entries.
