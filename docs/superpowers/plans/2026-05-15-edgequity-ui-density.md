# Edgequity UI Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Edgequity into a denser analyst-sheet screener with a more polished stock detail page.

**Architecture:** Keep the existing React static-data architecture. Update only the Edgequity presentation layer: table layout, metric cell styling, stock detail composition, toolbar density, and focused CSS utilities. Tests should lock in structural classes and important rendered labels without over-testing visual pixels.

**Tech Stack:** React, TypeScript, Tailwind CSS v4 utility classes, Node `tsx --test`, Vite.

---

## File Structure

- Modify `src/edgequity/components/state.test.tsx` to add tests for sticky table columns, compact header labels, grouped table boundaries, and the stock detail analyst-sheet sections.
- Modify `src/edgequity/components/ScreenerTable.tsx` to reduce table width, abbreviate labels, add sticky ticker/company columns, add metric group separators, and tighten row/header classes.
- Modify `src/edgequity/components/MetricCell.tsx` to support sticky cells, compact padding, group separators, and accent classes for selected numeric values.
- Modify `src/edgequity/components/ScreenerToolbar.tsx` to make controls denser and better aligned with the table.
- Modify `src/edgequity/components/StockDetail.tsx` to replace the current simple card stack with the approved analyst-sheet layout.
- Modify `src/index.css` to add focused reusable utility classes for dense tables, sticky table shadows, metric panels, and subtle accent states.

## Task 1: Tests For Dense Screener Structure

**Files:**
- Modify: `src/edgequity/components/state.test.tsx`
- Test: `src/edgequity/components/state.test.tsx`

- [ ] **Step 1: Add failing tests for compact table structure**

Add these tests near the existing `ScreenerTable` tests:

```tsx
test('ScreenerTable renders compact analyst table labels and sticky identifier columns', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[stock]} onSelectStock={() => undefined} />);

  assert.match(html, /eq-table-shell/);
  assert.match(html, /eq-sticky-col/);
  assert.match(html, />MCap</);
  assert.match(html, />Fwd P\/E</);
  assert.match(html, />FCFY</);
  assert.doesNotMatch(html, />Market Cap</);
  assert.doesNotMatch(html, />FCF Yield</);
});

test('ScreenerTable marks metric group boundaries for faster scanning', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[stock]} onSelectStock={() => undefined} />);

  assert.match(html, /eq-group-start/);
  assert.match(html, /aria-label="Sort by FCFY descending"/);
});
```

- [ ] **Step 2: Run the UI tests and confirm they fail**

Run: `npm run test:edgequity:ui`

Expected: FAIL because `eq-table-shell`, `eq-sticky-col`, compact labels, and `eq-group-start` do not exist yet.

- [ ] **Step 3: Commit the failing tests**

Run:

```bash
git add src/edgequity/components/state.test.tsx
git commit -m "test: specify dense Edgequity screener layout"
```

## Task 2: Implement Dense Screener Table

**Files:**
- Modify: `src/edgequity/components/ScreenerTable.tsx`
- Modify: `src/edgequity/components/MetricCell.tsx`
- Modify: `src/edgequity/components/ScreenerToolbar.tsx`
- Modify: `src/index.css`
- Test: `src/edgequity/components/state.test.tsx`

- [ ] **Step 1: Add compact label and width helpers in `ScreenerTable.tsx`**

Add these helpers below `getNextSort`:

```tsx
const COMPACT_COLUMN_LABELS: Record<string, string> = {
  marketCap: 'MCap',
  forwardPe: 'Fwd P/E',
  priceToSales: 'P/S',
  priceToBook: 'P/B',
  evToEbitda: 'EV/EBITDA',
  fcfYield: 'FCFY',
  grossMargin: 'Gross',
  operatingMargin: 'Op Mgn',
  netMargin: 'Net Mgn',
  revenueCagr3y: 'Rev 3Y',
  fcfCagr3y: 'FCF 3Y',
  currentRatio: 'Curr',
  debtToEquity: 'D/E',
  netDebtToEbitda: 'ND/EBITDA',
  fcfMargin: 'FCF Mgn',
  fcfConversion: 'FCF Conv',
  dividendYield: 'Div Yld',
};

function getCompactColumnLabel(column: EdgequityColumn): string {
  return COMPACT_COLUMN_LABELS[column.id] ?? column.label;
}

function isGroupStart(index: number): boolean {
  if (index === 0) return false;
  return EDGEQUITY_COLUMNS[index - 1].group !== EDGEQUITY_COLUMNS[index].group;
}
```

Replace `getColumnWidthClass` with:

