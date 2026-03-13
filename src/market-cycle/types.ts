export type WyckoffPhase = 'Accumulation' | 'Mark-Up' | 'Distribution' | 'Mark-Down';

export type ReadinessZone = 'strong-buy' | 'neutral' | 'defensive';

export type Timeframe = 'daily' | 'weekly' | 'monthly';

export interface TimeframeResult {
  phase: WyckoffPhase;
  confidence: number;
  probabilities: Record<WyckoffPhase, number>;
}

export interface MarketCycleResult {
  daily: TimeframeResult;
  weekly: TimeframeResult;
  monthly: TimeframeResult;
  readinessScore: number;
  readinessZone: ReadinessZone;
  readinessLabel: string;
  guidance: string;
  dataRange: { from: string; to: string };
  candleCount: { daily: number; weekly: number; monthly: number };
}
