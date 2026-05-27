import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import ErrorState from './ErrorState.tsx';
import EdgequityLogo from './EdgequityLogo.tsx';
import LoadingState from './LoadingState.tsx';
import MetricCell from './MetricCell.tsx';
import MetricTrendChart from './MetricTrendChart.tsx';
import FundamentalsPanel from './FundamentalsPanel.tsx';
import ReportedFinancialsPanel from './ReportedFinancialsPanel.tsx';
import ScreenerTable, { getScreenerSectors, getVisibleScreenerStocks } from './ScreenerTable.tsx';
import ScreenerToolbar from './ScreenerToolbar.tsx';
import StockDetail from './StockDetail.tsx';
import type { EdgequityColumn, EdgequityFinnhubSnapshot, EdgequityStockRecord } from '../types.ts';

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

const fmpStatementStock: EdgequityStockRecord = {
  ...stock,
  financialStatements: {
    source: {
      provider: 'sec',
      endpoint: 'SEC Company Facts',
      fetchedAt: '2026-05-24T00:00:00.000Z',
      status: 'ok',
    },
    annual: {
      incomeStatement: [
        {
          fiscalYear: '2025',
          period: 'FY',
          date: '2025-12-31',
          reportedCurrency: 'USD',
          values: {
            revenue: 600000000000,
            grossProfit: 300000000000,
            operatingIncome: 200000000000,
            netIncome: 180000000000,
            epsdiluted: 12,
          },
        },
        {
          fiscalYear: '2024',
          period: 'FY',
          date: '2024-12-31',
          reportedCurrency: 'USD',
          values: {
            revenue: 500000000000,
            grossProfit: 240000000000,
            operatingIncome: 160000000000,
            netIncome: 140000000000,
            epsdiluted: 10,
          },
        },
      ],
      balanceSheet: [
        {
          fiscalYear: '2025',
          period: 'FY',
          date: '2025-12-31',
          reportedCurrency: 'USD',
          values: {
            cashAndCashEquivalents: 90000000000,
            totalAssets: 700000000000,
            totalDebt: 20000000000,
            totalStockholdersEquity: 500000000000,
          },
        },
        {
          fiscalYear: '2024',
          period: 'FY',
          date: '2024-12-31',
          reportedCurrency: 'USD',
          values: {
            cashAndCashEquivalents: 80000000000,
            totalAssets: 650000000000,
            totalDebt: 22000000000,
            totalStockholdersEquity: 470000000000,
          },
        },
      ],
      cashFlow: [
        {
          fiscalYear: '2025',
          period: 'FY',
          date: '2025-12-31',
          reportedCurrency: 'USD',
          values: {
            operatingCashFlow: 170000000000,
            capitalExpenditure: -20000000000,
            freeCashFlow: 150000000000,
          },
        },
        {
          fiscalYear: '2024',
          period: 'FY',
          date: '2024-12-31',
          reportedCurrency: 'USD',
          values: {
            operatingCashFlow: 145000000000,
            capitalExpenditure: -15000000000,
            freeCashFlow: 130000000000,
          },
        },
      ],
    },
    quarterly: {
      incomeStatement: [
        {
          fiscalYear: '2026',
          period: 'Q2',
          date: '2026-06-30',
          reportedCurrency: 'USD',
          values: { revenue: 180000000000, grossProfit: 92000000000, operatingIncome: 61000000000, netIncome: 52000000000 },
        },
        {
          fiscalYear: '2026',
          period: 'Q1',
          date: '2026-03-31',
          reportedCurrency: 'USD',
          values: { revenue: 170000000000, grossProfit: 86000000000, operatingIncome: 56000000000, netIncome: 48000000000 },
        },
      ],
      balanceSheet: [
        {
          fiscalYear: '2026',
          period: 'Q2',
          date: '2026-06-30',
          reportedCurrency: 'USD',
          values: { totalAssets: 720000000000, totalDebt: 21000000000, totalStockholdersEquity: 510000000000 },
        },
        {
          fiscalYear: '2026',
          period: 'Q1',
          date: '2026-03-31',
          reportedCurrency: 'USD',
          values: { totalAssets: 710000000000, totalDebt: 20500000000, totalStockholdersEquity: 505000000000 },
        },
      ],
      cashFlow: [
        {
          fiscalYear: '2026',
          period: 'Q2',
          date: '2026-06-30',
          reportedCurrency: 'USD',
          values: { operatingCashFlow: 50000000000, capitalExpenditure: -6000000000, freeCashFlow: 44000000000 },
        },
        {
          fiscalYear: '2026',
          period: 'Q1',
          date: '2026-03-31',
          reportedCurrency: 'USD',
          values: { operatingCashFlow: 47000000000, capitalExpenditure: -5500000000, freeCashFlow: 41500000000 },
        },
      ],
    },
  },
};

