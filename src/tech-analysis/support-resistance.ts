// ── Support & Resistance ─────────────────────────────────────────────────────

import { Candle, IndicatorResult, SupportResistanceLevel, EntryZone, SupportResistanceResult } from './types';

export function computePivotPoints(candles: Candle[]): SupportResistanceLevel[] {
  if (candles.length < 2) return [];
  const prev = candles[candles.length - 2];
  const pp = (prev.high + prev.low + prev.close) / 3;
  const s1 = 2 * pp - prev.high;
  const s2 = pp - (prev.high - prev.low);
  const s3 = prev.low - 2 * (prev.high - pp);
  const r1 = 2 * pp - prev.low;
  const r2 = pp + (prev.high - prev.low);
  const r3 = prev.high + 2 * (pp - prev.low);
  const currentPrice = candles[candles.length - 1].close;

  return [
    { price: r3, label: 'Pivot R3', type: r3 > currentPrice ? 'resistance' : 'support', source: 'pivot' },
    { price: r2, label: 'Pivot R2', type: r2 > currentPrice ? 'resistance' : 'support', source: 'pivot' },
    { price: r1, label: 'Pivot R1', type: r1 > currentPrice ? 'resistance' : 'support', source: 'pivot' },
    { price: pp, label: 'Pivot PP', type: pp > currentPrice ? 'resistance' : 'support', source: 'pivot' },
    { price: s1, label: 'Pivot S1', type: s1 > currentPrice ? 'resistance' : 'support', source: 'pivot' },
    { price: s2, label: 'Pivot S2', type: s2 > currentPrice ? 'resistance' : 'support', source: 'pivot' },
    { price: s3, label: 'Pivot S3', type: s3 > currentPrice ? 'resistance' : 'support', source: 'pivot' },
  ];
}

export function computeFibLevels(high: number, low: number, currentPrice: number): SupportResistanceLevel[] {
  if (high <= low) return [];
  const range = high - low;
  const levels = [
    { pct: 0, price: low },
    { pct: 23.6, price: low + 0.236 * range },
    { pct: 38.2, price: low + 0.382 * range },
    { pct: 50, price: low + 0.5 * range },
    { pct: 61.8, price: low + 0.618 * range },
    { pct: 78.6, price: low + 0.786 * range },
    { pct: 100, price: high },
  ];
  return levels.map(l => ({
    price: l.price,
    label: `Fib ${l.pct}%`,
    type: l.price > currentPrice ? 'resistance' as const : 'support' as const,
    source: 'fibonacci' as const,
  }));
}

export function detectSwingLevels(candles: Candle[], neighbors = 3): SupportResistanceLevel[] {
  if (candles.length < neighbors * 2 + 1) return [];
  const currentPrice = candles[candles.length - 1].close;
  const SIG_THRESHOLD = currentPrice * 0.015;

  const candidates: { level: SupportResistanceLevel; significance: number }[] = [];

  for (let i = neighbors; i < candles.length - neighbors; i++) {
    let isSwingHigh = true, isSwingLow = true;
    const neighborHighs: number[] = [];
    const neighborLows: number[] = [];

    for (let j = 1; j <= neighbors; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) isSwingHigh = false;
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) isSwingLow = false;
      neighborHighs.push(candles[i - j].high, candles[i + j].high);
      neighborLows.push(candles[i - j].low, candles[i + j].low);
    }

    if (isSwingHigh) {
      const avgNeighborHigh = neighborHighs.reduce((a, b) => a + b, 0) / neighborHighs.length;
      const significance = Math.abs(candles[i].high - avgNeighborHigh);
      if (significance > SIG_THRESHOLD) {
        candidates.push({
          level: {
            price: candles[i].high,
            label: `Swing High (${candles[i].date})`,
            type: candles[i].high > currentPrice ? 'resistance' : 'support',
            source: 'swing',
          },
          significance,
        });
      }
    }

    if (isSwingLow) {
      const avgNeighborLow = neighborLows.reduce((a, b) => a + b, 0) / neighborLows.length;
      const significance = Math.abs(candles[i].low - avgNeighborLow);
      if (significance > SIG_THRESHOLD) {
        candidates.push({
          level: {
            price: candles[i].low,
            label: `Swing Low (${candles[i].date})`,
            type: candles[i].low > currentPrice ? 'resistance' : 'support',
            source: 'swing',
          },
          significance,
        });
      }
    }
  }

  // Keep only the most significant swings, then dedup
  candidates.sort((a, b) => b.significance - a.significance);
  const top6 = candidates.slice(0, 6).map(c => c.level);

  top6.sort((a, b) => a.price - b.price);
  const deduped: SupportResistanceLevel[] = [];
  for (const l of top6) {
    if (deduped.length === 0 || Math.abs(l.price - deduped[deduped.length - 1].price) / currentPrice > 0.005) {
      deduped.push(l);
    }
  }
  return deduped;
}

function addSMALevels(ind: IndicatorResult): SupportResistanceLevel[] {
  const levels: SupportResistanceLevel[] = [];
  const p = ind.close;
  if (ind.sma20)  levels.push({ price: ind.sma20,  label: 'SMA 20',  type: ind.sma20 > p ? 'resistance' : 'support', source: 'sma' });
  if (ind.sma50)  levels.push({ price: ind.sma50,  label: 'SMA 50',  type: ind.sma50 > p ? 'resistance' : 'support', source: 'sma' });
  if (ind.sma200) levels.push({ price: ind.sma200, label: 'SMA 200', type: ind.sma200 > p ? 'resistance' : 'support', source: 'sma' });
  return levels;
}

