# Edgequity Project Configuration

## Overview

Edgequity is a static-data fundamental stock screener for value investors. It uses a generated JSON cache for FMP free-tier three-statement financials and ratios, then refreshes selected-ticker quotes through Finnhub at runtime.

## Current Architecture

- `src/App.tsx` is the app shell.
- `src/edgequity` contains the active product code.
- `scripts/edgequity` contains static data generation and normalization.
- `public/data/edgequity` contains generated JSON consumed by the app.
- `.github/workflows/edgequity-data.yml` refreshes static data on demand or weekly.

## Deploy

- **Vercel (preferred):** `npm run build` (full data), output `dist`. See `docs/deploy-vercel.md`.
- **GitHub Pages:** workflow `deploy-github-pages.yml`, `npm run build`, URL `https://tonynguyen22.github.io/EdgeQuity/`.
- **Cloudflare Pages:** `npm run build:cf` (slim only); no `wrangler.toml`. See `docs/deploy-cloudflare-pages.md`.

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test:edgequity`
- `npm run test:edgequity:ui`
- `npm run edgequity:data`
- `npm run edgequity:sec-statements` - legacy SEC cache utility, not used by the main Edgequity detail tabs.
- `npm run edgequity:fundamentals-charts` - legacy SEC/Finnhub chart cache utility, not used by the main Edgequity detail tabs.

## Notes

- Runtime UI should not call finance APIs directly; selected-ticker quotes go through `/api/http-proxy` and Finnhub.
- Data generation requires `FMP_API_KEY` for income statement, balance sheet, and cash flow data.
- Runtime selected-ticker quote refreshes use `FINNHUB_API_KEY`; static data generation does not require it.
- **Statements** tab: selected stock record `financialStatements.annual` from FMP, with a static summary fallback.
- **Fundamentals** tab: chart sections derived from annual and quarterly FMP statement data on the selected stock record.
- Use `EDGEQUITY_MAX_TICKERS`, `EDGEQUITY_TICKERS`, or `EDGEQUITY_FMP_CALL_BUDGET` to control refresh scope.
- Keep the UI table-first, compact, and value-investor focused.
- The old multi-module app has been removed.
