---
name: equity-research
description: This skill should be used when the user asks to do equity research, create a stock research page, build an investment report, or analyze a specific ticker for the Tonivest Research website.
---

# Equity Research Skill

This skill produces a complete educational equity research report for ValuWise / Tonivest-style stock analysis pages. The current workflow is source-first and does not require the user to place transcripts or notes in local folders. For each requested ticker, the agent should independently pull the latest earnings call transcript when available, read the latest annual report or Form 10-K, pull financial statements from FMP, then synthesize a long-form report that teaches the user how the company works.

The report is not primarily a buy/sell pitch. Its purpose is to help the reader understand the business model, segments, industry context, financial statements, operating drivers, risks, and valuation mechanics. Ratings may exist in the UI, but the writing should avoid sounding like generic investment advice.

---

## When This Skill Applies

Use this skill whenever the user says something like:
- "Do equity research for [TICKER]"
- "Create a research page for [COMPANY]"
- "Build the stock report for [TICKER]"
- "Add [TICKER] to the site"

---

## Workflow

Work through the following steps in order. Do not skip steps.

### Step 1: Identify the Ticker

Extract the ticker symbol from the user's message. Set two variables:
- `TICKER` = uppercase (e.g., `GOOGL`)
- `ticker` = lowercase (e.g., `googl`)

If the user says `GOOG` and the ValuWise universe uses `GOOGL`, treat the company as Alphabet and use the available `GOOGL` dataset unless the user explicitly needs Class C share labeling.

---

### Step 2: Pull the Most Recent Earnings Transcript

Do not ask the user to provide transcript files. Search for the most recent earnings call transcript yourself.

Preferred source order:
1. Company investor relations transcript or corrected transcript PDF.
2. Company earnings webcast transcript if text is available.
3. Reputable public transcript mirrors such as The Motley Fool, StockAnalysis, MarketScreener, Earnings Labs, or Insider Monkey.
4. If no transcript exists, use the official earnings release and investor presentation, and state that a full transcript was not available.

Read enough of the transcript to understand:
- What management says the company does now.
- Which segments are accelerating or weakening.
- What products, customers, or platform changes matter.
- How management explains AI, cloud, ads, capex, margins, or other relevant drivers.
- What analysts asked about in Q&A, because Q&A usually reveals the market debate.

Record the source URL and transcript date in the report data.

---

### Step 3: Read the Annual Report / 10-K

Search for the latest annual report or Form 10-K. Prefer the company investor relations PDF or SEC filing.

Read the business description and MD&A sections. Extract:
- Reportable segments and how each segment makes money.
- Revenue by type or segment.
- Main operating expense and capex drivers.
- Risks that are specific to the company, not generic market risks.
- Balance sheet, buyback, dividend, debt, and cash flow context.

Use the annual report to make the writing educational. Explain unfamiliar terms in plain English when needed.

---

### Step 4: Pull Financial Statements from FMP

Use FMP through the available server-side proxy or environment key. Do not expose API keys in output.

Pull at least five annual periods when the plan allows:
- `income-statement`
- `balance-sheet-statement`
- `cash-flow-statement`

Use `limit=5` unless the plan requires less. For charts, use the latest five annual years in chronological order.

Extract and record:
- **Historical (5 years)**: Revenue, Gross Profit, Operating Income, Net Income, EPS (basic + diluted)
- **Margins**: Gross margin %, Operating margin %, Net margin %
- **Cash flow**: FCF, EBITDA, CapEx
- **Balance sheet**: Cash & equivalents, Total debt, Shareholders equity, Current ratio
- **Valuation multiples** (if present): P/E, Forward P/E, EV/EBITDA, P/S
- **DCF outputs**: WACC used, terminal growth rate (TGR), intrinsic value (Bear / Base / Bull price targets)
- **Sensitivity table**: A grid of WACC values (rows) vs TGR values (columns), each cell = implied price

**Default DCF parameters:** Terminal growth rate (TGR) = **2.5%**, equity risk premium (ERP) = **5.5%** unless the user specifies otherwise.

If a value is not available from FMP or filings, note it as "N/A" rather than guessing.

---

### Step 5: Web Research

Use `WebSearch` to gather current market data and recent developments. Run several targeted searches:

