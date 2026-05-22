import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import ErrorState from './ErrorState.tsx';
import EdgequityLogo from './EdgequityLogo.tsx';
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
  };
  const html = renderToStaticMarkup(<ScreenerTable stocks={[nvdaStock]} onSelectStock={() => undefined} />);

  assert.match(html, /table-auto/);
  assert.doesNotMatch(html, /table-fixed/);
  assert.match(html, /whitespace-nowrap/);
  assert.ok(html.indexOf('>Sector<') < html.indexOf('>Earnings<'));
  assert.ok(html.indexOf('>Earnings<') < html.indexOf('>Updated<'));
  assert.match(html, /eq-earnings-cell/);
  assert.match(html, /Recent[\s\S]*Q1 FY2027[\s\S]*May 20, 2026/);
  assert.match(html, /Next[\s\S]*Q2 FY2027[\s\S]*Aug 26, 2026 est\./);
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

test('StockDetail defaults to a full equity research report for covered tickers', () => {
  const html = renderToStaticMarkup(<StockDetail stock={stock} onBack={() => undefined} />);

  assert.match(html, /AI Analysis/);
  assert.match(html, /aria-selected="true"[\s\S]*AI Analysis/);
  assert.match(html, /Financials/);
  assert.match(html, /Equity Research: Apple Inc\. \(AAPL\)/);
  assert.match(html, /analysis-detail-container/);
  assert.match(html, /analysis-detail-header/);
  assert.match(html, /detail-content/);
  assert.match(html, /stock-overview-card/);
  assert.match(html, /quick-stats-grid/);
  assert.match(html, /detail-section/);
  assert.match(html, /metric-pair-grid/);
  assert.match(html, /scenario-comparison-grid/);
  assert.match(html, /forecast-table/);
  assert.match(html, /sensitivity-table/);
  assert.match(html, /final-verdict-box/);
  assert.match(html, /02 — Recent News &amp; Earnings/);
  assert.match(html, /03 — Business Summary/);
  assert.match(html, /04 — Core Segment Deep Dive/);
  assert.match(html, /05 — Industry Context/);
  assert.match(html, /06 — Competitive Advantages &amp; Moat/);
  assert.match(html, /07 — Revenue Growth &amp; Profitability/);
  assert.match(html, /08 — Earnings Per Share/);
  assert.match(html, /09 — Balance Sheet/);
  assert.match(html, /10 — 3-Year Forecast/);
  assert.match(html, /11 — Valuation/);
  assert.match(html, /12 — Sensitivity Analysis/);
  assert.match(html, /13 — Key Risks/);
  assert.match(html, /14 — Final Verdict/);
  assert.match(html, /eq-report-chart/);
  assert.match(html, /Bear Case/);
  assert.match(html, /Base Case/);
  assert.match(html, /Bull Case/);
  assert.match(html, /Apple pairs fortress-like cash generation/);
});

