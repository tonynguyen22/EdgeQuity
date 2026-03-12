# Multiples Analysis

## Overview

The Multiples Analysis tab computes **7 key valuation multiples** across recent fiscal years using standardized financial data from FMP and historical stock prices from Finnhub. It shows how the market has valued a company over time and whether the current valuation is above or below historical norms.

---

## Multiples Tracked

| Multiple | Formula | What It Measures |
|---|---|---|
| **P/E** | Market Cap ÷ Net Income | How much investors pay per dollar of earnings |
| **EV/EBITDA** | Enterprise Value ÷ EBITDA | Valuation relative to cash operating profits |
| **EV/Revenue** | Enterprise Value ÷ Revenue | Valuation relative to total sales |
| **EV/EBIT** | Enterprise Value ÷ Operating Income | Valuation relative to operating profits |
| **P/B** | Market Cap ÷ Book Value | Price relative to net assets |
| **P/S** | Market Cap ÷ Revenue | Price relative to sales |
| **P/FCF** | Market Cap ÷ Free Cash Flow | Price relative to cash generated |

---

## Data Sources

| Data | Source | API Endpoint |
|---|---|---|
| Income statements, balance sheets, cash flows | FMP (Financial Modeling Prep) | `/stable/income-statement`, `/stable/balance-sheet-statement`, `/stable/cash-flow-statement` |
| Historical stock prices (daily candles) | Finnhub | `/stock/candle` |
| Company profile (market cap, shares) | Finnhub | `/stock/profile2` |
| TTM metrics and quarterly series | Finnhub | `/stock/metric?metric=all` |

---

## How Multiples Are Calculated

For each fiscal year (up to 6 years):

1. **Get the stock price** at fiscal year-end using Finnhub candle data (closest trading day within 30 days)
2. **Calculate Market Cap** = Price × Diluted Shares Outstanding
3. **Calculate Enterprise Value** = Market Cap + Total Debt − Cash & Equivalents
4. **Compute each multiple** by dividing Market Cap (or EV) by the corresponding financial metric

If historical prices are unavailable, the current market cap is used as a fallback — showing "current valuation vs past fundamentals."

---

## Live TTM Metrics

The **TTM (Trailing Twelve Months)** metrics come directly from Finnhub's `/stock/metric` endpoint. These are real-time snapshot values that Finnhub calculates and updates:

- **P/E TTM** — current price ÷ trailing 12-month EPS
- **Forward P/E** — current price ÷ estimated next-year EPS
- **P/S TTM** — price-to-sales trailing 12 months
- **P/B** — price-to-book (quarterly)
- **EV/EBITDA TTM** — enterprise value to trailing EBITDA
- **EV/Revenue TTM** — enterprise value to trailing revenue
- **P/FCF TTM** — price to trailing free cash flow

These are displayed in the **Live TTM Metrics** strip and as a **TTM column** in the historical table.

---

## Quarterly Trend Charts

The charts support both **Annual** and **Quarterly** views. Quarterly data comes from Finnhub's `series.quarterly` object, which provides historical TTM values at each quarter-end (e.g., `peTTM`, `evEbitdaTTM`, `psTTM`, `pb`, `pfcfTTM`). This gives denser data points showing how multiples evolved between fiscal year-ends.

---

## Premium/Discount & Valuation Signal

### Premium/Discount

For each multiple, the **premium/discount** shows how far the current (most recent fiscal year) value is from the historical average:

- **Below Avg** (green) — e.g., "15.2% Below Avg" means the current multiple is 15.2% lower than the average. The stock is trading at a *discount* to its historical norm for that metric.
- **Above Avg** (red) — the current multiple is higher than average, suggesting a *premium*.
- **Near Avg** (neutral) — within ±1% of the historical average.

### Fair Value Signal

The overall signal uses a **majority-vote** system:

1. Count how many multiples have a premium/discount exceeding ±10%
2. If **≥50% of multiples are >10% below** average → **Undervalued**
3. If **≥50% of multiples are >10% above** average → **Overvalued**
4. Otherwise → **Fair Value**

> **Important**: "Fair Value" does NOT mean the stock is worth a specific price. It means the current multiples are roughly in line with their historical averages. This is a relative comparison, not an absolute valuation.

---

## Caching

- Financial data is cached in `localStorage` with a 24-hour TTL (key: `fmp_{symbol}_dcf_v1`)
- Candle data is cached separately (key: `multiples_{symbol}_candle_v1`)
- On fetch failure, expired cache is used as a fallback with a warning message