1. "[TICKER] recent earnings results [current year]"
2. "[TICKER] stock price market cap analyst target"
3. "[TICKER] latest news [current quarter]"
4. "[COMPANY NAME] competitive landscape industry trends"
5. "[TICKER] forward P/E EV/EBITDA consensus estimate"

Collect:
- Current stock price and market cap
- Most recent quarterly EPS and revenue (actual vs. estimate)
- Analyst consensus rating and average price target
- Any major recent news (guidance updates, product launches, acquisitions, macro risks)
- Industry growth outlook

---

### Step 6: Write the Report

For ValuWise, write report content into the app's research data layer rather than requiring a static local HTML page, unless the user explicitly asks for a `stocks/[ticker].html` file.

Writing style:
- Use Tony's long-form educational style from the existing `stocks` folder.
- Explain what the company does before discussing valuation.
- Each section should teach the user one concrete thing.
- Avoid generic phrases like "strong execution", "robust ecosystem", or "well positioned" unless you explain the mechanism.
- Do not frame the report as direct financial advice.
- Keep source links attached to the research data.
- Use the 14-section structure when rendering in the Tonivest design.

Required section intent:
1. Overview card: one concise thesis focused on what the company is and what drives it.
2. Recent News & Earnings: what changed in the latest quarter and what management said.
3. Business Summary: how the company makes money.
4. Core Segment Deep Dive: the segment that matters most to the stock.
5. Industry Context: why this industry is changing.
6. Competitive Advantages & Moat: advantages tied to financial output.
7. Revenue Growth & Profitability: 5-year financial proof.
8. Earnings Per Share: earnings quality and share count.
9. Balance Sheet: cash, debt, capex, buybacks/dividends.
10. 3-Year Forecast: scenarios, not false precision.
11. Valuation: how the market is pricing the business.
12. Sensitivity Analysis: what assumptions matter.
13. Key Risks: thesis-changing risks.
14. Final Verdict: educational summary and what to monitor next.

---

## Legacy Static HTML Workflow

If the user is working directly in `tonynguyen22.github.io`, create the file at `stocks/[ticker].html`. Use the exact HTML structure below. Do not deviate from the boilerplate. All 14 sections are required.

#### 5a. HTML Boilerplate

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[COMPANY NAME] ([TICKER]) — Equity Research | Tonivest</title>
    <link rel="icon" href="../assets/logo-nav.png" type="image/png">
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
```

#### 5b. Sidebar (required, all 4 nav items)

```html
<aside class="sidebar">
    <div class="sidebar-logo">
        <span class="logo-text">Tonivest Research</span>
        <button id="sidebar-toggle" class="sidebar-toggle" aria-label="Toggle Sidebar">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        </button>
    </div>
    <nav class="sidebar-nav">
        <a href="../index.html" class="nav-item active">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Company Analysis
        </a>
        <a href="../port.html" class="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
            My Portfolio
        </a>
        <a href="../tools.html" class="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Tools &amp; Projects
        </a>
        <a href="../about.html" class="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            About Me
        </a>
    </nav>
</aside>
```

#### 5c. Main Layout

CRITICAL: Use `<main class="main-content">` (not `<div>`). The `<header>` must be INSIDE `<div class="analysis-detail-container">`, not outside it. Getting this wrong breaks the page header layout.

```html
<main class="main-content">
    <div class="analysis-detail-container">
        <header class="analysis-detail-header">
            <div class="header-content">
                <h1 class="detail-title">Equity Research: [Company Name] ([TICKER])</h1>
                <p class="detail-meta">Initiated: [Month Year] &nbsp;|&nbsp; Last Updated: [Date] &nbsp;|&nbsp; Author: Tony Nguyen</p>
            </div>
            <a href="../index.html" class="back-button">← Back</a>
        </header>
        <article class="detail-content">
            <!-- sections go here -->
        </article>
    </div>
</main>
```

CRITICAL: Do not set inline `color` on `.stock-thesis` or `.fvb-reasoning` — these are defined in `styles.css` as `color: #ffffff` (pure white). Both classes render text inside the dark blue gradient boxes (overview card and final verdict). Any opacity reduction will make the text look grey and hard to read.

---

#### Section 01: Overview Card

