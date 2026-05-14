export function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function ratio(numerator: unknown, denominator: unknown): number | null {
  const normalizedNumerator = normalizeNumber(numerator);
  const normalizedDenominator = normalizeNumber(denominator);

  if (normalizedNumerator === null || normalizedDenominator === null || normalizedDenominator === 0) {
    return null;
  }

  return normalizedNumerator / normalizedDenominator;
}

export function cagr(start: unknown, end: unknown, years: unknown): number | null {
  const normalizedStart = normalizeNumber(start);
  const normalizedEnd = normalizeNumber(end);
  const normalizedYears = normalizeNumber(years);

  if (
    normalizedStart === null ||
    normalizedEnd === null ||
    normalizedYears === null ||
    normalizedStart <= 0 ||
    normalizedEnd <= 0 ||
    normalizedYears <= 0
  ) {
    return null;
  }

  return Math.pow(normalizedEnd / normalizedStart, 1 / normalizedYears) - 1;
}

export function absNumber(value: unknown): number | null {
  const normalizedValue = normalizeNumber(value);

  return normalizedValue === null ? null : Math.abs(normalizedValue);
}
