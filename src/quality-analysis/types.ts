export type LetterGrade = 'A' | 'B' | 'C' | 'D';

export interface MetricResult {
  name: string;
  value: number;
  formattedValue: string;
  grade: LetterGrade;
  trend: 'improving' | 'stable' | 'declining';
}

export interface CategoryResult {
  name: string;
  iconKey: string;
  weight: number;
  grade: LetterGrade;
  score: number;
  metrics: MetricResult[];
}

export interface GradeResult {
  rawCategories: CategoryResult[];
  overallGrade: LetterGrade;
  overallScore: number;
  summary: string;
}

export interface YearGrade {
  year: string;
  health: LetterGrade;
  prof: LetterGrade;
  growth: LetterGrade;
  cf: LetterGrade;
  overall: LetterGrade;
  score: number;
}

export interface AltmanZResult {
  z: number;
  zone: 'safe' | 'grey' | 'distress';
}

export interface PiotroskiSignal {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PiotroskiResult {
  score: number;
  signals: PiotroskiSignal[];
}

export interface DuPontYear {
  year: string;
  netMargin: number;
  assetTurnover: number;
  equityMultiplier: number;
  roe: number;
}

export interface WorkingCapitalYear {
  year: string;
  dso: number | null;
  dio: number | null;
  dpo: number | null;
  ccc: number | null;
}

export interface EarningsQualityResult {
  score: number;
  label: string;
  trend: { year: string; accruals: number }[];
  interpretation: string;
  latest: number;
}

export interface HistoricalYear {
  year: string;
  rev: number;
  revGrowth: number;
  gp: number;
  cogs: number;
  grossMargin: number;
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  netProfitMargin: number;
  eps: number;
  epsGrowth: number | null;
  currentRatio: number;
  quickRatio: number;
  interestCoverage: number;
  debtToEquity: number;
  roe: number;
  roa: number;
  cfo: number;
  capex: number;
  ebit: number;
  totalAssets: number;
  totalEquity: number;
  currentAssets: number;
  currentLiabilities: number;
  longTermDebt: number;
  shares: number;
  netReceivables: number;
  accountsPayable: number;
  retainedEarnings: number;
  totalLiabilities: number;
  inventory: number;
}

export interface QualityData {
  incomeStatements: any[];
  balanceSheets: any[];
  cashFlows: any[];
  profile: any;
  metrics: any;
}
