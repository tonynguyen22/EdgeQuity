export type WyckoffPhase = 'Accumulation' | 'Mark-Up' | 'Distribution' | 'Mark-Down';

export interface MarketCycleResult {
  phase: WyckoffPhase;
  confidence: number;
  probabilities: Record<WyckoffPhase, number>;
  dataRange: { from: string; to: string };
  candleCount: number;
}
