# ValuWise — Project Instructions

## Overview
React + TypeScript + Vite + Tailwind v4 stock analysis app. Single-page with sidebar navigation and 9 tab views.

## App Features

### DCF Valuation (`src/dcf/index.tsx`)
Full discounted cash flow model built from standardized financials via Financial Modeling Prep (FMP) `/stable/` API. Restricted to ~87 pre-selected tickers.
- **Inputs:** 6 adjustable sliders — Revenue Growth (Yr 1 & Yr N), EBIT Margin (Yr 1 & Yr N), Terminal Growth, WACC adjustment, Equity Risk Premium, Forecast Years (1–10)
- **Scenario Presets:** Bear / Base / Bull with auto-filled assumptions; scenario comparison is dynamic — base = current slider values, bear/bull = offsets from current (growth ×0.7/×1.3, margins ×0.85/×1.15, WACC +1%/-0.5%)
- **Outputs:** Intrinsic value per share, upside/downside %, key assumptions summary, company name & industry display
- **Historical Financials:** 5–6 year income statement (Revenue, COGS, Gross Profit, SG&A, R&D, EBIT, D&A, Interest Expense, Income Tax, Net Income, margins)
- **Forecast Model:** N-year projection table (Revenue, EBIT, D&A, CapEx, Tax, UFCF, Discount Factor, PV of UFCF) with tabular-nums formatting
- **Valuation Bridge:** PV of FCFFs + Terminal Value = Enterprise Value → Equity Value → Per Share
- **Reverse DCF:** Solves for implied terminal growth rate at current market price
- **Sensitivity Matrix:** Terminal Growth % vs WACC with color-coded upside/downside cells
- **Charts:** Historical Margin Trends (gross, EBITDA, EBIT, net margins), Revenue & EBIT bar/line chart — all with legend click isolation
- **Exports:** Print/PDF (includes scenario comparison, sensitivity matrix, disclaimer), Excel (3 sheets: Income Statement, Balance Sheet, Cash Flow)

### Comp Analysis (`src/CompAnalysis.tsx`)
Comparable company analysis with multi-source peer discovery.
- **Peer Finder:** Finnhub `/stock/peers` suggestions + AI Peers via Gemini 2.5 Flash (5 competitors)
- **Manual peers:** Add up to 5 custom tickers
- **Metrics table:** Revenue Growth, EBITDA, EBITDA %, Net Income, NI %, Price, Market Cap, EV, EV/Revenue, EV/EBITDA, P/Sales, P/E, P/Book, P/FCF — sortable columns
- **Statistics row:** Mean, Median, 25th/75th percentile for all metrics
- **Implied Valuation:** 6 multiples-based price targets (EV/Rev, EV/EBITDA, P/Sales, P/E, P/Book, P/FCF)
- **Charts:** Bubble chart (EV/EBITDA vs Revenue Growth, bubble size = market cap), multi-line EV/EBITDA history, relative value ranking bars, radar chart (target vs peer median on 6 axes)
- **Composite Score:** 0–100 relative value score (average of percentile rankings)
- **Export:** Excel with all companies, metrics, and peer statistics

### Quality Analysis (`src/quality-analysis/index.tsx`)
Comprehensive financial quality scoring (A-D) across 4 weighted categories from FMP standardized financials. Restricted to ~87 pre-selected tickers (same as DCF).
Uses the **same `fmp_{sym}_dcf_v1` cache** as DCF — if a ticker was already looked up on the DCF page, Quality Analysis reuses that data (zero additional FMP calls).
- **Data Source:** FMP income statement, balance sheet, cash flow (3 FMP calls, 5 years) + Finnhub profile/metrics (2 calls)
- **Financial Health (25%):** Current Ratio, Quick Ratio, Debt-to-Equity, Interest Coverage
- **Profitability (30%):** Gross Margin, EBITDA Margin, Net Margin, ROE, ROA
- **Growth (25%):** Revenue Growth (3yr avg + CAGR), EPS Growth
- **Cash Flow Quality (20%):** FCF Margin, FCF Conversion, CFO Margin
- **Overall Grade:** Weighted composite with trend indicators (improving/stable/declining)
- **Risk Flags:** Automatic detection of financial warning signs
- **Grade Score Trend:** Line chart of category scores over recent years
- **Charts:** Historical margins, health ratios, ROE/ROA, radar chart
- **Altman Z-Score:** Bankruptcy risk (safe/grey/distress zones)
- **Piotroski F-Score:** 9-signal fundamental strength (0-9)
- **DuPont Analysis:** ROE decomposition (Net Margin x Asset Turnover x Equity Multiplier)
- **Working Capital Efficiency:** DSO, DIO, DPO, Cash Conversion Cycle
- **Earnings Quality:** Accruals ratio analysis

