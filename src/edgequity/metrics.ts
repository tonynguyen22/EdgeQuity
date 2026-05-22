import { getEdgequityAnalysisNote } from './analysis.ts';
import type { EdgequityColumn, EdgequityStockRecord } from './types.ts';

type EdgequityValueFormat = EdgequityColumn['format'];
type EdgequityValue = string | number | null | undefined;

interface EarningsCalendarEntry {
  recentPeriod: string;
  recentDate: string;
  nextPeriod: string;
  nextDate: string;
}

// Primary source: MarketBeat earnings pages refreshed on 2026-05-21.
// Supplemental sources: company IR/news releases, Wall Street Horizon, Benzinga, Public, and TipRanks
// when MarketBeat did not expose a next earnings date or when a ticker is no longer active.
const EARNINGS_CALENDAR_BY_TICKER: Record<string, EarningsCalendarEntry> = {
  AAL: { recentPeriod: 'Q1 2026', recentDate: 'Apr 23, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 23, 2026 est.' },
  AAPL: { recentPeriod: 'Q2 2026', recentDate: 'Apr 30, 2026', nextPeriod: 'Q3 2026', nextDate: 'Jul 30, 2026 est.' },
  ABBV: { recentPeriod: 'Q1 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 30, 2026 est.' },
  ADBE: { recentPeriod: 'Q1 2026', recentDate: 'Mar 12, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jun 11, 2026 est.' },
  AMD: { recentPeriod: 'Q1 2026', recentDate: 'May 5, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 4, 2026 est.' },
  AMZN: { recentPeriod: 'Q1 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 30, 2026 est.' },
  ATVI: { recentPeriod: 'Final public results', recentDate: 'Aug 2, 2023', nextPeriod: 'No active earnings', nextDate: 'Acquired Oct 13, 2023' },
  BA: { recentPeriod: 'Q1 2026', recentDate: 'Apr 22, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 28, 2026 est.' },
  BABA: { recentPeriod: 'Q4 FY2026', recentDate: 'May 13, 2026', nextPeriod: 'Q1 FY2027', nextDate: 'Aug 28, 2026 est.' },
  BAC: { recentPeriod: 'Q1 2026', recentDate: 'Apr 15, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 14, 2026 est.' },
  BIDU: { recentPeriod: 'Q1 2026', recentDate: 'May 18, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 19, 2026 est.' },
  BILI: { recentPeriod: 'Q1 2026', recentDate: 'May 19, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jun 30, 2026 est.' },
  C: { recentPeriod: 'Q1 2026', recentDate: 'Apr 14, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 14, 2026 est.' },
  CARR: { recentPeriod: 'Q1 2026', recentDate: 'Apr 30, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 4, 2026 est.' },
  CCL: { recentPeriod: 'Q1 2026', recentDate: 'Mar 27, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jun 23, 2026 est.' },
  COIN: { recentPeriod: 'Q1 2026', recentDate: 'May 7, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 30, 2026 est.' },
  COST: { recentPeriod: 'Q2 2026', recentDate: 'Mar 11, 2026', nextPeriod: 'Q3 2026', nextDate: 'May 28, 2026 est.' },
  CPRX: { recentPeriod: 'Q3 2025', recentDate: 'Nov 6, 2025', nextPeriod: 'Q4 2026', nextDate: 'Aug 5, 2026 est.' },
  CSCO: { recentPeriod: 'Q3 FY2026', recentDate: 'May 13, 2026', nextPeriod: 'Q4 FY2026', nextDate: 'Aug 12, 2026 est.' },
  CVX: { recentPeriod: 'Q1 2026', recentDate: 'May 1, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 7, 2026 est.' },
  DAL: { recentPeriod: 'Q1 2026', recentDate: 'Apr 8, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 9, 2026 est.' },
  DIS: { recentPeriod: 'Q2 2026', recentDate: 'May 6, 2026', nextPeriod: 'Q3 2026', nextDate: 'Aug 5, 2026 est.' },
  DOCU: { recentPeriod: 'Q4 2026', recentDate: 'Mar 17, 2026', nextPeriod: 'Q1 2026', nextDate: 'Jun 4, 2026 est.' },
  ET: { recentPeriod: 'Q1 2026', recentDate: 'May 5, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 5, 2026 est.' },
  ETSY: { recentPeriod: 'Q1 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 29, 2026 est.' },
  F: { recentPeriod: 'Q1 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 29, 2026 est.' },
  FDX: { recentPeriod: 'Q3 2026', recentDate: 'Mar 19, 2026', nextPeriod: 'Q4 2026', nextDate: 'Jun 23, 2026 est.' },
  GE: { recentPeriod: 'Q1 2026', recentDate: 'Apr 21, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 16, 2026 est.' },
  GM: { recentPeriod: 'Q1 2026', recentDate: 'Apr 28, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 21, 2026 est.' },
  GOOGL: { recentPeriod: 'Q1 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 22, 2026 est.' },
  GS: { recentPeriod: 'Q1 2026', recentDate: 'Apr 13, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 14, 2026 est.' },
  HCA: { recentPeriod: 'Q1 2026', recentDate: 'Apr 24, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 24, 2026 est.' },
  HOOD: { recentPeriod: 'Q1 2026', recentDate: 'Apr 28, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 29, 2026 est.' },
  INTC: { recentPeriod: 'Q1 2026', recentDate: 'Apr 23, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 23, 2026 est.' },
  JNJ: { recentPeriod: 'Q1 2026', recentDate: 'Apr 14, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 15, 2026 est.' },
  JPM: { recentPeriod: 'Q1 2026', recentDate: 'Apr 14, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 14, 2026 est.' },
  KO: { recentPeriod: 'Q1 2026', recentDate: 'Apr 28, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 28, 2026 est.' },
  LCID: { recentPeriod: 'Q1 2026', recentDate: 'May 5, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 4, 2026 est.' },
  LMT: { recentPeriod: 'Q1 2026', recentDate: 'Apr 23, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 28, 2026 est.' },
  META: { recentPeriod: 'Q1 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 29, 2026 est.' },
  MGM: { recentPeriod: 'Q1 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 29, 2026 est.' },
  MRNA: { recentPeriod: 'Q1 2026', recentDate: 'May 1, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 31, 2026 est.' },
  MRO: { recentPeriod: 'Final public results', recentDate: 'Nov 6, 2024', nextPeriod: 'No active earnings', nextDate: 'Acquired Nov 22, 2024' },
  MSFT: { recentPeriod: 'Q3 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q4 2026', nextDate: 'Jul 29, 2026 est.' },
  NFLX: { recentPeriod: 'Q1 2026', recentDate: 'Apr 16, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 16, 2026 est.' },
  NIO: { recentPeriod: 'Q4 2025', recentDate: 'Feb 14, 2026', nextPeriod: 'Q1 2026', nextDate: 'Jun 2, 2026 est.' },
  NKE: { recentPeriod: 'Q3 2026', recentDate: 'Mar 31, 2026', nextPeriod: 'Q4 2026', nextDate: 'Jun 25, 2026 est.' },
  NOK: { recentPeriod: 'Q1 2026', recentDate: 'Apr 24, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 23, 2026 est.' },
  NVDA: { recentPeriod: 'Q1 FY2027', recentDate: 'May 20, 2026', nextPeriod: 'Q2 FY2027', nextDate: 'Aug 26, 2026 est.' },
  PEP: { recentPeriod: 'Q1 2026', recentDate: 'Apr 15, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 16, 2026 est.' },
  PFE: { recentPeriod: 'Q1 2026', recentDate: 'May 5, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 4, 2026 est.' },
  PINS: { recentPeriod: 'Q1 2026', recentDate: 'May 4, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 6, 2026 est.' },
  PLTR: { recentPeriod: 'Q1 2026', recentDate: 'May 4, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 3, 2026 est.' },
  PYPL: { recentPeriod: 'Q1 2026', recentDate: 'May 5, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 28, 2026 est.' },
  RBLX: { recentPeriod: 'Q1 2026', recentDate: 'Apr 30, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 30, 2026 est.' },
  RIOT: { recentPeriod: 'Q1 2026', recentDate: 'Apr 30, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 30, 2026 est.' },
  RIVN: { recentPeriod: 'Q1 2026', recentDate: 'Apr 30, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 4, 2026 est.' },
  ROKU: { recentPeriod: 'Q1 2026', recentDate: 'Apr 30, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 30, 2026 est.' },
  SBUX: { recentPeriod: 'Q2 2026', recentDate: 'Apr 28, 2026', nextPeriod: 'Q3 2026', nextDate: 'Aug 4, 2026 est.' },
  SHOP: { recentPeriod: 'Q1 2026', recentDate: 'May 5, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 5, 2026 est.' },
  SIRI: { recentPeriod: 'Q1 2026', recentDate: 'Apr 30, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 30, 2026 est.' },
  SNAP: { recentPeriod: 'Q1 2026', recentDate: 'May 6, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 4, 2026 est.' },
  SOFI: { recentPeriod: 'Q1 2026', recentDate: 'Apr 29, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 4, 2026 est.' },
  SONY: { recentPeriod: 'Q4 2026', recentDate: 'May 8, 2026', nextPeriod: 'Q1 2026', nextDate: 'Aug 6, 2026 est.' },
  SQ: { recentPeriod: 'Q1 2026', recentDate: 'May 7, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 7, 2026 est.' },
  T: { recentPeriod: 'Q1 2026', recentDate: 'Apr 22, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 22, 2026 est.' },
  TGT: { recentPeriod: 'Q1 FY2027', recentDate: 'May 20, 2026', nextPeriod: 'Q2 FY2027', nextDate: 'Aug 19, 2026 est.' },
  TLRY: { recentPeriod: 'Q3 2026', recentDate: 'Apr 1, 2026', nextPeriod: 'Q4 2026', nextDate: 'Jul 27, 2026 est.' },
  TSLA: { recentPeriod: 'Q1 2026', recentDate: 'Apr 23, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 22, 2026 est.' },
  TSM: { recentPeriod: 'Q1 2026', recentDate: 'Apr 15, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 16, 2026 est.' },
  TWTR: { recentPeriod: 'Final public results', recentDate: 'Jul 22, 2022', nextPeriod: 'No active earnings', nextDate: 'Private since Oct 27, 2022' },
  UAL: { recentPeriod: 'Q1 2026', recentDate: 'Apr 21, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 15, 2026 est.' },
  UBER: { recentPeriod: 'Q1 2026', recentDate: 'May 6, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 5, 2026 est.' },
  UNH: { recentPeriod: 'Q1 2026', recentDate: 'Apr 21, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 4, 2026 est.' },
  V: { recentPeriod: 'Q2 2026', recentDate: 'Apr 28, 2026', nextPeriod: 'Q3 2026', nextDate: 'Jul 28, 2026 est.' },
  VIAC: { recentPeriod: 'Ticker changed', recentDate: 'Feb 16, 2022', nextPeriod: 'No active VIAC earnings', nextDate: 'Now trades as PARA' },
  VZ: { recentPeriod: 'Q1 2026', recentDate: 'Apr 27, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 21, 2026 est.' },
  WBA: { recentPeriod: 'Q3 FY2025', recentDate: 'Jun 26, 2025', nextPeriod: 'No active earnings', nextDate: 'Sycamore deal pending' },
  WFC: { recentPeriod: 'Q1 2026', recentDate: 'Apr 14, 2026', nextPeriod: 'Q2 2026', nextDate: 'Jul 14, 2026 est.' },
  WMT: { recentPeriod: 'Q1 FY2027', recentDate: 'May 21, 2026', nextPeriod: 'Q2 FY2027', nextDate: 'Aug 20, 2026' },
  XOM: { recentPeriod: 'Q1 2026', recentDate: 'May 1, 2026', nextPeriod: 'Q2 2026', nextDate: 'Aug 7, 2026 est.' },
  ZM: { recentPeriod: 'Q4 2026', recentDate: 'Feb 25, 2026', nextPeriod: 'Q1 2026', nextDate: 'May 21, 2026 est.' },
};

