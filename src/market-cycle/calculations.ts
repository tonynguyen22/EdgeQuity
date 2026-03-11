import type { Candle } from '../tech-analysis/types';
import type { MarketCycleResult, WyckoffPhase } from './types';
import { computeAllIndicators, computeSMA, normalizePolygon, fetchOHLCV } from '../tech-analysis/calculations';
import { proxyFetch } from '../utils/proxyFetch';
import { safeSetItem } from '../tech-analysis/utils/storage';

const CACHE_KEY = 'market_cycle_spy_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapRange(val: number, inMin: number, inMax: number, outMax: number, outMin: number): number {
  if (val <= inMin) return outMax;
  if (val >= inMax) return outMin;
  return outMax - ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function softmax(scores: Record<string, number>, temperature = 30): Record<string, number> {
  const keys = Object.keys(scores);
  const maxScore = Math.max(...Object.values(scores));
  const exps = keys.map(k => Math.exp((scores[k] - maxScore) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  const result: Record<string, number> = {};
  keys.forEach((k, i) => {
    result[k] = Math.round((exps[i] / sum) * 1000) / 10;
  });
  // Ensure sum = 100
  const total = Object.values(result).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    const maxKey = keys.reduce((a, b) => result[a] > result[b] ? a : b);
    result[maxKey] = Math.round((result[maxKey] + (100 - total)) * 10) / 10;
  }
  return result;
}

// ── SPY Data Fetch ───────────────────────────────────────────────────────────

async function fetchSPYCandles(): Promise<Candle[]> {
  const errors: string[] = [];

  // Massive API first (2 years of daily data)
  const toDate = new Date().toISOString().slice(0, 10);
  const from = new Date();
  from.setDate(from.getDate() - 730);
  const fromDate = from.toISOString().slice(0, 10);

  try {
    const url = `https://api.massive.com/v2/aggs/ticker/SPY/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=5000`;
    const res = await proxyFetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      errors.push(`Massive API: ${res.status} ${body.slice(0, 200)}`);
    } else {
      const candles = normalizePolygon(await res.json());
      if (candles.length >= 200) return candles;
      errors.push(`Massive API returned ${candles.length} candles`);
    }
  } catch (e: any) {
    errors.push(`Massive API: ${e.message}`);
  }

  // Fallback: existing OHLCV chain (1 year, ~252 candles)
  try {
    const candles = await fetchOHLCV('SPY');
    if (candles.length >= 200) return candles;
    errors.push(`fetchOHLCV returned ${candles.length} candles (need 200+)`);
  } catch (e: any) {
    errors.push(`fetchOHLCV: ${e.message}`);
  }

  throw new Error(`SPY fetch failed. Details: ${errors.join(' | ')}`);
}

// ── Cycle Detection ──────────────────────────────────────────────────────────

