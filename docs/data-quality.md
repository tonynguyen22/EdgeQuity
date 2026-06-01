# Edgequity Data Quality

Edgequity generated stock JSON is source-of-truth for the browser. Financial statements should match public SEC Company Facts for SEC-backed records.

## Refresh Data

Run:

~~~bash
npm run edgequity:data
~~~

Requires FINNHUB_API_KEY. SEC Company Facts uses SEC_USER_AGENT or the project default.

## Audit Data

Run exact NVDA audit:

~~~bash
npm run edgequity:audit-data:nvda
~~~

Run deterministic sample audit:

~~~bash
npm run edgequity:audit-data -- --sample=10 --seed=2026-05-31
~~~

Run full universe audit:

~~~bash
npm run edgequity:audit-data -- --sample=50 --seed=full-universe
~~~

## What The Audit Compares

- Annual income statement: revenue, gross profit, operating income, net income, diluted EPS, diluted shares.
- Annual balance sheet: assets, total debt, stockholders equity, cash.
- Annual cash flow: operating cash flow, capex, free cash flow.
- Quarterly balance sheet: assets, total debt, stockholders equity, cash.

SEC-backed generated rows should match public SEC facts exactly. Records with missing SEC coverage can be skipped only when generated metadata marks statements missing.
