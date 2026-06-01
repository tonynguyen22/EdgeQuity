# Edgequity Project Brain

Last updated: 2026-06-01

## One-line model

Edgequity is a Vite + React static-data stock screener for AI infrastructure names. Data is built ahead of time into JSON under `public/data/edgequity`; the browser loads those files, renders a dense fundamental table, and enriches a selected ticker with cached Finnhub profile, quote, and metric data through serverless API routes.

## Current product shape

The current codebase is Edgequity, not the older ValuWise multi-tab valuation terminal described in stale project instructions. Treat `src/edgequity` and `scripts/edgequity` as the source of truth.

User-facing app flow:

1. `src/main.tsx` mounts `src/App.tsx`.
2. `App` calls `loadAllEdgequityStocks()` from `src/edgequity/data.ts`.
3. `loadAllEdgequityStocks()` fetches `/data/edgequity/manifest.json`, validates it, then fetches each `stocks/*.json` record listed in the manifest.
4. Loaded records render in `ScreenerTable` with query filter, sector filter, grouped columns, and sortable metrics.
5. Clicking a row sets `selectedTicker` and renders `StockDetail`.
6. `StockDetail` shows static KPIs immediately, then calls `/api/edgequity/finnhub-snapshot?ticker=...` for cached Finnhub profile, quote, and ratio series.
7. Detail charts are built from embedded normalized SEC statement periods in each stock JSON, with Finnhub ratio series overriding selected margin series when available.

## Data model

Core schema lives in `src/edgequity/types.ts`.

Main record: `EdgequityStockRecord`

Important sections:

- Identity: `ticker`, `name`, `sector`, `industry`, `currency`.
- Market data: `price`, `marketCap`, `enterpriseValue`.
- Metric groups: `valuation`, `profitability`, `growth`, `financialHealth`, `cashFlow`, `dividends`.
- History: annual summary rows used as fallback chart/table data.
- Financial statements: normalized annual and quarterly income statement, balance sheet, and cash flow periods.
- Research metadata: earnings calendar, transcript metadata, statement quality, warnings, sources.

Data rules:

- Missing numeric data is `null`, not `0`.
- Ratios in stock JSON are decimals unless a chart function explicitly converts to percentage points.
- Money values are full units, not millions.
- Public JSON must not contain provider API keys.
- Generated JSON should stay deterministic: sorted tickers, two-space indentation, trailing newline.

## Static data pipeline

Primary builder: `scripts/edgequity/build-static-data.ts`

Pipeline:

1. Read `FINNHUB_API_KEY`.
2. Select universe from `EDGEQUITY_TICKERS` or full `AI_INFRASTRUCTURE_UNIVERSE` in `scripts/edgequity/ai-universe.ts`.
3. For each ticker, fetch Finnhub profile, metrics, quote, earnings metadata, transcript metadata, and SEC normalized statement data.
4. Normalize metrics through `scripts/edgequity/normalize.ts`.
5. Embed normalized financial statements and quality metadata.
6. Publish atomically to `public/data/edgequity/stocks/*.json` and `public/data/edgequity/manifest.json`.

Universe theme groups:

- AI Semiconductors
- Semiconductor Equipment
- Cloud & AI Platforms
- Enterprise AI Software
- Cybersecurity
- Data Center Networking
- AI Servers & Hardware
- Power & Cooling Infrastructure
- Data Center REITs
- AI Apps & Automation

Workflow automation:

- `.github/workflows/edgequity-data.yml` refreshes static data weekly Monday 09:00 UTC or manually.
- It runs `npm run edgequity:data`, `npm run lint`, `npm run build`, then commits changed `public/data/edgequity` files.
- Required secrets: `FINNHUB_API_KEY`; workflow still names `FMP_API_KEY`, but current builder requires Finnhub and SEC paths.

## Runtime APIs

`api/http-proxy.js`

- POST-only generic proxy.
- Allows a fixed host set: Finnhub, Massive, Polygon, Twelve Data, Alpha Vantage, TAAPI, ShopAIKey, Gemini.
- Injects provider keys from environment when missing or placeholder-like.
- Used by `src/utils/proxyFetch.ts` for quote refreshes.

`api/edgequity/finnhub-snapshot.js`

