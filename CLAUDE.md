# Edgequity Project Configuration

## Overview

Edgequity is a static-data fundamental stock screener for value investors. It uses a generated JSON cache instead of public runtime API calls, so the hosted app avoids free-tier API limits.

## Current Architecture

- `src/App.tsx` is the app shell.
- `src/edgequity` contains the active product code.
- `scripts/edgequity` contains static data generation and normalization.
- `public/data/edgequity` contains generated JSON consumed by the app.
- `.github/workflows/edgequity-data.yml` refreshes static data on demand or weekly.

## Deploy (Cloudflare Pages, free)

- Git connect: build `npm run build`, output `dist`, `NODE_VERSION=22`.
- Production URL: `https://<project-name>.pages.dev` (e.g. `edgequity.pages.dev`).
- See `docs/deploy-cloudflare-pages.md`.

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test:edgequity`
- `npm run test:edgequity:ui`
- `npm run edgequity:data`
- `npm run edgequity:sec-statements`
- `npm run edgequity:fundamentals-charts`

## Notes

- Runtime UI should not call finance APIs directly.
- Data generation requires `FINNHUB_API_KEY` for screener raw cache (`metrics.json` includes historical ratio series).
- **Statements** tab: SEC EDGAR (`edgequity:sec-statements`, no API key).
- **Fundamentals** tab: `fundamentals-charts.json` from `edgequity:fundamentals-charts` (SEC facts + Finnhub series).
- Optional: `FMP_API_KEY` for legacy `edgequity:data` pipeline only.
- The generator defaults to a safe FMP call budget. Use `EDGEQUITY_MAX_TICKERS`, `EDGEQUITY_TICKERS`, or `EDGEQUITY_FMP_CALL_BUDGET` to control refresh scope.
- Keep the UI table-first, compact, and value-investor focused.
- The old multi-module app has been removed.
