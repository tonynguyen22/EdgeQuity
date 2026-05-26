import type { EdgequityColumn, EdgequityStockRecord } from './types.ts';

type EdgequityValueFormat = EdgequityColumn['format'];
type EdgequityValue = string | number | null | undefined;

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
    accessor: (stock) => formatEarningsCalendarValue(stock),
    format: 'text',
    sortable: true,
  },
  {
    id: 'reportUpdatedAt',
    label: 'Last Updated',
    group: 'profile',
    accessor: (stock) => stock.earnings?.updatedAt?.slice(0, 10) ?? null,
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

export function getEarningsCalendar(stock: EdgequityStockRecord) {
  return {
    recentPeriod: stock.earnings?.recent?.period ?? 'Research queued',
    recentDate: stock.earnings?.recent?.date ?? '-',
    nextPeriod: stock.earnings?.next?.period ?? 'Next report',
    nextDate: stock.earnings?.next?.date ?? '-',
    updatedAt: stock.earnings?.updatedAt?.slice(0, 10) ?? '-',
  };
}

function formatEarningsCalendarValue(stock: EdgequityStockRecord): string {
  const calendar = getEarningsCalendar(stock);
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