- GET-only ticker snapshot route.
- Validates ticker with `isValidTicker()`.
- Calls `buildFinnhubSnapshot()` in `api/edgequity-finnhub-cache.js`.
- Uses `FINNHUB_API_KEY` and `EDGEQUITY_CACHE_DIR` or `/tmp/edgequity-finnhub-cache`.

Finnhub cache TTLs:

- Profile: 30 days.
- Quote: 60 seconds.
- Metrics: 12 hours.

## Frontend architecture

Top-level:

- `src/App.tsx`: load state, selected ticker state, error/loading branches, page shell.
- `src/index.css`: Tailwind v4 plus `--vw-*` design tokens and Edgequity component classes.

Screener:

- `src/edgequity/metrics.ts`: column definitions, accessors, formatting.
- `src/edgequity/components/ScreenerToolbar.tsx`: query and sector controls.
- `src/edgequity/components/ScreenerTable.tsx`: grouped sortable table, sticky ticker/name columns, row selection.
- `src/edgequity/components/MetricCell.tsx`: formatted values with group styling.

Detail view:

- `src/edgequity/components/StockDetail.tsx`: ticker hero, KPI strip, warning notes, company profile, price summary, fundamentals charts.
- `src/edgequity/finnhub-analysis.ts`: Finnhub snapshot validation and ratio series extraction.
- `src/edgequity/fundamentals-charts.ts`: chart document builder from embedded statement periods.
- `src/edgequity/components/MetricTrendChart.tsx`: Recharts rendering.

State:

- Plain React `useState`, `useMemo`, `useEffect`, `useRef`.
- No router, no external state library.
- Selected ticker is local state in `App`.

## Commands

Install:

`npm install`

Development:

`npm run dev`

Build:

`npm run build`

Type check:

`npm run lint`

Data tests:

`npm run test:edgequity`

UI/component tests:

`npm run test:edgequity:ui`

Refresh static data:

`npm run edgequity:data`

Audit NVDA data:

`npm run edgequity:audit-data:nvda`

Audit deterministic sample:

`npm run edgequity:audit-data -- --sample=10 --seed=2026-05-31`

Audit full universe:

`npm run edgequity:audit-data -- --sample=50 --seed=full-universe`

Refresh selected tickers:

`EDGEQUITY_TICKERS=NVDA,AMD npm run edgequity:data`

## Design principles

- Keep app table-first and dense, like a value-investor workbench.
- Avoid marketing pages, hero sections, decorative cards, and generic dashboard filler.
- Use existing `--vw-*` tokens and Edgequity CSS classes before adding new style systems.
- Keep table dimensions stable: fixed column widths, sticky columns, no dynamic layout jumps.
- Prefer compact financial labels and monospaced numeric output.
- If adding charts, preserve scanability and avoid chart chrome that competes with table workflow.

## Testing pattern

Configured tests use Node's test runner through `tsx --test`.

Current scripts:

- `test:edgequity`: script/data normalization tests.
- `test:edgequity:ui`: frontend data, metrics, analysis, branding, fundamentals, and component tests.
- `lint`: TypeScript `tsc --noEmit`.

Before claiming completion on code changes, run relevant tests plus `npm run lint`; for broad app changes also run `npm run build`.

## Known gotchas

- `AGENTS.md` is the durable project brain; `CURRENT_WORK.md` is the current handoff/status brain.
- `public/data/edgequity/raw/` is currently untracked in this workspace.
- `stocks/` contains generated/static HTML-looking artifacts and is untracked.
- `docs/superpowers/plans/2026-05-27-finnhub-ai-analysis.md` is untracked.
- `.agents/skills/settings.local.json` is untracked local config.
- Do not commit or delete untracked files unless user asks.
- Frontend uses both static-data detail charts and live cached Finnhub enrichment; do not assume all detail data comes from one provider.
- The generic proxy allowlist contains providers from the older app; check whether each host is still needed before widening or removing.

## Good next enhancements

- Reconcile workflow/env docs around `FMP_API_KEY` vs current Finnhub-driven builder.
- Add a small architecture diagram to docs if onboarding more contributors.
- Consider URL state for selected ticker/filtering if shareable links matter.
- Clarify whether the untracked raw data and stock HTML artifacts should be generated outputs, fixtures, or ignored.
