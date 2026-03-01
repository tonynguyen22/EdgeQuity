# ValuWise — Project Instructions

## Overview
React + TypeScript + Vite + Tailwind v4 stock analysis app. Single-page with sidebar navigation and 9 tab views.

## App Features

### DCF Valuation (`src/App.tsx`)
Full discounted cash flow model built from SEC-reported financials (Finnhub `/stock/financials-reported`).
- **Inputs:** 6 adjustable sliders — Revenue Growth (Yr 1 & Yr N), EBIT Margin (Yr 1 & Yr N), Terminal Growth, WACC adjustment, Equity Risk Premium, Forecast Years (1–10)
- **Scenario Presets:** Bear / Base / Bull with auto-filled assumptions; scenario comparison table shows implied price & upside for all three
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

### Company Grade (`src/CompanyGrade.tsx`)
Letter-grade scoring system (A–D) across 4 categories from SEC financials.
- **Financial Health:** Current Ratio, Quick Ratio, Debt-to-Equity, Interest Coverage
- **Profitability:** Gross Margin, EBITDA Margin, Net Margin, ROE, ROA
- **Growth:** Revenue Growth, EPS Growth, FCF Margin, FCF Conversion
- **Cash Flow:** Operating Cash Flow Margin
- **Overall Grade:** Weighted composite with trend indicator (improving/stable/declining)
- **Grade Score Trend:** 5-year line chart of category scores over time
- **Details:** Expandable categories with per-metric narrative explanations and grading thresholds
- **Charts:** Radar chart (14 metrics scored 0–100)

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

### Earnings Estimates (`src/EarningsEstimates.tsx`)
Earnings history and upcoming event tracking via API Ninjas.
- **Next Earnings:** Countdown timer + scheduled date
- **Historical EPS:** Last 8 quarters — actual vs estimated, surprise %, beat/miss badges
- **Beat Statistics:** Beat rate, average surprise magnitude
- **EPS Momentum:** YoY growth acceleration (Accelerating/Stable/Decelerating)
- **Earnings Quality Score:** 0–100 composite of beat rate + magnitude

### Insider & Institutional (`src/InsiderInstitutional.tsx`)
Insider transaction tracking from Finnhub.
- **Transaction Table:** 30 most recent insider trades (12-month window) — name, title, type (Purchase/Sale/Award), date, shares, price, value
- **Net Transaction Score:** -1 to +1 ratio of buy vs sell volume
- **Buy Clustering:** Detects months with 2+ distinct insider purchases (bullish signal)
- **Institutional holders** (premium endpoint, fails gracefully)

### News Sentiment (`src/NewsSentiment.tsx`)
News aggregation with AI-powered sentiment analysis.
- **Headlines:** 20 most recent articles (30-day window) with source, date, external links
- **Finnhub Sentiment:** Bullish/Bearish %, Buzz index, company score vs sector average
- **AI Sentiment (Gemini 2.5 Flash):** Overall sentiment (Bullish/Neutral/Bearish), key themes summary, trend direction, per-headline sentiment breakdown
- **Visual:** Sentiment percentage bars

### Portfolio Tracker (`src/PortfolioTracker.tsx`)
Multi-holding portfolio with live pricing and P&L tracking.
- **Holdings:** Add/remove positions with symbol, shares, optional cost basis — persisted to localStorage
- **Live Prices:** API Ninjas `/v1/stockprice` + Finnhub profile/metric for sector & beta
- **Per-Holding:** Price, total value, day change ($, %), gain/loss vs cost basis ($, %), portfolio weight %
- **Summary Cards:** Total value, day P&L, cumulative P&L, diversification grade (A–D by sector count)
- **Chart:** Sector allocation pie chart

