// ── Indicator Math ────────────────────────────────────────────────────────────

import { Candle, IndicatorResult, TaapiSnap, Signal, SignalLabel, SignalDetail, IndicatorCard, HoverInfo } from './types';
import { proxyFetch } from '../utils/proxyFetch';
import { getHoverDescription } from './hover-descriptions';

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeEMA(values: number[], period: number): (number | null)[] {
  if (values.length < period) return values.map(() => null);
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(period - 1).fill(null);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  for (let i = period; i < values.length; i++) { ema = values[i] * k + ema * (1 - k); result.push(ema); }
  return result;
}

function computeSMA(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    return values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
  });
}

function computeBB(values: number[], period = 20, mult = 2) {
  const mid = computeSMA(values, period);
  const upper: (number | null)[] = [], lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (mid[i] === null) { upper.push(null); lower.push(null); continue; }
    const slice = values.slice(i - period + 1, i + 1);
    const mean = mid[i]!;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
    upper.push(mean + mult * std);
    lower.push(mean - mult * std);
  }
  return { upper, mid, lower };
}

function computeRSI(values: number[], period = 14): (number | null)[] {
  if (values.length < period + 1) return values.map(() => null);
  const changes = values.slice(1).map((v, i) => v - values[i]);
  const result: (number | null)[] = new Array(period).fill(null);
  let avgGain = changes.slice(0, period).reduce((a, b) => a + Math.max(0, b), 0) / period;
  let avgLoss = changes.slice(0, period).reduce((a, b) => a + Math.max(0, -b), 0) / period;
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + Math.max(0, changes[i])) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -changes[i])) / period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
}

function computeMACD(values: number[], fast = 12, slow = 26, sig = 9) {
  const ema12 = computeEMA(values, fast), ema26 = computeEMA(values, slow);
  const macdLine: (number | null)[] = ema12.map((v, i) => v !== null && ema26[i] !== null ? v - ema26[i]! : null);
  const macdVals = macdLine.filter(v => v !== null) as number[];
  const sigEMA = computeEMA(macdVals, sig);
  const sigFull: (number | null)[] = new Array(macdLine.length).fill(null);
  let si = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) { sigFull[i] = si < sigEMA.length ? sigEMA[si] : null; si++; }
  }
  const histFull = macdLine.map((v, i) => v !== null && sigFull[i] !== null ? v - sigFull[i]! : null);
  return { macdLine, sigFull, histFull };
}

function computeATR(candles: Candle[], period = 14): (number | null)[] {
  const tr = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prev = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prev), Math.abs(c.low - prev));
  });
  const result: (number | null)[] = new Array(period - 1).fill(null);
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(atr);
  for (let i = period; i < tr.length; i++) { atr = (atr * (period - 1) + tr[i]) / period; result.push(atr); }
  return result;
}

function computeStochastic(candles: Candle[], period = 14, smooth = 3) {
  const rawK: (number | null)[] = candles.map((c, i) => {
    if (i < period - 1) return null;
    const sl = candles.slice(i - period + 1, i + 1);
    const lo = Math.min(...sl.map(s => s.low)), hi = Math.max(...sl.map(s => s.high));
    return hi === lo ? 50 : ((c.close - lo) / (hi - lo)) * 100;
  });
  const kVals = rawK.filter(v => v !== null) as number[];
  const dSmooth = computeSMA(kVals, smooth);
  const d: (number | null)[] = new Array(rawK.length).fill(null);
  let di = 0;
  for (let i = 0; i < rawK.length; i++) { if (rawK[i] !== null) { d[i] = di < dSmooth.length ? dSmooth[di] : null; di++; } }
  return { k: rawK, d };
}

function computeWilliamsR(candles: Candle[], period = 14): (number | null)[] {
  return candles.map((c, i) => {
    if (i < period - 1) return null;
    const sl = candles.slice(i - period + 1, i + 1);
    const lo = Math.min(...sl.map(s => s.low)), hi = Math.max(...sl.map(s => s.high));
    return hi === lo ? -50 : ((hi - c.close) / (hi - lo)) * -100;
  });
}

function computeCCI(candles: Candle[], period = 20): (number | null)[] {
  return candles.map((c, i) => {
    if (i < period - 1) return null;
    const sl = candles.slice(i - period + 1, i + 1);
    const tp = sl.map(s => (s.high + s.low + s.close) / 3);
    const mean = tp.reduce((a, b) => a + b, 0) / period;
    const dev = tp.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
    return dev === 0 ? 0 : ((c.high + c.low + c.close) / 3 - mean) / (0.015 * dev);
  });
}

// ── New Indicators ───────────────────────────────────────────────────────────

function computeADX(candles: Candle[], period = 14): (number | null)[] {
  if (candles.length < period * 2 + 1) return candles.map(() => null);
  const plusDM: number[] = [], minusDM: number[] = [], tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const prev = candles[i - 1].close;
    tr.push(Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - prev), Math.abs(candles[i].low - prev)));
  }

  const smooth = (arr: number[]) => {
    const out: number[] = [];
    let sum = arr.slice(0, period).reduce((a, b) => a + b, 0);
    out.push(sum);
    for (let i = period; i < arr.length; i++) {
      sum = sum - sum / period + arr[i];
      out.push(sum);
    }
    return out;
  };

  const sTR = smooth(tr);
  const sPDM = smooth(plusDM);
  const sMDM = smooth(minusDM);

  const dx: number[] = [];
  for (let i = 0; i < sTR.length; i++) {
    const pdi = sTR[i] !== 0 ? (sPDM[i] / sTR[i]) * 100 : 0;
    const mdi = sTR[i] !== 0 ? (sMDM[i] / sTR[i]) * 100 : 0;
    const sum = pdi + mdi;
    dx.push(sum === 0 ? 0 : Math.abs(pdi - mdi) / sum * 100);
  }

  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (dx.length < period) return result;
  let adx = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period * 2] = adx;
  for (let i = period; i < dx.length; i++) {
    adx = (adx * (period - 1) + dx[i]) / period;
    const idx = i + period;
    if (idx < candles.length) result[idx] = adx;
  }
  return result;
}

