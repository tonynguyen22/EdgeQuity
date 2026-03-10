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
  mfi: number | null;
  stochRsi: number | null;
  // Trend
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema9: number | null;
  ema21: number | null;
  pctVsSMA20: number | null;
  pctVsSMA50: number | null;
  pctVsSMA200: number | null;
  pctVsEMA9: number | null;
  pctVsEMA21: number | null;
  adx: number | null;
  psar: number | null;
  psarTrend: 'bullish' | 'bearish' | null;
  // Volatility
  bbUpper: number | null;
  bbLower: number | null;
  bbMid: number | null;
  bbPctB: number | null;
  bbWidth: number | null;
  atr: number | null;
  atrPct: number | null;
  // Momentum / Context
  roc10: number | null;
  roc20: number | null;
  volRatio: number | null;
  obvDirection: 'rising' | 'falling' | 'flat' | null;
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

export type SignalLabel = 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';

export interface SignalDetail {
  name: string;
  value: string;
  bull: boolean | null;
}

export interface Signal {
  score: number;
  label: SignalLabel;
  details: SignalDetail[];
}

export interface HoverInfo {
  what: string;
  reading: string;
  howTo: string;
}

export interface IndicatorCard {
  name: string;
  value: string;
  label: string;
  bull: boolean | null;
  desc: string;
  hoverInfo: HoverInfo;
}

export type Timeframe = 'D1' | 'W1';

export interface TimeframeData {
  indicators: IndicatorResult;
  signal: Signal;
  cards: { section: string; cards: IndicatorCard[] }[];
}

export interface SupportResistanceLevel {
  price: number;
  label: string;
  type: 'support' | 'resistance';
  source: 'pivot' | 'fibonacci' | 'sma' | 'bollinger' | 'swing';
}

export interface EntryZone {
  low: number;
  high: number;
  confluenceCount: number;
  levels: SupportResistanceLevel[];
  strength: 'strong' | 'moderate' | 'weak';
  label: 'Short-term Entry' | 'Medium-term Entry' | 'Long-term Entry';
}

export interface SupportResistanceResult {
  levels: SupportResistanceLevel[];
  entryZones: EntryZone[];
  currentPrice: number;
}
