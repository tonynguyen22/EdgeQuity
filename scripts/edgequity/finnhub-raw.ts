import type { EdgequityStockRecord } from "../../src/edgequity/types.ts";

type RawObject = Record<string, unknown>;

export interface FinnhubSymbol {
  symbol?: string;
  displaySymbol?: string;
  description?: string;
  type?: string;
  currency?: string;
  mic?: string;
}

export interface EdgequityUniverseStock {
  ticker: string;
  name: string;
  currency: string | null;
  exchangeMic: string | null;
  type: string | null;
  source: "finnhub:stock/symbol";
}

export interface FinnhubReportedLineItem {
  concept?: string;
  unit?: string;
  label?: string;
  value?: unknown;
}

export interface FinnhubReportedFiling {
  accessNumber?: string;
  symbol?: string;
  cik?: string;
  year?: number;
  quarter?: number;
  form?: string;
  startDate?: string;
  endDate?: string;
  filedDate?: string;
  acceptedDate?: string;
  report?: {
    ic?: FinnhubReportedLineItem[];
    bs?: FinnhubReportedLineItem[];
    cf?: FinnhubReportedLineItem[];
  };
}

export interface FinnhubReportedFinancials {
  symbol?: string;
  cik?: string;
  data?: FinnhubReportedFiling[];
}

export interface FinnhubThinInput {
  ticker: string;
  profile: RawObject;
  metrics: RawObject;
  reported: FinnhubReportedFinancials;
  sourceFetchedAt: string;
  marketCapUsdOverride?: number | null;
}

export interface MappedLineItems {
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  totalAssets: number | null;
  totalDebt: number | null;
  totalEquity: number | null;
  sharesDiluted: number | null;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  freeCashFlow: number | null;
  cashAndEquivalents: number | null;
}

const COMMON_STOCK_TYPES = new Set(["common stock"]);
const MAJOR_US_EQUITY_MICS = new Set(["XNYS", "XNAS", "XASE", "ARCX"]);
const EXCLUDED_TYPES = ["etf", "fund", "warrant", "unit", "preferred", "right", "note", "bond"];
const EXCLUDED_SYMBOL_PATTERNS = [
  /\bWS\b/i,
  /\bWT\b/i,
  /\bW\b/i,
  /\bU\b/i,
  /\bRT\b/i,
  /\bPR\b/i,
  /\bP[A-Z]$/i,
];

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeProviderPercentPoints(value: unknown): number | null {
  const normalized = normalizeNumber(value);
  if (normalized === null) return null;
  return Math.abs(normalized) > 1 ? normalized / 100 : normalized;
}

function normalizeProviderYieldPercentPoints(value: unknown): number | null {
  const normalized = normalizeNumber(value);
  if (normalized === null) return null;
  return Math.abs(normalized) > 0.05 ? normalized / 100 : normalized;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const normalized = normalizeNumber(value);
    if (normalized !== null) return normalized;
  }

  return null;
}

function firstProviderPercentPoints(...values: unknown[]): number | null {
  for (const value of values) {
    const normalized = normalizeProviderPercentPoints(value);
    if (normalized !== null) return normalized;
  }

  return null;
}

function firstProviderYieldPercentPoints(...values: unknown[]): number | null {
  for (const value of values) {
    const normalized = normalizeProviderYieldPercentPoints(value);
    if (normalized !== null) return normalized;
  }

  return null;
}

function metricObject(metrics: RawObject): RawObject {
  const nestedMetric = metrics.metric;
  return nestedMetric && typeof nestedMetric === "object" && !Array.isArray(nestedMetric)
    ? (nestedMetric as RawObject)
    : metrics;
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

function isCleanTickerSymbol(symbol: string): boolean {
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) return false;
  return !EXCLUDED_SYMBOL_PATTERNS.some((pattern) => pattern.test(symbol.replace(/[.-]/g, " ")));
}

