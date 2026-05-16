import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import ErrorState from './ErrorState.tsx';
import LoadingState from './LoadingState.tsx';
import MetricCell from './MetricCell.tsx';
import ScreenerTable, { getScreenerSectors, getVisibleScreenerStocks } from './ScreenerTable.tsx';
import ScreenerToolbar from './ScreenerToolbar.tsx';
import StockDetail from './StockDetail.tsx';
import type { EdgequityColumn, EdgequityStockRecord } from '../types.ts';

const stock: EdgequityStockRecord = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  industry: 'Consumer Electronics',
  currency: 'USD',
  price: 190,
  marketCap: 3000000000000,
  enterpriseValue: 3100000000000,
  valuation: {
    peTTM: 28,
    forwardPE: 24,
    psTTM: 7,
    pb: 35,
    evRevenue: 7.2,
    evEbitda: 21,
    pfcf: 26,
    fcfYield: 0.038,
    earningsYield: 0.036,
  },
  profitability: {
    grossMargin: 0.46,
    operatingMargin: 0.3,
    netMargin: 0.26,
    roe: 1.4,
    roa: 0.28,
    roic: 0.52,
  },
  growth: {
    revenueCagr3y: 0.06,
    revenueCagr5y: 0.08,
    epsCagr3y: 0.09,
    fcfCagr3y: 0.07,
  },
  financialHealth: {
    currentRatio: 1,
    quickRatio: 0.9,
    debtToEquity: 1.8,
    netDebtToEbitda: 0.7,
    interestCoverage: 30,
  },
  cashFlow: {
    operatingCashFlow: 110000000000,
    freeCashFlow: 99000000000,
    fcfMargin: 0.25,
    capexToRevenue: 0.03,
    fcfConversion: 1.1,
  },
  dividends: {
    dividendYield: 0.005,
    payoutRatio: 0.15,
  },
  history: [],
  warnings: [],
};

test('LoadingState renders the Edgequity loading message', () => {
  const html = renderToStaticMarkup(<LoadingState />);

  assert.match(html, /Loading Edgequity data\.\.\./);
});

test('ErrorState renders the Edgequity error heading and message', () => {
  const html = renderToStaticMarkup(<ErrorState message="Network unavailable" />);

  assert.match(html, /Edgequity data could not load/);
  assert.match(html, /Network unavailable/);
});

test('ScreenerTable renders ticker and company buttons', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[stock]} onSelectStock={() => undefined} />);

  assert.match(html, /AAPL/);
  assert.match(html, /Apple Inc\./);
});

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

test('ScreenerToolbar renders search, sector options, and reset control', () => {
  const html = renderToStaticMarkup(
    <ScreenerToolbar
      query=""
      sector=""
      sectors={['Consumer Defensive', 'Technology']}
      onQueryChange={() => undefined}
      onSectorChange={() => undefined}
      onReset={() => undefined}
    />,
  );

  assert.match(html, /Search ticker or company/);
  assert.match(html, /All sectors/);
  assert.match(html, /Consumer Defensive/);
  assert.match(html, /Technology/);
  assert.match(html, /Reset/);
});

test('ScreenerTable derives sorted non-empty sectors', () => {
  assert.deepEqual(getScreenerSectors([
    { ...stock, sector: 'Technology' },
    { ...stock, ticker: 'KO', sector: 'Consumer Defensive' },
    { ...stock, ticker: 'BRK.B', sector: null },
    { ...stock, ticker: 'MSFT', sector: 'Technology' },
  ]), ['Consumer Defensive', 'Technology']);
});

test('ScreenerTable filters trimmed sector options against trimmed stock sectors', () => {
  const stocks: EdgequityStockRecord[] = [
    { ...stock, ticker: 'AAPL', sector: ' Technology ' },
    { ...stock, ticker: 'KO', sector: 'Consumer Defensive' },
  ];

  const visible = getVisibleScreenerStocks(stocks, {
    query: '',
    sector: 'Technology',
    sort: { columnId: 'ticker', direction: 'asc' },
  });

  assert.deepEqual(visible.map((item) => item.ticker), ['AAPL']);
});