function addBBLevels(ind: IndicatorResult): SupportResistanceLevel[] {
  const levels: SupportResistanceLevel[] = [];
  const p = ind.close;
  if (ind.bbUpper) levels.push({ price: ind.bbUpper, label: 'BB Upper', type: ind.bbUpper > p ? 'resistance' : 'support', source: 'bollinger' });
  if (ind.bbMid)   levels.push({ price: ind.bbMid,   label: 'BB Mid',   type: ind.bbMid > p ? 'resistance' : 'support', source: 'bollinger' });
  if (ind.bbLower) levels.push({ price: ind.bbLower, label: 'BB Lower', type: ind.bbLower > p ? 'resistance' : 'support', source: 'bollinger' });
  return levels;
}

export function identifyEntryZones(
  levels: SupportResistanceLevel[],
  currentPrice: number,
): EntryZone[] {
  // Only consider supports within 30% below current price
  const MIN_PRICE = currentPrice * 0.70;
  const supports = levels
    .filter(l => l.type === 'support' && l.price < currentPrice && l.price > MIN_PRICE)
    .sort((a, b) => b.price - a.price);

  if (supports.length === 0) return [];

  // Cluster nearby levels within 1.5% tolerance
  const CLUSTER_TOLERANCE = currentPrice * 0.015;
  const clusters: { center: number; levels: SupportResistanceLevel[] }[] = [];

  for (const s of supports) {
    const existing = clusters.find(c => Math.abs(c.center - s.price) < CLUSTER_TOLERANCE);
    if (existing) {
      existing.levels.push(s);
      existing.center = existing.levels.reduce((sum, l) => sum + l.price, 0) / existing.levels.length;
    } else {
      clusters.push({ center: s.price, levels: [s] });
    }
  }

  // Compute tight zone range for each cluster
  const MAX_ZONE_WIDTH = currentPrice * 0.025;
  const SINGLE_LEVEL_BAND = currentPrice * 0.0075;

  const zonesWithRanges = clusters.map(cluster => {
    const prices = cluster.levels.map(l => l.price);
    let low = Math.min(...prices);
    let high = Math.max(...prices);

    if (prices.length === 1) {
      low = prices[0] - SINGLE_LEVEL_BAND;
      high = prices[0] + SINGLE_LEVEL_BAND;
    }

    // Cap zone width at 2.5% of current price
    if (high - low > MAX_ZONE_WIDTH) {
      const center = (low + high) / 2;
      low = center - MAX_ZONE_WIDTH / 2;
      high = center + MAX_ZONE_WIDTH / 2;
    }

    high = Math.min(high, currentPrice * 0.999);
    low = Math.max(low, 0.01);

    return { ...cluster, low, high };
  });

  // Sort by proximity to current price (closest first)
  zonesWithRanges.sort((a, b) => b.center - a.center);

  // Select up to 3 zones with at least 4% center-to-center separation
  const MIN_SEPARATION = currentPrice * 0.04;
  const selected: typeof zonesWithRanges = [];

  for (const zone of zonesWithRanges) {
    const tooClose = selected.some(s => Math.abs(s.center - zone.center) < MIN_SEPARATION);
    if (!tooClose) {
      selected.push(zone);
      if (selected.length === 3) break;
    }
  }

  const LABELS: EntryZone['label'][] = ['Short-term Entry', 'Medium-term Entry', 'Long-term Entry'];

  return selected.map((zone, i): EntryZone => ({
    low: zone.low,
    high: zone.high,
    confluenceCount: zone.levels.length,
    levels: zone.levels,
    strength: zone.levels.length >= 3 ? 'strong' : zone.levels.length >= 2 ? 'moderate' : 'weak',
    label: LABELS[i],
  }));
}

export function computeSupportResistance(
  dailyCandles: Candle[],
  weeklyCandles: Candle[],
  dailyInd: IndicatorResult,
): SupportResistanceResult {
  const currentPrice = dailyInd.close;
  const allLevels: SupportResistanceLevel[] = [];

  // Weekly-primary: pivots, swings, and Fibonacci from weekly candles
  allLevels.push(...computePivotPoints(weeklyCandles));
  allLevels.push(...detectSwingLevels(weeklyCandles, 3));
  allLevels.push(...computeFibLevels(dailyInd.high52w, dailyInd.low52w, currentPrice));

  // Supplementary: daily SMA and Bollinger Band levels
  allLevels.push(...addSMALevels(dailyInd));
  allLevels.push(...addBBLevels(dailyInd));

  allLevels.sort((a, b) => a.price - b.price);
  const deduped: SupportResistanceLevel[] = [];
  for (const l of allLevels) {
    if (l.price <= 0) continue;
    if (deduped.length === 0 || Math.abs(l.price - deduped[deduped.length - 1].price) / currentPrice > 0.005) {
      deduped.push(l);
    }
  }

  const entryZones = identifyEntryZones(deduped, currentPrice);
  return { levels: deduped, entryZones, currentPrice };
}