```tsx
function getColumnWidthClass(column: EdgequityColumn): string {
  if (column.id === 'ticker') return 'w-[72px] min-w-[72px]';
  if (column.id === 'name') return 'w-[168px] min-w-[168px]';
  if (column.id === 'sector') return 'w-[118px] min-w-[118px]';
  if (column.format === 'money') return 'w-[92px] min-w-[92px]';
  if (column.format === 'percent') return 'w-[74px] min-w-[74px]';
  return 'w-[82px] min-w-[82px]';
}
```

- [ ] **Step 2: Update the table markup in `ScreenerTable.tsx`**

Change the card wrapper to:

```tsx
<section className="vw-card eq-table-shell overflow-hidden">
```

Change the table wrapper and table to:

```tsx
<div className="eq-scrollbar overflow-x-auto">
  <table className="min-w-[1900px] table-fixed border-collapse text-[12px]">
```

Inside the column map, change the callback to include `index`:

```tsx
{EDGEQUITY_COLUMNS.map((column, index) => {
```

Use this `th` class:

```tsx
className={`${getColumnWidthClass(column)} ${column.id === 'ticker' || column.id === 'name' ? 'eq-sticky-col' : ''} ${column.id === 'name' ? 'eq-sticky-name' : ''} ${isGroupStart(index) ? 'eq-group-start' : ''} px-2 py-1.5 text-[10px] font-semibold uppercase`}
```

Replace the rendered header label with:

```tsx
<span className="truncate">{getCompactColumnLabel(column)}</span>
```

Pass the column index into `MetricCell`:

```tsx
<MetricCell key={column.id} stock={stock} column={column} columnIndex={index} />
```

- [ ] **Step 3: Update `MetricCell.tsx` for compact sticky cells**

Change the props interface to:

```tsx
interface MetricCellProps {
  stock: EdgequityStockRecord;
  column: EdgequityColumn;
  columnIndex: number;
}
```

Change the component signature and add class helpers:

```tsx
export default function MetricCell({ stock, column, columnIndex }: MetricCellProps) {
  const value = getColumnValue(stock, column);
  const formattedValue = formatEdgequityValue(value, column.format);
  const isText = column.format === 'text';
  const isMissing = formattedValue === '-';
  const isSticky = column.id === 'ticker' || column.id === 'name';
  const groupStart = columnIndex > 0 ? 'eq-group-start' : '';
  const stickyClass = isSticky ? `eq-sticky-col ${column.id === 'name' ? 'eq-sticky-name' : ''}` : '';
  const accentClass = getAccentClass(column.id, value);
  const valueClassName = isText
    ? 'text-left'
    : `text-right font-mono tabular-nums ${isMissing ? 'text-[var(--vw-text-tertiary)]' : accentClass}`;
```

Return:

```tsx
return (
  <td className={`px-2 py-1.5 text-[12px] ${stickyClass} ${groupStart} ${valueClassName}`}>
    <span className={column.id === 'ticker' ? 'font-mono font-semibold text-[var(--vw-accent)]' : ''}>
      {formattedValue}
    </span>
  </td>
);
```

Add the helper below the component:

```tsx
function getAccentClass(columnId: string, value: string | number | null): string {
  if (typeof value !== 'number') return '';
  if (columnId === 'fcfYield' && value >= 0.03) return 'text-[var(--vw-green)]';
  if ((columnId === 'grossMargin' || columnId === 'operatingMargin' || columnId === 'netMargin') && value >= 0.25) {
    return 'text-[var(--vw-green)]';
  }
  if (columnId === 'debtToEquity' && value > 2) return 'text-[var(--vw-amber)]';
  return '';
}
```

- [ ] **Step 4: Compact `ScreenerToolbar.tsx`**

Change the root class to:

```tsx
className="flex flex-col gap-2 border-b px-2.5 py-2 sm:flex-row sm:items-center"
```

Change input/select/button heights from `h-9` to `h-8`, input padding to `px-2.5`, and button padding to `px-2.5`.

- [ ] **Step 5: Add CSS utilities in `src/index.css`**

Append these utilities near the existing `.vw-card` utilities:

```css
.eq-table-shell {
  border-radius: 8px;
}

.eq-table-shell table {
  background: rgba(8, 12, 20, 0.58);
}

.eq-table-shell thead th {
  letter-spacing: 0;
}

.eq-table-shell tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.012);
}

.eq-sticky-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--vw-bg-raised);
}

thead .eq-sticky-col {
  z-index: 12;
}

.eq-sticky-name {
  left: 72px;
  box-shadow: 10px 0 18px -18px rgba(0, 0, 0, 0.9);
}

.eq-group-start {
  border-left: 1px solid rgba(109, 133, 162, 0.28);
}

.eq-scrollbar {
  scrollbar-gutter: stable;
}
```

