import { useMemo, useState } from 'react';

import { FUNDRA_COLUMNS, getColumnValue } from '../metrics';
import type { FundraColumn, FundraStockRecord } from '../types';
import MetricCell from './MetricCell';
import ScreenerToolbar from './ScreenerToolbar';

type SortDirection = 'asc' | 'desc';

export interface ScreenerSort {
  columnId: string;
  direction: SortDirection;
}

interface ScreenerTableProps {
  stocks: FundraStockRecord[];
  onSelectStock: (ticker: string) => void;
}

interface VisibleStocksOptions {
  query: string;
  sector: string;
  sort: ScreenerSort;
}

const DEFAULT_SORT: ScreenerSort = { columnId: 'marketCap', direction: 'desc' };

export function getScreenerSectors(stocks: FundraStockRecord[]): string[] {
  return Array.from(
    new Set(stocks.map((stock) => stock.sector?.trim()).filter((sector): sector is string => Boolean(sector))),
  ).sort((a, b) => a.localeCompare(b));
}

export function getVisibleScreenerStocks(
  stocks: FundraStockRecord[],
  { query, sector, sort }: VisibleStocksOptions,
): FundraStockRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  const column = FUNDRA_COLUMNS.find((item) => item.id === sort.columnId) ?? FUNDRA_COLUMNS[0];

  return [...stocks]
    .filter((stock) => {
      const matchesQuery =
        normalizedQuery.length === 0
        || stock.ticker.toLowerCase().includes(normalizedQuery)
        || stock.name.toLowerCase().includes(normalizedQuery);
      const matchesSector = sector.length === 0 || stock.sector === sector;

      return matchesQuery && matchesSector;
    })
    .sort((a, b) => compareStocks(a, b, column, sort.direction));
}

function compareStocks(
  a: FundraStockRecord,
  b: FundraStockRecord,
  column: FundraColumn,
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

function getColumnWidthClass(column: FundraColumn): string {
  if (column.id === 'ticker') return 'w-[92px] min-w-[92px]';
  if (column.id === 'name') return 'w-[220px] min-w-[220px]';
  if (column.id === 'sector') return 'w-[170px] min-w-[170px]';
  return 'w-[116px] min-w-[116px]';
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
    <section className="vw-card overflow-hidden">
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
      <div className="overflow-x-auto">
        <table className="min-w-[2760px] table-fixed border-collapse text-sm">
          <thead
            className="sticky top-0 z-10"
            style={{ background: 'var(--vw-bg-raised)', color: 'var(--vw-text-tertiary)' }}
          >
            <tr className="border-b" style={{ borderColor: 'var(--vw-border)' }}>
              {FUNDRA_COLUMNS.map((column) => {
                const isActiveSort = sort.columnId === column.id;
                const arrow = isActiveSort ? (sort.direction === 'desc' ? 'v' : '^') : '';

                return (
                  <th
                    key={column.id}
                    scope="col"
                    className={`${getColumnWidthClass(column)} px-3 py-2 text-xs font-semibold uppercase`}
                  >
                    <button
                      type="button"
                      className={`flex w-full items-center gap-1 transition-colors hover:text-[var(--vw-text-primary)] ${
                        column.format === 'text' ? 'justify-start text-left' : 'justify-end text-right'
                      }`}
                      onClick={() => setSort((currentSort) => getNextSort(currentSort, column.id))}
                    >
                      <span className="truncate">{column.label}</span>
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
                {FUNDRA_COLUMNS.map((column) => (
                  <MetricCell key={column.id} stock={stock} column={column} />
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
