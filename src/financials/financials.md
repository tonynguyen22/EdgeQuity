# `src/financials/` — SEC Financial Statements

## Folder Structure

```
src/financials/
├── index.tsx                # App shell — imports hook, memos, renders components
├── financials.md            # This file
├── types.ts                 # Interfaces (StatementLineItem, FinancialsResponse, etc.)
├── calculations.ts          # Pure functions (growth rates, margins, trend builders)
├── hooks/
│   └── useFinancialsData.ts # Custom hook: ticker state, fetch from Python backend, cache
├── utils/
│   ├── formatters.ts        # Currency/number formatting (formatCompact, formatGrowth, etc.)
│   └── storage.ts           # localStorage helpers (getCached, setCache, TTL)
└── components/
    ├── FinancialsControls.tsx # Ticker search + statement type tabs + loading/error
    ├── StatementTable.tsx     # Financial statement table with YoY growth toggle
    └── StatementCharts.tsx    # Revenue/profitability bar chart + margin trends line chart
```

## Data Flow

```
User types ticker → handleSearch()
        ↓
useFinancialsData hook
  → check localStorage cache (edgar_{symbol}_financials_v1, 24h TTL)
  → if miss: fetch from Python backend (/api/financials?ticker=AAPL&years=5)
  → Python backend uses edgartools to fetch 10-K from SEC EDGAR
  → returns { income_statement, balance_sheet, cash_flow, periods }
  → cache in localStorage
        ↓
index.tsx (App Shell)
  → useMemo: currentItems based on activeStatement
  → useMemo: incomeMetrics, marginTrends for charts
        ↓
Components render:
  FinancialsControls  → search form, statement type tabs
  StatementCharts     → revenue bar chart, margin line chart (income view only)
  StatementTable      → line items × periods with optional YoY growth
```

## Backend

- **`api/financials.py`** — Vercel Python serverless function using `edgartools`
- **`api/requirements.txt`** — `edgartools>=3.0.0`
- **`vercel.json`** — Python runtime config + CORS headers
- **Endpoint:** `GET /api/financials?ticker=AAPL&years=5`

## Import Dependency Graph

```
types.ts              (leaf — no imports)
utils/formatters.ts   (leaf — no imports)
utils/storage.ts      (leaf — no imports)
calculations.ts       ← types.ts
hooks/useFinancialsData.ts  ← types.ts, utils/storage.ts
components/FinancialsControls.tsx  ← types.ts
components/StatementTable.tsx      ← types.ts, utils/formatters.ts, calculations.ts
components/StatementCharts.tsx     ← types.ts
index.tsx             ← hooks/*, calculations.ts, components/*
```

## Environment

| Variable | Used In | Source |
|----------|---------|--------|
| `EDGAR_API_URL` | `hooks/useFinancialsData.ts` | `.env` → Vite `define` block |
