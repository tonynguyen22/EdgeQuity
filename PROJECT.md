# Edgequity Project Instructions

## Overview

Edgequity is a static-data fundamental stock screener for value investors. The public app does not call finance APIs at runtime. Instead, a local or GitHub Actions data job fetches the supported stock universe, normalizes the records, writes JSON files under `public/data/edgequity`, and the React app renders those files as a table-first screener with a stock detail page.

## Tech Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 and the existing `--vw-*` design tokens in `src/index.css`
- Node/tsx scripts for static data generation and tests
- GitHub Actions for scheduled JSON refreshes

## App Structure

- `src/App.tsx` loads all static stock records and switches between the screener table and selected stock detail page.
- `src/edgequity/types.ts` defines the static data schema.
- `src/edgequity/universe.ts` defines the supported ticker universe.
- `src/edgequity/data.ts` validates and loads the static JSON files.
- `src/edgequity/metrics.ts` defines table columns and formatting.
- `src/edgequity/components/ScreenerTable.tsx` renders the sortable/filterable table.
- `src/edgequity/components/StockDetail.tsx` renders the drilldown page.
- `scripts/edgequity/build-static-data.ts` fetches API data and writes static JSON.
- `scripts/edgequity/normalize.ts` converts raw provider payloads into Edgequity records.
- `public/data/edgequity/manifest.json` lists available static records.
- `public/data/edgequity/stocks/*.json` contains one normalized stock record per ticker.

## Commands

- `npm run dev` - start Vite on port 3000.
- `npm run build` - production build.
- `npm run lint` - TypeScript check with `tsc --noEmit`.
- `npm run test:edgequity` - data normalization tests.
- `npm run test:edgequity:ui` - loader, formatter, and component tests.
- `npm run edgequity:data` - generate static stock data. Requires API keys.

## Static Data Refresh

Edgequity reads static JSON from `public/data/edgequity` at runtime. To refresh data in GitHub Actions, configure repository secrets:

- `FMP_API_KEY`
- `FINNHUB_API_KEY`

The `Refresh Edgequity static data` workflow can be run manually and also runs weekly on Monday at 09:00 UTC. The generator has a free-tier budget guard for FMP requests. The workflow sets `EDGEQUITY_MAX_TICKERS: 80` because each ticker uses 3 FMP calls, matching the default 240-call budget. To change the refresh universe, set `EDGEQUITY_MAX_TICKERS`, set `EDGEQUITY_TICKERS` to a comma-separated subset, or intentionally raise `EDGEQUITY_FMP_CALL_BUDGET`.

## Data Rules

- Use `null` for unavailable numeric values, not `0`.
- Store ratios as decimals, for example `0.25` for 25%.
- Store money values in full units, not millions.
- Keep generated JSON deterministic: sorted tickers, two-space indentation, trailing newline.
- Do not store API keys in generated files.
- The public UI should read only static JSON and should not require secrets.

## Design Direction

Edgequity should feel like a dense value-investor workbench: restrained, table-first, and built for scanning. Avoid landing-page sections, marketing copy, decorative hero layouts, or generic dashboard clutter. Use the existing dark financial-terminal tokens, compact controls, stable table dimensions, and readable mono formatting for numbers.

## Legacy Cleanup

The old multi-tab valuation terminal modules were intentionally removed. Do not reintroduce DCF, DDM, technical analysis, news sentiment, earnings, insider, dividend, peer, quality, multiples, market-cycle, or 3-statement feature folders unless the product direction changes again.