### Dividend Analysis (`src/DividendAnalysis.tsx`)
Dividend history and sustainability analysis via Massive API.
- **History Table:** 10 most recent payments — ex-date, pay date, amount, type (recurring/special/irregular)
- **Metrics:** Yield %, annual recurring dividend, 3/5/10-year CAGR (recurring-only), payout ratio (% of EPS), consecutive growth streak
- **FCF Safety:** Payout ratio vs free cash flow for sustainability assessment
- **Data:** 40 payments fetched for CAGR accuracy, special dividends excluded from growth calculations

### Global Features
- **Sidebar Navigation:** Grouped into Valuation (DCF, Comp, Grade), Market Data (Tech, Earnings, Insider, News), Tools (Portfolio, Dividends)
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
| DCF Valuation | `src/App.tsx` (inline) | emerald |
| Comp Analysis | `src/CompAnalysis.tsx` | blue |
| Company Grade | `src/CompanyGrade.tsx` | amber |
| Tech Analysis | `src/TechAnalysis.tsx` | violet |
| Earnings | `src/EarningsEstimates.tsx` | cyan |
| Insider/Inst. | `src/InsiderInstitutional.tsx` | orange |
| News Sentiment | `src/NewsSentiment.tsx` | sky |
| Portfolio | `src/PortfolioTracker.tsx` | indigo |
| Dividends | `src/DividendAnalysis.tsx` | rose |

## API Constraints

### Finnhub (free tier)
Usable: `/stock/financials-reported`, `/stock/profile2`, `/stock/metric`, `/stock/quote`, `/stock/peers`, `/stock/price-target`, `/stock/insider-transactions`, `/company-news`, `/news-sentiment`
**DO NOT USE (premium)**: `/stock/eps-estimate`, `/stock/revenue-estimate`, `/stock/eps-surprise`, `/stock/dividends2`, `/stock/ownership`, `/stock/earnings-quality`

### Other APIs
- **Massive API**: Dividends only — `stocks/v1/dividends`
- **API Ninjas**: Earnings (`/v1/earningscalendar`, `/v1/upcomingearnings`) + stock price (`/v1/stockprice`). Header: `X-Api-Key`. Do NOT add `limit` param to earningscalendar (breaks free tier).
- **TAAPI.io**: Technical indicators (bulk endpoint)
- **Gemini 2.5 Flash**: AI sentiment in News tab. Model: `gemini-2.5-flash` via `v1beta` REST API. Older models (1.5, 2.0) return 404 for new keys.

## Code Conventions
- No emoji in code or UI unless the user asks
- localStorage caching with versioned keys (e.g. `news_AAPL_v2`). Bump suffix when data logic changes.
- `safeSetItem()` evicts cache on QuotaExceededError — prefixes: `finnhub_`, `valuwise_`, `tech_`, `earnings_`, `insider_`, `news_`, `dividend_`
- All `JSON.parse` from localStorage must be wrapped in try/catch
- EBIT fallback chain: OperatingIncomeLoss -> EBT+IntExp-IntInc -> GrossProfit-SGA-RD (apply in BOTH historicalSummary loop AND DCF useMemo baseEbit)
- Page centering: root `max-w-5xl mx-auto`, then title/form/loading/error/hint each need `max-w-xl mx-auto`
- Chart legend click isolation: EVERY Recharts chart (existing and new) MUST implement legend click isolation using `hiddenSeries` state + `handleLegendClick(d, chartKeys)` pattern with `hide` prop on ALL Line/Bar/Area elements
- Gemini JSON mode: use `generationConfig: { responseMimeType: 'application/json' }` + fallback regex `/\{[\s\S]*\}/`

## Common Pitfalls
- Stale cache showing 0 values: bump cache key version
- EBIT=0 for some companies (e.g. SHW): missing fallback chain — must be in both places
- Payout ratio inflation: use Finnhub's `dividendsPerShareAnnual` from `/stock/metric`, not a 365-day rolling window (can capture 5 quarterly payments)
- Gemini model 404: older model IDs deprecated for new API keys — use `gemini-2.5-flash`
