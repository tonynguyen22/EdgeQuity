---
name: Modular Component Refactor
description: Refactor a monolithic React/TSX component file into a modular folder structure with separated concerns (types, calculations, hooks, utils, components, app shell).
---

# Modular Component Refactor

Break a large single-file React component into a clean folder structure following the ValuWise module pattern established by `src/dcf/` and `src/peer-analysis/`.

## Target Folder Structure

```
src/<module-name>/
├── index.tsx                # Slim app shell — imports hook, computes derived memos, renders components
├── <module-name>.md         # Module documentation (folder structure, data flow, file reference)
├── types.ts                 # All TypeScript interfaces & types (leaf — no imports)
├── calculations.ts          # Pure functions only (no React deps, safe for unit testing)
├── hooks/
│   └── use<Module>Data.ts   # Custom hook: all state management + API fetching + caching
├── utils/
│   ├── formatters.ts        # Number/string formatting helpers
│   ├── storage.ts           # localStorage helpers (safeSetItem, cache clearing)
│   └── excel.ts             # Excel/CSV export utilities (if applicable)
└── components/
    ├── <Component1>.tsx      # Focused UI components — one per visual section
    ├── <Component2>.tsx
    └── ...
```

## Step-by-Step Process

### 1. Analyze the Monolith

- Read the entire source file and create a mental map of:
  - **State variables** (useState hooks)
  - **Event handlers** (functions that call setState)
  - **Data fetching** (async functions, API calls, caching)
  - **Pure calculations** (functions with no side effects, no React deps)
  - **Formatting helpers** (currency, percentage, multiplier formatters)
  - **Sub-components** (inline components defined inside the main function)
  - **JSX sections** (distinct visual blocks in the return statement)

### 2. Identify Import References

- Search the codebase for all files that import the monolith
- Note the exact import path and usage (default export, named exports, component name in JSX)
- These will need updating after the refactor

### 3. Create Foundation Files (dependency order)

Create files in this order so each can import from the previous:

#### `types.ts`
- Extract ALL interfaces, type aliases, and type unions
- Every shape used across 2+ files should be here
- This file has NO imports from other module files (leaf node)

#### `utils/formatters.ts`
- Extract formatting functions (formatCurrency, formatPct, etc.)
- Pure functions, no React deps, no module-internal imports

#### `utils/storage.ts`
- Extract localStorage helpers (safeSetItem, cache clearing)
- Pure functions, no React deps

#### `utils/excel.ts` (if applicable)
- Extract export-to-Excel/CSV logic
- Imports from `types.ts` and `utils/formatters.ts` only

#### `calculations.ts`
- Extract ALL pure computation functions
- **Rule:** No `React`, no `useState`, no `useEffect`, no DOM access
- These are functions that take data in and return data out
- Examples: statistical calculations, derived metrics, sorting logic, color generators
- Import from `types.ts` only

#### `hooks/use<Module>Data.ts`
- Extract the custom hook containing:
  - All `useState` declarations
  - All event handler functions (that call setState)
  - All data-fetching async functions
  - Internal helpers used only during fetching (e.g., `findConcept`)
- The hook returns an object with all state values and handler functions
- Import from `types.ts` and `utils/` only

### 4. Create Component Files

For each distinct visual section in the JSX:

- Create a separate `components/<Name>.tsx` file
- Define a clear `Props` interface listing exactly what the component needs
- Move any inline sub-components (SortTh, Sparkline, etc.) into the relevant component file
- Import from `types.ts`, `utils/formatters.ts`, and `calculations.ts` as needed
- Components should be purely presentational where possible

**Splitting heuristic:** Each component should correspond to one `<div className="bg-slate-800/50 ...">` card/section in the original JSX.

### 5. Create the App Shell (`index.tsx`)

- Import the custom hook
- Import all calculation functions
- Import all components
- Wire `useMemo` calls that compute derived data from hook state + pure functions
- Render components with props from hook + derived memos
- **Target: ~100-150 lines** — if it's much longer, extract more into components

### 6. Update External References

- Update all import paths in files that previously imported the monolith
- Update any display labels if renaming (sidebar, landing page, etc.)
- Delete the old monolith file

### 7. Create Module Documentation

Create `<module-name>.md` following this structure:

```markdown
# `src/<module-name>/` — <Module Title>
## Folder Structure        (tree diagram)
## Data Flow               (text diagram: user action → hook → calculations → components)
## File Reference           (one section per file with exports, props, description)
## Import Dependency Graph  (text diagram showing no circular deps)
```

### 8. Verify

1. **Type check:** `npx tsc --noEmit` must pass with zero errors
2. **Browser test:** Navigate to the module's tab and verify it loads
3. **Functional test:** Exercise the main user flows (search, data loading, interactions)

## Rules & Conventions

- **No circular dependencies** — the dependency graph must be a DAG
- **Leaf files** (`types.ts`, `utils/formatters.ts`) import nothing from the module
- **Pure functions** in `calculations.ts` — no React, no side effects
- **Single responsibility** — each component file handles one visual section
- **Consistent naming** — hook is `use<Module>Data`, types file is `types.ts`
- **API keys** stay in the hook file (or use environment variables)
- **Cache keys** follow the pattern `finnhub_{symbol}_<module>_data_v<N>`
- **The old monolith file must be deleted** — don't leave it around

## Reference Examples

- `src/dcf/` — DCF Valuation Module (documented in `src/dcf/dcf.md`)
- `src/peer-analysis/` — Peer Analysis Module (documented in `src/peer-analysis/peer-analysis.md`)
