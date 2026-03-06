import { useState } from 'react';
import { IndicatorResult, Signal, TaapiSnap } from '../types';
import { computeAllIndicators, computeSignal, fetchOHLCV, fetchTAAPI } from '../calculations';
import { safeSetItem } from '../utils/storage';

// ── API Keys ──────────────────────────────────────────────────────────────────
const FINNHUB_KEY = 'ctj1dchr01qgfbsvp4mgctj1dchr01qgfbsvp4n0';
const POLYGON_KEY = 'M8zhNduoGphylrTzDQwdpDqz1E35B7Qx';
const TWELVE_KEY  = '97eed83076bf4f208812f013f332bad3';
const AV_KEY      = 'RUIU5L10WQRWQLW1';
const TAAPI_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHVlIjoiNjlhMjNiZGZlZTAzMzMxMWE0OGYzYzNmIiwiaWF0IjoxNzcyMjM5ODM5LCJleHAiOjMzMjc2NzAzODM5fQ.W_Y15aP16FJ1G4Ocsk7xEm69dLgplV887Wc-YEghbx8';

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
