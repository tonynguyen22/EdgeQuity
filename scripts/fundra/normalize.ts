import type { FundraStockRecord } from "../../src/fundra/types.ts";

type RawObject = Record<string, unknown>;

export type RawFundraPayload = {
  ticker: string;
  profile: RawObject;
  metrics: RawObject;
  incomeStatements: RawObject[];
  balanceSheets: RawObject[];
  cashFlows: RawObject[];
};

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

function normalizeRatioPercent(value: unknown): number | null {
  const normalizedValue = normalizeNumber(value);

  if (normalizedValue === null) return null;

  return Math.abs(normalizedValue) > 1 ? normalizedValue / 100 : normalizedValue;
}

function normalizeDividendYield(value: unknown): number | null {
  const normalizedValue = normalizeNumber(value);

  if (normalizedValue === null) return null;

  return Math.abs(normalizedValue) > 0.1 ? normalizedValue / 100 : normalizedValue;
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const normalizedValue = normalizeNumber(value);
    if (normalizedValue !== null) return normalizedValue;
  }

  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalizedValue = normalizeString(value);
    if (normalizedValue !== null) return normalizedValue;
  }

  return null;
}

function firstRatioPercent(...values: unknown[]): number | null {
  for (const value of values) {
    const normalizedValue = normalizeRatioPercent(value);
    if (normalizedValue !== null) return normalizedValue;
  }

  return null;
}

function firstDividendYield(...values: unknown[]): number | null {
  for (const value of values) {
    const normalizedValue = normalizeDividendYield(value);
    if (normalizedValue !== null) return normalizedValue;
  }

  return null;
}

function metricObject(metrics: RawObject): RawObject {
  const nestedMetric = metrics.metric;
  return nestedMetric && typeof nestedMetric === "object" && !Array.isArray(nestedMetric)
    ? (nestedMetric as RawObject)
    : metrics;
}

function normalizeMarketCap(profile: RawObject): number | null {
  const marketCapitalization = normalizeNumber(profile.marketCapitalization);
  if (marketCapitalization !== null) return marketCapitalization * 1_000_000;

  return normalizeNumber(profile.mktCap);
}

function normalizeHistory(raw: RawFundraPayload): FundraStockRecord["history"] {
  return raw.incomeStatements.map((income, index) => {
    const balance = raw.balanceSheets[index] ?? {};
    const cashFlow = raw.cashFlows[index] ?? {};
    const year = firstString(income.fiscalYear, income.calendarYear, income.date) ?? "";

    return {
      year,
      revenue: normalizeNumber(income.revenue),
      grossProfit: normalizeNumber(income.grossProfit),
      operatingIncome: firstNumber(income.operatingIncome, income.ebit),
      netIncome: normalizeNumber(income.netIncome),
      freeCashFlow: normalizeNumber(cashFlow.freeCashFlow),
      totalAssets: normalizeNumber(balance.totalAssets),
      totalDebt: normalizeNumber(balance.totalDebt),
      totalEquity: firstNumber(balance.totalStockholdersEquity, balance.totalEquity),
      sharesDiluted: normalizeNumber(income.weightedAverageShsOutDil),
    };
  });
}

function growthFromHistory(
  history: FundraStockRecord["history"],
  key: "revenue" | "freeCashFlow",
  years: 3 | 5,
): number | null {
  const latest = history[0];
  const oldest = history[years] ?? history[years - 1];

  return latest && oldest ? cagr(oldest[key], latest[key], years) : null;
}

function epsCagr3y(incomeStatements: RawObject[]): number | null {
  const latest = incomeStatements[0];
  const oldest = incomeStatements[3] ?? incomeStatements[2];

  return latest && oldest ? cagr(oldest.epsdiluted, latest.epsdiluted, 3) : null;
}

export function buildWarnings(record: {
  peTTM: number | null;
  marketCap: number | null;
  historyLength: number;
}): string[] {
  const warnings: string[] = [];

  if (record.peTTM === null) warnings.push("P/E unavailable");
  if (record.marketCap === null) warnings.push("Market cap unavailable");
  if (record.historyLength < 3) warnings.push("Less than three years of financial history");

  return warnings;
}