- [ ] **Step 6: Run tests and commit**

Run: `npm run test:edgequity:ui`

Expected: PASS.

Run:

```bash
git add src/edgequity/components/ScreenerTable.tsx src/edgequity/components/MetricCell.tsx src/edgequity/components/ScreenerToolbar.tsx src/index.css
git commit -m "feat: densify Edgequity screener table"
```

## Task 3: Tests For Analyst Stock Detail

**Files:**
- Modify: `src/edgequity/components/state.test.tsx`
- Test: `src/edgequity/components/state.test.tsx`

- [ ] **Step 1: Add a failing detail-page structure test**

Add this test after the existing stock detail test:

```tsx
test('StockDetail renders the analyst sheet layout sections', () => {
  const detailStock: EdgequityStockRecord = {
    ...stock,
    warnings: ['Revenue history is partially estimated'],
  };
  const html = renderToStaticMarkup(<StockDetail stock={detailStock} onBack={() => undefined} />);

  assert.match(html, /eq-detail-hero/);
  assert.match(html, /eq-kpi-strip/);
  assert.match(html, /eq-metric-panel/);
  assert.match(html, /Investment notes/);
  assert.match(html, /Historical fundamentals/);
});
```

- [ ] **Step 2: Run the UI tests and confirm the new test fails**

Run: `npm run test:edgequity:ui`

