# Detected Conventions

Generated: 2026-03-12

## Naming Patterns
- **Files**: kebab-case directories (`tech-analysis/`, `peer-analysis/`), camelCase TypeScript files (`calculations.ts`, `usePeerData.ts`)
- **Functions**: camelCase (`computeDCF`, `handleSearch`, `buildHistoricalYear`)
- **Components**: PascalCase (`App`, `Sidebar`, `LandingPage`, `MonteCarloSimulation`)
- **Types/Interfaces**: PascalCase (`DCFInputs`, `DCFResult`, `FMPIncomeStatement`)
- **Constants**: SCREAMING_SNAKE_CASE (`SUPPORTED_TICKERS`)
- **CSS tokens**: kebab-case with `--vw-` prefix (`--vw-bg-deep`, `--vw-accent`, `--vw-text-primary`)

## Import Style
- Named imports: `import { useState, useMemo } from 'react'`
- Type imports: `import type { DCFInputs, DCFResult } from './types'`
- Icon imports: Named from lucide-react (`import { Search, TrendingUp } from 'lucide-react'`)
- No barrel files (no `index.ts` re-exports) — direct file path imports
- Path alias: `@/*` maps to project root (configured in `tsconfig.json`)

## Module Structure (per tab)
Each tab module follows a consistent directory pattern:
```
src/<module-name>/
├── index.tsx          # Main component (renders full tab UI)
├── types.ts           # TypeScript interfaces and type definitions
├── calculations.ts    # Pure computation functions (no React dependencies)
├── hooks/             # Custom React hooks (data fetching, state management)
│   └── use<Name>Data.ts
├── components/        # Sub-components used by index.tsx
├── utils/             # Formatting, storage, export helpers
└── <module>.md        # Documentation (some modules)
```

## Error Handling
- `try/catch` around all `JSON.parse(localStorage.getItem(...))` calls
- API failures handled with loading/error state in hooks (graceful degradation)
- `throw new Error(...)` for critical data validation in calculation functions
- `safeSetItem()` wrapper for localStorage writes with quota eviction

## State Management
- React built-ins only: `useState`, `useMemo`, `useCallback`, `useEffect`, `useRef`
- No external state library (no Redux, Zustand, or Context API for global state)
- Each tab manages its own state independently

## Design System
- Custom CSS properties (`--vw-*`) defined in `:root` of `src/index.css`
- Utility classes: `.vw-card` (glass panel), `.vw-glow` (accent shadow), `.vw-stat-up/.vw-stat-down` (signal pills), `.vw-gradient-text`, `.vw-glass`, `.vw-shimmer`
- Fonts: DM Sans (UI) + IBM Plex Mono (numerical data), loaded via Google Fonts
- Dark theme only: deep navy palette (#080c14 base)
- Tailwind v4 with `@theme` block for custom scale overrides

## Charts (Recharts)
- Every chart MUST implement legend click isolation:
  - `hiddenSeries` state set + `handleLegendClick(e, chartKeys)` handler
  - `hide` prop on all `<Line>`, `<Bar>`, `<Area>` elements
- `tabular-nums` font-variant on data tables

## Caching
- localStorage with versioned key patterns: `fmp_{sym}_dcf_v1`, `finnhub_{symbol}_comp_data_v5`, `tech_{sym}_v1`, etc.
- `safeSetItem()` evicts oldest entries by prefix on `QuotaExceededError`
- Prefixes: `finnhub_`, `fmp_`, `valuwise_`, `tech_`, `earnings_`, `insider_`, `news_`, `dividend_`, `ddm_`, `stmt_`
- **Never bump `fmp_{sym}_dcf_v1`** — shared cache between DCF, Quality Analysis, and 3-Statement
- 24-hour TTL on all caches

## API Usage
- FMP: financial statements only (3 endpoints), restricted to SUPPORTED_TICKERS
- Finnhub: profile, metrics, quotes, peers, price targets, insider transactions, news sentiment
- API Ninjas: earnings calendar/upcoming + stock price
- Massive API: dividends
- TAAPI.io: technical indicators (bulk)
- Gemini 2.5 Flash: AI news sentiment analysis
