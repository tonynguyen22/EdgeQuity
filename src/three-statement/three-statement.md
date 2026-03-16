# 3-Statement Model Module

## Overview
A linked 3-statement financial model that connects Income Statement, Balance Sheet, and Cash Flow Statement. Users select from SUPPORTED_TICKERS, input assumptions, and the model cascades changes through all three statements automatically. Includes Excel export.

## File Structure
```
src/three-statement/
├── index.tsx                # Main UI: ticker dropdown, assumption sliders, forecast tables
├── types.ts                 # ThreeStmtInputs, HistoricalBase, ForecastRow
├── calculations.ts          # Pure: buildForecast() — linked IS→BS→CF engine
├── hooks/
│   └── useStatementData.ts  # Shared DCF cache + FMP /stable/ API. Cache 24h.
└── utils/
    └── excel.ts             # exportThreeStatementToExcel() — TSV .xls download
```

## Data Flow
1. User selects ticker from SUPPORTED_TICKERS dropdown → `fetchData()` runs
2. **Checks shared DCF cache** (`fmp_{sym}_dcf_v1`) first — if valid, uses it
3. If no cache, fetches fresh from FMP `/stable/` and saves to shared cache
4. Assumptions auto-filled from latest year (COGS%, SG&A%, tax rate, DSO, etc.)
5. User adjusts assumptions → clicks "Build Model"
6. `buildForecast()` generates N projected years linked across all 3 statements
7. Results displayed in sub-tabs: Income Statement / Balance Sheet / Cash Flow
8. Excel export downloads all 3 statements in one file

## Model Logic
- **Income Statement**: Revenue × growth → COGS/SGA/DA as % → EBIT → Interest → Tax → Net Income
- **Balance Sheet**: PP&E (prior + CapEx − DA), WC from DSO/DIO/DPO, Debt schedule, Equity (prior + NI − Dividends)
- **Cash Flow**: NI + DA − ΔWC = CFO; −CapEx = CFI; Debt net + Dividends = CFF

## API Endpoints (FMP `/stable/`)
- `POST /stable/income-statement?symbol={sym}&period=annual&limit=5`
- `POST /stable/balance-sheet-statement?symbol={sym}&period=annual&limit=5`
- `POST /stable/cash-flow-statement?symbol={sym}&period=annual&limit=5`
- All routed through `proxyFetch` (POST via Netlify http-proxy)
- **Shares cache with DCF** — cache key `fmp_{sym}_dcf_v1`

## Key Assumptions
| Input | Default | Source |
|-------|---------|--------|
| Revenue Growth | 10/9/8/7/6% | User slider per year |
| COGS % | Auto-filled | Historical latest |
| SG&A % | Auto-filled | Historical latest |
| D&A % | Auto-filled | Historical latest |
| Tax Rate | Auto-filled | Historical latest |
| CapEx % | Auto-filled | Historical latest |
| DSO/DIO/DPO | Auto-filled | Historical latest |
| Dividend Payout | 30% | User slider |

## Ticker Restriction
- Only SUPPORTED_TICKERS (~84 stocks) are selectable via dropdown autocomplete
- Imported from `../dcf/types`

## Sidebar
- Tab ID: `three-stmt`
- Group: Fundamentals
- Icon: FileSpreadsheet (cyan)