export const EDGEQUITY_COLUMNS: EdgequityColumn[] = [
  {
    id: 'ticker',
    label: 'Ticker',
    group: 'profile',
    accessor: (stock) => stock.ticker,
    format: 'text',
    sortable: true,
  },
  {
    id: 'name',
    label: 'Company',
    group: 'profile',
    accessor: (stock) => stock.name,
    format: 'text',
    sortable: true,
  },
  {
    id: 'sector',
    label: 'Sector',
    group: 'profile',
    accessor: (stock) => stock.sector,
    format: 'text',
    sortable: true,
  },
  {
    id: 'earningsCalendar',
    label: 'Earnings',
    group: 'profile',
    accessor: (stock) => formatEarningsCalendarValue(stock.ticker),
    format: 'text',
    sortable: true,
  },
  {
    id: 'reportUpdatedAt',
    label: 'Last Updated',
    group: 'profile',
    accessor: (stock) => getEdgequityAnalysisNote(stock.ticker)?.updatedAt ?? null,
    format: 'text',
    sortable: true,
  },
  {
    id: 'marketCap',
    label: 'Market Cap',
    group: 'profile',
    accessor: (stock) => stock.marketCap,
    format: 'money',
    sortable: true,
  },
  {
    id: 'peTTM',
    label: 'P/E TTM',
    group: 'valuation',
    accessor: (stock) => stock.valuation.peTTM,
    format: 'multiple',
    sortable: true,
  },
  {
    id: 'forwardPE',
    label: 'Forward P/E',
    group: 'valuation',
    accessor: (stock) => stock.valuation.forwardPE,
    format: 'multiple',
    sortable: true,
  },
  {
    id: 'psTTM',
    label: 'P/S TTM',
    group: 'valuation',
    accessor: (stock) => stock.valuation.psTTM,
    format: 'multiple',
    sortable: true,
  },
  {
    id: 'pb',
    label: 'P/B',
    group: 'valuation',
    accessor: (stock) => stock.valuation.pb,
    format: 'multiple',
    sortable: true,
  },
  {
    id: 'evEbitda',
    label: 'EV/EBITDA',
    group: 'valuation',
    accessor: (stock) => stock.valuation.evEbitda,
    format: 'multiple',
    sortable: true,
  },
  {
    id: 'fcfYield',
    label: 'FCF Yield',
    group: 'valuation',
    accessor: (stock) => stock.valuation.fcfYield,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'grossMargin',
    label: 'Gross Margin',
    group: 'margin',
    accessor: (stock) => stock.profitability.grossMargin,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'operatingMargin',
    label: 'Operating Margin',
    group: 'margin',
    accessor: (stock) => stock.profitability.operatingMargin,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'netMargin',
    label: 'Net Margin',
    group: 'margin',
    accessor: (stock) => stock.profitability.netMargin,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'roe',
    label: 'ROE',
    group: 'profitability',
    accessor: (stock) => stock.profitability.roe,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'roa',
    label: 'ROA',
    group: 'profitability',
    accessor: (stock) => stock.profitability.roa,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'revenueCagr3y',
    label: 'Revenue CAGR 3Y',
    group: 'growth',
    accessor: (stock) => stock.growth.revenueCagr3y,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'fcfCagr3y',
    label: 'FCF CAGR 3Y',
    group: 'growth',
    accessor: (stock) => stock.growth.fcfCagr3y,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'currentRatio',
    label: 'Current Ratio',
    group: 'financialHealth',
    accessor: (stock) => stock.financialHealth.currentRatio,
    format: 'number',
    sortable: true,
  },
  {
    id: 'debtToEquity',
    label: 'Debt/Equity',
    group: 'financialHealth',
    accessor: (stock) => stock.financialHealth.debtToEquity,
    format: 'number',
    sortable: true,
  },
  {
    id: 'netDebtToEbitda',
    label: 'Net Debt/EBITDA',
    group: 'financialHealth',
    accessor: (stock) => stock.financialHealth.netDebtToEbitda,
    format: 'multiple',
    sortable: true,
  },
  {
    id: 'fcfMargin',
    label: 'FCF Margin',
    group: 'cashFlow',
    accessor: (stock) => stock.cashFlow.fcfMargin,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'fcfConversion',
    label: 'FCF Conversion',
    group: 'cashFlow',
    accessor: (stock) => stock.cashFlow.fcfConversion,
    format: 'percent',
    sortable: true,
  },
  {
    id: 'dividendYield',
    label: 'Dividend Yield',
    group: 'dividends',
    accessor: (stock) => stock.dividends.dividendYield,
    format: 'percent',
    sortable: true,
  },
];