```html
<section class="detail-section">
    <div class="stock-overview-card">
        <div class="stock-ticker-row">
            <span class="stock-ticker">[TICKER]</span>
            <span class="stock-company-name">[Company Name]</span>
            <span class="verdict-badge verdict-[buy|hold|sell]">[BUY|HOLD|SELL]</span>
        </div>
        <div class="info-tags">
            <span class="info-tag">[Sector]</span>
            <span class="info-tag">[Industry]</span>
            <span class="info-tag">Large Cap</span>
            <span class="info-tag">Initiated: [Month Year]</span>
        </div>
        <p class="stock-thesis">[2-3 sentence investment thesis written in first person. State what the company does, why I find it compelling, and the key catalyst or risk I am watching. No em dashes.]</p>
        <div class="quick-stats-grid">
            <div class="quick-stat">
                <span class="quick-stat-value qs-neutral">$[Price]</span>
                <span class="quick-stat-label">Current Price</span>
            </div>
            <div class="quick-stat">
                <span class="quick-stat-value qs-positive">$[Base PT]</span>
                <span class="quick-stat-label">Base Price Target</span>
            </div>
            <div class="quick-stat">
                <span class="quick-stat-value qs-[positive|negative]">[Upside]%</span>
                <span class="quick-stat-label">Upside to PT</span>
            </div>
            <div class="quick-stat">
                <span class="quick-stat-value qs-neutral">$[Mkt Cap]B</span>
                <span class="quick-stat-label">Market Cap</span>
            </div>
            <div class="quick-stat">
                <span class="quick-stat-value qs-neutral">[P/E]x</span>
                <span class="quick-stat-label">Fwd P/E</span>
            </div>
            <div class="quick-stat">
                <span class="quick-stat-value qs-neutral">[EV/EBITDA]x</span>
                <span class="quick-stat-label">EV/EBITDA</span>
            </div>
        </div>
    </div>
</section>
```

---

#### Section 02: Recent News & Earnings

Use `.update-timeline` with one `.update-card.latest-update` for the most recent earnings and additional `.update-card` entries for any other notable news. Each card shows:
- Earnings date or news date
- Actual EPS vs estimate (mark as beat/miss)
- Revenue actual vs estimate
- Key management commentary from the transcript
- Rating pill and upside row

```html
<section class="detail-section">
    <span class="section-label">02 — Recent News &amp; Earnings</span>
    <h3>Recent News &amp; Earnings</h3>
    <div class="update-timeline">
        <div class="update-card latest-update">
            <div class="update-card-header">
                <span class="update-card-title">[Quarter] Earnings — [Beat|Miss|In-Line]</span>
                <span class="update-date-pill">[Month DD, YYYY]</span>
            </div>
            <div class="update-card-meta">
                <span>EPS: $[actual] (est. $[est.])</span>
                <span>Revenue: $[actual]B (est. $[est.]B)</span>
            </div>
            <p>[2-3 sentences in first person summarizing the quarter. What stood out to me, what I found encouraging or concerning. No em dashes.]</p>
            <div class="update-upside-row">
                <span class="rating-pill rating-[buy|hold|sell]">[BUY|HOLD|SELL]</span>
                <span class="upside-value [positive|negative|neutral]">[+/-X.X]% to PT</span>
            </div>
        </div>
        <!-- Add more update-card elements for notable news items -->
    </div>
</section>
```

---

#### Section 03: Business Summary

```html
<section class="detail-section">
    <span class="section-label">03 — Business Summary</span>
    <h3>Business Summary</h3>
    <p>[Opening paragraph: what the company does, when it was founded, where it operates, and the overall scale. Written in first person. 3-4 sentences. No em dashes.]</p>
    <h4>[Segment Name 1]</h4>
    <p>[Description of this segment, its revenue contribution, key products or services, and growth trajectory. 2-3 sentences.]</p>
    <h4>[Segment Name 2]</h4>
    <p>[Description.]</p>
    <!-- Repeat for each major segment -->
</section>
```

---

#### Section 04: Core Segment

This is a deep-dive into the single most important business segment or revenue driver. This section goes well beyond the brief overview in Section 03. Include:
- Revenue breakdown with a visual table (actual dollar amounts, YoY growth)
- Margin profile and unit economics where available
- Key products, customers, or contracts
- Why I think this segment is the primary value driver
- Competitive dynamics within this segment specifically

