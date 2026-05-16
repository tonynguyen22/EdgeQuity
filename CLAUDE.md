# Edgequity Project Configuration

## Overview

Edgequity is a static-data fundamental stock screener for value investors. It uses a generated JSON cache instead of public runtime API calls, so the hosted app avoids free-tier API limits.

## Current Architecture

- `src/App.tsx` is the app shell.
- `src/edgequity` contains the active product code.
- `scripts/edgequity` contains static data generation and normalization.
- `public/data/edgequity` contains generated JSON consumed by the app.
- `.github/workflows/edgequity-data.yml` refreshes static data on demand or weekly.

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test:edgequity`
- `npm run test:edgequity:ui`
- `npm run edgequity:data`

## Notes

- Runtime UI should not call finance APIs directly.
- Data generation requires `FMP_API_KEY` and `FINNHUB_API_KEY`.
- The generator defaults to a safe FMP call budget. Use `EDGEQUITY_MAX_TICKERS`, `EDGEQUITY_TICKERS`, or `EDGEQUITY_FMP_CALL_BUDGET` to control refresh scope.
- Keep the UI table-first, compact, and value-investor focused.
- The old multi-module app has been removed.
