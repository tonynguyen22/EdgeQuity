# Todo

**Date:** 2026-03-03

- [x] Fixed SEC EDGAR API issue by creating a proxy server.
- [x] Created `proxy/index.ts` with the proxy server code.
- [x] Updated `package.json` with a `proxy` script.
- [x] Updated `src/EdgarFinancials.tsx` to use the proxy server.
- [x] Updated `CLAUDE.md` to document the new proxy server and `proxy` command.
- [x] Converted the local proxy to a Netlify Function.
- [x] Created `netlify/functions/sec.js` with the Netlify Function code.
- [x] Created `netlify.toml` to configure Netlify deployment.
- [x] Updated `src/EdgarFinancials.tsx` to use the Netlify Function URL.
- [x] Removed the local proxy server files and configuration.
- [x] Updated `CLAUDE.md` with the new deployment instructions.
- [x] Updated `Todo.md` with today's completed tasks.

**Date:** 2026-03-02

- [x] Create a backend proxy to handle SEC EDGAR API requests.
- [x] Create a new file `proxy/index.ts` for the proxy server.
- [x] Install `node-fetch` for the proxy server.
- [x] Modify `src/EdgarFinancials.tsx` to use the proxy server.
- [x] Install `tsx` to run the proxy server.
- [x] Start the proxy server.
- [x] Configure a proxy in `vite.config.ts`.
- [x] Restart the development server.
- [x] Update `CLAUDE.md` with the new `EdgarFinancials.tsx` tab.
- [x] Create `Todo.md` with the list of tasks.
- [x] Reverse the order of years in `EdgarFinancials.tsx` to be from low to high.
- [x] Convert non-USD currency to USD in `EdgarFinancials.tsx`.
- [x] Update `Todo.md` with the new tasks.
- [x] Update `CLAUDE.md` with the currency conversion feature.
- [x] In `EdgarFinancials.tsx`, change `.slice(0, 5)` to `.slice(-5)` in `extractAnnual` function.
- [x] In `EdgarFinancials.tsx`, change `.slice(0, 5)` to `.slice(-5)` for `allYears` variable.
- [x] In `EdgarFinancials.tsx`, change `.slice(0, 5)` to `.slice(-5)` for `years` variable.
- [x] Update `Todo.md` with the new slice changes.
- [x] Add more income statement concepts to `EdgarFinancials.tsx`.
- [x] Add more balance sheet concepts to `EdgarFinancials.tsx`.
- [x] Add more cash flow concepts to `EdgarFinancials.tsx`.
- [x] Update `FinancialData` interface to include new concepts.
- [x] Update `d` object to include new concepts.
- [x] Update `TableSection` to display new income statement concepts.
- [x] Update `TableSection` to display new balance sheet concepts.
- [x] Update `TableSection` to display new cash flow concepts.
- [x] Update `Todo.md` with the new data fetching tasks.
