export const fmtYear = (fiscalYear: string): string => fiscalYear || '-';

export const fmtQuarter = (period: string, quarter: number, year: number): string => {
  if (quarter && year) return `Q${quarter} ${year}`;
  if (!period) return '-';
  const d = new Date(period);
  if (isNaN(d.getTime())) return period;
  return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
};