export function formatEdgequityValue(value: EdgequityValue, format: EdgequityValueFormat): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (!Number.isFinite(value)) {
    return '-';
  }

  switch (format) {
    case 'money':
      return formatMoney(value);
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'multiple':
      return `${value.toFixed(1)}x`;
    case 'number':
      return value.toFixed(2);
    case 'text':
      return String(value);
  }
}

export function getColumnValue(stock: EdgequityStockRecord, column: EdgequityColumn): string | number | null {
  return column.accessor(stock);
}

export function getEarningsCalendar(ticker: string) {
  const note = getEdgequityAnalysisNote(ticker);
  const calendar = EARNINGS_CALENDAR_BY_TICKER[ticker.toUpperCase()];
  const recentPeriod = calendar?.recentPeriod ?? note?.research?.earningsTitle.split(':')[0] ?? 'Research queued';

  return {
    recentPeriod,
    recentDate: calendar?.recentDate ?? note?.research?.earningsDate ?? '-',
    nextPeriod: calendar?.nextPeriod ?? 'Next report',
    nextDate: calendar?.nextDate ?? '-',
    updatedAt: note?.updatedAt ?? '-',
  };
}

function formatEarningsCalendarValue(ticker: string): string {
  const calendar = getEarningsCalendar(ticker);
  return `${calendar.recentPeriod} ${calendar.recentDate} ${calendar.nextPeriod} ${calendar.nextDate}`;
}

function formatMoney(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000_000) {
    return `${sign}$${(absValue / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (absValue >= 1_000_000_000) {
    return `${sign}$${(absValue / 1_000_000_000).toFixed(1)}B`;
  }

  if (absValue >= 1_000_000) {
    return `${sign}$${(absValue / 1_000_000).toFixed(1)}M`;
  }

  return `${sign}$${absValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