```html
<section class="detail-section">
    <span class="section-label">04 — Core Segment</span>
    <h3>[Core Segment Name]</h3>
    <p>[2-3 sentence intro explaining why this is the segment I focus on most and what makes it structurally important to the investment thesis. First person. No em dashes.]</p>

    <!-- Visual breakdown table -->
    <table class="forecast-table" style="margin: 1.5rem 0;">
        <thead>
            <tr>
                <th>[Sub-segment or Product]</th>
                <th>FY[Year-2]</th>
                <th>FY[Year-1]</th>
                <th>FY[Year]</th>
                <th>YoY Growth</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>[Name]</td>
                <td>$[X]B</td>
                <td>$[X]B</td>
                <td>$[X]B</td>
                <td class="qs-positive">+[X]%</td>
            </tr>
            <!-- rows for each sub-segment -->
        </tbody>
    </table>

    <h4>Unit Economics &amp; Margin Profile</h4>
    <p>[Discuss gross margin, operating leverage, and key cost drivers for this segment. 2-3 sentences.]</p>

    <h4>Why This Segment Matters</h4>
    <p>[First-person reasoning on why this is the primary value driver and how I am thinking about its trajectory. 2-3 sentences.]</p>
</section>
```

---

#### Section 05: Industry Context

```html
<section class="detail-section">
    <span class="section-label">05 — Industry Context</span>
    <h3>Industry Context</h3>
    <p>[Paragraph on the total addressable market size, growth rate, key secular tailwinds, and structural changes underway. 3-4 sentences in first person. Reference specific data points or figures where available.]</p>
    <p>[Second paragraph on competitive landscape and how the market is evolving. Any disruption risks or technology shifts I am paying attention to.]</p>
</section>
```

---

#### Section 06: Competitive Advantages & Moat

```html
<section class="detail-section">
    <span class="section-label">06 — Competitive Advantages &amp; Moat</span>
    <h3>Competitive Advantages &amp; Moat</h3>
    <h4>1. [Moat Type, e.g. Network Effects]</h4>
    <p>[Explanation in first person. 2-3 sentences. Why I believe this is a durable advantage.]</p>
    <h4>2. [Moat Type, e.g. Switching Costs]</h4>
    <p>[Explanation.]</p>
    <!-- 3-5 moat points total -->
</section>
```

---

#### Section 07: Revenue Growth & Profitability

Include a `.metric-pair-grid` for current-year highlights, then a historical data table showing at least 4-5 years.

```html
<section class="detail-section">
    <span class="section-label">07 — Revenue Growth &amp; Profitability</span>
    <h3>Revenue Growth &amp; Profitability</h3>
    <div class="metric-pair-grid">
        <div class="metric-pair">
            <span class="mp-label">Revenue (TTM)</span>
            <span class="mp-value">$[X]B</span>
            <span class="mp-context">+[X]% YoY</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Gross Margin</span>
            <span class="mp-value">[X]%</span>
            <span class="mp-context">[vs. prior year %]</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Operating Margin</span>
            <span class="mp-value">[X]%</span>
            <span class="mp-context">[trend note]</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Net Margin</span>
            <span class="mp-value">[X]%</span>
            <span class="mp-context">[trend note]</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">EBITDA</span>
            <span class="mp-value">$[X]B</span>
            <span class="mp-context">[EBITDA margin %]</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Free Cash Flow</span>
            <span class="mp-value">$[X]B</span>
            <span class="mp-context">FCF Margin [X]%</span>
        </div>
    </div>

    <!-- Historical table -->
    <table class="forecast-table" style="margin-top: 1.5rem;">
        <thead>
            <tr>
                <th>Metric</th>
                <th>FY[Year-4]</th>
                <th>FY[Year-3]</th>
                <th>FY[Year-2]</th>
                <th>FY[Year-1]</th>
                <th>FY[Year]</th>
            </tr>
        </thead>
        <tbody>
            <tr class="ft-section"><td colspan="6">Income Statement</td></tr>
            <tr><td>Revenue ($B)</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td></tr>
            <tr><td>Gross Profit ($B)</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td></tr>
            <tr><td>Operating Income ($B)</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td></tr>
            <tr><td>Net Income ($B)</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td></tr>
            <tr class="ft-section"><td colspan="6">Margins</td></tr>
            <tr><td>Gross Margin</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td></tr>
            <tr><td>Operating Margin</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td></tr>
            <tr><td>Net Margin</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td></tr>
            <tr class="ft-section"><td colspan="6">Cash Flow</td></tr>
            <tr><td>FCF ($B)</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td></tr>
            <tr><td>FCF Margin</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td></tr>
        </tbody>
    </table>
</section>
```