test('ScreenerTable filters by query and sector, then sorts nulls last', () => {
  const stocks: EdgequityStockRecord[] = [
    { ...stock, ticker: 'AAA', name: 'Acme Software', sector: 'Technology', marketCap: null },
    { ...stock, ticker: 'BBB', name: 'Beta Stores', sector: 'Consumer Defensive', marketCap: 20 },
    { ...stock, ticker: 'CCC', name: 'Cloud Components', sector: 'Technology', marketCap: 10 },
  ];

  const visible = getVisibleScreenerStocks(stocks, {
    query: 'c',
    sector: 'Technology',
    sort: { columnId: 'marketCap', direction: 'asc' },
  });

  assert.deepEqual(visible.map((item) => item.ticker), ['CCC', 'AAA']);
});

test('ScreenerTable server render uses market cap descending by default', () => {
  const stocks: EdgequityStockRecord[] = [
    { ...stock, ticker: 'SMOL', name: 'Small Co.', marketCap: 10 },
    { ...stock, ticker: 'BIG', name: 'Big Co.', marketCap: 20 },
  ];
  const html = renderToStaticMarkup(<ScreenerTable stocks={stocks} onSelectStock={() => undefined} />);

  assert.ok(html.indexOf('BIG') < html.indexOf('SMOL'));
  assert.match(html, /Market Cap[\s\S]*>v</);
});

test('ScreenerTable exposes active and inactive sort state to assistive tech', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[stock]} onSelectStock={() => undefined} />);

  assert.match(html, /aria-sort="descending"[\s\S]*Market Cap/);
  assert.match(html, /aria-sort="none"[\s\S]*Ticker/);
  assert.match(html, /aria-label="Sort by Market Cap ascending"/);
});

test('ScreenerTable renders an empty state when no stocks are visible', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[]} onSelectStock={() => undefined} />);

  assert.match(html, /No stocks match the current filters/);
});

test('StockDetail renders metric groups, data notes, and historical fundamentals', () => {
  const detailStock: EdgequityStockRecord = {
    ...stock,
    warnings: ['Missing forward estimates'],
    history: [
      {
        year: '2025',
        revenue: 391000000000,
        grossProfit: 181000000000,
        operatingIncome: 123000000000,
        netIncome: 97000000000,
        freeCashFlow: 99000000000,
        totalAssets: 365000000000,
        totalDebt: 106000000000,
        totalEquity: 74000000000,
        sharesDiluted: 15000000000,
      },
    ],
  };
  const html = renderToStaticMarkup(<StockDetail stock={detailStock} onBack={() => undefined} />);

  assert.match(html, /Back to screener/);
  assert.match(html, /AAPL/);
  assert.match(html, /Apple Inc\./);
  assert.match(html, /Technology \/ Consumer Electronics/);
  assert.match(html, /Data notes/);
  assert.match(html, /Missing forward estimates/);
  assert.match(html, /Valuation/);
  assert.match(html, /P\/E TTM/);
  assert.match(html, /28\.0x/);
  assert.match(html, /Profitability/);
  assert.match(html, /46\.0%/);
  assert.match(html, /Historical fundamentals/);
  assert.match(html, /Gross Profit/);
  assert.match(html, /\$391\.0B/);
  assert.match(html, /\$106\.0B/);
});

test('MetricCell renders text values left-aligned without mono numeric styling', () => {
  const column: EdgequityColumn = {
    id: 'name',
    label: 'Company',
    group: 'profile',
    accessor: (row) => row.name,
    format: 'text',
    sortable: true,
  };

  const html = renderToStaticMarkup(
    <table>
      <tbody>
        <tr>
          <MetricCell stock={stock} column={column} />
        </tr>
      </tbody>
    </table>,
  );

  assert.match(html, /Apple Inc\./);
  assert.match(html, /text-left/);
  assert.match(html, /font-normal/);
  assert.doesNotMatch(html, /font-mono/);
  assert.doesNotMatch(html, /tabular-nums/);
  assert.match(html, /--vw-text-primary/);
});

test('MetricCell keeps missing text values tertiary', () => {
  const column: EdgequityColumn = {
    id: 'sector',
    label: 'Sector',
    group: 'profile',
    accessor: () => null,
    format: 'text',
    sortable: true,
  };

  const html = renderToStaticMarkup(
    <table>
      <tbody>
        <tr>
          <MetricCell stock={stock} column={column} />
        </tr>
      </tbody>
    </table>,
  );

  assert.match(html, />-</);
  assert.match(html, /--vw-text-tertiary/);
});