function computeMFI(candles: Candle[], period = 14): (number | null)[] {
  if (candles.length < period + 1) return candles.map(() => null);
  const tp = candles.map(c => (c.high + c.low + c.close) / 3);
  const mf = tp.map((t, i) => t * candles[i].volume);
  const result: (number | null)[] = new Array(period).fill(null);
  for (let i = period; i < candles.length; i++) {
    let posFlow = 0, negFlow = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (tp[j] > tp[j - 1]) posFlow += mf[j];
      else if (tp[j] < tp[j - 1]) negFlow += mf[j];
    }
    result.push(negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow));
  }
  return result;
}

function computeParabolicSAR(candles: Candle[], step = 0.02, maxStep = 0.2): { sar: (number | null)[]; trend: ('bullish' | 'bearish')[] } {
  const n = candles.length;
  if (n < 2) return { sar: candles.map(() => null), trend: candles.map(() => 'bullish') };
  const sar: (number | null)[] = [null];
  const trend: ('bullish' | 'bearish')[] = [];

  let isUpTrend = candles[1].close > candles[0].close;
  let af = step;
  let ep = isUpTrend ? candles[0].high : candles[0].low;
  let sarVal = isUpTrend ? candles[0].low : candles[0].high;

  trend.push(isUpTrend ? 'bullish' : 'bearish');

  for (let i = 1; i < n; i++) {
    const prevSar = sarVal;
    sarVal = prevSar + af * (ep - prevSar);

    if (isUpTrend) {
      sarVal = Math.min(sarVal, candles[i - 1].low, i >= 2 ? candles[i - 2].low : candles[i - 1].low);
      if (candles[i].low < sarVal) {
        isUpTrend = false;
        sarVal = ep;
        ep = candles[i].low;
        af = step;
      } else {
        if (candles[i].high > ep) { ep = candles[i].high; af = Math.min(af + step, maxStep); }
      }
    } else {
      sarVal = Math.max(sarVal, candles[i - 1].high, i >= 2 ? candles[i - 2].high : candles[i - 1].high);
      if (candles[i].high > sarVal) {
        isUpTrend = true;
        sarVal = ep;
        ep = candles[i].high;
        af = step;
      } else {
        if (candles[i].low < ep) { ep = candles[i].low; af = Math.min(af + step, maxStep); }
      }
    }
    sar.push(sarVal);
    trend.push(isUpTrend ? 'bullish' : 'bearish');
  }
  return { sar, trend };
}

function computeStochRSI(values: number[], rsiPeriod = 14, stochPeriod = 14): (number | null)[] {
  const rsiArr = computeRSI(values, rsiPeriod);
  const result: (number | null)[] = rsiArr.map(() => null);
  const rsiValid = rsiArr.filter(v => v !== null) as number[];
  if (rsiValid.length < stochPeriod) return result;
  const stochVals: (number | null)[] = [];
  for (let i = 0; i < rsiValid.length; i++) {
    if (i < stochPeriod - 1) { stochVals.push(null); continue; }
    const window = rsiValid.slice(i - stochPeriod + 1, i + 1);
    const lo = Math.min(...window), hi = Math.max(...window);
    stochVals.push(hi === lo ? 50 : ((rsiValid[i] - lo) / (hi - lo)) * 100);
  }
  let si = 0;
  for (let i = 0; i < rsiArr.length; i++) {
    if (rsiArr[i] !== null) {
      if (si < stochVals.length) result[i] = stochVals[si];
      si++;
    }
  }
  return result;
}

function computeOBVDirection(candles: Candle[], lookback = 20): 'rising' | 'falling' | 'flat' | null {
  if (candles.length < lookback + 1) return null;
  let obv = 0;
  const obvArr: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) obv += candles[i].volume;
    else if (candles[i].close < candles[i - 1].close) obv -= candles[i].volume;
    obvArr.push(obv);
  }
  const recent = obvArr.slice(-lookback);
  const sma5End = recent.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const sma5Start = recent.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const pctChange = sma5Start !== 0 ? ((sma5End - sma5Start) / Math.abs(sma5Start)) * 100 : 0;
  if (pctChange > 5) return 'rising';
  if (pctChange < -5) return 'falling';
  return 'flat';
}

// ── Resample Daily → Weekly ──────────────────────────────────────────────────

export function resampleToWeekly(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const weeks = new Map<string, Candle[]>();
  for (const c of candles) {
    const d = new Date(c.date);
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000);
    const weekNum = Math.ceil((dayOfYear + jan4.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(c);
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, wc]) => ({
      date: wc[wc.length - 1].date,
      open: wc[0].open,
      high: Math.max(...wc.map(c => c.high)),
      low: Math.min(...wc.map(c => c.low)),
      close: wc[wc.length - 1].close,
      volume: wc.reduce((a, c) => a + c.volume, 0),
    }));
}

// ── Main Indicator Computation ───────────────────────────────────────────────

