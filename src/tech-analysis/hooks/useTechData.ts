import { useState } from 'react';
import { IndicatorResult, Signal, TaapiSnap } from '../types';
import { computeAllIndicators, computeSignal, fetchOHLCV, fetchTAAPI } from '../calculations';
import { safeSetItem } from '../utils/storage';

// ── API Keys (from .env via Vite define) ───────────────────────────────────────
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const POLYGON_KEY = process.env.POLYGON_API_KEY;
const TWELVE_KEY  = process.env.TWELVE_API_KEY;
const AV_KEY      = process.env.ALPHAVANTAGE_API_KEY;
const TAAPI_KEY   = process.env.TAAPI_API_KEY;

export interface UseTechDataResult {
  tickerInput: string;
  setTickerInput: (value: string) => void;
  loading: boolean;
  error: string;
  indicators: IndicatorResult | null;
  signal: Signal | null;
  displayName: string;
  snapState: TaapiSnap | null;
  handleSearch: (e: React.FormEvent) => Promise<void>;
}

export function useTechData(): UseTechDataResult {
  const [tickerInput, setTickerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [indicators, setIndicators] = useState<IndicatorResult | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [snapState, setSnapState] = useState<TaapiSnap | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = tickerInput.trim().toUpperCase();
    if (!sym) return;

    setLoading(true);
    setError('');
    setIndicators(null);
    setSignal(null);
    setDisplayName('');
    setSnapState(null);

    try {
      const cacheKey = `tech_${sym}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, data } = JSON.parse(cached);
          if (Date.now() - ts < 24 * 60 * 60 * 1000) {
            setIndicators(data.indicators);
            setSignal(data.signal);
            setDisplayName(data.displayName ?? sym);
            setSnapState(data.snap ?? null);
            setLoading(false);
            return;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const [candles, snap] = await Promise.all([
        fetchOHLCV(sym, FINNHUB_KEY, POLYGON_KEY, TWELVE_KEY, AV_KEY),
        fetchTAAPI(sym, TAAPI_KEY)
      ]);
      const ind = computeAllIndicators(candles);
      const sig = computeSignal(ind, snap);

      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), data: { indicators: ind, signal: sig, displayName: sym, snap } }));

      setIndicators(ind);
      setSignal(sig);
      setDisplayName(sym);
      setSnapState(snap);
    } catch (err: any) {
      setError(err.message || 'Failed to load technical data.');
    } finally {
      setLoading(false);
    }
  };

  return {
    tickerInput,
    setTickerInput,
    loading,
    error,
    indicators,
    signal,
    displayName,
    snapState,
    handleSearch,
  };
}