### Tech Analysis (`src/TechAnalysis.tsx`)
Technical indicator dashboard using TAAPI.io bulk endpoint.
- **Oscillators:** RSI (14), Stochastic %K/%D, Williams %R, CCI (20)
- **Trend:** MACD (histogram + signal), SMA 20/50/200, price % vs SMAs, Bollinger Bands %B & width
- **Volatility:** ATR, ATR % of price
- **Momentum:** Rate of Change (10-day, 20-day), Volume Ratio
- **Signal Score:** 0–100 weighted bullish/bearish composite
- **52-week range** position, YTD change
- **Charts:** Price + SMAs, MACD histogram, Bollinger Bands — all with legend click isolation
- **Narratives:** Plain-English explanation of each indicator's signal

### Earnings Estimates (`src/earnings-estimates/index.tsx`)
Earnings history and upcoming event tracking via API Ninjas.
- **Next Earnings:** Countdown timer + scheduled date
- **Historical EPS:** Last 8 quarters — actual vs estimated, surprise %, beat/miss badges
- **Beat Statistics:** Beat rate, average surprise magnitude
- **EPS Momentum:** YoY growth acceleration (Accelerating/Stable/Decelerating)
- **Earnings Quality Score:** 0–100 composite of beat rate + magnitude
- **Structure:** `types.ts`, `calculations.ts`, `hooks/useEarningsData.ts`, `components/` (BeatMissSummary, MomentumQuality, EarningsTable)

### Insider & Institutional (`src/insider-institutional/index.tsx`)
Insider transaction tracking from Finnhub.
- **Transaction Table:** 30 most recent insider trades (12-month window) — name, title, type (Purchase/Sale/Award), date, shares, price, value
- **Net Transaction Score:** -1 to +1 ratio of buy vs sell volume
- **Buy Clustering:** Detects months with 2+ distinct insider purchases (bullish signal)
- **Institutional holders** (premium endpoint, fails gracefully)
- **Structure:** `types.ts`, `calculations.ts`, `hooks/useInsiderData.ts`, `components/` (SummaryCards, TransactionTable, InstitutionalTable)

### News Sentiment (`src/news-sentiment/index.tsx`)
News aggregation with AI-powered sentiment analysis.
- **Headlines:** 20 most recent articles (30-day window) with source, date, external links
- **Finnhub Sentiment:** Bullish/Bearish %, Buzz index, company score vs sector average
- **AI Sentiment (Gemini 2.5 Flash):** Overall sentiment (Bullish/Neutral/Bearish), key themes summary, trend direction, per-headline sentiment breakdown
- **Visual:** Sentiment percentage bars
- **Structure:** `types.ts`, `hooks/` (useNewsData, useAiAnalysis), `components/` (SentimentOverview, AiAnalysis, NewsArticles)

### Portfolio Tracker (`src/PortfolioTracker.tsx`)
Multi-holding portfolio with live pricing and P&L tracking.
- **Holdings:** Add/remove positions with symbol, shares, optional cost basis — persisted to localStorage
- **Live Prices:** API Ninjas `/v1/stockprice` + Finnhub profile/metric for sector & beta
- **Per-Holding:** Price, total value, day change ($, %), gain/loss vs cost basis ($, %), portfolio weight %
- **Summary Cards:** Total value, day P&L, cumulative P&L, diversification grade (A–D by sector count)
- **Chart:** Sector allocation pie chart

### Dividend Analysis (`src/dividend-analysis/index.tsx`)
Dividend history and sustainability analysis via Massive API.
- **History Table:** 10 most recent payments — ex-date, pay date, amount, type (recurring/special/irregular)
- **Metrics:** Yield %, annual recurring dividend, 3/5/10-year CAGR (recurring-only), payout ratio (% of EPS), consecutive growth streak
- **FCF Safety:** Payout ratio vs free cash flow for sustainability assessment
- **Data:** 40 payments fetched for CAGR accuracy, special dividends excluded from growth calculations
- **Structure:** `types.ts`, `calculations.ts`, `hooks/useDividendData.ts`, `components/` (MetricCards, SafetyScore, GrowthSection, PaymentHistory)

### Global Features
- **Sidebar Navigation:** Grouped into Valuation (DCF, Comp, Quality), Market Data (Tech, Earnings, Insider, News), Tools (Portfolio, Dividends)
- **Dark Theme:** Slate-900 background throughout
- **localStorage Caching:** Versioned keys with `safeSetItem` eviction on quota exceeded
- **Clear Cache:** Button in sidebar to purge all cached data
- **Legend Click Isolation:** Every Recharts chart supports click-to-isolate series in legend

## Commands
- `npm run dev` — start dev server (port 3000)
- `npm run build` — production build
- `npm run lint` — type-check (`tsc --noEmit`)

