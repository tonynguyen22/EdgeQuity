import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import ErrorState from './ErrorState.tsx';
import LoadingState from './LoadingState.tsx';
import MetricCell from './MetricCell.tsx';
import ScreenerTable, { getScreenerSectors, getVisibleScreenerStocks } from './ScreenerTable.tsx';
import ScreenerToolbar from './ScreenerToolbar.tsx';
import StockDetail from './StockDetail.tsx';
import type { FundraColumn, FundraStockRecord } from '../types.ts';

const stock: FundraStockRecord = {
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

test('LoadingState renders the Fundra loading message', () => {
  const html = renderToStaticMarkup(<LoadingState />);

  assert.match(html, /Loading Fundra data\.\.\./);
});

test('ErrorState renders the Fundra error heading and message', () => {
  const html = renderToStaticMarkup(<ErrorState message="Network unavailable" />);

  assert.match(html, /Fundra data could not load/);
  assert.match(html, /Network unavailable/);
});

test('ScreenerTable renders ticker and company buttons', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[stock]} onSelectStock={() => undefined} />);

  assert.match(html, /AAPL/);
  assert.match(html, /Apple Inc\./);
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

test('ScreenerTable filters by query and sector, then sorts nulls last', () => {
  const stocks: FundraStockRecord[] = [
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
  const stocks: FundraStockRecord[] = [
    { ...stock, ticker: 'SMOL', name: 'Small Co.', marketCap: 10 },
    { ...stock, ticker: 'BIG', name: 'Big Co.', marketCap: 20 },
  ];
  const html = renderToStaticMarkup(<ScreenerTable stocks={stocks} onSelectStock={() => undefined} />);

  assert.ok(html.indexOf('BIG') < html.indexOf('SMOL'));
  assert.match(html, /Market Cap[\s\S]*>v</);
});

test('ScreenerTable renders an empty state when no stocks are visible', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[]} onSelectStock={() => undefined} />);

  assert.match(html, /No stocks match the current filters/);
});

test('StockDetail renders selected stock basics', () => {
  const html = renderToStaticMarkup(<StockDetail stock={stock} onBack={() => undefined} />);

  assert.match(html, /Back/);
  assert.match(html, /AAPL/);
  assert.match(html, /Apple Inc\./);
});

test('MetricCell renders text values left-aligned without mono numeric styling', () => {
  const column: FundraColumn = {
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
  const column: FundraColumn = {
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
