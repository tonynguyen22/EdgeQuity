import type { FinancialData, DCFInputs, DCFResult } from '../types';
import { computeDCF } from '../calculations';

export interface MonteCarloConfig {
  numSimulations: number;
  revGrowthStdDev: number;  // percentage points
  ebitMarginStdDev: number;
  termGrowthStdDev: number;
  waccStdDev: number;
}

export interface MonteCarloResult {
  values: number[];
  mean: number;
  median: number;
  stdDev: number;
  percentiles: { p10: number; p25: number; p50: number; p75: number; p90: number };
  probabilityUndervalued: number;
  currentPrice: number;
  histogram: { bin: number; count: number }[];
}

function randomTriangular(min: number, mode: number, max: number): number {
  const u = Math.random();
  const fc = (mode - min) / (max - min);
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function clampVal(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function runMonteCarloSimulation(
  data: FinancialData,
  baseInputs: DCFInputs,
  config: MonteCarloConfig,
): MonteCarloResult {
  const values: number[] = [];
  let currentPrice = 0;

  for (let i = 0; i < config.numSimulations; i++) {
    const simInputs: DCFInputs = {
      ...baseInputs,
      revGrowthStart: clampVal(
        randomTriangular(
          baseInputs.revGrowthStart - config.revGrowthStdDev * 2,
          baseInputs.revGrowthStart,
          baseInputs.revGrowthStart + config.revGrowthStdDev * 2
        ),
        -30, 80
      ),
      revGrowthEnd: clampVal(
        randomTriangular(
          baseInputs.revGrowthEnd - config.revGrowthStdDev * 2,
          baseInputs.revGrowthEnd,
          baseInputs.revGrowthEnd + config.revGrowthStdDev * 2
        ),
        -20, 60
      ),
      ebitMarginStart: clampVal(
        randomTriangular(
          baseInputs.ebitMarginStart - config.ebitMarginStdDev * 2,
          baseInputs.ebitMarginStart,
          baseInputs.ebitMarginStart + config.ebitMarginStdDev * 2
        ),
        -50, 70
      ),
      ebitMarginEnd: clampVal(
        randomTriangular(
          baseInputs.ebitMarginEnd - config.ebitMarginStdDev * 2,
          baseInputs.ebitMarginEnd,
          baseInputs.ebitMarginEnd + config.ebitMarginStdDev * 2
        ),
        -50, 70
      ),
      termGrowth: clampVal(
        randomTriangular(
          baseInputs.termGrowth - config.termGrowthStdDev * 2,
          baseInputs.termGrowth,
          baseInputs.termGrowth + config.termGrowthStdDev * 2
        ),
        -2, 6
      ),
      waccAdj: clampVal(
        randomTriangular(
          baseInputs.waccAdj - config.waccStdDev * 2,
          baseInputs.waccAdj,
          baseInputs.waccAdj + config.waccStdDev * 2
        ),
        -3, 5
      ),
    };

    try {
      const result = computeDCF(data, simInputs);
      if (Number.isFinite(result.intrinsicValue) && result.intrinsicValue > 0 && result.intrinsicValue < 100000) {
        values.push(result.intrinsicValue);
        if (currentPrice === 0) currentPrice = result.currentPrice;
      }
    } catch {
      // Skip failed simulations
    }
  }

  values.sort((a, b) => a - b);

  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const median = percentile(values, 50);
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const probabilityUndervalued = currentPrice > 0
    ? values.filter(v => v > currentPrice).length / values.length
    : 0;

  // Build histogram
  const numBins = 30;
  const minVal = values[0];
  const maxVal = values[values.length - 1];
  const binWidth = (maxVal - minVal) / numBins || 1;
  const histogram: { bin: number; count: number }[] = [];
  for (let b = 0; b < numBins; b++) {
    const binStart = minVal + b * binWidth;
    const binEnd = binStart + binWidth;
    const count = values.filter(v => v >= binStart && (b === numBins - 1 ? v <= binEnd : v < binEnd)).length;
    histogram.push({ bin: Math.round(binStart), count });
  }

  return {
    values,
    mean,
    median,
    stdDev,
    percentiles: {
      p10: percentile(values, 10),
      p25: percentile(values, 25),
      p50: median,
      p75: percentile(values, 75),
      p90: percentile(values, 90),
    },
    probabilityUndervalued,
    currentPrice,
    histogram,
  };
}
