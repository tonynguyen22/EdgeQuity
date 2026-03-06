# DCF Module — Comprehensive Test Cases & Edge Cases

Every row below is a scenario that **can or does** break the model. Organized by which layer of `calculations.ts` / `useDCFData.ts` / `index.tsx` is affected.

---

## 1. XBRL Data Extraction — Missing / Zero Concepts

These are the most common root cause of wrong numbers. The XBRL taxonomy varies across companies and even across years for the **same** company.

| # | Test Case | Ticker Example | Root Cause in Code | Current Behavior | Severity |
|---|-----------|----------------|-------------------|------------------|----------|
| 1.1 | **D&A is 0** | TSLA, some quarters | TSLA uses `tsla_DepreciationDepletionAndAmortization` (custom namespace), not `us-gaap_*`. None of the concept keys in L87 / L166 / L230 match. `findConceptByLabel` fallback also fails if the label doesn't contain "depreciation" or "amortization". | D&A = 0 → EBITDA = EBIT, FCFF understated, D&A margin = 0% → projected D&A = 0 | 🔴 **Critical** |
| 1.2 | **Revenue is 0** | Foreign companies, edge tickers | If none of the 5 `REV_CONCEPTS` match (e.g. IFRS filer using non-standard key), `getRev()` returns 0. | All margins = 0 (divide by 0 guarded → returns 0), CAGR = 0, projections flat at 0 | 🔴 Critical |
| 1.3 | **EBIT is 0 after all 3 fallbacks** | Banks, REITs, insurance companies | Financial-sector firms often don't report traditional `OperatingIncomeLoss`, `GrossProfit`, or `SGA`. All 3 fallback branches (L73-84) fail. | EBIT =  0, EBIT margin = 0, projected EBIT = 0 → FCFF driven only by D&A − CapEx | 🔴 Critical |
| 1.4 | **CapEx is 0** | Asset-light companies (e.g. META sometimes) or custom XBRL keys | Only looks for `PaymentsToAcquirePropertyPlantAndEquipment` (L111, L183, L232). Some companies combine PP&E + intangibles or use `PaymentsToAcquireProductiveAssets`. | CapEx margin = 0% → no CapEx deducted from FCFF → overstates intrinsic value | 🟡 Medium |
| 1.5 | **Net Income is 0** | Tax benefit companies or XBRL key mismatch | `us-gaap_NetIncomeLoss` not found | ROE, ROA, profitability ratios all 0 | 🟡 Medium |
| 1.6 | **Shares Outstanding is 0** | Some foreign filers, pre-IPO | Both `getShares` and BS fallback fail | EPS = 0, share-related CAGRs = 0, shares dilution meaningless | 🔴 Critical |
| 1.7 | **Cash is 0** | Missing `CashAndCashEquivalentsAtCarryingValue` | Some companies report cash under `CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents` | Equity value understated by missing cash | 🟡 Medium |
| 1.8 | **Total Debt is 0** | Companies using unusual debt taxonomy | Only a subset of debt concepts are checked | WACC overweights equity, debt shield underestimated | 🟡 Medium |
| 1.9 | **Working Capital components all 0** | Service companies with minimal WC | AR, Inventory, AP all return 0 | WC = 0, ΔWC is flat across projections → OK but may miss real WC dynamics | 🟢 Low |
| 1.10 | **Tax is 0 or negative** | Companies with tax credits / NOLs | `IncomeTaxExpenseBenefit` can be negative (tax benefit) | Negative tax rate → inflated EBIAT → overstated FCFF | 🟡 Medium |

---

## 2. EBIT Fallback Chain

