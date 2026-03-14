import type { Candle } from '../tech-analysis/types';
import type { MarketCycleResult, WyckoffPhase, TimeframeResult, ReadinessZone } from './types';
import { computeAllIndicators, computeSMA, fetchOHLCV } from '../tech-analysis/calculations';
import { safeSetItem } from '../tech-analysis/utils/storage';

const CACHE_KEY = 'market_cycle_result_v4';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

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
  const total = Object.values(result).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    const maxKey = keys.reduce((a, b) => result[a] > result[b] ? a : b);
    result[maxKey] = Math.round((result[maxKey] + (100 - total)) * 10) / 10;
  }
  return result;
}

// ── Data Fetch ───────────────────────────────────────────────────────────────

/** Monthly + weekly from server-side function (shared cache for all users) */
async function fetchServerData(): Promise<{ monthly: Candle[]; weekly: Candle[] }> {
  const res = await fetch('/.netlify/functions/market-cycle');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Server error: ${res.status}`);
  }
  return res.json();
}

/** Daily from client-side (uses existing fetchOHLCV proxy chain) */
async function fetchDailyData(): Promise<Candle[]> {
  const candles = await fetchOHLCV('SPY');
  if (candles.length < 50) throw new Error(`Daily: only ${candles.length} candles (need 50+)`);
  return candles;
}

// ── Cycle Detection ──────────────────────────────────────────────────────────

function computeWyckoffPhase(candles: Candle[]): TimeframeResult {
  const closes = candles.map(c => c.close);
  const n = closes.length;

  const ind = computeAllIndicators(candles);

  const sma50Arr = computeSMA(closes, 50);
  const s50Now = sma50Arr[n - 1];
  const s50Prev = sma50Arr[n - 21] ?? sma50Arr[n - 11];
  const sma50Slope = s50Now != null && s50Prev != null
    ? ((s50Now - s50Prev) / s50Prev) * 100 : 0;

  const priceVsSMA50 = ind.pctVsSMA50 ?? 0;
  const priceVsSMA200 = ind.pctVsSMA200 ?? 0;
  const goldenCross = (ind.sma50 ?? 0) > (ind.sma200 ?? 1);
  const rsi = ind.rsi ?? 50;
  const macdHist = ind.macdHist ?? 0;
  const macd = ind.macd ?? 0;
  const adx = ind.adx ?? 20;
  const bbWidth = ind.bbWidth ?? 0.05;
  const roc20 = ind.roc20 ?? 0;

  let accum = 0;
  accum += clamp(mapRange(priceVsSMA200, -10, 3, 80, 10));
  if (!goldenCross && sma50Slope > -0.1) accum += 25;
  if (!goldenCross && sma50Slope > 0.1) accum += 15;
  accum += clamp(mapRange(rsi, 25, 45, 70, 10));
  if (macdHist < 0 && macdHist > -1) accum += 20;
  accum += clamp(mapRange(bbWidth * 100, 2, 6, 60, 10));
  accum += clamp(mapRange(adx, 10, 25, 50, 10));
  accum += clamp(mapRange(Math.abs(roc20), 0, 5, 50, 5));

  let markup = 0;
  if (priceVsSMA50 > 0 && priceVsSMA200 > 0) markup += 35;
  if (goldenCross) markup += 25;
  markup += clamp(mapRange(rsi, 50, 70, 70, 10));
  if (macdHist > 0) markup += 20;
  if (macdHist > 0.5) markup += 10;
  markup += clamp(mapRange(adx, 25, 40, 50, 10));
  markup += clamp(mapRange(roc20, 3, 12, 50, 5));
  if (sma50Slope > 0.2) markup += 15;

  let distrib = 0;
  if (priceVsSMA200 > 0 && priceVsSMA50 < 3) distrib += 25;
  if (goldenCross && sma50Slope < 0.15) distrib += 20;
  if (goldenCross && sma50Slope < -0.05) distrib += 15;
  distrib += clamp(mapRange(rsi, 55, 75, 50, 10));
  if (macd > 0 && macdHist < 0) distrib += 30;
  distrib += clamp(mapRange(bbWidth * 100, 5, 10, 50, 10));
  if (adx > 15 && adx < 30) distrib += 15;

  let markdown = 0;
  if (priceVsSMA50 < 0 && priceVsSMA200 < 0) markdown += 35;
  if (!goldenCross) markdown += 25;
  markdown += clamp(mapRange(rsi, 20, 40, 70, 10));
  if (macdHist < 0) markdown += 20;
  if (macdHist < -0.5) markdown += 10;
  if (adx > 25 && priceVsSMA200 < 0) markdown += 20;
  markdown += clamp(mapRange(roc20, -12, -3, 50, 5));
  if (sma50Slope < -0.2) markdown += 15;

  const rawScores: Record<WyckoffPhase, number> = {
    'Accumulation': accum, 'Mark-Up': markup,
    'Distribution': distrib, 'Mark-Down': markdown,
  };
  const probabilities = softmax(rawScores) as Record<WyckoffPhase, number>;
  const entries = (Object.entries(probabilities) as [WyckoffPhase, number][]).sort((a, b) => b[1] - a[1]);

  return { phase: entries[0][0], confidence: entries[0][1], probabilities };
}

// ── Investment Readiness Score ────────────────────────────────────────────────

const PHASE_SCORE: Record<WyckoffPhase, number> = {
  'Accumulation': 60, 'Mark-Up': 85, 'Distribution': 35, 'Mark-Down': 15,
};

function isBullish(phase: WyckoffPhase) {
  return phase === 'Mark-Up' || phase === 'Accumulation';
}

function computeInvestmentReadiness(
  daily: TimeframeResult, weekly: TimeframeResult, monthly: TimeframeResult,
): { score: number; zone: ReadinessZone; label: string } {
  let score = PHASE_SCORE[monthly.phase] * 0.35 + PHASE_SCORE[weekly.phase] * 0.40 + PHASE_SCORE[daily.phase] * 0.25;

  if (isBullish(monthly.phase) && isBullish(weekly.phase) && isBullish(daily.phase)) score += 10;
  if (!isBullish(monthly.phase) && !isBullish(weekly.phase) && !isBullish(daily.phase)) score -= 10;
  if (isBullish(monthly.phase) === isBullish(weekly.phase) && isBullish(weekly.phase) !== isBullish(daily.phase)) score -= 3;
  if (isBullish(monthly.phase) !== isBullish(weekly.phase) && isBullish(weekly.phase) === isBullish(daily.phase)) score -= 5;

  const avgConf = (monthly.confidence + weekly.confidence + daily.confidence) / 3;
  if (avgConf < 35) score = score * 0.7 + 50 * 0.3;

  score = Math.round(Math.max(0, Math.min(100, score)));

  if (score >= 65) return { score, zone: 'strong-buy', label: 'Strong Buy Window' };
  if (score >= 40) return { score, zone: 'neutral', label: 'Neutral / Selective' };
  return { score, zone: 'defensive', label: 'Defensive / Wait' };
}

// ── Dynamic Guidance ─────────────────────────────────────────────────────────

function generateGuidance(daily: TimeframeResult, weekly: TimeframeResult, monthly: TimeframeResult): string {
  const m = monthly.phase, w = weekly.phase, d = daily.phase;

  if (isBullish(m) && isBullish(w) && isBullish(d)) {
    if (m === 'Mark-Up' && w === 'Mark-Up')
      return 'All three timeframes confirm a sustained uptrend. The monthly, weekly, and daily are all bullish — this is the strongest possible environment for equity exposure. Stay fully invested, add on pullbacks, and let winners run. Growth and momentum strategies tend to outperform.';
    return 'All timeframes lean bullish. The structural trend is positive and short-term momentum is constructive. Consider building positions gradually via dollar-cost averaging into quality names.';
  }

  if (!isBullish(m) && !isBullish(w) && !isBullish(d)) {
    if (m === 'Mark-Down' && w === 'Mark-Down')
      return 'All three timeframes are bearish — a rare full-alignment downtrend. Capital preservation is critical. Maintain elevated cash, consider defensive hedges, and wait for at least the daily to show accumulation before re-engaging.';
    return 'All timeframes lean bearish. Distribution or mark-down signals suggest reducing exposure. Take profits, tighten stops, and rotate toward defensive sectors. Cash is a valid position.';
  }

  if (isBullish(m) && isBullish(w) && !isBullish(d))
    return `Structural trend is bullish — monthly (${m}) and weekly (${w}) are positive, but daily shows ${d.toLowerCase()}. Likely a pullback within an uptrend. Watch for the daily to stabilize before adding. Existing positions can be held with tighter stops.`;

  if (isBullish(m) && !isBullish(w) && !isBullish(d))
    return `Monthly is still ${m.toLowerCase()} but both weekly (${w}) and daily (${d}) are deteriorating. A deeper correction may be underway, though long-term structure remains positive. Reduce new buying, raise some cash, but don't panic — the monthly trend takes precedence.`;

  if (isBullish(m) && !isBullish(w) && isBullish(d))
    return `Mixed: monthly is ${m.toLowerCase()}, daily is ${d.toLowerCase()}, but weekly is ${w.toLowerCase()}. Daily may be leading a recovery within a weekly pullback. Small positions are reasonable but wait for weekly confirmation.`;

  if (!isBullish(m) && !isBullish(w) && isBullish(d))
    return `Monthly (${m}) and weekly (${w}) are bearish, but daily shows ${d.toLowerCase()} — likely a bear market rally. Keep sizes small and set tight stops.`;

  if (!isBullish(m) && isBullish(w) && isBullish(d))
    return `Weekly and daily turned bullish while monthly remains ${m.toLowerCase()}. Could be early stages of a structural shift — or a powerful bear-market rally. Build conviction slowly.`;

  if (!isBullish(m) && isBullish(w) && !isBullish(d))
    return `Monthly is ${m.toLowerCase()}, weekly is ${w.toLowerCase()}, but daily is ${d.toLowerCase()}. Choppy environment. Wait for at least two of three timeframes to agree.`;

  return 'Market signals are mixed across timeframes. Maintain a balanced allocation and wait for clearer directional signals.';
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function fetchMarketCycle(): Promise<MarketCycleResult> {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data as MarketCycleResult;
    } catch { localStorage.removeItem(CACHE_KEY); }
  }

  // Fetch: monthly+weekly from server (shared), daily from client (proxy)
  const [serverData, dailyCandles] = await Promise.all([
    fetchServerData(),
    fetchDailyData(),
  ]);

  const daily = computeWyckoffPhase(dailyCandles);
  const weekly = computeWyckoffPhase(serverData.weekly);
  const monthly = computeWyckoffPhase(serverData.monthly);
  const { score, zone, label } = computeInvestmentReadiness(daily, weekly, monthly);
  const guidance = generateGuidance(daily, weekly, monthly);

  const result: MarketCycleResult = {
    daily, weekly, monthly,
    readinessScore: score,
    readinessZone: zone,
    readinessLabel: label,
    guidance,
    dataRange: {
      from: dailyCandles[0].date,
      to: dailyCandles[dailyCandles.length - 1].date,
    },
    candleCount: {
      daily: dailyCandles.length,
      weekly: serverData.weekly.length,
      monthly: serverData.monthly.length,
    },
  };

  safeSetItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result }));
  return result;
}
