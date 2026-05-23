# Fundamentals Charts & Statements Rename — Design Spec

**Date:** 2026-05-22  
**Status:** Approved  
**Project:** Edgequity (international value screener)

## Goal

Add a **Fundamentals** tab with annual (5Y) and quarterly (20Q) trend charts for key ratios, and rename **BCTC** to **Statements** (SEC filing tables).

## Tabs (Stock Detail)

| Tab | Content |
|-----|---------|
| AI Analysis | Existing research |
| Financials | Metric groups + thin history table |
| **Statements** | SEC EDGAR tables (`sec-statements.json`) |
| **Fundamentals** | Chart sections (`fundamentals-charts.json`) |

## Data Architecture

**Static cache only** — no runtime finance API calls.

| Data | Source | File |
|------|--------|------|
| Statement tables | SEC Company Facts (annual) | `raw/{TICKER}/sec-statements.json` |
| Chart series | SEC (absolute $) + Finnhub `metrics.json` `series` | `raw/{TICKER}/fundamentals-charts.json` |

### SEC (quarterly + annual)

- Extend Company Facts parser: `pickQuarterlyUsdValues` (fp Q1–Q4, 20 periods) + existing annual (5 periods).
- Concepts mapped for revenue, profits, balance sheet lines.

### Finnhub (valuation & ratios)

- Parse existing `raw/{TICKER}/metrics.json` → `series.annual` / `series.quarterly`.
- Keys: `pe`, `peTTM`, `pb`, `ps`, `psTTM`, `eps`, `bookValue`, `grossMargin`, `operatingMargin`, `netMargin`, `totalDebtToEquity`, `totalDebtToTotalAsset`, `evEbitda`, `evEbitdaTTM`, dividend yield fields.
- EV/EBIT: computed when `ev` + EBIT available; otherwise omitted.

## UI

- `FundamentalsPanel`: five sections (Growth, Margins & efficiency, Balance sheet, Leverage, Valuation).
- Each metric: title, description, latest badge, dual charts (Annual | Quarterly).
- Recharts line charts; USD / % / multiple formatting.
- Hide metrics with no data.

## Build

- `npm run edgequity:fundamentals-charts` — universe 500, resume, `EDGEQUITY_REFRESH_FUNDAMENTALS=1`.
- Optional SEC fetch when `sec-company-facts.json` missing (rate-limited).

## Out of Scope

- Broad runtime API polling in browser
- Full 10-K line order in Fundamentals (that stays in Statements)

## Success Criteria

- Statements tab label updated
- Fundamentals tab renders for AAPL, TSM, BRK.B with annual + quarterly charts
- Build completes for ≥490 tickers with partial or full sections