test('StockDetail charts use the latest five years and render revenue plus FCF and margin lines', () => {
  const chartStock: EdgequityStockRecord = {
    ...stock,
    history: [
      { year: '2025', revenue: 600, grossProfit: 300, operatingIncome: 200, netIncome: 180, freeCashFlow: 150, totalAssets: 700, totalDebt: 20, totalEquity: 500, sharesDiluted: 10 },
      { year: '2024', revenue: 540, grossProfit: 260, operatingIncome: 170, netIncome: 150, freeCashFlow: 130, totalAssets: 650, totalDebt: 22, totalEquity: 470, sharesDiluted: 10 },
      { year: '2023', revenue: 500, grossProfit: 240, operatingIncome: 160, netIncome: 140, freeCashFlow: 110, totalAssets: 620, totalDebt: 24, totalEquity: 440, sharesDiluted: 11 },
      { year: '2022', revenue: 460, grossProfit: 220, operatingIncome: 140, netIncome: 120, freeCashFlow: 90, totalAssets: 590, totalDebt: 26, totalEquity: 410, sharesDiluted: 11 },
      { year: '2021', revenue: 430, grossProfit: 210, operatingIncome: 130, netIncome: 110, freeCashFlow: 80, totalAssets: 560, totalDebt: 28, totalEquity: 390, sharesDiluted: 12 },
      { year: '2020', revenue: 400, grossProfit: 190, operatingIncome: 115, netIncome: 100, freeCashFlow: 70, totalAssets: 530, totalDebt: 30, totalEquity: 360, sharesDiluted: 12 },
    ],
  };
  const html = renderToStaticMarkup(<StockDetail stock={chartStock} onBack={() => undefined} />);

  assert.match(html, /eq-chart-line-primary/);
  assert.match(html, /eq-chart-line-secondary/);
  assert.match(html, /Revenue and Free Cash Flow/);
  assert.match(html, /5Y Revenue and FCF/);
  assert.match(html, /Y-axis: USD in billions/);
  assert.match(html, /X-axis: Fiscal year/);
  assert.match(html, /eq-chart-latest-row/);
  assert.match(html, /eq-chart-data-table/);
  assert.match(html, /Latest: \$600\.0/);
  assert.match(html, /Latest: \$150\.0/);
  assert.match(html, /Gross and Operating Margin/);
  assert.match(html, /5Y Gross and Operating Margin/);
  assert.match(html, /Y-axis: Margin percentage/);
  assert.match(html, /Latest: 50\.0%/);
  assert.doesNotMatch(html, /eq-chart-labels"><span>2020</);
  assert.match(html, />2021</);
  assert.match(html, />2025</);
});

test('StockDetail renders Alphabet base-case price prediction and valuation method', () => {
  const googleStock: EdgequityStockRecord = {
    ...stock,
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    price: 390.28,
    valuation: {
      ...stock.valuation,
      peTTM: 29.8,
      forwardPE: 24.5,
      fcfYield: 0.0154,
    },
    history: [
      { year: '2025', revenue: 402963000000, grossProfit: 240428000000, operatingIncome: 129166000000, netIncome: 132170000000, freeCashFlow: 73266000000, totalAssets: 595281000000, totalDebt: 59291000000, totalEquity: 415265000000, sharesDiluted: 12230000000 },
      { year: '2024', revenue: 350018000000, grossProfit: 203712000000, operatingIncome: 112390000000, netIncome: 100118000000, freeCashFlow: 72764000000, totalAssets: 450256000000, totalDebt: 25461000000, totalEquity: 325084000000, sharesDiluted: 12447000000 },
      { year: '2023', revenue: 307394000000, grossProfit: 174062000000, operatingIncome: 84293000000, netIncome: 73795000000, freeCashFlow: 69495000000, totalAssets: 402392000000, totalDebt: 27121000000, totalEquity: 283379000000, sharesDiluted: 12722000000 },
      { year: '2022', revenue: 282836000000, grossProfit: 156633000000, operatingIncome: 74842000000, netIncome: 59972000000, freeCashFlow: 60010000000, totalAssets: 365264000000, totalDebt: 29679000000, totalEquity: 256144000000, sharesDiluted: 13159000000 },
      { year: '2021', revenue: 257637000000, grossProfit: 146698000000, operatingIncome: 78714000000, netIncome: 76033000000, freeCashFlow: 67012000000, totalAssets: 359268000000, totalDebt: 28395000000, totalEquity: 251635000000, sharesDiluted: 13553480000 },
    ],
  };
  const html = renderToStaticMarkup(<StockDetail stock={googleStock} onBack={() => undefined} />);

  assert.match(html, /\$480/);
  assert.match(html, /Base-case price target/);
  assert.match(html, /26x FY2028E EPS/);
  assert.match(html, /\+23\.0%/);
});

test('StockDetail renders an analysis pending state for uncovered tickers', () => {
  const uncoveredStock: EdgequityStockRecord = {
    ...stock,
    ticker: 'NFLX',
    name: 'Netflix Inc.',
  };
  const html = renderToStaticMarkup(<StockDetail stock={uncoveredStock} onBack={() => undefined} />);

  assert.match(html, /AI analysis is queued for this ticker\. Financial data is available below\./);
  assert.doesNotMatch(html, /Apple pairs fortress-like cash generation/);
});

test('StockDetail keeps metric groups, investment notes, and historical fundamentals in the financials tab', () => {
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
  assert.match(html, /id="edgequity-financials-panel"/);
  assert.match(html, /id="edgequity-statements-panel"/);
  assert.match(html, />Statements</);
  assert.match(html, />Fundamentals</);
  assert.match(html, /id="edgequity-fundamentals-panel"/);
  assert.match(html, /hidden=""/);
  assert.match(html, /Valuation/);
  assert.match(html, /P\/E TTM/);
  assert.match(html, /28\.0x/);
  assert.match(html, /Margin/);
  assert.match(html, /Gross Margin/);
  assert.match(html, /Profitability/);
  assert.match(html, /ROE/);
  assert.match(html, /46\.0%/);
  assert.match(html, /Historical fundamentals/);
  assert.match(html, /Gross Profit/);
  assert.match(html, /\$391\.0B/);
  assert.match(html, /\$106\.0B/);
});

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
