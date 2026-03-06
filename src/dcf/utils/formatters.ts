export const parseNum = (val: any): number => {
  if (val === 'None' || val === null || val === undefined || val === '0') return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCurrency = (val: number) => {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  if (absVal >= 1e9) return `${isNegative ? '-' : ''}$${(absVal / 1e9).toFixed(2)}B`;
  if (absVal >= 1e6) return `${isNegative ? '-' : ''}$${(absVal / 1e6).toFixed(2)}M`;
  return `${isNegative ? '-' : ''}$${absVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export const formatModelCurrency = (val: number, unit: 'M' | 'B' = 'M') => {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const divisor = unit === 'B' ? 1e9 : 1e6;
  return `${isNegative ? '-' : ''}$${(absVal / divisor).toFixed(2)}${unit}`;
};

export const formatModelNumber = (val: number, unit: 'M' | 'B' = 'M') => {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const divisor = unit === 'B' ? 1e9 : 1e6;
  return `${isNegative ? '-' : ''}${(absVal / divisor).toFixed(2)}${unit}`;
};

export const formatPct = (val: number) => `${(val * 100).toFixed(2)}%`;