function isCommonStock(symbol: FinnhubSymbol): boolean {
  const ticker = normalizeString(symbol.symbol ?? symbol.displaySymbol);
  const type = normalizeString(symbol.type)?.toLowerCase() ?? "";
  const mic = normalizeString(symbol.mic);

  if (ticker === null || !isCleanTickerSymbol(ticker)) return false;
  if (mic !== null && !MAJOR_US_EQUITY_MICS.has(mic)) return false;
  if (EXCLUDED_TYPES.some((excludedType) => type.includes(excludedType))) return false;
  if (!COMMON_STOCK_TYPES.has(type)) return false;

  return true;
}

export function buildUniverseFromFinnhubSymbols(symbols: FinnhubSymbol[], limit = 500): EdgequityUniverseStock[] {
  const seenTickers = new Set<string>();
  const universe: EdgequityUniverseStock[] = [];

  for (const symbol of symbols) {
    if (!isCommonStock(symbol)) continue;

    const ticker = normalizeString(symbol.symbol ?? symbol.displaySymbol)?.toUpperCase();
    if (!ticker || seenTickers.has(ticker)) continue;

    seenTickers.add(ticker);
    universe.push({
      ticker,
      name: normalizeString(symbol.description) ?? ticker,
      currency: normalizeString(symbol.currency),
      exchangeMic: normalizeString(symbol.mic),
      type: normalizeString(symbol.type),
      source: "finnhub:stock/symbol",
    });
  }

  return universe
    .sort((a, b) => a.ticker.localeCompare(b.ticker))
    .slice(0, limit);
}

function findLineValue(
  lineItems: FinnhubReportedLineItem[],
  conceptPatterns: RegExp[],
  labelPatterns: RegExp[] = [],
): number | null {
  for (const item of lineItems) {
    const concept = normalizeString(item.concept) ?? "";
    if (conceptPatterns.some((pattern) => pattern.test(concept))) {
      const value = normalizeNumber(item.value);
      if (value !== null) return value;
    }
  }

  for (const item of lineItems) {
    const label = normalizeString(item.label) ?? "";
    if (labelPatterns.some((pattern) => pattern.test(label))) {
      const value = normalizeNumber(item.value);
      if (value !== null) return value;
    }
  }

  return null;
}

function sumNullable(...values: Array<number | null>): number | null {
  const presentValues = values.filter((value): value is number => value !== null);
  return presentValues.length === 0 ? null : presentValues.reduce((sum, value) => sum + value, 0);
}

export function lineItemsToObject(
  incomeStatement: FinnhubReportedLineItem[] = [],
  balanceSheet: FinnhubReportedLineItem[] = [],
  cashFlow: FinnhubReportedLineItem[] = [],
): MappedLineItems {
  const revenue = findLineValue(incomeStatement, [
    /RevenueFromContractWithCustomer/i,
    /Revenues$/i,
    /SalesRevenueNet/i,
  ], [/^(net )?(sales|revenue)$/i]);
  const grossProfit = findLineValue(incomeStatement, [/GrossProfit/i], [/gross (profit|margin)/i]);
  const operatingIncome = findLineValue(incomeStatement, [/OperatingIncomeLoss/i], [/operating income/i]);
  const netIncome = findLineValue(incomeStatement, [/NetIncomeLoss/i, /ProfitLoss/i], [/net income/i]);
  const sharesDiluted = findLineValue(incomeStatement, [
    /WeightedAverageNumberOfDilutedSharesOutstanding/i,
    /WeightedAverageDilutedSharesOutstanding/i,
  ], [/diluted.*shares/i]);

  const totalAssets = findLineValue(balanceSheet, [/Assets$/i], [/total assets/i]);
  const debtCurrent = findLineValue(balanceSheet, [/ShortTermBorrowings/i, /LongTermDebtCurrent/i], [/current.*debt/i]);
  const debtNonCurrent = findLineValue(balanceSheet, [/LongTermDebtNoncurrent/i], [/long.term debt/i, /term debt/i]);
  const totalDebt = findLineValue(balanceSheet, [/DebtCurrentAndNoncurrent/i, /LongTermDebtAndFinanceLeaseObligations/i], [/total debt/i])
    ?? sumNullable(debtCurrent, debtNonCurrent);
  const totalEquity = findLineValue(balanceSheet, [/StockholdersEquity/i, /StockholdersEquityIncludingPortionAttributable/i], [/shareholders'? equity/i, /stockholders'? equity/i]);
  const cashAndEquivalents = findLineValue(balanceSheet, [/CashAndCashEquivalentsAtCarryingValue/i], [/cash and cash equivalents/i]);

  const operatingCashFlow = findLineValue(cashFlow, [/NetCashProvidedByUsedInOperatingActivities/i], [/operating activities/i]);
  const capexPayment = findLineValue(cashFlow, [
    /PaymentsToAcquirePropertyPlantAndEquipment/i,
    /PaymentsToAcquireProductiveAssets/i,
  ], [/payments.*property/i, /capital expenditures/i]);
  const capex = capexPayment === null ? null : Math.abs(capexPayment);
  const freeCashFlow = operatingCashFlow !== null && capex !== null ? operatingCashFlow - capex : null;

  return {
    revenue,
    grossProfit,
    operatingIncome,
    netIncome,
    totalAssets,
    totalDebt,
    totalEquity,
    sharesDiluted,
    operatingCashFlow,
    capitalExpenditure: capex,
    freeCashFlow,
    cashAndEquivalents,
  };
}