export function normalizeFundraRecord(raw: RawFundraPayload): FundraStockRecord {
  const latestIncome = raw.incomeStatements[0] ?? {};
  const latestBalance = raw.balanceSheets[0] ?? {};
  const latestCashFlow = raw.cashFlows[0] ?? {};
  const metric = metricObject(raw.metrics);

  const revenue = normalizeNumber(latestIncome.revenue);
  const grossProfit = normalizeNumber(latestIncome.grossProfit);
  const operatingIncome = firstNumber(latestIncome.operatingIncome, latestIncome.ebit);
  const netIncome = normalizeNumber(latestIncome.netIncome);
  const ebitda = normalizeNumber(latestIncome.ebitda);
  const totalAssets = normalizeNumber(latestBalance.totalAssets);
  const totalDebt = normalizeNumber(latestBalance.totalDebt);
  const totalEquity = firstNumber(latestBalance.totalStockholdersEquity, latestBalance.totalEquity);
  const cash = normalizeNumber(latestBalance.cashAndCashEquivalents);
  const operatingCashFlow = normalizeNumber(latestCashFlow.operatingCashFlow);
  const freeCashFlow = normalizeNumber(latestCashFlow.freeCashFlow);
  const capex = absNumber(latestCashFlow.capitalExpenditure);
  const marketCap = normalizeMarketCap(raw.profile);
  const enterpriseValue =
    marketCap !== null && totalDebt !== null ? marketCap + totalDebt - (cash ?? 0) : firstNumber(metric.enterpriseValue, metric.enterpriseValueTTM);
  const peTTM = firstNumber(metric.peTTM, metric.peNormalizedAnnual);
  const history = normalizeHistory(raw);

  return {
    ticker: raw.ticker,
    name: firstString(raw.profile.name, raw.profile.companyName) ?? raw.ticker,
    sector: firstString(raw.profile.sector, raw.profile.gicsSector, raw.profile.finnhubIndustry),
    industry: firstString(raw.profile.industry, raw.profile.finnhubIndustry),
    currency: firstString(raw.profile.currency),
    price: firstNumber(raw.profile.price, metric.currentPrice, metric.currentPriceEstimate),
    marketCap,
    enterpriseValue,
    valuation: {
      peTTM,
      forwardPE: normalizeNumber(metric.forwardPE),
      psTTM: firstNumber(metric.psTTM, metric.psAnnual),
      pb: firstNumber(metric.pbAnnual, metric.pbQuarterly),
      evRevenue: firstNumber(metric.evToRevenueAnnual, metric.evToRevenueTTM, ratio(enterpriseValue, revenue)),
      evEbitda: firstNumber(metric.evToEbitdaAnnual, metric.evToEbitdaTTM, ratio(enterpriseValue, ebitda)),
      pfcf: ratio(marketCap, freeCashFlow),
      fcfYield: ratio(freeCashFlow, marketCap),
      earningsYield: ratio(netIncome, marketCap),
    },
    profitability: {
      grossMargin: firstNumber(firstRatioPercent(metric.grossMarginAnnual, metric.grossMarginTTM), ratio(grossProfit, revenue)),
      operatingMargin: firstNumber(firstRatioPercent(metric.operatingMarginAnnual, metric.operatingMarginTTM), ratio(operatingIncome, revenue)),
      netMargin: firstNumber(firstRatioPercent(metric.netProfitMarginAnnual, metric.netProfitMarginTTM), ratio(netIncome, revenue)),
      roe: firstNumber(firstRatioPercent(metric.returnOnEquityAnnual, metric.roeTTM), ratio(netIncome, totalEquity)),
      roa: firstNumber(firstRatioPercent(metric.returnOnAssetsAnnual, metric.roaTTM), ratio(netIncome, totalAssets)),
      roic: firstRatioPercent(metric.returnOnInvestedCapitalAnnual, metric.roicTTM),
    },
    growth: {
      revenueCagr3y: growthFromHistory(history, "revenue", 3),
      revenueCagr5y: growthFromHistory(history, "revenue", 5),
      epsCagr3y: firstNumber(firstRatioPercent(metric.epsGrowth3Y), epsCagr3y(raw.incomeStatements)),
      fcfCagr3y: growthFromHistory(history, "freeCashFlow", 3),
    },
    financialHealth: {
      currentRatio: firstNumber(metric.currentRatioAnnual, metric.currentRatioQuarterly),
      quickRatio: firstNumber(metric.quickRatioAnnual, metric.quickRatioQuarterly),
      debtToEquity: firstNumber(metric.totalDebtToEquityAnnual, metric.totalDebtToEquityQuarterly, ratio(totalDebt, totalEquity)),
      netDebtToEbitda: firstNumber(
        metric.netDebtToEbitdaAnnual,
        metric.netDebtToEbitdaTTM,
        totalDebt !== null && ebitda !== null ? ratio(totalDebt - (cash ?? 0), ebitda) : null,
      ),
      interestCoverage: firstNumber(metric.interestCoverageAnnual, metric.interestCoverageTTM),
    },
    cashFlow: {
      operatingCashFlow,
      freeCashFlow,
      fcfMargin: ratio(freeCashFlow, revenue),
      capexToRevenue: ratio(capex, revenue),
      fcfConversion: ratio(freeCashFlow, netIncome),
    },
    dividends: {
      dividendYield: firstDividendYield(metric.dividendYieldIndicatedAnnual, metric.currentDividendYieldTTM, metric.dividendYieldTTM),
      payoutRatio: firstRatioPercent(metric.payoutRatioAnnual, metric.payoutRatioTTM),
    },
    history,
    warnings: buildWarnings({ peTTM, marketCap, historyLength: history.length }),
  };
}
