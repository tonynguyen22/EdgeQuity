# ValuWise — Project Configuration

## Overview
Professional equity research and stock analysis platform. Features DCF valuation, DDM, multiples analysis, quality scoring, 3-statement modeling, peer analysis, technical indicators, earnings estimates, insider activity, news sentiment, dividend analysis, and market cycle detection across ~84 supported tickers. Single-page React app with sidebar navigation and 12 tab views, styled as a financial terminal.

## Tech Stack
- Framework: Vite + React 19
- Language: TypeScript (~5.8)
- Package Manager: npm
- Test Framework: none
- Build Tool: Vite 6
- Linter: tsc --noEmit (type checking only)
- CSS: Tailwind CSS v4 + custom design system (`--vw-*` tokens)
- Animation: motion library
- Charts: Recharts
- Deployment: Vercel (Vite static build plus `/api/http-proxy` serverless API proxy)

## Directory Structure
```
ValuWise/
├── index.html                    # SPA entry point
├── src/
│   ├── main.tsx                  # React root mount
│   ├── index.css                 # Design system (--vw-* tokens, fonts, utilities)
│   ├── components/               # Shared components (TickerSearch, TabLanding, SupportedTickersBySector)
│   ├── dcf/                      # DCF Valuation + app shell (Sidebar, LandingPage)
│   ├── ddm/                      # Dividend Discount Model
│   ├── multiples-analysis/       # Historical multiples (P/E, EV/EBITDA, etc.)
│   ├── quality-analysis/         # Financial quality scoring (A-D grades)
│   ├── three-statement/          # Linked Income/Balance/Cash Flow model
│   ├── peer-analysis/            # Comparable company analysis
│   ├── tech-analysis/            # Technical indicators (RSI, MACD, SMAs)
│   ├── earnings-estimates/       # EPS history & beat/miss tracking
│   ├── insider-institutional/    # Insider transaction tracking
│   ├── news-sentiment/           # News + AI sentiment (Gemini 2.5 Flash)
│   ├── dividend-analysis/        # Dividend history & sustainability
│   ├── market-cycle/             # Wyckoff market cycle detection (SPY)
│   └── utils/                    # Shared utilities
├── api/
│   └── http-proxy.js             # Vercel serverless API proxy
├── vite.config.ts                # Vite config with proxies for SEC EDGAR
├── vercel.json                   # Vercel deploy config, headers, and SEC rewrites
├── tsconfig.json                 # TypeScript config (ES2022, bundler resolution)
└── package.json                  # Dependencies and scripts
```

## Conventions
- Naming: camelCase for functions/variables, PascalCase for React components and type interfaces, kebab-case for module directories
- Import style: named imports (`import { useState } from 'react'`), type imports with `import type`
- Error handling: try/catch around localStorage JSON.parse, graceful fallbacks on API failure
- State management: React useState/useMemo/useCallback (no external state library)
- API pattern: REST calls to FMP, Finnhub, API Ninjas, Massive API, TAAPI.io, Gemini; proxied via Vite dev server + Vercel rewrites/API routes
- Test structure: none — no test files or test framework configured
- Module structure: each tab is a self-contained directory with `index.tsx`, `types.ts`, `calculations.ts`, `hooks/`, `components/`, `utils/`
- Design system: CSS custom properties (`--vw-*`) in `src/index.css`, utility classes (`.vw-card`, `.vw-glow`, `.vw-stat-up/.vw-stat-down`)
- Charts: Recharts with mandatory legend click isolation (`hiddenSeries` state + `handleLegendClick` pattern)
- Caching: localStorage with versioned keys, `safeSetItem()` eviction on quota exceeded

## Commands
- Install: `npm install`
- Dev: `npm run dev` (Vite, port 3000)
- Build: `npm run build` (vite build)
- Test: none configured
- Lint: `npm run lint` (tsc --noEmit)

## Key Files
- Entry point: `src/main.tsx`
- App shell: `src/dcf/index.tsx` (contains Sidebar, routing, and main layout)
- Design system: `src/index.css`
- Config: `vite.config.ts`, `tsconfig.json`, `vercel.json`, `package.json`
- Shared components: `src/components/TickerSearch.tsx`, `src/components/TabLanding.tsx`
- Supported tickers: `src/dcf/types.ts` (SUPPORTED_TICKERS constant)
- Project docs: `PROJECT.md` (detailed feature/API docs)