## Architecture
Vertical sidebar (w-52) with grouped nav (Valuation | Market Data | Tools). Each tab is a self-contained component:

| Tab | File | Color |
|-----|------|-------|
| DCF Valuation | `src/dcf/index.tsx` | emerald |
| Comp Analysis | `src/CompAnalysis.tsx` | blue |
| Quality Analysis | `src/quality-analysis/index.tsx` | amber |
| Tech Analysis | `src/TechAnalysis.tsx` | violet |
| Earnings | `src/earnings-estimates/index.tsx` | cyan |
| Insider/Inst. | `src/insider-institutional/index.tsx` | orange |
| News Sentiment | `src/news-sentiment/index.tsx` | sky |
| Portfolio | `src/PortfolioTracker.tsx` | indigo |
| Dividends | `src/dividend-analysis/index.tsx` | rose |

## Deployment
This application is configured for deployment on Netlify.

## API Constraints

### Financial Modeling Prep (FMP) — financial statements only (DCF + Quality Analysis)
Free tier: 250 calls/day. Used for the 3 financial statement endpoints (3 FMP calls per ticker, cached 24h).
Endpoints: `/stable/income-statement`, `/stable/balance-sheet-statement`, `/stable/cash-flow-statement`
**Both DCF and Quality Analysis are restricted to ~87 pre-selected tickers** defined in `SUPPORTED_TICKERS` (src/dcf/types.ts).
Both DCF and Quality Analysis share the same cache key `fmp_{sym}_dcf_v1` — NEVER bump the version.
DO NOT use FMP for profile, price targets, or any non-statement data — use Finnhub instead.

### Finnhub (free tier) — all modules + DCF profile/metrics
Usable: `/stock/profile2`, `/stock/metric`, `/stock/quote`, `/stock/peers`, `/stock/price-target`, `/stock/insider-transactions`, `/company-news`, `/news-sentiment`
DCF uses Finnhub for: `/stock/profile2` (name, industry, mktCap, shares), `/stock/metric` (beta), `/stock/price-target` (analyst consensus).
**DO NOT USE (premium)**: `/stock/eps-estimate`, `/stock/revenue-estimate`, `/stock/eps-surprise`, `/stock/dividends2`, `/stock/ownership`, `/stock/earnings-quality`

### Other APIs
- **Massive API**: Dividends only — `stocks/v1/dividends`
- **API Ninjas**: Earnings (`/v1/earningscalendar`, `/v1/upcomingearnings`) + stock price (`/v1/stockprice`). Header: `X-Api-Key`. Do NOT add `limit` param to earningscalendar (breaks free tier).
- **TAAPI.io**: Technical indicators (bulk endpoint)
- **Gemini 2.5 Flash**: AI sentiment in News tab. Model: `gemini-2.5-flash` via `v1beta` REST API. Older models (1.5, 2.0) return 404 for new keys.

## Code Conventions
- No emoji in code or UI unless the user asks
- localStorage caching with versioned keys (e.g. `news_AAPL_v2`). Bump suffix when data logic changes — **except** `fmp_{sym}_dcf_v1` which must stay at `v1` (shared across DCF and Quality Analysis).
- `safeSetItem()` evicts cache on QuotaExceededError — prefixes: `finnhub_`, `fmp_`, `valuwise_`, `tech_`, `earnings_`, `insider_`, `news_`, `dividend_`
- All `JSON.parse` from localStorage must be wrapped in try/catch
- DCF uses FMP standardized fields (no XBRL concept matching) — `operatingIncome`, `depreciationAndAmortization`, `capitalExpenditure`, etc.
- Page centering: root `max-w-5xl mx-auto`, then title/form/loading/error/hint each need `max-w-xl mx-auto`
- Chart legend click isolation: EVERY Recharts chart (existing and new) MUST implement legend click isolation using `hiddenSeries` state + `handleLegendClick(d, chartKeys)` pattern with `hide` prop on ALL Line/Bar/Area elements
- Gemini JSON mode: use `generationConfig: { responseMimeType: 'application/json' }` + fallback regex `/\{[\s\S]*\}/`

## Common Pitfalls
- Stale cache showing 0 values: bump cache key version (except `fmp_*_dcf_v1` — never bump)
- FMP returns `capitalExpenditure` as negative — always use `Math.abs()`
- DCF profile data comes from Finnhub: `marketCapitalization` is in millions (multiply by 1e6), `shareOutstanding` is in millions (multiply by 1e6)
- FMP `fiscalYear` field is used for year labels (not `calendarYear`)
- Payout ratio inflation: use Finnhub's `dividendsPerShareAnnual` from `/stock/metric`, not a 365-day rolling window (can capture 5 quarterly payments)
- Gemini model 404: older model IDs deprecated for new API keys — use `gemini-2.5-flash`