---

#### Section 08: Earnings Per Share

```html
<section class="detail-section">
    <span class="section-label">08 — Earnings Per Share</span>
    <h3>Earnings Per Share</h3>
    <div class="metric-pair-grid">
        <div class="metric-pair">
            <span class="mp-label">EPS (TTM, Diluted)</span>
            <span class="mp-value">$[X]</span>
            <span class="mp-context">+[X]% YoY</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Fwd EPS (Consensus)</span>
            <span class="mp-value">$[X]</span>
            <span class="mp-context">[Year] estimate</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">P/E (TTM)</span>
            <span class="mp-value">[X]x</span>
            <span class="mp-context">vs. sector avg [X]x</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Fwd P/E</span>
            <span class="mp-value">[X]x</span>
            <span class="mp-context">[Year] estimate</span>
        </div>
    </div>
    <table class="forecast-table" style="margin-top: 1.5rem;">
        <thead>
            <tr>
                <th>Year</th>
                <th>EPS (Diluted)</th>
                <th>YoY Growth</th>
                <th>Shares Out. (B)</th>
            </tr>
        </thead>
        <tbody>
            <!-- 5 historical years -->
            <tr><td>FY[Year-4]</td><td>$[X]</td><td>[X]%</td><td>[X]</td></tr>
            <tr><td>FY[Year-3]</td><td>$[X]</td><td>[X]%</td><td>[X]</td></tr>
            <tr><td>FY[Year-2]</td><td>$[X]</td><td>[X]%</td><td>[X]</td></tr>
            <tr><td>FY[Year-1]</td><td>$[X]</td><td>[X]%</td><td>[X]</td></tr>
            <tr><td>FY[Year]</td><td>$[X]</td><td>[X]%</td><td>[X]</td></tr>
        </tbody>
    </table>
</section>
```

---

#### Section 09: Balance Sheet

```html
<section class="detail-section">
    <span class="section-label">09 — Balance Sheet</span>
    <h3>Balance Sheet</h3>
    <div class="metric-pair-grid">
        <div class="metric-pair">
            <span class="mp-label">Cash &amp; Equivalents</span>
            <span class="mp-value">$[X]B</span>
            <span class="mp-context">[trend note]</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Total Debt</span>
            <span class="mp-value">$[X]B</span>
            <span class="mp-context">Net debt: $[X]B</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Debt / Equity</span>
            <span class="mp-value">[X]x</span>
            <span class="mp-context">[low|moderate|elevated]</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Current Ratio</span>
            <span class="mp-value">[X]x</span>
            <span class="mp-context">[healthy / watch]</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Shareholders Equity</span>
            <span class="mp-value">$[X]B</span>
            <span class="mp-context">Book value / share: $[X]</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Buybacks (LTM)</span>
            <span class="mp-value">$[X]B</span>
            <span class="mp-context">[X]% of market cap</span>
        </div>
    </div>
</section>
```

---

#### Section 10: 3-Year Forecast

