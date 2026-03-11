export type EarningsView = 'quarterly' | 'annual';

export interface AnnualEarningsRecord {
  fiscalYear: string;
  reportedEPS: number | null;
}

export interface EarningsRecord {
  actual: number | null;
  estimate: number | null;
  period: string;
  quarter: number;
  surprise: number | null;
  surprisePercent: number | null;
  symbol: string;
  year: number;
}

export interface EpsMomentum {
  recentAvg: number;
  priorAvg: number;
  delta: number;
  trend: 'Accelerating' | 'Stable' | 'Decelerating';
}

export interface QualityScore {
  score: number;
  label: string;
  avgSurprise: number;
  beatRate: number;
}