Expected: FAIL because the new detail layout classes and `Investment notes` heading do not exist yet.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add src/edgequity/components/state.test.tsx
git commit -m "test: specify Edgequity analyst detail layout"
```

## Task 4: Implement Analyst Stock Detail

**Files:**
- Modify: `src/edgequity/components/StockDetail.tsx`
- Modify: `src/index.css`
- Test: `src/edgequity/components/state.test.tsx`

- [ ] **Step 1: Replace the top-level detail layout in `StockDetail.tsx`**

Use this structure for the component return:

```tsx
return (
  <div className="space-y-3">
    <button type="button" className="eq-back-button" onClick={onBack}>
      Back to screener
    </button>

    <section className="eq-detail-hero">
      <div className="min-w-0">
        <p className="font-mono text-xs font-semibold uppercase text-[var(--vw-accent)]">{stock.ticker}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal">{stock.name}</h2>
        <p className="mt-1 text-sm text-[var(--vw-text-secondary)]">{sectorLine}</p>
      </div>
      <div className="eq-kpi-strip">
        <HeaderMetric label="Price" value={`${stock.currency ?? 'USD'} ${formatEdgequityValue(stock.price, 'number')}`} />
        <HeaderMetric label="Market Cap" value={formatEdgequityValue(stock.marketCap, 'money')} />
        <HeaderMetric label="Enterprise Value" value={formatEdgequityValue(stock.enterpriseValue, 'money')} />
        <HeaderMetric label="FCF Yield" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} highlight />
      </div>
    </section>

    {stock.warnings.length > 0 && (
      <section className="eq-note-panel">
        <h3>Investment notes</h3>
        <ul>
          {stock.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </section>
    )}

    <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {METRIC_GROUPS.map((group) => (
        <MetricGroupCard key={group.id} stock={stock} group={group} />
      ))}
    </section>

    <HistoryTable stock={stock} />
  </div>
);
```

- [ ] **Step 2: Update `HeaderMetric` to support highlighting**

Change its signature to:

```tsx
function HeaderMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
```

Change the value paragraph class to:

```tsx
<p className={`font-mono text-sm font-semibold tabular-nums ${highlight ? 'text-[var(--vw-green)]' : 'text-[var(--vw-text-primary)]'}`}>
```

- [ ] **Step 3: Update `MetricGroupCard` styling**

Change the article class from `vw-card p-4` to:

```tsx
<article className="eq-metric-panel">
```

Change the row class to:

```tsx
<div key={column.id} className="flex min-h-8 items-center justify-between gap-4 border-t border-[var(--vw-border-dim)] py-1.5 first:border-t-0">
```

- [ ] **Step 4: Extract `HistoryTable` below `MetricGroupCard`**

Move the historical table JSX into:

```tsx
function HistoryTable({ stock }: { stock: EdgequityStockRecord }) {
  return (
    <section className="vw-card eq-history-panel overflow-hidden">
      <div className="border-b px-3 py-2" style={{ borderColor: 'var(--vw-border)' }}>
        <h3 className="text-xs font-semibold uppercase text-[var(--vw-text-tertiary)]">Historical fundamentals</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] table-fixed border-collapse text-[12px]">
          <thead style={{ background: 'var(--vw-bg-raised)', color: 'var(--vw-text-tertiary)' }}>
            <tr className="border-b" style={{ borderColor: 'var(--vw-border)' }}>
              <th scope="col" className="w-[72px] px-3 py-1.5 text-left text-[10px] font-semibold uppercase">Year</th>
              {HISTORY_MONEY_FIELDS.map((field) => (
                <th key={field.id} scope="col" className="w-[118px] px-2 py-1.5 text-right text-[10px] font-semibold uppercase">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--vw-border-dim)' }}>
            {stock.history.map((year) => (
              <tr key={year.year}>
                <th scope="row" className="px-3 py-1.5 text-left font-mono text-[12px] font-semibold">{year.year}</th>
                {HISTORY_MONEY_FIELDS.map((field) => (
                  <td key={field.id} className="px-2 py-1.5 text-right font-mono tabular-nums">
                    {formatHistoryMoney(year[field.id as HistoryMoneyField])}
                  </td>
                ))}
              </tr>
            ))}
            {stock.history.length === 0 && (
              <tr>
                <td colSpan={HISTORY_MONEY_FIELDS.length + 1} className="px-3 py-8 text-center text-sm text-[var(--vw-text-tertiary)]">
                  No historical fundamentals available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add detail CSS utilities in `src/index.css`**

Append:

```css
.eq-back-button {
  border: 1px solid var(--vw-border-lit);
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.84);
  color: var(--vw-text-secondary);
  padding: 0.45rem 0.65rem;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.eq-back-button:hover {
  border-color: rgba(0, 212, 170, 0.42);
  color: var(--vw-text-primary);
  background: var(--vw-bg-hover);
}

.eq-detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.9rem;
  border: 1px solid var(--vw-border);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(8, 12, 20, 0.96));
  padding: 1rem;
}

.eq-kpi-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--vw-border-dim);
  border-radius: 8px;
  background: var(--vw-border-dim);
}

.eq-kpi-strip > div {
  background: rgba(12, 18, 32, 0.94);
  padding: 0.65rem 0.75rem;
}

.eq-note-panel {
  border: 1px solid rgba(240, 180, 41, 0.25);
  border-radius: 8px;
  background: rgba(240, 180, 41, 0.055);
  padding: 0.75rem 0.9rem;
}

.eq-note-panel h3 {
  color: var(--vw-amber);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.eq-note-panel ul {
  margin-top: 0.45rem;
  color: var(--vw-text-secondary);
  font-size: 0.875rem;
}

.eq-metric-panel {
  border: 1px solid var(--vw-border);
  border-radius: 8px;
  background: rgba(17, 24, 39, 0.88);
  padding: 0.8rem;
}

.eq-history-panel {
  border-radius: 8px;
}

@media (min-width: 900px) {
  .eq-detail-hero {
    grid-template-columns: minmax(0, 1fr) minmax(420px, 0.85fr);
    align-items: end;
  }

  .eq-kpi-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
```

- [ ] **Step 6: Run tests and commit**

Run: `npm run test:edgequity:ui`

Expected: PASS.

Run:

```bash
git add src/edgequity/components/StockDetail.tsx src/index.css
git commit -m "feat: redesign Edgequity stock detail"
```

## Task 5: Full Verification And Browser Review

**Files:**
- No planned code changes unless verification reveals a bug.

- [ ] **Step 1: Run full local checks**

Run:

```bash
npm run test:edgequity
npm run test:edgequity:ui
npm run lint
npm run build
git diff --check
```

Expected: all commands exit 0. `git diff --check` may print CRLF warnings only if Git reports them as warnings, but it must exit 0.

- [ ] **Step 2: Verify in browser**

Run the dev server:

```bash
npm run dev -- --host 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`.

Verify:
- The table has compact columns and shows more metrics before horizontal scrolling.
- The ticker and company columns stay visible while scrolling horizontally.
- The AAPL row opens a detailed analyst-sheet page.
- The detail page shows the KPI strip, grouped metric panels, investment notes when warnings exist, and the historical fundamentals table.

- [ ] **Step 3: Commit any polish fixes**

If browser review requires small polish, commit them:

```bash
git add src/edgequity/components src/index.css
git commit -m "fix: polish Edgequity analyst UI"
```

## Self-Review

- Spec coverage: the plan covers dense table columns, sticky identifier columns, group boundaries, compact toolbar, richer stock detail, subtle notes, visual CSS, tests, build, and browser verification.
- Placeholder scan: no task contains TBD, TODO, or unspecified implementation.
- Type consistency: new `MetricCell` prop is consistently named `columnIndex`; CSS class names match tests and implementation steps.