```html
<section class="detail-section">
    <span class="section-label">10 — 3-Year Forecast</span>
    <h3>3-Year Forecast</h3>
    <p>[1-2 sentences on your overall stance on the company's growth trajectory and how you arrived at these scenario assumptions. First person. No em dashes.]</p>

    <div class="scenario-comparison-grid">
        <div class="scenario-col bear">
            <span class="scenario-col-label">Bear</span>
            <span class="scenario-col-pt">$[Bear PT]</span>
            <span class="scenario-col-upside [negative]">[X]% downside</span>
            <div class="scenario-col-rows">
                <div class="scenario-col-row">
                    <span class="scenario-col-row-label">Rev CAGR</span>
                    <span class="scenario-col-row-val">[X]%</span>
                </div>
                <div class="scenario-col-row">
                    <span class="scenario-col-row-label">Op. Margin</span>
                    <span class="scenario-col-row-val">[X]%</span>
                </div>
                <div class="scenario-col-row">
                    <span class="scenario-col-row-label">EPS [Year+3]E</span>
                    <span class="scenario-col-row-val">$[X]</span>
                </div>
                <div class="scenario-col-row">
                    <span class="scenario-col-row-label">Exit Multiple</span>
                    <span class="scenario-col-row-val">[X]x P/E</span>
                </div>
            </div>
        </div>
        <div class="scenario-col base">
            <span class="scenario-col-label">Base</span>
            <span class="scenario-col-pt">$[Base PT]</span>
            <span class="scenario-col-upside [positive|negative]">[X]% [upside|downside]</span>
            <div class="scenario-col-rows">
                <!-- same rows -->
            </div>
        </div>
        <div class="scenario-col bull">
            <span class="scenario-col-label">Bull</span>
            <span class="scenario-col-pt">$[Bull PT]</span>
            <span class="scenario-col-upside positive">[X]% upside</span>
            <div class="scenario-col-rows">
                <!-- same rows -->
            </div>
        </div>
    </div>

    <!-- Detailed forecast table -->
    <table class="forecast-table" style="margin-top: 2rem;">
        <thead>
            <tr>
                <th>Metric</th>
                <th>FY[Year] A</th>
                <th>FY[Year+1] E</th>
                <th>FY[Year+2] E</th>
                <th>FY[Year+3] E</th>
            </tr>
        </thead>
        <tbody>
            <tr class="ft-section"><td colspan="5">Base Case</td></tr>
            <tr><td>Revenue ($B)</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td></tr>
            <tr><td>Revenue Growth</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td></tr>
            <tr><td>Operating Income ($B)</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td></tr>
            <tr><td>Operating Margin</td><td>[X]%</td><td>[X]%</td><td>[X]%</td><td>[X]%</td></tr>
            <tr><td>EPS (Diluted)</td><td>$[X]</td><td>$[X]</td><td>$[X]</td><td>$[X]</td></tr>
            <tr><td>FCF ($B)</td><td>[X]</td><td>[X]</td><td>[X]</td><td>[X]</td></tr>
        </tbody>
    </table>
</section>
```

---

#### Section 11: Valuation

```html
<section class="detail-section">
    <span class="section-label">11 — Valuation</span>
    <h3>Valuation</h3>
    <p>[2-3 sentences explaining your DCF methodology, key assumptions you used, and where you land on intrinsic value. First person. No em dashes.]</p>
    <div class="metric-pair-grid">
        <div class="metric-pair">
            <span class="mp-label">DCF Intrinsic Value</span>
            <span class="mp-value">$[X]</span>
            <span class="mp-context">Base case</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Required Return Rate (WACC)</span>
            <span class="mp-value">[X]%</span>
            <span class="mp-context">the minimum annual return investors expect</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">Long-run Growth Rate (TGR)</span>
            <span class="mp-value">[X]%</span>
            <span class="mp-context">assumed steady growth rate after forecast period</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">EV / EBITDA</span>
            <span class="mp-value">[X]x</span>
            <span class="mp-context">vs. peers [X]-[X]x</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">P/E (Fwd)</span>
            <span class="mp-value">[X]x</span>
            <span class="mp-context">vs. 5yr avg [X]x</span>
        </div>
        <div class="metric-pair">
            <span class="mp-label">P/FCF</span>
            <span class="mp-value">[X]x</span>
            <span class="mp-context">[cheap|fair|rich]</span>
        </div>
    </div>
</section>
```

---

#### Section 12: Sensitivity Analysis

```html
<section class="detail-section">
    <span class="section-label">12 — Sensitivity Analysis</span>
    <h3>Sensitivity Analysis</h3>
    <p>[1-2 sentences on what you are stress-testing and what ranges you find most plausible. First person. Then add one plain-English sentence explaining the table, e.g.: "Each cell shows what the stock would be worth under a different combination of required return rate and long-run growth assumption."]</p>
    <div class="sensitivity-wrap">
        <table class="sensitivity-table">
            <thead>
                <tr>
                    <th class="st-corner">Required Return \ Long-run Growth</th>
                    <th>[TGR1]%</th>
                    <th>[TGR2]%</th>
                    <th>[TGR3]%</th>
                    <th>[TGR4]%</th>
                    <th>[TGR5]%</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="st-row-head">[WACC1]%</td>
                    <td>$[X]</td><td>$[X]</td><td>$[X]</td><td>$[X]</td><td>$[X]</td>
                </tr>
                <tr>
                    <td class="st-row-head">[WACC2]%</td>
                    <td>$[X]</td><td>$[X]</td><td class="st-highlight">$[X]</td><td>$[X]</td><td>$[X]</td>
                </tr>
                <!-- 5 WACC rows total; mark base case cell with st-highlight -->
            </tbody>
        </table>
    </div>
</section>
```