const annualOnlyFmpStatementStock: EdgequityStockRecord = {
  ...fmpStatementStock,
  financialStatements: fmpStatementStock.financialStatements
    ? {
      ...fmpStatementStock.financialStatements,
      quarterly: undefined,
    }
    : undefined,
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

test('EdgequityLogo renders the institutional shield mark and wordmark', () => {
  const html = renderToStaticMarkup(<EdgequityLogo />);

  assert.match(html, /eq-brand-logo/);
  assert.match(html, /aria-label="Edgequity"/);
  assert.match(html, /Edgequity/);
  assert.match(html, /<svg/);
  assert.match(html, /<title>Edgequity institutional research shield<\/title>/);
  assert.match(html, /eq-logo-e-stem/);
  assert.match(html, /eq-logo-e-top/);
  assert.match(html, /eq-logo-e-mid/);
  assert.match(html, /eq-logo-e-bottom/);
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
  assert.match(html, /text-\[13px\]/);
  assert.match(html, /text-\[11px\]/);
  assert.match(html, />MCap</);
  assert.match(html, />Fwd P\/E</);
  assert.match(html, />FCFY</);
  assert.doesNotMatch(html, />Market Cap</);
  assert.doesNotMatch(html, />FCF Yield</);
});

test('ScreenerTable renders grouped column headers for faster scanning', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[stock]} onSelectStock={() => undefined} />);

  assert.match(html, /eq-group-header/);
  assert.match(html, /eq-soft-row-dividers/);
  assert.match(html, /eq-group-header-valuation/);
  assert.match(html, /eq-group-header-margin/);
  assert.match(html, /eq-group-shade-valuation/);
  assert.match(html, /eq-group-shade-margin/);
  assert.match(html, /colSpan="6"[\s\S]*>Valuation</);
  assert.match(html, /colSpan="3"[\s\S]*>Margin</);
  assert.match(html, /colSpan="2"[\s\S]*>Profitability</);
  assert.match(html, /eq-group-start/);
  assert.match(html, /aria-label="Sort by FCFY descending"/);
});

test('ScreenerTable keeps compact rows and shows earnings context after sector', () => {
  const nvdaStock: EdgequityStockRecord = {
    ...stock,
    ticker: 'NVDA',
    name: 'NVIDIA Corp',
    sector: 'Communication Services',
    earnings: {
      recent: { period: 'Q1 FY2027', date: '2026-05-20', source: 'Finnhub', sourceUrl: 'https://finnhub.io' },
      next: { period: 'Q2 FY2027', date: '2026-08-26', isEstimated: true, source: 'DoltHub', sourceUrl: 'https://www.dolthub.com/repositories/post-no-preference/earnings' },
      updatedAt: '2026-05-25T00:00:00.000Z',
    },
    transcript: {
      status: 'found',
      title: 'NVIDIA Q1 FY2027 earnings call transcript',
      date: '2026-05-20',
      source: 'Company IR',
      sourceUrl: 'https://investor.nvidia.com',
      fetchedAt: '2026-05-25T00:00:00.000Z',
    },
  };
  const html = renderToStaticMarkup(<ScreenerTable stocks={[nvdaStock]} onSelectStock={() => undefined} />);

  assert.match(html, /table-auto/);
  assert.doesNotMatch(html, /table-fixed/);
  assert.match(html, /whitespace-nowrap/);
  assert.ok(html.indexOf('>Sector<') < html.indexOf('>Earnings<'));
  assert.ok(html.indexOf('>Earnings<') < html.indexOf('>Updated<'));
  assert.match(html, /eq-earnings-cell/);
  assert.match(html, /Recent[\s\S]*Q1 FY2027[\s\S]*2026-05-20/);
  assert.match(html, /Next[\s\S]*Q2 FY2027[\s\S]*2026-08-26/);
  assert.match(html, /2026-05-20/);
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
  assert.match(html, /MCap[\s\S]*>v</);
});

