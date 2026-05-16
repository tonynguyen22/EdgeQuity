# Edgequity UI Density Redesign

## Approved Direction

Use **Option A: Analyst Sheet** from the visual companion.

The UI should feel like a polished value-investor worksheet: dense enough to compare many fundamentals at once, but refined enough to showcase as a CV project. The direction is informed by Open Design's emphasis on deliberate visual systems, strong hierarchy, and critique-driven design rather than generic dashboard cards.

## Goals

- Fit more screener columns in the first viewport by tightening table widths, padding, typography, and header labels.
- Keep the table as the main page and make it feel like the core product, not a card preview.
- Make stock detail pages more appealing and more useful for value-investor review.
- Preserve the local static-data architecture and existing sorting/filtering behavior.

## Screener Table Design

- Use a dense analyst-sheet table with compact cells, tighter row height, and smaller uppercase headers.
- Keep `ticker` and `company` visually anchored, with sticky left columns on horizontal scroll.
- Use abbreviated table labels for space where obvious, such as `MCap`, `Fwd P/E`, `EV/EBITDA`, `FCFY`, `Op Mgn`, and `D/E`.
- Keep values right-aligned and tabular; text columns stay left-aligned.
- Add subtle vertical separation between metric groups so valuation, profitability, growth, health, cash flow, and dividends are easier to scan.
- Improve hover/focus state so rows feel clickable without becoming loud.
- Keep the toolbar compact and aligned with the table density.

## Stock Detail Design

- Replace the plain header/card stack with an analyst-sheet layout:
  - compact back control
  - strong ticker/company header
  - KPI strip for price, market cap, enterprise value, and FCF yield
  - grouped fundamentals shown as refined metric panels
  - historical fundamentals table kept below as a dense data table
- Use small accent treatments for notable figures, especially FCF yield and profitability values.
- Avoid a marketing-page feel; the detail page should look like a focused research sheet.
- Keep data notes visible when present, but style them as subtle warnings rather than a dominant card.

## Visual System

- Retain the dark financial terminal palette, but make it less bulky.
- Use restrained teal/cyan accents, thin borders, smaller radii, and compact spacing.
- Remove any decorative UI that does not help scanning.
- Keep typography practical: sans for labels/text, mono for numbers.
- Make the layout responsive: mobile can stack sections, while desktop prioritizes dense comparison.

## Testing And Verification

- Update component tests only if markup expectations change.
- Run `npm run test:edgequity:ui`, `npm run lint`, and `npm run build`.
- Verify in browser that the table shows more columns before horizontal scrolling and the stock detail page looks polished at desktop and mobile widths.