---

#### Section 13: Key Risks

```html
<section class="detail-section">
    <span class="section-label">13 — Key Risks</span>
    <h3>Key Risks</h3>
    <h4>1. [Risk Title]</h4>
    <p>[2-3 sentences on this risk, why I take it seriously, and how I am thinking about the probability and severity. First person. No em dashes.]</p>
    <h4>2. [Risk Title]</h4>
    <p>[Explanation.]</p>
    <!-- 4-6 risks total -->
</section>
```

---

#### Section 14: Final Verdict

```html
<section class="detail-section">
    <span class="section-label">14 — Final Verdict</span>
    <h3>Final Verdict</h3>
    <div class="final-verdict-box">
        <div class="fvb-inner">
            <span class="fvb-rating-label">Rating</span>
            <span class="fvb-rating verdict-[buy|hold|sell]">[BUY|HOLD|SELL]</span>
            <div class="fvb-stats-row">
                <div>
                    <span class="fvb-stat-label">Entry Price</span>
                    <span class="fvb-stat-value fvb-neutral">$[X]</span>
                </div>
                <div>
                    <span class="fvb-stat-label">Base Target</span>
                    <span class="fvb-stat-value fvb-positive">$[X]</span>
                </div>
                <div>
                    <span class="fvb-stat-label">Upside</span>
                    <span class="fvb-stat-value fvb-[positive|negative]">[X]%</span>
                </div>
                <div>
                    <span class="fvb-stat-label">Bear Target</span>
                    <span class="fvb-stat-value fvb-negative">$[X]</span>
                </div>
                <div>
                    <span class="fvb-stat-label">Bull Target</span>
                    <span class="fvb-stat-value fvb-positive">$[X]</span>
                </div>
                <div>
                    <span class="fvb-stat-label">Time Horizon</span>
                    <span class="fvb-stat-value fvb-neutral">3 Years</span>
                </div>
            </div>
            <p class="fvb-reasoning">[3-4 sentences summarizing the thesis in first person. Bring together the moat, the valuation, the key risk, and your conviction level. No em dashes. This is your bottom line.]</p>
        </div>
    </div>
</section>
```

---

#### 5d. Sidebar Toggle Script (required at end of `<body>`)

```html
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        });
    });
</script>
```

---

### Step 6: Update `index.html`

Read `index.html` to find the card grid. Add a new card for this stock in the correct position (alphabetically or at the top, matching existing ordering). The card structure:

```html
<div class="analysis-card">
    <div class="card-header">
        <span class="card-rating-badge crb-[buy|hold|sell]">[BUY|HOLD|SELL]</span>
        <span class="stock-symbol">[TICKER]</span>
    </div>
    <h3 class="card-title">[Company Name]</h3>
    <p class="card-description">[1-2 sentence thesis with base price target. No em dashes.]</p>
    <a href="stocks/[ticker].html" class="card-link">View Report</a>
</div>
```

---

## Writing Style Rules (apply to ALL prose content)

- Write in first person: "I think...", "I believe...", "In my view...", "What I find compelling...", "I expect..."
- No em dashes anywhere. Use commas, colons, or restructure the sentence.
- Use specific numbers from the Excel and web research rather than vague language.
- Include visual tables and figure callouts wherever data supports them.
- Prose should read like an analyst note, not an AI summary.
- Write for a general audience. Assume the reader is smart but has no finance or tech background. Do not assume familiarity with any term or ratio. Explain the "so what" behind every number.
- Explain every abbreviation on first use. Write the full term, then the abbreviation in parentheses. After that, you may use the abbreviation alone. Example: "weighted average cost of capital (WACC)" on first use, then "WACC" thereafter.

---

## Quality Checklist Before Finishing

Before completing, verify:
- [ ] All 14 sections are present and in order
- [ ] Sidebar has all 4 nav items and toggle button
- [ ] Sidebar toggle script is at the end of `<body>`
- [ ] All paths use `../` prefix
- [ ] No inline color or layout styles
- [ ] No em dashes in prose
- [ ] First-person voice used throughout
- [ ] Historical tables have real data from Excel
- [ ] Sensitivity table has the base-case cell marked with `st-highlight`
- [ ] Final verdict rating matches `verdict-badge` in section 01
- [ ] `index.html` card added with matching rating badge class