test('ScreenerTable exposes active and inactive sort state to assistive tech', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[stock]} onSelectStock={() => undefined} />);

  assert.match(html, /aria-sort="descending"[\s\S]*MCap/);
  assert.match(html, /aria-sort="none"[\s\S]*Ticker/);
  assert.match(html, /aria-label="Sort by MCap ascending"/);
});

test('ScreenerTable renders an empty state when no stocks are visible', () => {
  const html = renderToStaticMarkup(<ScreenerTable stocks={[]} onSelectStock={() => undefined} />);

  assert.match(html, /No stocks match the current filters/);
});

test('StockDetail renders only the AI Analysis company and price shell', () => {
  const html = renderToStaticMarkup(<StockDetail stock={stock} onBack={() => undefined} />);

  assert.match(html, /eq-analysis-company-header/);
  assert.match(html, /eq-analysis-price-hero/);
  assert.match(html, /Company Profile/);
  assert.match(html, /Current Price/);
  assert.match(html, /Previous Close/);
  assert.match(html, /Market Cap/);
  assert.match(html, /Data Status/);
  assert.doesNotMatch(html, /role="tablist"/);
  assert.doesNotMatch(html, /Financials/);
  assert.match(html, /<h4>Fundamentals<\/h4>/);
  assert.doesNotMatch(html, /edgequity-fundamentals-tab/);
  assert.doesNotMatch(html, /edgequity-financials-panel/);
  assert.doesNotMatch(html, /Coming Soon/);
  assert.doesNotMatch(html, />Statements</);
  assert.doesNotMatch(html, /Equity Research: Apple Inc\. \(AAPL\)/);
  assert.doesNotMatch(html, /analysis-detail-container/);
  assert.doesNotMatch(html, /Apple pairs fortress-like cash generation/);
});

test('StockDetail AI Analysis renders statement fundamentals inside paired chart cards', () => {
  const html = renderToStaticMarkup(<StockDetail stock={fmpStatementStock} onBack={() => undefined} />);

  assert.match(html, /<span>1<\/span>[\s\S]*<h4>Fundamentals<\/h4>/);
  assert.match(html, /A\. Revenue/);
  assert.match(html, /Revenue Annual/);
  assert.match(html, /Revenue Quarterly/);
  assert.match(html, /eq-analysis-metric-pair-card/);
  assert.match(html, /eq-analysis-chart-pair/);
  assert.match(html, /2Y/);
  assert.match(html, /2Q/);
});

