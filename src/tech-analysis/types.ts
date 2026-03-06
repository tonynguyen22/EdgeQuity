// ── Types ─────────────────────────────────────────────────────────────────────

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  close: number;
  yearChange: number | null;
  high52w: number;
  low52w: number;
  pos52w: number;
  // Oscillators
  rsi: number | null;
  stochK: number | null;
  stochD: number | null;
  williamsR: number | null;
  cci: number | null;
  // Trend
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  pctVsSMA20: number | null;
  pctVsSMA50: number | null;
  pctVsSMA200: number | null;
  // Volatility
  bbPctB: number | null;
  bbWidth: number | null;
  atr: number | null;
  atrPct: number | null;
  // Momentum / Context
  roc10: number | null;
  roc20: number | null;
  volRatio: number | null;
}

export interface TaapiSnap {
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  bbUpper: number | null;
  bbMid: number | null;
  bbLower: number | null;
  ema20: number | null;
  ema50: number | null;
}

export interface SignalDetail {
  name: string;
  value: string;
  bull: boolean | null;
}

export interface Signal {
  score: number;
  label: 'Bullish' | 'Neutral' | 'Bearish';
  details: SignalDetail[];
}

export interface IndicatorCard {
  name: string;
  value: string;
  label: string;
  bull: boolean | null;
  desc: string;
}
