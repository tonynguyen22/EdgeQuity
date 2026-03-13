import type { Candle } from '../tech-analysis/types';
import type { MarketCycleResult, WyckoffPhase, TimeframeResult, ReadinessZone } from './types';
import { computeAllIndicators, computeSMA, fetchOHLCV } from '../tech-analysis/calculations';
import { proxyFetch } from '../utils/proxyFetch';
import { safeSetItem } from '../tech-analysis/utils/storage';

const CACHE_KEY_DAILY = 'market_cycle_daily_v3';
const CACHE_KEY_WEEKLY = 'market_cycle_weekly_v3';
const CACHE_KEY_MONTHLY = 'market_cycle_monthly_v3';
const CACHE_KEY_RESULT = 'market_cycle_result_v3';
const DAILY_TTL = 24 * 60 * 60 * 1000;        // 24 hours
const WEEKLY_TTL = 7 * 24 * 60 * 60 * 1000;   // 7 days
const MONTHLY_TTL = 30 * 24 * 60 * 60 * 1000;  // 30 days
const AV_BASE = 'https://www.alphavantage.co/query';
const AV_DELAY_MS = 1500;

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Alpha Vantage Normalizers ────────────────────────────────────────────────

function normalizeAVDaily(data: any): Candle[] {
  const ts = data?.['Time Series (Daily)'];
  if (!ts) return [];
  return Object.entries(ts).map(([date, v]: [string, any]) => ({
    date,
    open: parseFloat(v['1. open']), high: parseFloat(v['2. high']),
    low: parseFloat(v['3. low']), close: parseFloat(v['4. close']),
    volume: parseInt(v['5. volume'], 10),
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeAVWeekly(data: any): Candle[] {
  const ts = data?.['Weekly Time Series'];
  if (!ts) return [];
  return Object.entries(ts).map(([date, v]: [string, any]) => ({
    date,
    open: parseFloat(v['1. open']), high: parseFloat(v['2. high']),
    low: parseFloat(v['3. low']), close: parseFloat(v['4. close']),
    volume: parseInt(v['5. volume'], 10),
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeAVMonthly(data: any): Candle[] {
  const ts = data?.['Monthly Time Series'];
  if (!ts) return [];
  return Object.entries(ts).map(([date, v]: [string, any]) => ({
    date,
    open: parseFloat(v['1. open']), high: parseFloat(v['2. high']),
    low: parseFloat(v['3. low']), close: parseFloat(v['4. close']),
    volume: parseInt(v['5. volume'], 10),
  })).sort((a, b) => a.date.localeCompare(b.date));
}

// ── SPY Data Fetch (with per-timeframe caching) ─────────────────────────────

function getCachedCandles(key: string, ttl: number, minCount = 200): Candle[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, candles } = JSON.parse(raw);
    if (Date.now() - ts < ttl && Array.isArray(candles) && candles.length >= minCount) {
      return candles as Candle[];
    }
  } catch { /* ignore bad cache */ }
  return null;
}

function setCachedCandles(key: string, candles: Candle[]) {
  safeSetItem(key, JSON.stringify({ ts: Date.now(), candles }));
}

async function fetchAVCandles(
  fn: string, normalizer: (d: any) => Candle[], label: string, minCount = 200,
): Promise<Candle[]> {
  const url = `${AV_BASE}?function=${fn}&symbol=SPY`;
  const res = await proxyFetch(url);
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
  const json = await res.json();
  if (json?.['Note'] || json?.['Information']) {
    throw new Error(`${label}: API rate limit — ${json['Note'] || json['Information']}`);
  }
  const candles = normalizer(json);
  if (candles.length < minCount) throw new Error(`${label}: only ${candles.length} candles (need ${minCount}+)`);
  return candles;
}

async function fetchSPYDaily(): Promise<Candle[]> {
  const cached = getCachedCandles(CACHE_KEY_DAILY, DAILY_TTL);
  if (cached) return cached;

  const errors: string[] = [];

  try {
    const all = await fetchAVCandles('TIME_SERIES_DAILY', normalizeAVDaily, 'AV Daily');
    const trimmed = all.slice(-520);
    setCachedCandles(CACHE_KEY_DAILY, trimmed);
    return trimmed;
  } catch (e: any) { errors.push(e.message); }

  try {
    const candles = await fetchOHLCV('SPY');
    if (candles.length >= 200) {
      setCachedCandles(CACHE_KEY_DAILY, candles);
      return candles;
    }
    errors.push(`fetchOHLCV: ${candles.length} candles`);
  } catch (e: any) { errors.push(`fetchOHLCV: ${e.message}`); }

  throw new Error(`SPY daily fetch failed: ${errors.join(' | ')}`);
}

async function fetchSPYWeekly(): Promise<Candle[]> {
  const cached = getCachedCandles(CACHE_KEY_WEEKLY, WEEKLY_TTL);
  if (cached) return cached;

  const all = await fetchAVCandles('TIME_SERIES_WEEKLY', normalizeAVWeekly, 'AV Weekly');
  const trimmed = all.slice(-260);
  setCachedCandles(CACHE_KEY_WEEKLY, trimmed);
  return trimmed;
}

async function fetchSPYMonthly(): Promise<Candle[]> {
  const cached = getCachedCandles(CACHE_KEY_MONTHLY, MONTHLY_TTL, 200);
  if (cached) return cached;

  const all = await fetchAVCandles('TIME_SERIES_MONTHLY', normalizeAVMonthly, 'AV Monthly', 200);
  setCachedCandles(CACHE_KEY_MONTHLY, all);
  return all;
}

// ── Cycle Detection (reusable for any timeframe) ─────────────────────────────

function computeWyckoffPhase(candles: Candle[]): TimeframeResult {
  const closes = candles.map(c => c.close);
  const n = closes.length;

  const ind = computeAllIndicators(candles);

  const sma50Arr = computeSMA(closes, 50);
  const sma200Arr = computeSMA(closes, 200);

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
    'Accumulation': accum,
    'Mark-Up': markup,
    'Distribution': distrib,
    'Mark-Down': markdown,
  };
  const probabilities = softmax(rawScores) as Record<WyckoffPhase, number>;

  const entries = (Object.entries(probabilities) as [WyckoffPhase, number][])
    .sort((a, b) => b[1] - a[1]);

  return {
    phase: entries[0][0],
    confidence: entries[0][1],
    probabilities,
  };
}

// ── Investment Readiness Score ────────────────────────────────────────────────

const PHASE_SCORE: Record<WyckoffPhase, number> = {
  'Accumulation': 60,
  'Mark-Up': 85,
  'Distribution': 35,
  'Mark-Down': 15,
};

function isBullish(phase: WyckoffPhase) {
  return phase === 'Mark-Up' || phase === 'Accumulation';
}

function computeInvestmentReadiness(
  daily: TimeframeResult,
  weekly: TimeframeResult,
  monthly: TimeframeResult,
): { score: number; zone: ReadinessZone; label: string } {
  // Weighted avg: monthly 35%, weekly 40%, daily 25%
  const monthlyBase = PHASE_SCORE[monthly.phase];
  const weeklyBase = PHASE_SCORE[weekly.phase];
  const dailyBase = PHASE_SCORE[daily.phase];
  let score = monthlyBase * 0.35 + weeklyBase * 0.40 + dailyBase * 0.25;

  // Full alignment bonus/penalty
  const allBullish = isBullish(monthly.phase) && isBullish(weekly.phase) && isBullish(daily.phase);
  const allBearish = !isBullish(monthly.phase) && !isBullish(weekly.phase) && !isBullish(daily.phase);
  if (allBullish) score += 10;
  if (allBearish) score -= 10;

  // Partial alignment: monthly+weekly agree but daily diverges (short-term noise)
  if (isBullish(monthly.phase) === isBullish(weekly.phase) && isBullish(weekly.phase) !== isBullish(daily.phase)) {
    score -= 3; // mild penalty, larger timeframes agree
  }

  // Monthly diverges from weekly+daily (structural shift signal)
  if (isBullish(monthly.phase) !== isBullish(weekly.phase) && isBullish(weekly.phase) === isBullish(daily.phase)) {
    score -= 5; // possible structural transition
  }

  // Confidence scaling
  const avgConf = (monthly.confidence + weekly.confidence + daily.confidence) / 3;
  if (avgConf < 35) {
    score = score * 0.7 + 50 * 0.3;
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  let zone: ReadinessZone;
  let label: string;
  if (score >= 65) {
    zone = 'strong-buy';
    label = 'Strong Buy Window';
  } else if (score >= 40) {
    zone = 'neutral';
    label = 'Neutral / Selective';
  } else {
    zone = 'defensive';
    label = 'Defensive / Wait';
  }

  return { score, zone, label };
}

// ── Dynamic Guidance Generator ───────────────────────────────────────────────

function generateGuidance(
  daily: TimeframeResult, weekly: TimeframeResult, monthly: TimeframeResult,
): string {
  const m = monthly.phase;
  const w = weekly.phase;
  const d = daily.phase;

  // All aligned
  if (isBullish(m) && isBullish(w) && isBullish(d)) {
    if (m === 'Mark-Up' && w === 'Mark-Up') {
      return 'All three timeframes confirm a sustained uptrend. The monthly, weekly, and daily are all bullish — this is the strongest possible environment for equity exposure. Stay fully invested, add on pullbacks, and let winners run. Growth and momentum strategies tend to outperform.';
    }
    return 'All timeframes lean bullish. The monthly and weekly suggest the structural trend is positive, and the daily confirms short-term momentum is constructive. Consider building positions gradually. Dollar-cost averaging into quality names is favorable here.';
  }

  if (!isBullish(m) && !isBullish(w) && !isBullish(d)) {
    if (m === 'Mark-Down' && w === 'Mark-Down') {
      return 'All three timeframes are bearish — a rare full-alignment downtrend. Capital preservation is critical. Maintain elevated cash, consider defensive hedges, and avoid buying dips. Wait for at least the daily to show accumulation before re-engaging.';
    }
    return 'All timeframes lean bearish. Distribution or mark-down signals across monthly, weekly, and daily suggest reducing exposure. Take profits on extended positions, tighten stops, and rotate toward defensive sectors. Cash is a valid position.';
  }

  // Monthly bullish, shorter-term weakening
  if (isBullish(m) && isBullish(w) && !isBullish(d)) {
    return `The structural trend is bullish — monthly (${m}) and weekly (${w}) are positive, but the daily shows ${d.toLowerCase()}. This is likely a pullback within an uptrend. Watch for the daily to stabilize before adding. Existing positions can be held with tighter stops.`;
  }

  if (isBullish(m) && !isBullish(w) && !isBullish(d)) {
    return `The monthly is still ${m.toLowerCase()} but both weekly (${w}) and daily (${d}) are deteriorating. A deeper correction may be underway, though the long-term structure remains positive. Reduce new buying, raise some cash, but don't panic sell — the monthly trend takes precedence for long-term positioning.`;
  }

  if (isBullish(m) && !isBullish(w) && isBullish(d)) {
    return `Mixed signals: the monthly is ${m.toLowerCase()} and the daily is ${d.toLowerCase()}, but the weekly is ${w.toLowerCase()}. The daily may be leading a recovery within a weekly pullback. Cautiously optimistic — small positions are reasonable but wait for weekly confirmation before sizing up.`;
  }

  // Monthly bearish, shorter-term improving
  if (!isBullish(m) && !isBullish(w) && isBullish(d)) {
    return `The monthly (${m}) and weekly (${w}) are both bearish, but the daily shows ${d.toLowerCase()} — likely a bear market rally. These bounces can be sharp but short-lived. If participating, keep sizes small and set tight stops. Don't mistake a counter-trend move for a new bull market.`;
  }

  if (!isBullish(m) && isBullish(w) && isBullish(d)) {
    return `Interesting divergence: the weekly and daily have turned bullish while the monthly remains ${m.toLowerCase()}. This could be the early stages of a structural shift — or a powerful bear-market rally. Build conviction slowly. If the monthly transitions to accumulation, it becomes a higher-confidence entry.`;
  }

  if (!isBullish(m) && isBullish(w) && !isBullish(d)) {
    return `The monthly is ${m.toLowerCase()}, the weekly is ${w.toLowerCase()}, but the daily is ${d.toLowerCase()}. A choppy, unclear environment. Avoid aggressive positioning. Wait for at least two of three timeframes to agree before making major allocation changes.`;
  }

  return 'Market signals are mixed across timeframes. Consider maintaining a balanced allocation and waiting for clearer directional signals across monthly, weekly, and daily before making major portfolio changes.';
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function fetchMarketCycle(): Promise<MarketCycleResult> {
  // Check result cache
  const cachedResult = localStorage.getItem(CACHE_KEY_RESULT);
  if (cachedResult) {
    try {
      const { ts, data } = JSON.parse(cachedResult);
      if (Date.now() - ts < DAILY_TTL) return data as MarketCycleResult;
    } catch { localStorage.removeItem(CACHE_KEY_RESULT); }
  }

  // Sequential fetch with delays to respect AV rate limit
  // Monthly fetched first (longest cache = rarely needs API call)
  const monthlyCached = getCachedCandles(CACHE_KEY_MONTHLY, MONTHLY_TTL, 200);
  const monthlyCandles = await fetchSPYMonthly();

  // Delay if monthly was a fresh fetch
  const weeklyCached = getCachedCandles(CACHE_KEY_WEEKLY, WEEKLY_TTL);
  if (!monthlyCached && !weeklyCached) {
    await sleep(AV_DELAY_MS);
  }
  const weeklyCandles = await fetchSPYWeekly();

  // Delay if weekly was a fresh fetch
  const dailyCached = getCachedCandles(CACHE_KEY_DAILY, DAILY_TTL);
  if (!weeklyCached && !dailyCached) {
    await sleep(AV_DELAY_MS);
  }
  const dailyCandles = await fetchSPYDaily();

  const daily = computeWyckoffPhase(dailyCandles);
  const weekly = computeWyckoffPhase(weeklyCandles);
  const monthly = computeWyckoffPhase(monthlyCandles);
  const { score, zone, label } = computeInvestmentReadiness(daily, weekly, monthly);
  const guidance = generateGuidance(daily, weekly, monthly);

  const result: MarketCycleResult = {
    daily,
    weekly,
    monthly,
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
      weekly: weeklyCandles.length,
      monthly: monthlyCandles.length,
    },
  };

  safeSetItem(CACHE_KEY_RESULT, JSON.stringify({ ts: Date.now(), data: result }));
  return result;
}
