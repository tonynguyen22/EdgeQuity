export interface DDMInputs {
  currentDividend: number;       // Current annual dividend per share
  shortTermGrowth: number;       // Short-term dividend growth rate (%)
  terminalGrowth: number;        // Long-term/terminal growth rate (%)
  costOfEquity: number;          // Required rate of return (%)
  highGrowthYears: number;       // Years of high growth (for H-Model and Multi-Stage)
  modelType: 'gordon' | 'hmodel' | 'multistage';
}

export interface DDMResult {
  intrinsicValue: number;
  currentPrice: number;
  upside: number;
  impliedYield: number;
  dividendStream: { year: string; dividend: number; pv: number }[];
  terminalValue: number;
  pvTerminalValue: number;
  pvDividends: number;
  modelLabel: string;
}

export interface DDMSensitivityCell {
  growth: number;
  coe: number;
  value: number | null;
}