export function computeAllIndicators(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close);
  const n = closes.length;
  const last = candles[n - 1];

  const sma20Arr = computeSMA(closes, 20);
  const sma50Arr = computeSMA(closes, 50);
  const sma200Arr = computeSMA(closes, 200);
  const ema9Arr = computeEMA(closes, 9);
  const ema21Arr = computeEMA(closes, 21);
  const bb = computeBB(closes, 20, 2);
  const rsiArr = computeRSI(closes, 14);
  const { macdLine, sigFull, histFull } = computeMACD(closes);
  const atrArr = computeATR(candles, 14);
  const { k: stochK, d: stochD } = computeStochastic(candles, 14, 3);
  const wrArr = computeWilliamsR(candles, 14);
  const cciArr = computeCCI(candles, 20);
  const adxArr = computeADX(candles, 14);
  const mfiArr = computeMFI(candles, 14);
  const psarResult = computeParabolicSAR(candles);
  const stochRsiArr = computeStochRSI(closes, 14, 14);
  const obvDir = computeOBVDirection(candles, 20);

  const sma20 = sma20Arr[n - 1], sma50 = sma50Arr[n - 1], sma200 = sma200Arr[n - 1];
  const ema9 = ema9Arr[n - 1], ema21 = ema21Arr[n - 1];
  const bbU = bb.upper[n - 1], bbL = bb.lower[n - 1], bbM = bb.mid[n - 1];
  const bbPctB = bbU != null && bbL != null && bbU !== bbL ? (last.close - bbL) / (bbU - bbL) : null;
  const bbWidth = bbU != null && bbL != null && bbM != null && bbM !== 0 ? (bbU - bbL) / bbM : null;
  const atr = atrArr[n - 1];
  const volumes = candles.map(c => c.volume);
  const vol20 = computeSMA(volumes, 20)[n - 1];
  const high52w = Math.max(...candles.map(c => c.high));
  const low52w  = Math.min(...candles.map(c => c.low));

  return {
    close: last.close,
    yearChange: n > 1 ? ((last.close - closes[0]) / closes[0]) * 100 : null,
    high52w, low52w,
    pos52w: high52w !== low52w ? ((last.close - low52w) / (high52w - low52w)) * 100 : 50,
    rsi: rsiArr[n - 1],
    stochK: stochK[n - 1], stochD: stochD[n - 1],
    williamsR: wrArr[n - 1],
    cci: cciArr[n - 1],
    mfi: mfiArr[n - 1],
    stochRsi: stochRsiArr[n - 1],
    macd: macdLine[n - 1], macdSignal: sigFull[n - 1], macdHist: histFull[n - 1],
    sma20, sma50, sma200,
    ema9, ema21,
    pctVsSMA20:  sma20  ? ((last.close - sma20)  / sma20)  * 100 : null,
    pctVsSMA50:  sma50  ? ((last.close - sma50)  / sma50)  * 100 : null,
    pctVsSMA200: sma200 ? ((last.close - sma200) / sma200) * 100 : null,
    pctVsEMA9:   ema9   ? ((last.close - ema9)   / ema9)   * 100 : null,
    pctVsEMA21:  ema21  ? ((last.close - ema21)  / ema21)  * 100 : null,
    adx: adxArr[n - 1],
    psar: psarResult.sar[n - 1],
    psarTrend: n > 0 ? psarResult.trend[n - 1] : null,
    bbUpper: bbU, bbLower: bbL, bbMid: bbM,
    bbPctB, bbWidth,
    atr, atrPct: atr && last.close ? (atr / last.close) * 100 : null,
    roc10: n > 10 ? ((closes[n - 1] - closes[n - 11]) / closes[n - 11]) * 100 : null,
    roc20: n > 20 ? ((closes[n - 1] - closes[n - 21]) / closes[n - 21]) * 100 : null,
    volRatio: vol20 && vol20 > 0 ? last.volume / vol20 : null,
    obvDirection: obvDir,
  };
}

// ── OHLCV Normalizers ─────────────────────────────────────────────────────────

function normalizeFinnhub(data: any): Candle[] {
  if (!data || data.s !== 'ok' || !data.t) return [];
  return data.t.map((t: number, i: number) => ({
    date: new Date(t * 1000).toISOString().slice(0, 10),
    open: data.o[i], high: data.h[i], low: data.l[i], close: data.c[i], volume: data.v[i],
  }));
}

function normalizePolygon(data: any): Candle[] {
  if (!data?.results?.length) return [];
  return data.results.map((r: any) => ({
    date: new Date(r.t).toISOString().slice(0, 10),
    open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v,
  }));
}

function normalizeTwelveData(data: any): Candle[] {
  if (!data?.values?.length) return [];
  return [...data.values].reverse().map((r: any) => ({
    date: r.datetime,
    open: parseFloat(r.open), high: parseFloat(r.high),
    low: parseFloat(r.low), close: parseFloat(r.close), volume: parseInt(r.volume, 10),
  }));
}

function normalizeAlphaVantage(data: any): Candle[] {
  const ts = data?.['Time Series (Daily)'];
  if (!ts) return [];
  return Object.entries(ts).map(([date, v]: [string, any]) => ({
    date,
    open: parseFloat(v['1. open']), high: parseFloat(v['2. high']),
    low: parseFloat(v['3. low']), close: parseFloat(v['4. close']),
    volume: parseInt(v['5. volume'], 10),
  })).sort((a, b) => a.date.localeCompare(b.date));
}

// ── OHLCV Fetcher ─────────────────────────────────────────────────────────────

export async function fetchOHLCV(symbol: string): Promise<Candle[]> {
  const nowSec = Math.floor(Date.now() / 1000);
  const oneYearAgo = nowSec - 365 * 24 * 3600;
  const toDate   = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(oneYearAgo * 1000).toISOString().slice(0, 10);

  try {
    const res = await proxyFetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${oneYearAgo}&to=${nowSec}`
    );
    if (res.ok) { const c = normalizeFinnhub(await res.json()); if (c.length > 20) return c; }
  } catch { /* try next */ }

  try {
    const res = await proxyFetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=365`
    );
    if (res.ok) { const c = normalizePolygon(await res.json()); if (c.length > 20) return c; }
  } catch { /* try next */ }

  try {
    const res = await proxyFetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=252`
    );
    if (res.ok) { const c = normalizeTwelveData(await res.json()); if (c.length > 20) return c; }
  } catch { /* try next */ }

  try {
    const res = await proxyFetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact`
    );
    if (res.ok) { const c = normalizeAlphaVantage(await res.json()); if (c.length > 20) return c; }
  } catch { /* try next */ }

  throw new Error('No price data found. The ticker may be invalid or all data sources are temporarily unavailable.');
}

// ── TAAPI Snapshot ────────────────────────────────────────────────────────────

export async function fetchTAAPI(symbol: string): Promise<TaapiSnap | null> {
  try {
    const res = await proxyFetch('https://api.taapi.io/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        construct: {
          exchange: 'stocks', symbol, interval: '1d',
          indicators: [
            { indicator: 'rsi' }, { indicator: 'macd' }, { indicator: 'bbands' },
            { indicator: 'ema', optInTimePeriod: 20 }, { indicator: 'ema', optInTimePeriod: 50 },
          ],
        },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json.data)) return null;
    const snap: TaapiSnap = { rsi: null, macd: null, macdSignal: null, bbUpper: null, bbMid: null, bbLower: null, ema20: null, ema50: null };
    for (const item of json.data) {
      const r = item.result ?? {}, id: string = item.id ?? '';
      if (id.startsWith('rsi'))    snap.rsi = r.value ?? null;
      else if (id.startsWith('macd'))   { snap.macd = r.valueMACD ?? null; snap.macdSignal = r.valueMACDSignal ?? null; }
      else if (id.startsWith('bbands')) { snap.bbUpper = r.valueUpperBand ?? null; snap.bbMid = r.valueMiddleBand ?? null; snap.bbLower = r.valueLowerBand ?? null; }
      else if (id.startsWith('ema'))    { if (snap.ema20 === null) snap.ema20 = r.value ?? null; else snap.ema50 = r.value ?? null; }
    }
    return snap;
  } catch { return null; }
}

