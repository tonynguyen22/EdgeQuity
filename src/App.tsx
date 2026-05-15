import { useEffect, useMemo, useState } from 'react';

import ErrorState from './fundra/components/ErrorState';
import LoadingState from './fundra/components/LoadingState';
import ScreenerTable from './fundra/components/ScreenerTable';
import StockDetail from './fundra/components/StockDetail';
import { loadAllFundraStocks } from './fundra/data';
import type { FundraStockRecord } from './fundra/types';

export default function App() {
  const [stocks, setStocks] = useState<FundraStockRecord[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStocks() {
      try {
        setLoading(true);
        setError(null);
        const records = await loadAllFundraStocks();

        if (isMounted) {
          setStocks(records);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadStocks();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedStock = useMemo(
    () => stocks.find((stock) => stock.ticker === selectedTicker) ?? null,
    [selectedTicker, stocks],
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error !== null) {
    return <ErrorState message={error} />;
  }

  return (
    <div
      className="min-h-screen font-sans vw-grid-bg"
      style={{ background: 'var(--vw-bg-deep)', color: 'var(--vw-text-primary)' }}
    >
      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <header
          className="mb-5 flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between"
          style={{ borderColor: 'var(--vw-border)' }}
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Fundra</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
              Fundamental stock screener for value investors
            </p>
          </div>
          <div className="vw-card px-4 py-2">
            <p className="text-xs uppercase font-semibold" style={{ color: 'var(--vw-text-tertiary)' }}>
              Stocks
            </p>
            <p className="font-mono text-lg" style={{ color: 'var(--vw-accent)' }}>
              {stocks.length}
            </p>
          </div>
        </header>

        {selectedStock ? (
          <StockDetail stock={selectedStock} onBack={() => setSelectedTicker(null)} />
        ) : (
          <ScreenerTable stocks={stocks} onSelectStock={setSelectedTicker} />
        )}
      </main>
    </div>
  );
}
