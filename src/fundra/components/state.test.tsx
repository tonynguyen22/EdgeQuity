import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import ErrorState from './ErrorState.tsx';
import LoadingState from './LoadingState.tsx';
import ScreenerTable from './ScreenerTable.tsx';
import StockDetail from './StockDetail.tsx';
import type { FundraStockRecord } from '../types.ts';

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

test('StockDetail renders selected stock basics', () => {
  const html = renderToStaticMarkup(<StockDetail stock={stock} onBack={() => undefined} />);

  assert.match(html, /Back/);
  assert.match(html, /AAPL/);
  assert.match(html, /Apple Inc\./);
});