// ── Signal (5-level weighted) ────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }

function rsiSubScore(rsi: number): number {
  if (rsi <= 20) return 65;
  if (rsi <= 30) return 60;
  if (rsi <= 40) return 35;
  if (rsi <= 50) return 45;
  if (rsi <= 60) return 60;
  if (rsi <= 70) return 70;
  if (rsi <= 80) return 35;
  return 20;
}

function macdSubScore(macd: number, sig: number, hist: number | null): number {
  const bull = macd > sig;
  const histVal = hist ?? (macd - sig);
  if (bull && histVal > 0) return 80;
  if (bull) return 65;
  if (!bull && histVal < 0) return 20;
  return 35;
}

function stochSubScore(k: number): number {
  if (k <= 20) return 60;
  if (k <= 40) return 40;
  if (k <= 60) return 50;
  if (k <= 80) return 65;
  return 35;
}

function cciSubScore(cci: number): number {
  if (cci < -200) return 65;
  if (cci < -100) return 55;
  if (cci < 0) return 40;
  if (cci < 100) return 60;
  if (cci < 200) return 40;
  return 25;
}

function smaSubScore(pctVsSMA: number): number {
  if (pctVsSMA > 5) return 80;
  if (pctVsSMA > 0) return 65;
  if (pctVsSMA > -5) return 35;
  return 20;
}

function adxSubScore(adx: number, psar: 'bullish' | 'bearish' | null): number {
  if (adx < 20) return 50;
  if (psar === 'bullish') return adx > 40 ? 85 : 70;
  if (psar === 'bearish') return adx > 40 ? 15 : 30;
  return 50;
}

function mfiSubScore(mfi: number): number {
  if (mfi <= 20) return 60;
  if (mfi <= 40) return 40;
  if (mfi <= 60) return 55;
  if (mfi <= 80) return 65;
  return 30;
}

function labelFromScore(score: number): SignalLabel {
  if (score >= 75) return 'Strong Bullish';
  if (score >= 55) return 'Bullish';
  if (score >= 40) return 'Neutral';
  if (score >= 25) return 'Bearish';
  return 'Strong Bearish';
}

export function computeSignal(ind: IndicatorResult, snap: TaapiSnap | null): Signal {
  const rsi = snap?.rsi ?? ind.rsi;
  const macd = snap?.macd ?? ind.macd;
  const macdSig = snap?.macdSignal ?? ind.macdSignal;
  const scores: { name: string; score: number; weight: number }[] = [];
  const details: SignalDetail[] = [];

  if (rsi !== null) {
    const s = rsiSubScore(rsi);
    scores.push({ name: 'RSI', score: s, weight: 1 });
    const lbl = rsi >= 70 ? 'Overbought' : rsi <= 30 ? 'Oversold' : rsi >= 50 ? 'Bullish' : 'Bearish';
    details.push({ name: 'RSI', value: `${rsi.toFixed(1)} (${lbl})`, bull: s >= 55 ? true : s <= 40 ? false : null });
  }
  if (macd !== null && macdSig !== null) {
    const s = macdSubScore(macd, macdSig, ind.macdHist);
    scores.push({ name: 'MACD', score: s, weight: 1.2 });
    const b = macd > macdSig;
    details.push({ name: 'MACD', value: b ? 'Bullish crossover' : 'Bearish crossover', bull: b });
  }
  if (ind.stochK !== null) {
    const s = stochSubScore(ind.stochK);
    scores.push({ name: 'Stoch', score: s, weight: 0.8 });
    details.push({ name: 'Stoch %K', value: ind.stochK.toFixed(1), bull: s >= 55 ? true : s <= 40 ? false : null });
  }
  if (ind.cci !== null) {
    const s = cciSubScore(ind.cci);
    scores.push({ name: 'CCI', score: s, weight: 0.7 });
    details.push({ name: 'CCI', value: ind.cci.toFixed(0), bull: s >= 55 ? true : s <= 40 ? false : null });
  }
  if (ind.mfi !== null) {
    const s = mfiSubScore(ind.mfi);
    scores.push({ name: 'MFI', score: s, weight: 0.8 });
    details.push({ name: 'MFI', value: ind.mfi.toFixed(1), bull: s >= 55 ? true : s <= 40 ? false : null });
  }
  if (ind.stochRsi !== null) {
    const s = stochSubScore(ind.stochRsi);
    scores.push({ name: 'StochRSI', score: s, weight: 0.6 });
  }
  if (ind.pctVsSMA50 !== null) {
    const s = smaSubScore(ind.pctVsSMA50);
    scores.push({ name: 'SMA50', score: s, weight: 1 });
    details.push({ name: 'SMA 50', value: `${ind.pctVsSMA50 >= 0 ? '+' : ''}${ind.pctVsSMA50.toFixed(1)}%`, bull: ind.pctVsSMA50 > 0 });
  }
  if (ind.pctVsSMA200 !== null) {
    const s = smaSubScore(ind.pctVsSMA200);
    scores.push({ name: 'SMA200', score: s, weight: 1.2 });
    details.push({ name: 'SMA 200', value: `${ind.pctVsSMA200 >= 0 ? '+' : ''}${ind.pctVsSMA200.toFixed(1)}%`, bull: ind.pctVsSMA200 > 0 });
  }
  if (ind.adx !== null) {
    const s = adxSubScore(ind.adx, ind.psarTrend);
    scores.push({ name: 'ADX', score: s, weight: 1 });
  }
  if (ind.psarTrend !== null) {
    const s = ind.psarTrend === 'bullish' ? 70 : 30;
    scores.push({ name: 'PSAR', score: s, weight: 0.8 });
    details.push({ name: 'PSAR', value: ind.psarTrend === 'bullish' ? 'Bullish' : 'Bearish', bull: ind.psarTrend === 'bullish' });
  }
  if (ind.pctVsEMA9 !== null && ind.pctVsEMA21 !== null) {
    const cross = ind.ema9 !== null && ind.ema21 !== null && ind.ema9 > ind.ema21;
    const s = cross ? 65 : 35;
    scores.push({ name: 'EMA9/21', score: s, weight: 0.7 });
  }
  if (ind.roc10 !== null) {
    const s = clamp(50 + ind.roc10 * 3);
    scores.push({ name: 'ROC10', score: s, weight: 0.6 });
  }
  if (ind.roc20 !== null) {
    const s = clamp(50 + ind.roc20 * 2);
    scores.push({ name: 'ROC20', score: s, weight: 0.6 });
  }
  if (ind.obvDirection !== null) {
    const s = ind.obvDirection === 'rising' ? 70 : ind.obvDirection === 'falling' ? 30 : 50;
    scores.push({ name: 'OBV', score: s, weight: 0.5 });
  }
  if (ind.bbPctB !== null) {
    const b = ind.bbPctB;
    const s = b < 0 ? 65 : b < 0.2 ? 55 : b < 0.5 ? 50 : b < 0.8 ? 50 : b < 1 ? 45 : 30;
    scores.push({ name: 'BB', score: s, weight: 0.4 });
  }
  if (ind.volRatio !== null) {
    scores.push({ name: 'Vol', score: 50, weight: 0.2 });
  }

  let totalWeight = 0, weightedSum = 0;
  for (const { score, weight } of scores) { weightedSum += score * weight; totalWeight += weight; }
  const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
  return { score: finalScore, label: labelFromScore(finalScore), details };
}

