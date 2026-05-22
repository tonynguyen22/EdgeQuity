/**
 * Resolve standardized SEC XBRL concepts per catalog metric (replaces first-match if/else).
 */
import {
  classifySecConcept,
  type CompanyFactsPayload,
  type GaapFactSeries,
  pickAnnualUsdValues,
  pickQuarterlyUsdRows,
} from "./sec-edgar.ts";

export interface SecMetricResolveInput {
  metricId: string;
  preferredConcepts: string[];
  statementHint?: "ic" | "bs" | "cf";
  conceptPatterns?: RegExp[];
  excludeConceptPatterns?: RegExp[];
}

const GLOBAL_EXCLUDE_CONCEPT = [
  /ProForma/i,
  /Deferred/i,
  /RemainingPerformanceObligation/i,
  /BusinessAcquisition/i,
  /ContractWithCustomerLiability/i,
  /Recognized$/i,
  /Additions$/i,
  /Noncurrent$/i,
  /Axis$/i,
  /Member$/i,
  /TextBlock/i,
  /Abstract$/i,
  /Table$/i,
  /Policy$/i,
];

const METRIC_EXCLUDE_CONCEPT: Partial<Record<string, RegExp[]>> = {
  revenue: [/CostOf/i, /Deferred/i, /ProForma/i, /Recognized/i],
  grossProfit: [/Margin/i, /Rate/i],
  operatingIncome: [/BeforeTax/i, /Margin/i],
  pretaxIncome: [/AfterTax/i, /Margin/i],
  netIncome: [/AvailableToCommonStockholdersBasic/i, /AttributableToNoncontrolling/i, /PerShare/i],
  eps: [/Basic(?!.*Diluted)/i],
  totalAssets: [/Average/i, /HeldForSale/i],
  cash: [/Restricted/i, /Pledged/i],
  receivables: [/Allowance/i, /Noncurrent/i],
  equity: [/Noncontrolling/i, /Redeemable/i],
  debt: [/CurrentMaturities/i, /Proceeds/i],
  operatingCashFlow: [/PaymentsTo/i, /ProceedsFrom/i],
  capex: [/Proceeds/i],
  freeCashFlow: [/PerShare/i],
};

const METRIC_CONCEPT_PATTERNS: Partial<Record<string, RegExp[]>> = {
  revenue: [/^Revenues?$/i, /^RevenueFromContract/i, /^SalesRevenue/i],
  grossProfit: [/^GrossProfit/i],
  operatingIncome: [/^OperatingIncomeLoss$/i],
  pretaxIncome: [/^IncomeLossFromContinuingOperationsBeforeIncomeTax/i, /^IncomeBeforeIncomeTax/i],
  netIncome: [/^NetIncomeLoss$/i, /^ProfitLoss$/i],
  eps: [/^EarningsPerShareDiluted$/i],
  totalAssets: [/^Assets$/i],
  cash: [/^CashAndCashEquivalentsAtCarryingValue$/i, /^CashCashEquivalentsAndShortTermInvestments$/i],
  receivables: [/^AccountsReceivableNetCurrent$/i, /^ReceivablesNetCurrent$/i],
  inventory: [/^InventoryNet$/i, /^Inventory$/i],
  equity: [/^StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest$/i, /^StockholdersEquity$/i],
  debt: [/^LongTermDebt$/i, /^DebtInstrumentCarryingAmount$/i],
  operatingCashFlow: [
    /^NetCashProvidedByUsedInOperatingActivities$/i,
    /^NetCashProvidedByUsedInOperatingActivitiesContinuingOperations$/i,
  ],
  capex: [/^PaymentsToAcquirePropertyPlantAndEquipment$/i, /^PaymentsToAcquireProductiveAssets$/i],
  freeCashFlow: [/^FreeCashFlow$/i],
};

const METRIC_STATEMENT_HINT: Partial<Record<string, "ic" | "bs" | "cf">> = {
  revenue: "ic",
  grossProfit: "ic",
  operatingIncome: "ic",
  pretaxIncome: "ic",
  netIncome: "ic",
  eps: "ic",
  totalAssets: "bs",
  cash: "bs",
  receivables: "bs",
  inventory: "bs",
  equity: "bs",
  debt: "bs",
  operatingCashFlow: "cf",
  capex: "cf",
  freeCashFlow: "cf",
};

function parsePeriodFy(period: string): number {
  const match = period.match(/^(\d{4})/);
  return match ? Number(match[1]) : 0;
}

function isExcluded(concept: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(concept));
}

function matchesMetric(
  concept: string,
  input: SecMetricResolveInput,
): boolean {
  if (input.preferredConcepts.includes(concept)) return true;
  const patterns = [...(input.conceptPatterns ?? []), ...(METRIC_CONCEPT_PATTERNS[input.metricId] ?? [])];
  return patterns.some((pattern) => pattern.test(concept));
}

function scoreCandidate(
  concept: string,
  series: GaapFactSeries,
  input: SecMetricResolveInput,
): number | null {
  const excludes = [
    ...GLOBAL_EXCLUDE_CONCEPT,
    ...(METRIC_EXCLUDE_CONCEPT[input.metricId] ?? []),
    ...(input.excludeConceptPatterns ?? []),
  ];
  if (isExcluded(concept, excludes)) return null;
  if (!matchesMetric(concept, input)) return null;

  const statementHint = input.statementHint ?? METRIC_STATEMENT_HINT[input.metricId];
  if (statementHint) {
    const statementId = classifySecConcept(concept, series.label);
    if (statementId !== statementHint) return null;
  }

  const annual = pickAnnualUsdValues(series);
  const quarterly = pickQuarterlyUsdRows(series);
  if (annual.length === 0 && quarterly.length === 0) return null;

  const maxFy = Math.max(
    0,
    ...annual.map((row) => row.fy),
    ...quarterly.map((row) => row.fy ?? parsePeriodFy(row.end)),
  );

  const preferredIdx = input.preferredConcepts.indexOf(concept);
  let score = maxFy * 10_000;
  score += annual.length * 25 + quarterly.length * 5;
  if (preferredIdx >= 0) {
    score += (input.preferredConcepts.length - preferredIdx) * 200;
  }
  if (/deprecated/i.test(series.label ?? "")) score -= 5_000;
  return score;
}

export function resolveSecMetricSeries(
  facts: CompanyFactsPayload["facts"],
  input: SecMetricResolveInput,
): { taxonomy: string; concept: string; series: GaapFactSeries } | null {
  let best: { taxonomy: string; concept: string; series: GaapFactSeries; score: number } | null = null;

  for (const taxonomy of ["us-gaap", "ifrs-full"] as const) {
    const bucket = facts?.[taxonomy];
    if (!bucket) continue;

    for (const [concept, series] of Object.entries(bucket)) {
      const score = scoreCandidate(concept, series, input);
      if (score === null) continue;
      if (!best || score > best.score) {
        best = { taxonomy, concept, series, score };
      }
    }
  }

  return best ? { taxonomy: best.taxonomy, concept: best.concept, series: best.series } : null;
}
