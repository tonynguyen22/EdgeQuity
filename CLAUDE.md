# Edgequity Project Configuration

## Overview

Edgequity is a static-data fundamental stock screener for value investors. It uses a generated JSON cache for financial statements and ratios, then refreshes selected-ticker quotes through Finnhub at runtime.

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
- `npm run edgequity:sec-statements`
- `npm run edgequity:fundamentals-charts`

## Notes

- Runtime UI should not call finance APIs directly; selected-ticker quotes go through `/api/http-proxy` and Finnhub.
- Data generation requires `FINNHUB_API_KEY` for screener raw cache (`metrics.json` includes historical ratio series).
- **Statements** tab: SEC EDGAR (`edgequity:sec-statements`, no API key).
- **Fundamentals** tab: `fundamentals-charts.json` from `edgequity:fundamentals-charts` (SEC facts + Finnhub series).
- Use `EDGEQUITY_MAX_TICKERS` or `EDGEQUITY_TICKERS` to control refresh scope.
- Keep the UI table-first, compact, and value-investor focused.
- The old multi-module app has been removed.