test('StockDetail AI Analysis uses paired annual and quarterly fundamental metric cards', () => {
  const snapshot = buildFinnhubSnapshot({
    annual: {
      fcfMargin: [
        { period: '2021-12-31', v: 0.18 },
        { period: '2022-12-31', v: 0.19 },
        { period: '2023-12-31', v: 0.2 },
        { period: '2024-12-31', v: 0.21 },
        { period: '2025-12-31', v: 0.22 },
      ],
    },
    quarterly: {
      fcfMargin: Array.from({ length: 20 }, (_, index) => ({
        period: `${2021 + Math.floor(index / 4)}-${String(((index % 4) + 1) * 3).padStart(2, '0')}-30`,
        v: 0.1 + index / 100,
      })),
    },
  });
  const html = renderToStaticMarkup(
    <StockDetail stock={fmpStatementStock} onBack={() => undefined} initialFinnhubSnapshot={snapshot} />,
  );

  assert.match(html, /eq-analysis-symbol-row/);
  assert.match(html, /AAPL[\s\S]*Apple Inc\./);
  assert.match(html, /Apple Inc\. is a Technology company listed on NASDAQ/);
  assert.match(html, /<span>1<\/span>[\s\S]*<h4>Fundamentals<\/h4>/);
  assert.match(html, /Sector: Technology/);
  assert.match(html, /A\. Revenue/);
  assert.match(html, /eq-analysis-metric-pair-card/);
  assert.match(html, /eq-analysis-chart-pair/);
  assert.ok(html.indexOf('A. Revenue') < html.indexOf('Annual'));
  assert.ok(html.indexOf('Annual') < html.indexOf('Quarterly'));
  assert.match(html, /20Q/);
  assert.match(html, /FCF margin Annual 2025: 22\.00%/);
  assert.match(html, /FCF margin Quarterly 2025-Q4: 29\.00%/);
});

test('MetricTrendChart formats per-share currency values with cents', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="EPS"
      cadence="Annual"
      format="perShare"
      points={[
        { period: '2024', value: 1.01 },
        { period: '2025', value: 1.23 },
      ]}
    />,
  );

  assert.match(html, /EPS 2025: \$1\.23/);
  assert.doesNotMatch(html, /EPS 2025: \$1(?:[^.])/);
});

test('MetricTrendChart leaves horizontal gutter between y-axis labels and plotted data', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="Revenue"
      cadence="Annual"
      format="money"
      points={[
        { period: '2024', value: 100 },
        { period: '2025', value: 200 },
      ]}
    />,
  );

  assert.match(html, /x="66" y="200" text-anchor="end"/);
  assert.match(html, /cx="118"/);
  assert.doesNotMatch(html, /cx="86"/);
});

test('StockDetail no longer renders the AI Analysis Coming Soon placeholder', () => {
  const html = renderToStaticMarkup(<StockDetail stock={stock} onBack={() => undefined} />);

  assert.doesNotMatch(html, /Coming Soon/);
  assert.doesNotMatch(html, /eq-coming-soon-panel/);
});

test('StockDetail renders the single AI analysis view without old detail tabs', () => {
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
  assert.match(html, /Investment notes/);
  assert.match(html, /Missing forward estimates/);
  assert.match(html, /Company Profile/);
  assert.match(html, /eq-analysis-company-header/);
  assert.match(html, /eq-analysis-price-hero/);
  assert.match(html, /<span>1<\/span>[\s\S]*<h4>Fundamentals<\/h4>/);
  assert.match(html, /A\. Revenue/);
  assert.match(html, /Revenue Annual/);
  assert.doesNotMatch(html, /id="edgequity-statements-panel"/);
  assert.doesNotMatch(html, />Statements</);
  assert.doesNotMatch(html, /edgequity-fundamentals-tab/);
  assert.doesNotMatch(html, /id="edgequity-fundamentals-panel"/);
  assert.doesNotMatch(html, /hidden=""/);
  assert.doesNotMatch(html, /eq-financials-overview/);
  assert.doesNotMatch(html, /Financial snapshot/);
  assert.match(html, /\$391\.0B/);
  assert.doesNotMatch(html, /eq-history-panel/);
  assert.doesNotMatch(html, /Historical fundamentals/);
});

test('ReportedFinancialsPanel renders normalized statement data from the selected stock record', () => {
  const html = renderToStaticMarkup(<ReportedFinancialsPanel stock={fmpStatementStock} />);

  assert.match(html, /Statements/);
  assert.match(html, /Source: SEC Company Facts/);
  assert.match(html, />Income Statement</);
  assert.match(html, />Balance Sheet</);
  assert.match(html, />Cash Flow</);
  assert.match(html, /Revenue/);
  assert.match(html, /Gross Profit/);
  assert.match(html, /\$600\.00B/);
  assert.doesNotMatch(html, /Financial Modeling Prep/);
  assert.doesNotMatch(html, /edgequity:sec-statements/);
});

