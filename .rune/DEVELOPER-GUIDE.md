# Developer Guide: ValuWise

## What This Does
ValuWise is a professional equity research platform that provides DCF valuation, dividend discount models, multiples analysis, quality scoring, 3-statement financial modeling, peer comparison, technical analysis, and AI-powered news sentiment for ~87 publicly traded stocks. It's used by individual investors and analysts for fundamental and market intelligence research.

## Quick Setup
```bash
# Install dependencies
npm install

# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Run development server (with API proxy — REQUIRED for API calls to work)
netlify dev

# Alternative: Vite-only dev server (API calls will fail without Netlify functions)
npm run dev

# Type-check
npm run lint

# Production build
npm run build
```

> **Note**: You must use `netlify dev` (port 8888) instead of `npm run dev` for the full application to work. The Netlify dev server proxies Vite (port 3000) and provides serverless functions that proxy SEC EDGAR API requests to avoid CORS issues.

## Key Files
- `src/main.tsx` — React app entry point (mounts `<App />` from `src/dcf/`)
- `src/dcf/index.tsx` — App shell with Sidebar, routing logic, and DCF valuation tab
- `src/index.css` — Design system: CSS custom properties (`--vw-*`), utility classes, fonts
- `src/dcf/types.ts` — Shared types (`DCFInputs`, `DCFResult`) + `SUPPORTED_TICKERS` array
- `src/dcf/calculations.ts` — Core DCF computation engine
- `src/components/TickerSearch.tsx` — Shared ticker search/autocomplete component
- `vite.config.ts` — Vite build + dev server proxy config
- `netlify.toml` — Netlify deployment + redirect rules for SEC EDGAR CORS proxy
- `PROJECT.md` — Comprehensive project documentation (features, APIs, conventions)

## How to Contribute
1. Fork or branch from main
2. Make changes — each tab is a self-contained module in `src/<module-name>/`
3. Type-check your changes: `npm run lint`
4. Open a PR — describe what and why

## Common Issues
- **API calls returning errors / CORS failures** → You're running `npm run dev` instead of `netlify dev`. The Netlify dev server is required for API proxy functions.
- **Stale data showing zero values** → Clear the app cache using the "Clear Cache" button in the sidebar, or manually clear localStorage entries with the relevant prefix.
- **FMP API 429 (rate limit)** → Free tier allows 250 calls/day. Data is cached for 24h — avoid clearing cache unnecessarily.
- **Gemini API 404** → Older model IDs are deprecated. Ensure you're using `gemini-2.5-flash` via `v1beta` REST API.
- **Missing `.env` file** → Copy `.env.example` to `.env` and populate API keys for FMP, Finnhub, API Ninjas, Massive API, TAAPI.io, and Google AI.