// ── Indicator Card Builder ─────────────────────────────────────────────────────

export function buildIndicatorCards(ind: IndicatorResult, snap: TaapiSnap | null): { section: string; cards: IndicatorCard[] }[] {
  const rsi = snap?.rsi ?? ind.rsi;
  const macd = snap?.macd ?? ind.macd;
  const macdSig = snap?.macdSignal ?? ind.macdSignal;
  const fmt2 = (v: number) => v.toFixed(2);
  const pctSign = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

  function hover(key: string, value?: number): HoverInfo {
    const desc = getHoverDescription(key);
    return {
      what: desc.what,
      reading: value !== undefined ? desc.reading(value) : desc.reading(0),
      howTo: desc.howTo,
    };
  }

  const oscillators: IndicatorCard[] = [];

  if (rsi !== null) {
    let label: string, bull: boolean | null, desc: string;
    if (rsi >= 70)      { label = 'Overbought'; bull = false; desc = `At ${rsi.toFixed(1)}, buyers are overextended. The move may be running out of steam — watch for a pullback or consolidation near this zone.`; }
    else if (rsi >= 60) { label = 'Bullish';    bull = true;  desc = `At ${rsi.toFixed(1)}, momentum is strong and bullish. The uptrend is healthy with room to continue before becoming overbought.`; }
    else if (rsi >= 50) { label = 'Mild Bullish'; bull = true; desc = `At ${rsi.toFixed(1)}, momentum leans slightly bullish. Price is above the mid-line — a positive bias, but not a strong signal on its own.`; }
    else if (rsi >= 40) { label = 'Mild Bearish'; bull = false; desc = `At ${rsi.toFixed(1)}, momentum is slightly negative. Sellers have a mild edge. Watch whether it holds above 40 or breaks lower.`; }
    else if (rsi > 30)  { label = 'Bearish';    bull = false; desc = `At ${rsi.toFixed(1)}, selling pressure is building. Approaching oversold territory — a drop below 30 would signal an extreme reading.`; }
    else                { label = 'Oversold';   bull = true;  desc = `At ${rsi.toFixed(1)}, the stock is oversold. Sellers may be exhausted and a bounce is plausible, but wait for price to turn before acting.`; }
    oscillators.push({ name: 'RSI (14)', value: rsi.toFixed(1), label, bull, desc, hoverInfo: hover('rsi', rsi) });
  }

  if (ind.stochK !== null) {
    let label: string, bull: boolean | null, desc: string;
    const k = ind.stochK, d = ind.stochD;
    const cross = d !== null ? (k > d ? ' %K above %D — mild bullish signal.' : ' %K below %D — mild bearish signal.') : '';
    if (k >= 80)      { label = 'Overbought'; bull = false; desc = `At ${k.toFixed(1)}, the stochastic is overbought. Price is near the top of its recent range.${cross} A pullback is possible.`; }
    else if (k >= 50) { label = 'Bullish';    bull = true;  desc = `At ${k.toFixed(1)}, price is in the upper half of its 14-day range — a bullish tilt.${cross}`; }
    else if (k > 20)  { label = 'Bearish';    bull = false; desc = `At ${k.toFixed(1)}, price is in the lower half of its 14-day range — a bearish lean.${cross}`; }
    else              { label = 'Oversold';   bull = true;  desc = `At ${k.toFixed(1)}, the stochastic is oversold. Price is near the bottom of its recent range.${cross} A reversal setup may be forming.`; }
    oscillators.push({ name: 'Stochastic %K (14,3)', value: `${k.toFixed(1)} / ${d?.toFixed(1) ?? '–'}`, label, bull, desc, hoverInfo: hover('stochastic', k) });
  }

  if (ind.williamsR !== null) {
    const wr = ind.williamsR;
    let label: string, bull: boolean | null, desc: string;
    if (wr >= -20)      { label = 'Overbought'; bull = false; desc = `At ${wr.toFixed(1)}, price is near the top of its 14-day high-low range. Similar to Stochastic — readings near 0 suggest overbought conditions.`; }
    else if (wr >= -50) { label = 'Neutral/Bear'; bull = false; desc = `At ${wr.toFixed(1)}, price is in the upper-middle of its recent range. No extreme signal, but sellers have a slight edge.`; }
    else if (wr > -80)  { label = 'Neutral/Bull'; bull = true; desc = `At ${wr.toFixed(1)}, price is in the lower-middle of its recent range. No extreme signal, but buyers have a slight edge.`; }
    else                { label = 'Oversold';    bull = true; desc = `At ${wr.toFixed(1)}, price is near the bottom of its 14-day range. Readings below -80 indicate oversold conditions — watch for a bounce.`; }
    oscillators.push({ name: 'Williams %R (14)', value: wr.toFixed(1), label, bull, desc, hoverInfo: hover('williamsR', wr) });
  }

  if (ind.cci !== null) {
    const c = ind.cci;
    let label: string, bull: boolean | null, desc: string;
    if (c > 200)       { label = 'Extremely Overbought'; bull = false; desc = `At ${c.toFixed(0)}, price is far above its recent average. Extreme readings like this often precede mean reversion.`; }
    else if (c > 100)  { label = 'Overbought'; bull = false; desc = `At ${c.toFixed(0)}, price is well above its typical level. The CCI signals overbought conditions — trend may be extended.`; }
    else if (c >= 0)   { label = 'Mild Bullish'; bull = true; desc = `At ${c.toFixed(0)}, price is slightly above its 20-day average. Mild bullish pressure with no extreme reading.`; }
    else if (c > -100) { label = 'Mild Bearish'; bull = false; desc = `At ${c.toFixed(0)}, price is slightly below its 20-day average. Mild bearish pressure with no extreme reading.`; }
    else if (c > -200) { label = 'Oversold'; bull = true; desc = `At ${c.toFixed(0)}, price is well below its typical level. Oversold by CCI — look for stabilization before treating as a buy signal.`; }
    else               { label = 'Extremely Oversold'; bull = true; desc = `At ${c.toFixed(0)}, price has moved extremely far below its average. Extreme oversold — high probability of mean reversion.`; }
    oscillators.push({ name: 'CCI (20)', value: c.toFixed(0), label, bull, desc, hoverInfo: hover('cci', c) });
  }

  if (ind.mfi !== null) {
    const m = ind.mfi;
    let label: string, bull: boolean | null, desc: string;
    if (m >= 80)      { label = 'Overbought'; bull = false; desc = `At ${m.toFixed(1)}, heavy money is flowing in. The buying pressure is extreme — often precedes a pullback as the move becomes exhausted.`; }
    else if (m >= 60) { label = 'Bullish';    bull = true;  desc = `At ${m.toFixed(1)}, more money is flowing into the stock than out. Volume-confirmed buying pressure supports the current price action.`; }
    else if (m >= 40) { label = 'Neutral';    bull = null;  desc = `At ${m.toFixed(1)}, money flow is balanced. Neither buyers nor sellers dominate — the stock is in equilibrium.`; }
    else if (m > 20)  { label = 'Bearish';    bull = false; desc = `At ${m.toFixed(1)}, money is flowing out. Volume-confirmed selling pressure — institutions may be reducing positions.`; }
    else              { label = 'Oversold';   bull = true;  desc = `At ${m.toFixed(1)}, selling has been extreme. Money has been flowing out aggressively — a reversal may be developing as sellers exhaust.`; }
    oscillators.push({ name: 'MFI (14)', value: m.toFixed(1), label, bull, desc, hoverInfo: hover('mfi', m) });
  }

  if (ind.stochRsi !== null) {
    const sr = ind.stochRsi;
    let label: string, bull: boolean | null, desc: string;
    if (sr >= 80)      { label = 'Overbought'; bull = false; desc = `At ${sr.toFixed(1)}, the StochRSI is overbought. Momentum's momentum is at its peak — the probability of a short-term pullback increases.`; }
    else if (sr >= 50) { label = 'Bullish';    bull = true;  desc = `At ${sr.toFixed(1)}, momentum is in the upper half of its recent range. Bullish bias with room to extend.`; }
    else if (sr > 20)  { label = 'Bearish';    bull = false; desc = `At ${sr.toFixed(1)}, momentum is in the lower half of its recent range. Bearish lean — selling pressure has been building.`; }
    else               { label = 'Oversold';   bull = true;  desc = `At ${sr.toFixed(1)}, the StochRSI signals extremely oversold momentum. A bounce is likely — this is one of the more sensitive reversal signals.`; }
    oscillators.push({ name: 'Stochastic RSI', value: sr.toFixed(1), label, bull, desc, hoverInfo: hover('stochRsi', sr) });
  }

  const trend: IndicatorCard[] = [];

  if (macd !== null && macdSig !== null) {
    const bull = macd > macdSig;
    const hist = ind.macdHist ?? (macd - macdSig);
    const histStr = `Histogram: ${hist >= 0 ? '+' : ''}${hist.toFixed(3)}`;
    const desc = bull
      ? `MACD line (${fmt2(macd)}) is above the signal line (${fmt2(macdSig)}). This is a bullish crossover — upward momentum is currently favored. ${histStr}.`
      : `MACD line (${fmt2(macd)}) is below the signal line (${fmt2(macdSig)}). This is a bearish crossover — downward momentum is currently favored. ${histStr}.`;
    trend.push({ name: 'MACD (12, 26, 9)', value: `${fmt2(macd)} / ${fmt2(macdSig)}`, label: bull ? 'Bullish Cross' : 'Bearish Cross', bull, desc, hoverInfo: hover('macd', macd) });
  }

  if (ind.adx !== null) {
    const a = ind.adx;
    const trendDir = ind.psarTrend;
    let label: string, bull: boolean | null, desc: string;
    if (a < 20) {
      label = 'No Trend'; bull = null;
      desc = `At ${a.toFixed(1)}, the market has no clear trend. Price is moving sideways — trend-following indicators may give false signals in this environment.`;
    } else if (a < 40) {
      label = trendDir === 'bullish' ? 'Moderate Up Trend' : trendDir === 'bearish' ? 'Moderate Down Trend' : 'Moderate Trend';
      bull = trendDir === 'bullish' ? true : trendDir === 'bearish' ? false : null;
      desc = `At ${a.toFixed(1)}, a moderate trend is in place${trendDir ? ` (${trendDir})` : ''}. Trend-following signals carry more weight when ADX is above 25.`;
    } else {
      label = trendDir === 'bullish' ? 'Strong Up Trend' : trendDir === 'bearish' ? 'Strong Down Trend' : 'Strong Trend';
      bull = trendDir === 'bullish' ? true : trendDir === 'bearish' ? false : null;
      desc = `At ${a.toFixed(1)}, a strong trend is underway${trendDir ? ` (${trendDir})` : ''}. High ADX values mean the current direction has strong conviction — counter-trend trades are risky.`;
    }
    trend.push({ name: 'ADX (14)', value: a.toFixed(1), label, bull, desc, hoverInfo: hover('adx', a) });
  }

  if (ind.psar !== null && ind.psarTrend !== null) {
    const bull = ind.psarTrend === 'bullish';
    const desc = bull
      ? `Parabolic SAR is below price at $${ind.psar.toFixed(2)}. This signals an uptrend — the SAR level acts as a trailing stop. A break below $${ind.psar.toFixed(2)} would flip the signal bearish.`
      : `Parabolic SAR is above price at $${ind.psar.toFixed(2)}. This signals a downtrend — the SAR level acts as overhead resistance. A break above $${ind.psar.toFixed(2)} would flip the signal bullish.`;
    trend.push({ name: 'Parabolic SAR', value: `$${ind.psar.toFixed(2)}`, label: bull ? 'Bullish' : 'Bearish', bull, desc, hoverInfo: hover('psar', ind.psar) });
  }

  if (ind.pctVsEMA9 !== null && ind.ema9 !== null && ind.pctVsEMA21 !== null && ind.ema21 !== null) {
    const cross = ind.ema9 > ind.ema21;
    const v9 = ind.pctVsEMA9;
    const bull = v9 > 0 && cross;
    const desc = cross
      ? `EMA 9 ($${ind.ema9.toFixed(2)}) is above EMA 21 ($${ind.ema21.toFixed(2)}) — short-term bullish crossover. Price is ${v9 >= 0 ? 'above' : 'below'} both, ${v9 >= 0 ? 'confirming' : 'diverging from'} the bullish signal.`
      : `EMA 9 ($${ind.ema9.toFixed(2)}) is below EMA 21 ($${ind.ema21.toFixed(2)}) — short-term bearish crossover. Price is ${v9 >= 0 ? 'above' : 'below'} the fast EMA.`;
    trend.push({ name: 'EMA 9 / 21', value: `${pctSign(v9)}`, label: cross ? 'Bullish Cross' : 'Bearish Cross', bull, desc, hoverInfo: hover('ema9_21', v9) });
  }

  if (ind.pctVsSMA20 !== null && ind.sma20 !== null) {
    const v = ind.pctVsSMA20, bull = v > 0;
    const desc = bull
      ? `Price is ${v.toFixed(1)}% above the 20-day moving average ($${ind.sma20.toFixed(2)}). Short-term momentum is bullish. Price tends to revert to the SMA 20 over time.`
      : `Price is ${Math.abs(v).toFixed(1)}% below the 20-day moving average ($${ind.sma20.toFixed(2)}). Short-term momentum is bearish — selling pressure is dominant in the near term.`;
    trend.push({ name: 'Price vs SMA 20', value: pctSign(v), label: bull ? 'Above' : 'Below', bull, desc, hoverInfo: hover('sma20', v) });
  }

  if (ind.pctVsSMA50 !== null && ind.sma50 !== null) {
    const v = ind.pctVsSMA50, bull = v > 0;
    const desc = bull
      ? `Price is ${v.toFixed(1)}% above the 50-day moving average ($${ind.sma50.toFixed(2)}). The medium-term trend is up. The SMA 50 often acts as a support level in an uptrend.`
      : `Price is ${Math.abs(v).toFixed(1)}% below the 50-day moving average ($${ind.sma50.toFixed(2)}). The medium-term trend is down. The SMA 50 may now act as overhead resistance.`;
    trend.push({ name: 'Price vs SMA 50', value: pctSign(v), label: bull ? 'Above' : 'Below', bull, desc, hoverInfo: hover('sma50', v) });
  }

  if (ind.pctVsSMA200 !== null && ind.sma200 !== null) {
    const v = ind.pctVsSMA200, bull = v > 0;
    const desc = bull
      ? `Price is ${v.toFixed(1)}% above the 200-day moving average ($${ind.sma200.toFixed(2)}). This is the key long-term trend line — being above it is the hallmark of a bull market.`
      : `Price is ${Math.abs(v).toFixed(1)}% below the 200-day moving average ($${ind.sma200.toFixed(2)}). Long-term trend is bearish — many institutional investors use the 200 SMA as a dividing line.`;
    trend.push({ name: 'Price vs SMA 200', value: pctSign(v), label: bull ? 'Above' : 'Below', bull, desc, hoverInfo: hover('sma200', v) });
  }

  const volatility: IndicatorCard[] = [];

  if (ind.bbPctB !== null) {
    const b = ind.bbPctB;
    let label: string, bull: boolean | null, desc: string;
    if (b > 1)         { label = 'Above Upper Band'; bull = false; desc = `At ${(b * 100).toFixed(0)}%, price has broken above the upper Bollinger Band. This signals an overbought, extended move — mean reversion back toward the middle band is common.`; }
    else if (b > 0.8)  { label = 'Near Upper Band'; bull = null; desc = `At ${(b * 100).toFixed(0)}%, price is in the upper 20% of the band. Strong momentum, but approaching resistance near the upper band.`; }
    else if (b > 0.5)  { label = 'Upper Half';      bull = true; desc = `At ${(b * 100).toFixed(0)}%, price is in the upper half of the Bollinger Bands. Mild bullish positioning with room before the upper band is reached.`; }
    else if (b > 0.2)  { label = 'Lower Half';      bull = false; desc = `At ${(b * 100).toFixed(0)}%, price is in the lower half of the band. Mild bearish bias — sellers are keeping price suppressed.`; }
    else if (b >= 0)   { label = 'Near Lower Band'; bull = null; desc = `At ${(b * 100).toFixed(0)}%, price is near the lower Bollinger Band. Potential oversold support zone — watch for a bounce back toward the middle band.`; }
    else               { label = 'Below Lower Band'; bull = true; desc = `At ${(b * 100).toFixed(0)}%, price has broken below the lower Bollinger Band. Technically oversold — high probability of at least a short-term rebound.`; }
    volatility.push({ name: 'Bollinger %B (20,2)', value: `${(b * 100).toFixed(1)}%`, label, bull, desc, hoverInfo: hover('bbPctB', b * 100) });
  }

  if (ind.bbWidth !== null) {
    const w = ind.bbWidth * 100;
    let label: string, bull: boolean | null, desc: string;
    if (w < 3)  { label = 'Squeeze'; bull = null; desc = `Band width is very tight at ${w.toFixed(1)}%. A Bollinger Squeeze often precedes a sharp breakout — the direction is unknown, but a big move could be imminent.`; }
    else if (w < 6) { label = 'Narrow'; bull = null; desc = `Band width is ${w.toFixed(1)}% — relatively tight. Low volatility environment. Watch for an expansion in width signaling the start of a trend.`; }
    else if (w < 12) { label = 'Normal'; bull = null; desc = `Band width of ${w.toFixed(1)}% is within normal range. Volatility is average — price is moving without extreme expansion or compression.`; }
    else { label = 'Wide / High Vol'; bull = null; desc = `Band width is wide at ${w.toFixed(1)}%. High volatility — price is making larger moves than usual. Wide bands often occur during strong trends or after news events.`; }
    volatility.push({ name: 'BB Width (20,2)', value: `${w.toFixed(1)}%`, label, bull, desc, hoverInfo: hover('bbWidth', w) });
  }

  if (ind.atr !== null && ind.atrPct !== null) {
    const desc = `ATR measures the average daily price range. At $${ind.atr.toFixed(2)} (${ind.atrPct.toFixed(1)}% of price), expect the stock to move roughly +-$${(ind.atr / 2).toFixed(2)} from any given open on a typical day. Higher ATR = wider stop-loss needed.`;
    volatility.push({ name: 'ATR (14)', value: `$${ind.atr.toFixed(2)}`, label: `${ind.atrPct.toFixed(1)}% of price`, bull: null, desc, hoverInfo: hover('atr', ind.atr) });
  }

  const context: IndicatorCard[] = [];

  if (ind.roc10 !== null) {
    const v = ind.roc10, bull = v > 0;
    const desc = bull
      ? `Price is up ${v.toFixed(1)}% over the last 10 sessions — strong short-term momentum. Rate of change above 0 confirms buyers have been in control.`
      : `Price is down ${Math.abs(v).toFixed(1)}% over the last 10 sessions. Negative short-term momentum — sellers have been in control over the past two weeks.`;
    context.push({ name: '10-Day Rate of Change', value: pctSign(v), label: bull ? 'Positive' : 'Negative', bull, desc, hoverInfo: hover('roc10', v) });
  }

  if (ind.roc20 !== null) {
    const v = ind.roc20, bull = v > 0;
    const desc = bull
      ? `Price is up ${v.toFixed(1)}% over the past 20 sessions (roughly one month). Positive monthly momentum — the stock has been trending higher.`
      : `Price is down ${Math.abs(v).toFixed(1)}% over the past 20 sessions. One month of negative momentum — the stock has been in a declining phase.`;
    context.push({ name: '20-Day Rate of Change', value: pctSign(v), label: bull ? 'Positive' : 'Negative', bull, desc, hoverInfo: hover('roc20', v) });
  }

  if (ind.obvDirection !== null) {
    const dir = ind.obvDirection;
    let label: string, bull: boolean | null, desc: string;
    if (dir === 'rising') {
      label = 'Rising'; bull = true;
      desc = 'On Balance Volume is trending upward. Volume is higher on up days than down days — money is flowing into the stock, confirming bullish price action.';
    } else if (dir === 'falling') {
      label = 'Falling'; bull = false;
      desc = 'On Balance Volume is trending downward. Volume is higher on down days — money is flowing out of the stock, confirming bearish price action.';
    } else {
      label = 'Flat'; bull = null;
      desc = 'On Balance Volume is flat. Volume is roughly equal on up and down days — no clear accumulation or distribution pattern.';
    }
    context.push({ name: 'OBV Direction', value: dir.charAt(0).toUpperCase() + dir.slice(1), label, bull, desc, hoverInfo: hover('obv', 0) });
  }

  if (ind.volRatio !== null) {
    const v = ind.volRatio;
    let label: string, bull: boolean | null, desc: string;
    if (v > 2)        { label = 'Very High Volume'; bull = null; desc = `${v.toFixed(1)}x the 20-day average volume. Unusually high activity — often associated with news events, earnings, or a strong trend confirmation.`; }
    else if (v > 1.3) { label = 'Above Average'; bull = null; desc = `${v.toFixed(1)}x average volume. Above-average participation — price moves on elevated volume are typically more meaningful and sustainable.`; }
    else if (v >= 0.7){ label = 'Normal'; bull = null; desc = `${v.toFixed(1)}x average volume. Volume is in the normal range. No unusual buying or selling activity detected in recent sessions.`; }
    else              { label = 'Below Average'; bull = null; desc = `${v.toFixed(1)}x average volume. Low participation — price moves on thin volume are less reliable and easier to reverse.`; }
    context.push({ name: 'Volume vs 20-Day Avg', value: `${v.toFixed(2)}x`, label, bull, desc, hoverInfo: hover('volRatio', v) });
  }

  {
    const p = ind.pos52w;
    let label: string, bull: boolean | null, desc: string;
    if (p >= 90)      { label = 'Near 52W High'; bull = true;  desc = `Price is in the top ${(100 - p).toFixed(0)}% of its yearly range — near the 52-week high of $${ind.high52w.toFixed(2)}. Stocks near 52-week highs often continue to outperform.`; }
    else if (p >= 60) { label = 'Upper Range';   bull = true;  desc = `At ${p.toFixed(0)}% of the 52-week range ($${ind.low52w.toFixed(2)} – $${ind.high52w.toFixed(2)}), price is in the upper portion — above the midpoint and closer to its high.`; }
    else if (p >= 40) { label = 'Mid Range';     bull = null;  desc = `At ${p.toFixed(0)}% of the 52-week range, price is near the middle of its yearly trading band. No strong directional signal from this reading alone.`; }
    else if (p >= 10) { label = 'Lower Range';   bull = false; desc = `At ${p.toFixed(0)}% of the 52-week range, price is in the lower portion of its yearly trading band — closer to its low of $${ind.low52w.toFixed(2)}.`; }
    else              { label = 'Near 52W Low';  bull = false; desc = `Price is in the bottom ${p.toFixed(0)}% of its yearly range — near the 52-week low of $${ind.low52w.toFixed(2)}. Could signal deep value or a prolonged downtrend — context matters.`; }
    context.push({ name: '52-Week Position', value: `${p.toFixed(0)}%`, label, bull, desc, hoverInfo: hover('pos52w', p) });
  }

  return [
    { section: 'Oscillators', cards: oscillators },
    { section: 'Trend', cards: trend },
    { section: 'Volatility', cards: volatility },
    { section: 'Momentum & Context', cards: context },
  ].filter(s => s.cards.length > 0);
}