The 3-step EBIT fallback ([calculations.ts L73-84](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/calculations.ts#L73-L84)):

```
1. OperatingIncomeLoss / ifrs-full_ProfitLossFromOperatingActivities
2. EBT + InterestExpense - InterestIncome
3. GrossProfit - SGA - R&D
```

| # | Test Case | What Breaks |
|---|-----------|------------|
| 2.1 | **EBT exists but Interest items are wrong sign** | Some companies report interest as positive expense, others as negative. The `Math.abs()` on L80-81 should handle this, but if `InterestExpense` is reported as a *credit*, `Math.abs` still produces a wrong number |
| 2.2 | **Fallback #3 missing R&D** | R&D returns 0 → EBIT = GP - SGA (overstates for tech companies that separate R&D) |
| 2.3 | **EBIT exists but is stale / from a different period** | Annual vs quarterly data mixing — `findConcept` takes the first match in the array, which might be a 10-K concept embedded with different period context |
| 2.4 | **EBIT is negative (loss-making company)** | Currently handled correctly (no `!ebit` skip for negatives since negative is truthy), but the auto-fill sets `ebitMarginStart` to a negative value, and the bear case multiplies by `0.85` which *increases* the margin toward zero |

---

## 3. WACC Calculation

[calculations.ts L239-257](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/calculations.ts#L239-L257)

| # | Test Case | Expected Behavior | Current Behavior |
|---|-----------|-------------------|------------------|
| 3.1 | **Beta is 0 or missing** | Should default to 1.0 | `parseNum(metrics?.beta) \|\| 1.0` — works ✅ |
| 3.2 | **Beta is negative** (e.g. gold stocks) | Cost of equity could be < risk-free | No guard — WACC could go very low; min 6% floor on L256 helps |
| 3.3 | **Market cap is 0** (delisted, data not available) | `profile.marketCapitalization` is null/0 | `totalValue = 0 + totalDebt` → `wEquity = 0`, WACC = debt-only. If both are 0, `wEquity = 1` | 🟡 |
| 3.4 | **WACC < terminal growth** | Infinite/negative terminal value | Floor: `wacc = max(baseWacc + adj, termGrowth/100 + 0.02)` ✅ |
| 3.5 | **All-equity company (zero debt)** | `kd = 0`, `wDebt = 0` | Works correctly — WACC = Ke | ✅ |
| 3.6 | **Very high leverage** | Debt >> market cap | `wDebt` could be > 0.9 → WACC dominated by after-tax debt cost, which is realistic but could look wrong | 🟡 |
| 3.7 | **Interest expense = 0 but debt > 0** | `kd = 0` → cost of debt = 0 | Understates WACC — should maybe default kd to ~4-5% | 🟡 |

---

## 4. Revenue CAGR Calculations

[calculations.ts L49-57](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/calculations.ts#L49-L57)

| # | Test Case | Result |
|---|-----------|--------|
| 4.1 | **Only 1-2 years of data** | `revs.length >= 4` fails → CAGR3yr = 0, CAGR5yr = 0. Auto-fill sets rev growth to 0% |
| 4.2 | **First-year revenue is 0** | `revs[0] > 0` check fails → 0 |
| 4.3 | **Base-year revenue is 0** (early-stage/pre-revenue) | Division guard catches it → 0 |
| 4.4 | **Revenue decline (negative CAGR)** | Math works correctly, but auto-fill sets negative growth which makes sense but bear case `× 0.5` halves the decline rate (makes it less bearish) |
| 4.5 | **Revenue spike in one year** (acquisitions, divestitures) | CAGR distorted by one-time jump — no smoothing | 🟡 |
| 4.6 | **Exactly 4 years of data but not 6** | CAGR3yr calculated, CAGR5yr = 0. Auto-fill uses 5yr CAGR (which is 0) for `revGrowthStart` | 🟡 |

---

## 5. Projections & Terminal Value

[calculations.ts L261-313](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/calculations.ts#L261-L313)

| # | Test Case | Issue |
|---|-----------|-------|
| 5.1 | **forecastYears = 1** | Single-year forecast — terminal value calculated on year-1 FCFF. Works but short horizon amplifies TV dominance |
| 5.2 | **Negative FCFF in the terminal year** | `tv = negativeFCFF × (1+g)/(wacc-g)` → negative TV → can produce negative intrinsic value | 🟡 |
| 5.3 | **revGrowthStart = -100** (revenue drops to 0) | Revenue = 0 in year 1 → all subsequent revenue = 0 → FCFF = 0 → TV = 0 → intrinsic = (cash − debt) / shares |
| 5.4 | **EBIT margin = 0** | FCFF = D&A − CapEx − ΔWC — could be positive if D&A > CapEx |
| 5.5 | **D&A margin = CapEx margin** (depreciation-matched CapEx) | Net reinvestment = 0, FCFF = EBIAT ± ΔWC |
| 5.6 | **Very high growth rate (>50%)** | Revenue explodes → TV extremely large → might produce unrealistic valuation |
| 5.7 | **Shares growth = -10% per year** (massive buybacks) | `shares = prevShares × 0.9` → terminal shares very small → intrinsic value per share inflated |
| 5.8 | **Discount period calculation at calendar edges** | `fractionOfYear = 1 - (currentMonth / 12)`. In January, fraction ≈ 0.917; in December, fraction ≈ 0.083. This shifts all discount timing. Works as designed but results change significantly by month |
| 5.9 | **Terminal growth = WACC - 0.02** (at the floor) | Very high terminal value. The floor prevents g ≥ WACC, but g = WACC − 0.02 still produces TV = FCFF×(1+g)/0.02 — 50× FCFF |

---

## 6. Historical Summary Edge Cases

[calculations.ts L59-148](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/calculations.ts#L59-L148)

| # | Test Case | Issue |
|---|-----------|-------|
| 6.1 | **Fewer than 5 years of financials** | `financials.slice(0,6).map(…).slice(0,5)` — returns fewer years. Charts show fewer bars, CAGR calcs may return 0 |
| 6.2 | **Reports not in chronological order** | `financials[0]` assumed to be the latest. If Finnhub returns out-of-order, base year is wrong |
| 6.3 | **Fiscal year ≠ calendar year** (e.g. MSFT ends June) | `report.endDate.substring(0,7)` shows `2024-06`, projections start from next calendar year. Mismatch between fiscal and projection years |
| 6.4 | **Duplicate reports** (amended filings / 10-K/A) | Might have two entries for the same year → distorts CAGR and averages |
| 6.5 | **Missing `report.endDate`** | Falls back to `report.year` — may produce odd labels |
| 6.6 | **Mix of annual + quarterly reports** | `freq=annual` in the API call should prevent this, but if API returns mixed data, metrics get polluted |

---

## 7. Shares Outstanding

Two separate extraction points with different concept priority:

| Location | Concepts (in order) |
|----------|-------------------|
| `getShares()` L45-47 | IC: `WeightedAverageShares` → BS: `CommonStockSharesOutstanding` |
| `sharesVals` L199 | BS: `CommonStockSharesOutstanding` → IC: `WeightedAverageShares` |
| `sharesOut` L259 | `profile.shareOutstanding × 1e6` → BS: multiple concepts |

| # | Test Case | Issue |
|---|-----------|-------|
| 7.1 | **Different shares in IC vs BS** | Weighted average (IC) ≠ point-in-time (BS). Historical uses IC first, but CAGR uses BS first → inconsistency |
| 7.2 | **`profile.shareOutstanding` is in millions but data value already scaled** | `× 1e6` may double-scale if Finnhub changes format | 🟡 |
| 7.3 | **Shares = 0 everywhere** | `terminalShares = 0` → `intrinsicValue = 0` → `upside` = 0 |
| 7.4 | **Stock split** changes shares drastically between years | CAGR reflects split, not dilution. May auto-fill unrealistic shares growth |

---

## 8. Tax Rate

[calculations.ts L154-160](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/calculations.ts#L154-L160)

| # | Test Case | Issue |
|---|-----------|-------|
| 8.1 | **EBT = 0 for all years** | All taxRates = 0, average = 0. Tax = 0, EBIAT = EBIT — overstates after-tax income |
| 8.2 | **One year has massive tax benefit** (negative tax) | One `taxRate = -3.0` (300% benefit) drags the average down dramatically |
| 8.3 | **Tax rate > 100%** (deferred tax adjustments) | Average inflated → projected tax too high → FCFF understated |
| 8.4 | **Missing `IncomeTaxExpenseBenefit` concept** | Returns 0 → tax rate = 0 → EBIAT = EBIT (no tax) |

> **Suggestion**: Clamp individual tax rates to [0%, 50%] before averaging. Default to 21% if no valid rates found.

---

## 9. Auto-Fill Slider Logic (index.tsx)

[index.tsx L72-89](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/index.tsx#L72-L89)

| # | Test Case | Issue |
|---|-----------|-------|
| 9.1 | **All CAGR values = 0** (insufficient data) | Sliders set to 0% growth — model projects flat revenue forever |
| 9.2 | **D&A margin = 0 (TSLA issue)** | `dnaMarginProj` auto-fills to 0% → projected D&A = 0 → FCFF = EBIAT − CapEx − ΔWC (understated) |
| 9.3 | **Negative EBIT margin** | `ebitMarginStart` and `ebitMarginEnd` both set to negative. Bear case (×0.85, ×0.70) makes them *less negative*, which is actually bullish |
| 9.4 | **`maxEbitMargin5yr` = 0** (no profitable year) | `ebitMarginEnd` auto-fills to 0%, suggesting margin doesn't improve |
| 9.5 | **Shares CAGR is very negative** (post-buyback) | Auto-fill sets `sharesGrowthProj` to e.g. −5%, which compounds over forecast period |

---

## 10. Sensitivity Matrix

[calculations.ts L332-346](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/calculations.ts#L332-L346)

| # | Test Case | Issue |
|---|-----------|-------|
| 10.1 | **Terminal FCFF ≤ 0** | `lastFcff ≤ 0` → TV is negative for all cells → matrix shows all negative prices or nulls |
| 10.2 | **WACC step goes below 0** | `w <= 0` → returns `null` (handled ✅) |
| 10.3 | **Growth step ≥ WACC step** | `w <= g` → returns `null` (handled ✅) |
| 10.4 | **Terminal shares = 0** | Returns `null` per cell (handled ✅) |

---

## 11. Reverse DCF

[index.tsx L204-220](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/index.tsx#L204-L220)

| # | Test Case | Issue |
|---|-----------|-------|
| 11.1 | **Last projected FCFF ≤ 0** | `lastFcff <= 0` → returns `null` (handled ✅) |
| 11.2 | **Current price = 0** | Guard: `dcf.currentPrice <= 0` → null ✅ |
| 11.3 | **Target PV TV is negative** | Binary search converges to floor (−5%) → shows "market expects long-run contraction" |
| 11.4 | **Binary search doesn't converge** | 60 iterations is usually sufficient, but extreme values could leave residual error |

---

## 12. Scenario Comparison

[index.tsx L222-259](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/index.tsx#L222-L259)

| # | Test Case | Issue |
|---|-----------|-------|
| 12.1 | **CAGR = 0 → bear uses ×0.5 = 0, ×0.1 = 0** | Bear and bull both project 0% growth — scenarios are identical |
| 12.2 | **Negative CAGR → bear ×0.5 halves the decline** | Bear case is actually *less bearish* than base — counterintuitive |
| 12.3 | **Base EBIT margin = 0 → all scenario margins = 0** | Bear ×0.85, Bull ×1.15 of 0 are still 0 — no differentiation |
| 12.4 | **`scenWacc < termGrowth/100`** | Floor prevents this but leaves very tight spread → massive TV |

---

## 13. Data Fetching & Caching

[useDCFData.ts](file:///c:/Users/Tony/Documents/GITHUB/ValuWise/src/dcf/hooks/useDCFData.ts)

| # | Test Case | Issue |
|---|-----------|-------|
| 13.1 | **API returns `error` in response body** | Caught by L53 check ✅ |
| 13.2 | **API returns empty `data` array** | `financials.length === 0` → error thrown ✅ |
| 13.3 | **API rate limited (429)** | No specific 429 handling — falls through to generic error |
| 13.4 | **Corrupted localStorage cache** | `JSON.parse` wrapped in try/catch → removes bad key ✅ |
| 13.5 | **Cache exceeds localStorage quota** | `safeSetItem` clears all caches and retries ✅ |
| 13.6 | **Network timeout** | No AbortController or timeout — fetch hangs indefinitely |
| 13.7 | **Stale cache (>24h) + API failure** | Cache cleared, API fails → no data, shows error |
| 13.8 | **Ticker doesn't exist** | Finnhub returns empty data → caught by the empty check |
| 13.9 | **Non-US tickers** (LSE, TSX) | Error message says "Only US-listed stocks with SEC filings (NYSE/NASDAQ)" ✅ |

---

## 14. Real-World Ticker Test Matrix

These specific tickers should be tested to cover the edge cases above:

| Ticker | Category | Key Edge Cases Covered |
|--------|----------|----------------------|
| **TSLA** | Custom XBRL namespace | D&A = 0 (1.1), custom debt concepts (1.8) |
| **AAPL** | Large-cap, stable | Baseline — everything should work correctly |
| **MSFT** | Fiscal year = June | Fiscal ≠ calendar year (6.3) |
| **JPM** | Bank / financial | EBIT fallback fails (1.3), non-standard revenue |
| **BRK.B** | Conglomerate, no dividends | Complex structure, unusual XBRL |
| **META** | Asset-light tech | Low CapEx (1.4), high R&D in EBIT fallback (2.2) |
| **RIVN** | Pre-profit, high burn | Negative EBIT (2.4), negative FCFF (5.2), negative tax rate (8.2) |
| **PLTR** | Recently profitable | Low historical margins, rapid margin expansion |
| **NVO** | IFRS filer (Denmark) | IFRS concept keys throughout |
| **SHOP** | Canadian cross-listed | Mixed GAAP/IFRS potential |
| **UBER** | Recent profitability | Negative historical margins → auto-fill edge (9.3) |
| **GME** | Volatile / meme stock | Wild revenue swings, negative EBIT |
| **T** | High-debt, dividend payer | High leverage (3.6), dividend / debt repayment ratios |
| **ABNB** | IPO'd recently | < 5 years of data (4.1, 6.1) |
| **GOOG** | Alphabet, large-cap | Should work — validation baseline |
| **WMT** | Retail, low-margin | Thin EBIT margin, large CapEx |

---

## Summary of Most Critical Fixes Needed

> [!CAUTION]
> These are the issues most likely to produce **incorrect valuations** silently:

1. **D&A extraction** — Add company-specific namespace fallbacks and a broader `findConceptByLabel` with more keyword variants (`"depreci"`, `"amortiz"`)
2. **Revenue = 0 guard** — If `baseRev = 0` after all fallbacks, the model should surface a clear error instead of silently producing $0 projections
3. **EBIT = 0 for financial companies** — Consider an alternative metric (e.g., net interest income) or warn the user that DCF is not suitable for this company type
4. **Tax rate clamping** — Individual year tax rates should be clamped to a reasonable range (e.g., 0–50%) before averaging
5. **Negative EBIT margin in scenarios** — Bear multipliers `×0.85` and `×0.70` should *increase* the magnitude when margin is negative, not decrease it
6. **Shares inconsistency** — Use the same concept priority order for historical shares, CAGR shares, and `sharesOut`
7. **Missing CAGR when < 6 years of data** — Fall back to available years instead of defaulting to 0%
