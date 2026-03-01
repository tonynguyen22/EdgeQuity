# ValuWise — Project Instructions

## Overview
React + TypeScript + Vite + Tailwind v4 stock analysis app. Single-page with sidebar navigation and 9 tab views.

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
