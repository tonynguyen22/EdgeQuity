export interface DividendPayment {
  date: string;
  exDate: string;
  amount: number;
  payDate: string;
  type: string;
}

export interface DividendMetrics {
  dividendYieldIndicatedAnnual?: number;
  dividendsPerShareAnnual?: number;
  payoutRatioAnnual?: number;
  payoutRatioTTM?: number;
  epsBasicExclExtraItemsTTM?: number;
  epsNormalizedAnnual?: number;
  freeCashFlowTTM?: number;
  fcfTTM?: number;
  sharesOutstanding?: number;
  shareOutstanding?: number;
  dividendGrowthRate5Y?: number;
  currentDividendYieldTTM?: number;
  dividendPerShareTTM?: number;
  peTTM?: number;
  beta?: number;
  marketCapitalization?: number;
  [key: string]: number | undefined;
}

export interface DividendData {
  payments: DividendPayment[];
  metrics: DividendMetrics;
  currentPrice: number;
  fcfTTM: number | null;
}

export interface SafetyInfo {
  label: string;
  grade: string;
  color: string;
  icon: React.ElementType;
  desc: string;
}

export interface StreakBadge {
  label: string;
  color: string;
  desc: string;
}