function computeMarketCycle(candles: Candle[]): MarketCycleResult {
  const closes = candles.map(c => c.close);
  const n = closes.length;

  // Compute all standard indicators on SPY
  const ind = computeAllIndicators(candles);

  // SMA arrays for slope analysis
  const sma50Arr = computeSMA(closes, 50);
  const sma200Arr = computeSMA(closes, 200);

  // SMA 50 slope: 20-day rate of change of the moving average
  const s50Now = sma50Arr[n - 1];
  const s50Prev = sma50Arr[n - 21] ?? sma50Arr[n - 11];
  const sma50Slope = s50Now != null && s50Prev != null
    ? ((s50Now - s50Prev) / s50Prev) * 100 : 0;

  // Key indicator values
  const priceVsSMA50 = ind.pctVsSMA50 ?? 0;
  const priceVsSMA200 = ind.pctVsSMA200 ?? 0;
  const goldenCross = (ind.sma50 ?? 0) > (ind.sma200 ?? 1);
  const rsi = ind.rsi ?? 50;
  const macdHist = ind.macdHist ?? 0;
  const macd = ind.macd ?? 0;
  const adx = ind.adx ?? 20;
  const bbWidth = ind.bbWidth ?? 0.05;
  const roc20 = ind.roc20 ?? 0;

  // ── ACCUMULATION ──
  let accum = 0;
  // Price near or below SMA 200
  accum += clamp(mapRange(priceVsSMA200, -10, 3, 80, 10));
  // SMA 50 below SMA 200 but slope turning up
  if (!goldenCross && sma50Slope > -0.1) accum += 25;
  if (!goldenCross && sma50Slope > 0.1) accum += 15;
  // RSI recovering from low (25-45)
  accum += clamp(mapRange(rsi, 25, 45, 70, 10));
  // MACD histogram negative but improving
  if (macdHist < 0 && macdHist > -1) accum += 20;
  // Bollinger squeeze
  accum += clamp(mapRange(bbWidth * 100, 2, 6, 60, 10));
  // Low ADX (range-bound market)
  accum += clamp(mapRange(adx, 10, 25, 50, 10));
  // Flat ROC (sideways movement)
  accum += clamp(mapRange(Math.abs(roc20), 0, 5, 50, 5));

  // ── MARK-UP ──
  let markup = 0;
  // Price above both SMAs
  if (priceVsSMA50 > 0 && priceVsSMA200 > 0) markup += 35;
  // Golden cross
  if (goldenCross) markup += 25;
  // RSI 50-70 (healthy uptrend)
  markup += clamp(mapRange(rsi, 50, 70, 70, 10));
  // MACD positive and histogram rising
  if (macdHist > 0) markup += 20;
  if (macdHist > 0.5) markup += 10;
  // ADX > 25 (strong trend)
  markup += clamp(mapRange(adx, 25, 40, 50, 10));
  // Positive momentum
  markup += clamp(mapRange(roc20, 3, 12, 50, 5));
  // SMA 50 slope positive
  if (sma50Slope > 0.2) markup += 15;

  // ── DISTRIBUTION ──
  let distrib = 0;
  // Price above SMA 200 but weakening vs SMA 50
  if (priceVsSMA200 > 0 && priceVsSMA50 < 3) distrib += 25;
  // SMA 50 slope flattening while still in golden cross
  if (goldenCross && sma50Slope < 0.15) distrib += 20;
  if (goldenCross && sma50Slope < -0.05) distrib += 15;
  // RSI declining from high (55-75 fading)
  distrib += clamp(mapRange(rsi, 55, 75, 50, 10));
  // MACD positive but histogram declining
  if (macd > 0 && macdHist < 0) distrib += 30;
  // High BB width (expanded volatility at top)
  distrib += clamp(mapRange(bbWidth * 100, 5, 10, 50, 10));
  // ADX weakening
  if (adx > 15 && adx < 30) distrib += 15;

  // ── MARK-DOWN ──
  let markdown = 0;
  // Price below both SMAs
  if (priceVsSMA50 < 0 && priceVsSMA200 < 0) markdown += 35;
  // Death cross
  if (!goldenCross) markdown += 25;
  // RSI below 40
  markdown += clamp(mapRange(rsi, 20, 40, 70, 10));
  // MACD negative and histogram falling
  if (macdHist < 0) markdown += 20;
  if (macdHist < -0.5) markdown += 10;
  // Strong ADX in downtrend
  if (adx > 25 && priceVsSMA200 < 0) markdown += 20;
  // Negative momentum
  markdown += clamp(mapRange(roc20, -12, -3, 50, 5));
  // SMA 50 slope negative
  if (sma50Slope < -0.2) markdown += 15;

  // Softmax normalization
  const rawScores: Record<WyckoffPhase, number> = {
    'Accumulation': accum,
    'Mark-Up': markup,
    'Distribution': distrib,
    'Mark-Down': markdown,
  };
  const probabilities = softmax(rawScores) as Record<WyckoffPhase, number>;

  // Determine phase and confidence
  const entries = (Object.entries(probabilities) as [WyckoffPhase, number][])
    .sort((a, b) => b[1] - a[1]);
  const phase = entries[0][0];
  const confidence = entries[0][1];

  return {
    phase,
    confidence,
    probabilities,
    dataRange: { from: candles[0].date, to: candles[n - 1].date },
    candleCount: n,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function fetchMarketCycle(): Promise<MarketCycleResult> {
  // Check cache
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data as MarketCycleResult;
    } catch { localStorage.removeItem(CACHE_KEY); }
  }

  const candles = await fetchSPYCandles();
  const result = computeMarketCycle(candles);

  safeSetItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result }));
  return result;
}