function latestAnnualFiling(reported: FinnhubReportedFinancials): FinnhubReportedFiling | null {
  const filings = reported.data ?? [];
  return filings.find((filing) => filing.form === "10-K" || filing.form === "20-F" || filing.quarter === 0) ?? filings[0] ?? null;
}

function yearLabel(filing: FinnhubReportedFiling | null): string {
  if (typeof filing?.year === "number") return String(filing.year);
  return normalizeString(filing?.endDate)?.slice(0, 4) ?? "";
}

function buildWarningsFromThinSummary(mapped: MappedLineItems, hasFiling: boolean): string[] {
  const warnings = ["Thin summary mapped from Finnhub as-reported line items"];

  if (!hasFiling) warnings.push("Finnhub as-reported financial filing unavailable");
  if (mapped.revenue === null) warnings.push("Revenue unavailable from mapped line items");
  if (mapped.freeCashFlow === null) warnings.push("Free cash flow unavailable from mapped line items");
  if (mapped.totalAssets === null) warnings.push("Total assets unavailable from mapped line items");

  return warnings;
}

export function buildThinStockRecordFromFinnhub(input: FinnhubThinInput): EdgequityStockRecord {
  const latestFiling = latestAnnualFiling(input.reported);
  const report = latestFiling?.report ?? {};
  const mapped = lineItemsToObject(report.ic, report.bs, report.cf);
  const metric = metricObject(input.metrics);
  const marketCapitalization = normalizeNumber(input.profile.marketCapitalization);
  const marketCap = input.marketCapUsdOverride ?? (marketCapitalization !== null ? marketCapitalization * 1_000_000 : firstNumber(input.profile.mktCap));
  const enterpriseValue = marketCap !== null && mapped.totalDebt !== null
    ? marketCap + mapped.totalDebt - (mapped.cashAndEquivalents ?? 0)
    : firstNumber(metric.enterpriseValue, metric.enterpriseValueTTM);

  return {
    ticker: input.ticker,
    name: normalizeString(input.profile.name) ?? normalizeString(input.profile.companyName) ?? input.ticker,
    sector: normalizeString(input.profile.sector) ?? normalizeString(input.profile.gicsSector) ?? normalizeString(input.profile.finnhubIndustry),
    industry: normalizeString(input.profile.industry) ?? normalizeString(input.profile.finnhubIndustry),
    currency: normalizeString(input.profile.currency),
    price: firstNumber(input.profile.price, metric.currentPrice, metric.currentPriceEstimate),
    marketCap,
    enterpriseValue,
    valuation: {
      peTTM: firstNumber(metric.peTTM, metric.peNormalizedAnnual),
      forwardPE: normalizeNumber(metric.forwardPE),
      psTTM: firstNumber(metric.psTTM, metric.psAnnual),
      pb: firstNumber(metric.pbAnnual, metric.pbQuarterly),
      evRevenue: firstNumber(metric.evToRevenueAnnual, metric.evToRevenueTTM, ratio(enterpriseValue, mapped.revenue)),
      evEbitda: firstNumber(metric.evToEbitdaAnnual, metric.evToEbitdaTTM),
      pfcf: ratio(marketCap, mapped.freeCashFlow),
      fcfYield: ratio(mapped.freeCashFlow, marketCap),
      earningsYield: ratio(mapped.netIncome, marketCap),
    },
    profitability: {
      grossMargin: ratio(mapped.grossProfit, mapped.revenue),
      operatingMargin: ratio(mapped.operatingIncome, mapped.revenue),
      netMargin: ratio(mapped.netIncome, mapped.revenue),
      roe: ratio(mapped.netIncome, mapped.totalEquity),
      roa: ratio(mapped.netIncome, mapped.totalAssets),
      roic: firstProviderPercentPoints(metric.returnOnInvestedCapitalAnnual, metric.roicTTM),
    },
    growth: {
      revenueCagr3y: null,
      revenueCagr5y: null,
      epsCagr3y: null,
      fcfCagr3y: null,
    },
    financialHealth: {
      currentRatio: firstNumber(metric.currentRatioAnnual, metric.currentRatioQuarterly),
      quickRatio: firstNumber(metric.quickRatioAnnual, metric.quickRatioQuarterly),
      debtToEquity: ratio(mapped.totalDebt, mapped.totalEquity),
      netDebtToEbitda: firstNumber(metric.netDebtToEbitdaAnnual, metric.netDebtToEbitdaTTM),
      interestCoverage: firstNumber(metric.interestCoverageAnnual, metric.interestCoverageTTM),
    },
    cashFlow: {
      operatingCashFlow: mapped.operatingCashFlow,
      freeCashFlow: mapped.freeCashFlow,
      fcfMargin: ratio(mapped.freeCashFlow, mapped.revenue),
      capexToRevenue: ratio(mapped.capitalExpenditure, mapped.revenue),
      fcfConversion: ratio(mapped.freeCashFlow, mapped.netIncome),
    },
    dividends: {
      dividendYield: firstProviderYieldPercentPoints(metric.dividendYieldIndicatedAnnual, metric.currentDividendYieldTTM, metric.dividendYieldTTM),
      payoutRatio: firstProviderPercentPoints(metric.payoutRatioAnnual, metric.payoutRatioTTM),
    },
    history: [{
      year: yearLabel(latestFiling),
      revenue: mapped.revenue,
      grossProfit: mapped.grossProfit,
      operatingIncome: mapped.operatingIncome,
      netIncome: mapped.netIncome,
      freeCashFlow: mapped.freeCashFlow,
      totalAssets: mapped.totalAssets,
      totalDebt: mapped.totalDebt,
      totalEquity: mapped.totalEquity,
      sharesDiluted: mapped.sharesDiluted,
    }],
    warnings: buildWarningsFromThinSummary(mapped, latestFiling !== null),
    sources: {
      profile: {
        provider: "finnhub",
        endpoint: "stock/profile2",
        fetchedAt: input.sourceFetchedAt,
        status: Object.keys(input.profile).length > 0 ? "ok" : "missing",
      },
      metrics: {
        provider: "finnhub",
        endpoint: "stock/metric",
        fetchedAt: input.sourceFetchedAt,
        status: Object.keys(input.metrics).length > 0 ? "ok" : "missing",
      },
      financialsReported: {
        provider: "finnhub",
        endpoint: "stock/financials-reported",
        fetchedAt: input.sourceFetchedAt,
        status: latestFiling !== null ? "ok" : "missing",
      },
      summary: {
        provider: "derived",
        fetchedAt: input.sourceFetchedAt,
        status: buildWarningsFromThinSummary(mapped, latestFiling !== null).length === 1 ? "ok" : "partial",
        message: input.marketCapUsdOverride !== null && input.marketCapUsdOverride !== undefined
          ? "Thin summary mapped from Finnhub as-reported line items; market cap sourced from USD market-cap ranked universe"
          : "Thin summary mapped from Finnhub as-reported line items",
      },
    },
  };
}
