# ValuWise — Project Instructions

## Overview
React + TypeScript + Vite + Tailwind v4 stock analysis app. Single-page with sidebar navigation and 12 tab views. Sidebar groups tabs into Valuation (DCF, DDM, Multiples), Fundamentals (Quality, 3-Statement, Peers), Market Intelligence (Technical, Earnings, Insider & Inst., News), and Income & Macro (Dividends, Market Cycle). Uses a financial terminal aesthetic with DM Sans + IBM Plex Mono fonts, deep navy-black palette (#0a0e17), cyan accent (#00d4aa), and CSS custom properties (`--vw-*` tokens in `src/index.css`).

## App Features

### DCF Valuation (`src/dcf/index.tsx`)
Full discounted cash flow model built from standardized financials via Financial Modeling Prep (FMP) `/stable/` API. Restricted to ~87 pre-selected tickers.
- **Sub-Tabs:** Model (main DCF output), Financials (historical tables), WACC & CAPM (editable CAPM/WACC assumptions with waterfall chart), Monte Carlo (N-simulation probability distribution)
- **Inputs:** 6 adjustable sliders — Revenue Growth (Yr 1 & Yr N), EBIT Margin (Yr 1 & Yr N), Terminal Growth, WACC adjustment, Equity Risk Premium, Forecast Years (1–10)
- **Scenario Presets:** Bear / Base / Bull with auto-filled assumptions; scenario comparison is dynamic — base = current slider values, bear/bull = offsets from current (growth ×0.7/×1.3, margins ×0.85/×1.15, WACC +1%/-0.5%)
- **Outputs:** Intrinsic value per share, upside/downside %, key assumptions summary, company name & industry display
- **Historical Financials:** 5–6 year income statement (Revenue, COGS, Gross Profit, SG&A, R&D, EBIT, D&A, Interest Expense, Income Tax, Net Income, margins)
- **Forecast Model:** N-year projection table (Revenue, EBIT, D&A, CapEx, Tax, UFCF, Discount Factor, PV of UFCF) with tabular-nums formatting
- **Valuation Bridge:** PV of FCFFs + Terminal Value = Enterprise Value → Equity Value → Per Share
- **Reverse DCF:** Solves for implied terminal growth rate at current market price
- **Sensitivity Matrix:** Terminal Growth % vs WACC with color-coded upside/downside cells
- **WACC & CAPM Panel:** Editable Risk-Free Rate, ERP, Beta, Cost of Debt, Tax Rate, Capital Structure weights. Waterfall chart showing WACC decomposition. "Apply to DCF" button.
- **Monte Carlo Simulation:** Runs 1K–10K simulations randomizing Rev Growth, EBIT Margin, Terminal Growth, WACC. Shows histogram, percentile table (10th–90th), P(Undervalued).
- **Charts:** Historical Margin Trends (gross, EBITDA, EBIT, net margins), Revenue & EBIT bar/line chart — all with legend click isolation
- **Exports:** Print/PDF (includes scenario comparison, sensitivity matrix, disclaimer), Excel (3 sheets: Income Statement, Balance Sheet, Cash Flow)

### DDM — Dividend Discount Model (`src/ddm/index.tsx`)
Dividend-based stock valuation with 3 model variants. Fetches dividend/beta data from Finnhub.
- **Models:** Gordon Growth (single perpetuity), H-Model (linear growth decline), Multi-Stage (explicit N-year forecasts + terminal)
- **Inputs:** Current annual dividend, terminal growth, cost of equity (CAPM auto-filled), short-term growth, high-growth period
- **Outputs:** Intrinsic value, upside/downside %, implied yield, valuation breakdown (PV dividends vs PV terminal), projected dividend stream table
- **Sensitivity Table:** Terminal Growth % vs Cost of Equity grid with color-coded cells
- **Structure:** `types.ts`, `calculations.ts`, `hooks/useDDMData.ts`, `ddm.md`

### 3-Statement Model (`src/three-statement/index.tsx`)
Linked financial model connecting Income Statement, Balance Sheet, and Cash Flow Statement. Fetches 5yr historicals from FMP.
- **Linked Logic:** Revenue drives COGS/SGA/DA (%), Working Capital from DSO/DIO/DPO, CapEx as % of revenue, Debt schedule, Retained earnings flow to equity
- **Inputs:** Revenue growth per year, cost structure %s, tax rate, CapEx %, DSO/DIO/DPO, dividend payout, debt repayment/issuance
- **Auto-fill:** Assumptions pre-populated from latest historical year
- **Sub-Tabs:** Income Statement, Balance Sheet, Cash Flow — each as forecast table (historical + projected)
- **Excel Export:** Tab-separated .xls download with all 3 statements
- **Structure:** `types.ts`, `calculations.ts`, `hooks/useStatementData.ts`, `utils/excel.ts`, `three-statement.md`

### Multiples Analysis (`src/multiples-analysis/index.tsx`)
Historical valuation multiples analysis with 7 key ratios across fiscal years. Uses FMP financial statements + Finnhub candle prices for point-in-time computation.
- **Multiples:** P/E, EV/EBITDA, EV/Revenue, EV/EBIT, P/B, P/S, P/FCF
- **Stats:** Average, median, high, low, premium/discount vs. average for each multiple (last 6 years)
- **Valuation Signal:** Undervalued / Fair Value / Overvalued (based on how many multiples are above/below averages)
- **TTM Snapshot:** Current trailing-twelve-month multiples from Finnhub `/stock/metric`
- **Quarterly Trend:** Line charts from Finnhub series data showing quarterly multiple evolution
- **Cards:** 7 metric cards with current value, historical avg, and premium/discount badge
- **Table:** Year-by-year table of all 7 multiples with color-coded heatmap cells
- **Charts:** Multi-line history charts with legend click isolation + quarterly trend
- **Full History:** Collapsible section showing all available years when more than 6 exist
- **Valuation Context:** Overall signal card with per-multiple assessment breakdown
- **Cache:** Shares FMP cache `fmp_{sym}_dcf_v1` (24h), separate candle cache `multiples_{sym}_candle_v1`
- **Structure:** `types.ts`, `calculations.ts`, `hooks/useMultiplesData.ts`, `components/` (SearchForm, MultiplesCards, MultiplesTable, MultiplesCharts, ValuationContext)

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

### Peer Analysis (`src/peer-analysis/index.tsx`)
Comparable company analysis with peer discovery, metrics comparison, and implied valuation. Refactored from old monolithic `CompAnalysis.tsx`.
- **Peer Finder:** Finnhub `/stock/peers` suggestions, filtered to SUPPORTED_TICKERS
- **Manual peers:** Add up to 5 custom tickers
- **Metrics table:** Revenue Growth, EBITDA, EBITDA %, Net Income, NI %, Price, Market Cap, EV, EV/Revenue, EV/EBITDA, P/Sales, P/E, P/Book, P/FCF — sortable columns
- **Statistics row:** Mean, Median, 25th/75th percentile for all metrics
- **Implied Valuation:** 6 multiples-based price targets (football-field chart)
- **Charts:** Bubble chart (EV/EBITDA vs Revenue Growth), multi-line EV/EBITDA history, relative bar ranking, radar chart (target vs peer median)
- **Composite Score:** 0–100 relative value score (average of percentile rankings)
- **Export:** Excel with all companies, metrics, and peer statistics
- **Cache:** `finnhub_{symbol}_comp_data_v5` (24h TTL)
- **Structure:** `types.ts`, `calculations.ts`, `hooks/usePeerData.ts`, `utils/` (formatters, storage, excel), `components/` (PeerControls, ComparisonTable, ImpliedValuation, EvEbitdaTrend, PeerRanking, RadarScore, BubbleChart)

### Tech Analysis (`src/tech-analysis/index.tsx`)
Technical indicator dashboard with dual-timeframe (Daily + Weekly) analysis, local indicator computation, and TAAPI.io supplement.
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

### Market Cycle (`src/market-cycle/index.tsx`)
Wyckoff market cycle detection from S&P 500 (SPY) daily price data. No ticker input — auto-fetches on mount.
- **Phases:** Accumulation, Mark-Up, Distribution, Mark-Down
- **Cycle Detection:** Scores each phase via technical indicators (RSI, MACD, SMA slopes, ADX, Bollinger Width, ROC) then softmax-normalizes to probabilities summing to 100%
- **Phase Banner:** Current phase with confidence percentage
- **Donut Chart:** Recharts PieChart showing all 4 phase probabilities
- **Phase Breakdown:** Bar visualization of each phase's probability
- **Educational Cards:** Detailed descriptions of each Wyckoff phase with investment guidance
- **Data Sources:** Massive API (2yr SPY candles, primary) or OHLCV fallback chain (Finnhub → Polygon → Twelve → Alpha Vantage)
- **Cache:** `market_cycle_spy_v1` (24h TTL)
- **Dependencies:** Reuses `computeAllIndicators`, `computeSMA`, `fetchOHLCV` from `tech-analysis/calculations.ts`
- **Structure:** `types.ts`, `calculations.ts`, `market-cycle.md`

### Dividend Analysis (`src/dividend-analysis/index.tsx`)
Dividend history and sustainability analysis via Massive API.
- **History Table:** 10 most recent payments — ex-date, pay date, amount, type (recurring/special/irregular)
- **Metrics:** Yield %, annual recurring dividend, 3/5/10-year CAGR (recurring-only), payout ratio (% of EPS), consecutive growth streak
- **FCF Safety:** Payout ratio vs free cash flow for sustainability assessment
- **Data:** 40 payments fetched for CAGR accuracy, special dividends excluded from growth calculations
- **Structure:** `types.ts`, `calculations.ts`, `hooks/useDividendData.ts`, `components/` (MetricCards, SafetyScore, GrowthSection, PaymentHistory)

### Global Features
- **Sidebar Navigation:** Grouped into Valuation (DCF, DDM, Multiples), Fundamentals (Quality, 3-Statement, Peers), Market Intelligence (Technical, Earnings, Insider & Inst., News), and Income & Macro (Dividends, Market Cycle). 12 tabs total. Gradient background with active indicator pills (left accent bars), decorative group dividers, and version/status indicator.
- **Landing Page:** Hero section with animated gradient mesh background, market ticker bar (simulated indices), stats banner (87+ tickers, 12 modules, 6 data sources), and glassmorphism feature cards grouped by category (Valuation, Fundamentals, Market Intelligence, Income & Macro) with staggered entry animations via `motion` library.
- **Design System:** Financial terminal aesthetic defined in `src/index.css` using CSS custom properties (`--vw-bg-deep`, `--vw-accent`, `--vw-border`, `--vw-text-*`). Noise grain overlay, glass card utility (`.vw-card`), glow effects (`.vw-glow`), stat pills (`.vw-stat-up`/`.vw-stat-down`), gradient text (`.vw-gradient-text`), custom scrollbar styling.
- **Typography:** DM Sans (display/headers) + IBM Plex Mono (data/numbers). Imported via Google Fonts in `index.css`.
- **Dark Theme:** Deep navy-black background (`#0a0e17` / `--vw-bg-deep`) with layered surface colors.
- **localStorage Caching:** Versioned keys with `safeSetItem` eviction on quota exceeded
- **Clear Cache:** Button in sidebar to purge all cached data
- **Legend Click Isolation:** Every Recharts chart supports click-to-isolate series in legend

## Commands
- `netlify dev` — start dev server with Netlify functions (port 8888, proxies Vite on port 3000). **Required for API calls** — plain `npm run dev` won't serve the Netlify proxy function.
- `npm run dev` — start Vite-only dev server (port 3000). API calls will fail without the Netlify functions.
- `npm run build` — production build
- `npm run lint` — type-check (`tsc --noEmit`)

## Architecture
Vertical sidebar (w-56, `Sidebar.tsx`) with gradient background and grouped nav (Valuation | Fundamentals | Market Intelligence | Income & Macro). Each tab is a self-contained module directory. App shell in `dcf/index.tsx` uses `max-w-7xl` content area with subtle grid background pattern:

| Tab | File | Color |
|-----|------|-------|
| DCF Valuation | `src/dcf/index.tsx` | emerald |
| DDM | `src/ddm/index.tsx` | amber |
| Multiples | `src/multiples-analysis/index.tsx` | pink |
| Quality Analysis | `src/quality-analysis/index.tsx` | amber |
| 3-Statement Model | `src/three-statement/index.tsx` | cyan |
| Peers (Comp Analysis) | `src/peer-analysis/index.tsx` | blue |
| Tech Analysis | `src/tech-analysis/index.tsx` | violet |
| Earnings | `src/earnings-estimates/index.tsx` | cyan |
| Insider/Inst. | `src/insider-institutional/index.tsx` | orange |
| News Sentiment | `src/news-sentiment/index.tsx` | sky |
| Dividends | `src/dividend-analysis/index.tsx` | rose |
| Market Cycle | `src/market-cycle/index.tsx` | teal |

## Deployment
This application is configured for deployment on Netlify.

## API Constraints

### Financial Modeling Prep (FMP) — financial statements only (DCF + Quality Analysis)
Free tier: 250 calls/day. Used for the 3 financial statement endpoints (3 FMP calls per ticker, cached 24h).
Endpoints: `/stable/income-statement`, `/stable/balance-sheet-statement`, `/stable/cash-flow-statement`
Also used by 3-Statement Model (same `/stable/` endpoints). 3-Statement shares the DCF cache (`fmp_{sym}_dcf_v1`).
**All tabs are restricted to ~87 pre-selected tickers** defined in `SUPPORTED_TICKERS` (src/dcf/types.ts). Each tab uses a dropdown with autocomplete filtering. Market Data tabs (Tech, Earnings, Insider, News, Dividend) use the shared `TickerSearch` component (src/components/TickerSearch.tsx). Peer Analysis filters peer suggestions to supported tickers only.
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
- `safeSetItem()` evicts cache on QuotaExceededError — prefixes: `finnhub_`, `fmp_`, `valuwise_`, `tech_`, `earnings_`, `insider_`, `news_`, `dividend_`, `ddm_`, `stmt_`
- All `JSON.parse` from localStorage must be wrapped in try/catch
- DCF uses FMP standardized fields (no XBRL concept matching) — `operatingIncome`, `depreciationAndAmortization`, `capitalExpenditure`, etc.
- Page centering: root `max-w-7xl mx-auto` in app shell, then individual tab content uses appropriate widths
- Chart legend click isolation: EVERY Recharts chart (existing and new) MUST implement legend click isolation using `hiddenSeries` state + `handleLegendClick(d, chartKeys)` pattern with `hide` prop on ALL Line/Bar/Area elements
- Gemini JSON mode: use `generationConfig: { responseMimeType: 'application/json' }` + fallback regex `/\{[\s\S]*\}/`
- **Design system:** Use CSS custom properties from `index.css` (`--vw-*` tokens): `--vw-bg-deep` for base background, `--vw-bg-raised`/`--vw-bg-surface` for cards, `--vw-accent` for primary color (#00d4aa), `--vw-border` for borders. Use `.vw-card` class for glassmorphism panels. Use `.vw-stat-up`/`.vw-stat-down` for market signals.
- **Fonts:** DM Sans for UI text, IBM Plex Mono for financial data/numbers. Configured via `--font-sans` and `--font-mono` in `@theme` block.
- **Animations:** Use `motion` library (already installed) for entry animations. Prefer `initial`/`animate` pattern with staggered delays.

## Common Pitfalls
- Stale cache showing 0 values: bump cache key version (except `fmp_*_dcf_v1` — never bump)
- FMP returns `capitalExpenditure` as negative — always use `Math.abs()`
- DCF profile data comes from Finnhub: `marketCapitalization` is in millions (multiply by 1e6), `shareOutstanding` is in millions (multiply by 1e6)
- FMP `fiscalYear` field is used for year labels (not `calendarYear`)
- Payout ratio inflation: use Finnhub's `dividendsPerShareAnnual` from `/stock/metric`, not a 365-day rolling window (can capture 5 quarterly payments)
- Gemini model 404: older model IDs deprecated for new API keys — use `gemini-2.5-flash`
