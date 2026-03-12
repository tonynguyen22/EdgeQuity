import { useState } from 'react';
import type { IndicatorResult, Signal, TaapiSnap, TimeframeData, Timeframe, SupportResistanceResult, Candle } from '../types';
import { computeAllIndicators, computeSignal, buildIndicatorCards, fetchOHLCV, fetchTAAPI, resampleToWeekly } from '../calculations';
import { computeSupportResistance } from '../support-resistance';
import { safeSetItem } from '../utils/storage';

export interface UseTechDataResult {
  tickerInput: string;
  setTickerInput: (value: string) => void;
  loading: boolean;
  error: string;
  dailyData: TimeframeData | null;
  weeklyData: TimeframeData | null;
  srData: SupportResistanceResult | null;
  displayName: string;
  activeTimeframe: Timeframe;
  setActiveTimeframe: (tf: Timeframe) => void;
  handleSearch: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

interface CachePayload {
  ts: number;
  data: {
    dailyIndicators: IndicatorResult;
    dailySignal: Signal;
    weeklyIndicators: IndicatorResult;
    weeklySignal: Signal;
    sr: SupportResistanceResult;
    displayName: string;
    snap: TaapiSnap | null;
  };
}

export function useTechData(): UseTechDataResult {
  const [tickerInput, setTickerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dailyData, setDailyData] = useState<TimeframeData | null>(null);
  const [weeklyData, setWeeklyData] = useState<TimeframeData | null>(null);
  const [srData, setSrData] = useState<SupportResistanceResult | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('D1');

  function buildTimeframeData(indicators: IndicatorResult, signal: Signal, snap: TaapiSnap | null): TimeframeData {
    return { indicators, signal, cards: buildIndicatorCards(indicators, snap) };
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = tickerInput.trim().toUpperCase();
    if (!sym) return;

    setLoading(true);
    setError('');
    setDailyData(null);
    setWeeklyData(null);
    setSrData(null);
    setDisplayName('');
    setActiveTimeframe('D1');

    try {
      const cacheKey = `tech_${sym}_v3`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, data } = JSON.parse(cached) as CachePayload;
          if (Date.now() - ts < 24 * 60 * 60 * 1000) {
            setDailyData(buildTimeframeData(data.dailyIndicators, data.dailySignal, data.snap));
            setWeeklyData(buildTimeframeData(data.weeklyIndicators, data.weeklySignal, null));
            setSrData(data.sr);
            setDisplayName(data.displayName ?? sym);
            setLoading(false);
            return;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const [candles, snap] = await Promise.all([
        fetchOHLCV(sym),
        fetchTAAPI(sym),
      ]);

      const weeklyCandles: Candle[] = resampleToWeekly(candles);

      const dInd = computeAllIndicators(candles);
      const dSig = computeSignal(dInd, snap);
      const wInd = computeAllIndicators(weeklyCandles);
      const wSig = computeSignal(wInd, null);
      const sr = computeSupportResistance(candles, weeklyCandles, dInd);

      const payload: CachePayload = {
        ts: Date.now(),
        data: {
          dailyIndicators: dInd,
          dailySignal: dSig,
          weeklyIndicators: wInd,
          weeklySignal: wSig,
          sr,
          displayName: sym,
          snap,
        },
      };
      safeSetItem(cacheKey, JSON.stringify(payload));

      setDailyData(buildTimeframeData(dInd, dSig, snap));
      setWeeklyData(buildTimeframeData(wInd, wSig, null));
      setSrData(sr);
      setDisplayName(sym);
    } catch (err: any) {
      setError(err.message || 'Failed to load technical data.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTickerInput('');
    setDailyData(null);
    setWeeklyData(null);
    setSrData(null);
    setDisplayName('');
    setError('');
    setActiveTimeframe('D1');
  };

  return {
    tickerInput,
    setTickerInput,
    loading,
    error,
    dailyData,
    weeklyData,
    srData,
    displayName,
    activeTimeframe,
    setActiveTimeframe,
    handleSearch,
    reset,
  };
}
