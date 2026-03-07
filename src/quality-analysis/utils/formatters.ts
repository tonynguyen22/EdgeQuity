export const parseNum = (val: any): number => {
  if (val === 'None' || val === null || val === undefined || val === '0') return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};