test('FundamentalsPanel renders annual and quarterly sections from normalized statements', () => {
  const html = renderToStaticMarkup(<FundamentalsPanel stock={fmpStatementStock} />);

  assert.match(html, /Growth/);
  assert.match(html, /Revenue/);
  assert.match(html, /Gross profit/);
  assert.match(html, /Free cash flow/);
  assert.match(html, /2Y/);
  assert.match(html, /2Q/);
  assert.match(html, /2024/);
  assert.match(html, /2025/);
  assert.match(html, /26 Q1/);
  assert.match(html, /26 Q2/);
  assert.match(html, /\$180\.00B/);
  assert.match(html, /\$600\.0B/);
  assert.doesNotMatch(html, /fundamentals chart cache/);
  assert.doesNotMatch(html, /edgequity:fundamentals-charts/);
});

test('FundamentalsPanel does not leave a blank quarterly chart column when only annual data exists', () => {
  const html = renderToStaticMarkup(<FundamentalsPanel stock={annualOnlyFmpStatementStock} />);

  assert.match(html, /eq-fundamentals-chart-grid is-single/);
  assert.match(html, /Revenue Annual chart/);
  assert.doesNotMatch(html, /Quarterly chart/);
  assert.doesNotMatch(html, /No data/);
});

test('StockDetail renders the analyst sheet layout sections', () => {
  const detailStock: EdgequityStockRecord = {
    ...stock,
    warnings: ['Revenue history is partially estimated'],
  };
  const html = renderToStaticMarkup(<StockDetail stock={detailStock} onBack={() => undefined} />);

  assert.match(html, /eq-detail-hero/);
  assert.match(html, /eq-kpi-strip/);
  assert.match(html, /eq-analysis-company-header/);
  assert.match(html, /eq-analysis-price-hero/);
  assert.match(html, /Investment notes/);
  assert.doesNotMatch(html, /eq-financials-summary/);
  assert.doesNotMatch(html, /eq-metric-panel/);
  assert.doesNotMatch(html, /eq-history-panel/);
});

test('MetricTrendChart normalizes annual charts to the latest five years in chronological order', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="Revenue"
      cadence="Annual"
      format="money"
      points={[
        { period: '2026', value: 600 },
        { period: '2025', value: 500 },
        { period: '2024', value: 400 },
        { period: '2023', value: 300 },
        { period: '2022', value: 200 },
        { period: '2021', value: 100 },
      ]}
    />,
  );

  assert.match(html, /5Y/);
  assert.match(html, /viewBox="0 0 520 260"/);
  assert.doesNotMatch(html, />2021</);
  assert.match(html, />2022</);
  assert.match(html, />2026</);
  assert.ok(html.indexOf('>2022<') < html.indexOf('>2026<'));
});

test('MetricTrendChart labels ISO annual date periods by year', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="EPS"
      cadence="Annual"
      format="perShare"
      points={[
        { period: '2024-12-31', value: 1.01 },
        { period: '2025-12-31', value: 1.23 },
      ]}
    />,
  );

  assert.match(html, />2024</);
  assert.match(html, />2025</);
  assert.doesNotMatch(html, />2025-1</);
});

test('MetricTrendChart normalizes quarterly charts to the latest five quarters', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="Revenue"
      cadence="Quarterly"
      format="money"
      points={[
        { period: '2027-Q1', value: 600 },
        { period: '2026-Q4', value: 500 },
        { period: '2026-Q3', value: 400 },
        { period: '2026-Q2', value: 300 },
        { period: '2026-Q1', value: 200 },
        { period: '2025-Q4', value: 100 },
      ]}
    />,
  );

  assert.match(html, /5Q/);
  assert.match(html, /viewBox="0 0 520 260"/);
  assert.doesNotMatch(html, /25 Q4/);
  assert.match(html, /26 Q1/);
  assert.match(html, /27 Q1/);
  assert.ok(html.indexOf('26 Q1') < html.indexOf('27 Q1'));
  assert.doesNotMatch(html, /rotate\(/);
});

