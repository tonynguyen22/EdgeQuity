import { useMemo, useState } from 'react';

import { EDGEQUITY_COLUMNS, getColumnValue } from '../metrics';
import type { EdgequityColumn, EdgequityStockRecord } from '../types';
import MetricCell from './MetricCell';
import ScreenerToolbar from './ScreenerToolbar';

type SortDirection = 'asc' | 'desc';

export interface ScreenerSort {
  columnId: string;
  direction: SortDirection;
}

interface ScreenerTableProps {
  stocks: EdgequityStockRecord[];
  onSelectStock: (ticker: string) => void;
}

interface VisibleStocksOptions {
  query: string;
  sector: string;
  sort: ScreenerSort;
}

const DEFAULT_SORT: ScreenerSort = { columnId: 'marketCap', direction: 'desc' };

function normalizeSector(sector: string | null): string {
  return sector?.trim() ?? '';
}

export function getScreenerSectors(stocks: EdgequityStockRecord[]): string[] {
  return Array.from(
    new Set(stocks.map((stock) => normalizeSector(stock.sector)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export function getVisibleScreenerStocks(
  stocks: EdgequityStockRecord[],
  { query, sector, sort }: VisibleStocksOptions,
): EdgequityStockRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSector = sector.trim();
  const column = EDGEQUITY_COLUMNS.find((item) => item.id === sort.columnId) ?? EDGEQUITY_COLUMNS[0];

  return [...stocks]
    .filter((stock) => {
      const matchesQuery =
        normalizedQuery.length === 0
        || stock.ticker.toLowerCase().includes(normalizedQuery)
        || stock.name.toLowerCase().includes(normalizedQuery);
      const matchesSector = normalizedSector.length === 0 || normalizeSector(stock.sector) === normalizedSector;

      return matchesQuery && matchesSector;
    })
    .sort((a, b) => compareStocks(a, b, column, sort.direction));
}

function compareStocks(
  a: EdgequityStockRecord,
  b: EdgequityStockRecord,
  column: EdgequityColumn,
  direction: SortDirection,
): number {
  const aValue = getColumnValue(a, column);
  const bValue = getColumnValue(b, column);
  const aMissing = isMissingSortValue(aValue);
  const bMissing = isMissingSortValue(bValue);

  if (aMissing && bMissing) return a.ticker.localeCompare(b.ticker);
  if (aMissing) return 1;
  if (bMissing) return -1;

  const baseComparison =
    typeof aValue === 'number' && typeof bValue === 'number'
      ? aValue - bValue
      : String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
  const sortedComparison = direction === 'asc' ? baseComparison : -baseComparison;

  return sortedComparison === 0 ? a.ticker.localeCompare(b.ticker) : sortedComparison;
}

function isMissingSortValue(value: string | number | null): boolean {
  return value === null || value === '';
}

function getNextSort(currentSort: ScreenerSort, columnId: string): ScreenerSort {
  if (currentSort.columnId !== columnId) {
    return { columnId, direction: 'desc' };
  }

  return { columnId, direction: currentSort.direction === 'desc' ? 'asc' : 'desc' };
}

const COMPACT_COLUMN_LABELS: Record<string, string> = {
  marketCap: 'MCap',
  forwardPE: 'Fwd P/E',
  psTTM: 'P/S',
  pb: 'P/B',
  evEbitda: 'EV/EBITDA',
  fcfYield: 'FCFY',
  grossMargin: 'Gross',
  operatingMargin: 'Op Mgn',
  netMargin: 'Net Mgn',
  revenueCagr3y: 'Rev 3Y',
  fcfCagr3y: 'FCF 3Y',
  currentRatio: 'Curr',
  debtToEquity: 'D/E',
  netDebtToEbitda: 'ND/EBITDA',
  fcfMargin: 'FCF Mgn',
  fcfConversion: 'FCF Conv',
  dividendYield: 'Div Yld',
};

function getCompactColumnLabel(column: EdgequityColumn): string {
  return COMPACT_COLUMN_LABELS[column.id] ?? column.label;
}

function isGroupStart(index: number): boolean {
  if (index === 0) return false;
  return EDGEQUITY_COLUMNS[index - 1].group !== EDGEQUITY_COLUMNS[index].group;
}

function getColumnWidthClass(column: EdgequityColumn): string {
  if (column.id === 'ticker') return 'w-[72px] min-w-[72px]';
  if (column.id === 'name') return 'w-[168px] min-w-[168px]';
  if (column.id === 'sector') return 'w-[118px] min-w-[118px]';
  if (column.format === 'money') return 'w-[92px] min-w-[92px]';
  if (column.format === 'percent') return 'w-[74px] min-w-[74px]';
  return 'w-[82px] min-w-[82px]';
}

function getAriaSort(isActiveSort: boolean, direction: SortDirection): 'ascending' | 'descending' | 'none' {
  if (!isActiveSort) return 'none';
  return direction === 'asc' ? 'ascending' : 'descending';
}

function getSortButtonLabel(column: EdgequityColumn, isActiveSort: boolean, direction: SortDirection): string {
  const nextDirection = isActiveSort && direction === 'desc' ? 'ascending' : 'descending';
  return `Sort by ${getCompactColumnLabel(column)} ${nextDirection}`;
}

export default function ScreenerTable({ stocks, onSelectStock }: ScreenerTableProps) {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [sort, setSort] = useState<ScreenerSort>(DEFAULT_SORT);

  const sectors = useMemo(() => getScreenerSectors(stocks), [stocks]);
  const visibleStocks = useMemo(
    () => getVisibleScreenerStocks(stocks, { query, sector, sort }),
    [query, sector, sort, stocks],
  );

  return (
    <section className="vw-card eq-table-shell overflow-hidden">
      <ScreenerToolbar
        query={query}
        sector={sector}
        sectors={sectors}
        onQueryChange={setQuery}
        onSectorChange={setSector}
        onReset={() => {
          setQuery('');
          setSector('');
        }}
      />
      <div className="eq-scrollbar overflow-x-auto">
        <table className="min-w-[1900px] table-fixed border-collapse text-[12px]">
          <thead
            className="sticky top-0 z-10"
            style={{ background: 'var(--vw-bg-raised)', color: 'var(--vw-text-tertiary)' }}
          >
            <tr className="border-b" style={{ borderColor: 'var(--vw-border)' }}>
              {EDGEQUITY_COLUMNS.map((column, index) => {
                const isActiveSort = sort.columnId === column.id;
                const arrow = isActiveSort ? (sort.direction === 'desc' ? 'v' : '^') : '';
                const ariaSort = getAriaSort(isActiveSort, sort.direction);
                const stickyClass = column.id === 'ticker' || column.id === 'name' ? 'eq-sticky-col' : '';
                const stickyNameClass = column.id === 'name' ? 'eq-sticky-name' : '';
                const groupClass = isGroupStart(index) ? 'eq-group-start' : '';

                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`${getColumnWidthClass(column)} ${stickyClass} ${stickyNameClass} ${groupClass} px-2 py-1.5 text-[10px] font-semibold uppercase`}
                  >
                    <button
                      type="button"
                      aria-label={getSortButtonLabel(column, isActiveSort, sort.direction)}
                      className={`flex w-full items-center gap-1 transition-colors hover:text-[var(--vw-text-primary)] ${
                        column.format === 'text' ? 'justify-start text-left' : 'justify-end text-right'
                      }`}
                      onClick={() => setSort((currentSort) => getNextSort(currentSort, column.id))}
                    >
                      <span className="truncate">{getCompactColumnLabel(column)}</span>
                      <span className="inline-block w-3 text-center" aria-hidden="true">
                        {arrow}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--vw-border-dim)' }}>
            {visibleStocks.map((stock) => (
              <tr
                key={stock.ticker}
                role="button"
                tabIndex={0}
                className="cursor-pointer transition-colors hover:bg-[var(--vw-bg-hover)] focus:bg-[var(--vw-bg-hover)] focus:outline-none"
                style={{ color: 'var(--vw-text-primary)' }}
                onClick={() => onSelectStock(stock.ticker)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectStock(stock.ticker);
                  }
                }}
              >
                {EDGEQUITY_COLUMNS.map((column, index) => (
                  <MetricCell key={column.id} stock={stock} column={column} groupStart={isGroupStart(index)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visibleStocks.length === 0 && (
          <div className="px-3 py-8 text-center text-sm" style={{ color: 'var(--vw-text-tertiary)' }}>
            No stocks match the current filters
          </div>
        )}
      </div>
    </section>
  );
}