test('MetricTrendChart exposes hover labels for each plotted point', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="Revenue"
      cadence="Annual"
      format="money"
      points={[
        { period: '2025', value: 1_200_000_000 },
        { period: '2026', value: 1_500_000_000 },
      ]}
    />,
  );

  assert.match(html, /eq-fundamentals-chart-hit/);
  assert.match(html, /Revenue 2025: \$1.20B/);
  assert.match(html, /Revenue 2026: \$1.50B/);
});

test('MetricTrendChart can render annual charts as bars', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="EPS"
      cadence="Annual"
      format="perShare"
      variant="bar"
      points={[
        { period: '2024', value: 6 },
        { period: '2025', value: 7 },
      ]}
    />,
  );

  assert.match(html, /eq-fundamentals-chart-bar/);
  assert.doesNotMatch(html, /eq-fundamentals-chart-line/);
  assert.match(html, /EPS 2025: \$7\.00/);
});

test('MetricTrendChart marks in-progress annual bars', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="Revenue"
      cadence="Annual"
      format="money"
      variant="bar"
      points={[
        { period: '2025-12-31', value: 100 },
        { period: '2026-12-31', value: 60, inProgress: true },
      ]}
    />,
  );

  assert.match(html, /eq-fundamentals-chart-bar is-in-progress/);
  assert.match(html, /2026-12-31 in progress/);
  assert.match(html, /aria-label="Revenue 2026-12-31 in progress: \$60"/);
});

test('MetricTrendChart maxPoints can render the latest twenty quarterly points', () => {
  const points = Array.from({ length: 24 }, (_, index) => ({
    period: `202${Math.floor(index / 4)}-Q${(index % 4) + 1}`,
    value: index + 1,
  }));
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="Gross Margin"
      cadence="Quarterly"
      format="percent"
      maxPoints={20}
      points={points}
    />,
  );

  assert.match(html, /20Q/);
  assert.doesNotMatch(html, /Gross Margin 2020-Q1/);
  assert.doesNotMatch(html, /Gross Margin 2020-Q4/);
  assert.match(html, /Gross Margin 2021-Q1: 5\.00%/);
  assert.match(html, /Gross Margin 2025-Q4: 24\.00%/);
});

test('MetricTrendChart labels partial quarterly coverage by actual point count', () => {
  const html = renderToStaticMarkup(
    <MetricTrendChart
      title="Revenue"
      cadence="Quarterly"
      format="money"
      maxPoints={20}
      points={[
        { period: '2024-Q4', value: 100 },
        { period: '2025-Q1', value: 110 },
        { period: '2025-Q2', value: 120 },
        { period: '2025-Q3', value: 130 },
        { period: '2025-Q4', value: 140 },
      ]}
    />,
  );

  assert.match(html, /5Q/);
  assert.doesNotMatch(html, /20Q/);
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

function buildFinnhubSnapshot(series: NonNullable<EdgequityFinnhubSnapshot['metrics']['series']>): EdgequityFinnhubSnapshot {
  return {
    ticker: stock.ticker,
    fetchedAt: '2026-05-27T12:00:00.000Z',
    profile: {
      ticker: stock.ticker,
      name: stock.name,
      exchange: 'NASDAQ',
      finnhubIndustry: 'Technology',
      country: 'US',
      currency: 'USD',
      weburl: 'https://www.apple.com',
    },
    quote: { c: stock.price ?? undefined, pc: 188 },
    metrics: { series },
    cache: { profile: 'hit', quote: 'hit', metrics: 'hit' },
  };
}
