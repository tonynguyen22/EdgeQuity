import {
  fetchCompanyFacts,
  findConceptSeries,
  loadSecTickerMap,
  padCik,
  pickAnnualUsdValues,
  pickQuarterlyInstantUsdRows,
  pickQuarterlyUsdRows,
  resolveCik,
  secQuarterPeriod,
  type CompanyFactsPayload,
} from "./sec-edgar.ts";

type RawObject = Record<string, unknown>;

const ANNUAL_PERIOD_LIMIT = 5;
const QUARTERLY_PERIOD_LIMIT = 20;

const CONCEPTS = {
  revenue: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"],
  grossProfit: ["GrossProfit"],
  operatingIncome: ["OperatingIncomeLoss"],
  netIncome: ["NetIncomeLoss", "ProfitLoss"],
  epsdiluted: ["EarningsPerShareDiluted"],
  weightedAverageShsOutDil: ["WeightedAverageNumberOfDilutedSharesOutstanding", "WeightedAverageNumberOfShareDiluted"],
  ebitda: ["EarningsBeforeInterestTaxesDepreciationAndAmortization"],
  totalAssets: ["Assets"],
  totalDebt: [
    "DebtCurrent",
    "LongTermDebtCurrent",
    "ShortTermBorrowings",
    "LongTermDebtNoncurrent",
    "LongTermDebtAndFinanceLeaseObligationsCurrent",
    "LongTermDebtAndFinanceLeaseObligationsNoncurrent",
  ],
  totalStockholdersEquity: [
    "StockholdersEquity",
    "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
  ],
  cashAndCashEquivalents: [
    "CashAndCashEquivalentsAtCarryingValue",
    "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
  ],
  operatingCashFlow: ["NetCashProvidedByUsedInOperatingActivities"],
  capitalExpenditure: [
    "PaymentsToAcquirePropertyPlantAndEquipment",
    "PaymentsToAcquireProductiveAssets",
    "PaymentsToAcquireOtherPropertyPlantAndEquipment",
    "CapitalExpenditures",
  ],
} as const;

export interface NormalizedStatementPayload {
  source: "sec";
  status: "ok" | "missing";
  annual: {
    incomeStatements: RawObject[];
    balanceSheets: RawObject[];
    cashFlows: RawObject[];
  };
  quarterly: {
    incomeStatements: RawObject[];
    balanceSheets: RawObject[];
    cashFlows: RawObject[];
  };
}

function emptyResult(status: "missing"): NormalizedStatementPayload {
  return {
    source: "sec",
    status,
    annual: { incomeStatements: [], balanceSheets: [], cashFlows: [] },
    quarterly: { incomeStatements: [], balanceSheets: [], cashFlows: [] },
  };
}

function mergeByFiscalYear(rows: RawObject[], fiscalYear: string, key: string, value: number, date?: string): void {
  const existing = rows.find((row) => row.fiscalYear === fiscalYear);
  if (existing) {
    existing[key] = value;
    if (date && typeof existing.date !== "string") existing.date = date;
    return;
  }

  rows.push({ fiscalYear, date: date ?? `${fiscalYear}-12-31`, period: "FY", [key]: value });
}

function mergeByQuarter(rows: RawObject[], fiscalYear: string, period: string, date: string, key: string, value: number): void {
  const existing = rows.find((row) => row.fiscalYear === fiscalYear && row.period === period);
  if (existing) {
    existing[key] = value;
    return;
  }

  rows.push({ fiscalYear, date, period, [key]: value });
}

function annualValuesByConcept(
  facts: CompanyFactsPayload,
  concepts: readonly string[],
): Map<string, { value: number; end: string }> {
  const candidates: Array<{ values: ReturnType<typeof pickAnnualUsdValues>; score: string }> = [];

  for (const concept of concepts) {
    const series = findConceptSeries(facts.facts, [concept])?.series;
    const values = pickAnnualUsdValues(series, ANNUAL_PERIOD_LIMIT);
    if (values.length === 0) continue;

    const latest = values.at(-1);
    const score = `${latest?.end ?? ""}|${String(values.length).padStart(2, "0")}`;
    candidates.push({ values, score });
  }

  const byYear = new Map<string, { value: number; end: string }>();
  for (const candidate of candidates.sort((left, right) => right.score.localeCompare(left.score))) {
    for (const row of candidate.values) {
      const fiscalYear = String(row.fy);
      if (!byYear.has(fiscalYear)) {
        byYear.set(fiscalYear, { value: row.value, end: row.end });
      }
    }
  }

  return new Map([...byYear.entries()].sort(([left], [right]) => left.localeCompare(right)).slice(-ANNUAL_PERIOD_LIMIT));
}

function quarterlyValuesByConcept(
  facts: CompanyFactsPayload,
  concepts: readonly string[],
): Map<string, { fiscalYear: string; period: string; date: string; value: number }> {
  return quarterlyValuesByConceptPicker(facts, concepts, pickQuarterlyUsdRows);
}

function quarterlyInstantValuesByConcept(
  facts: CompanyFactsPayload,
  concepts: readonly string[],
): Map<string, { fiscalYear: string; period: string; date: string; value: number }> {
  return quarterlyValuesByConceptPicker(facts, concepts, pickQuarterlyInstantUsdRows);
}

function quarterlyValuesByConceptPicker(
  facts: CompanyFactsPayload,
  concepts: readonly string[],
  pickRows: typeof pickQuarterlyUsdRows,
): Map<string, { fiscalYear: string; period: string; date: string; value: number }> {
  const candidates: Array<{ values: ReturnType<typeof pickQuarterlyUsdRows>; score: string }> = [];

  for (const concept of concepts) {
    const series = findConceptSeries(facts.facts, [concept])?.series;
    const values = pickRows(series, QUARTERLY_PERIOD_LIMIT);
    if (values.length === 0) continue;

    const latest = values.at(-1);
    const score = `${latest?.end ?? ""}|${String(values.length).padStart(2, "0")}`;
    candidates.push({ values, score });
  }

  const byQuarter = new Map<string, { fiscalYear: string; period: string; date: string; value: number }>();
  for (const candidate of candidates.sort((left, right) => right.score.localeCompare(left.score))) {
    for (const row of candidate.values) {
      const { fiscalYear, period } = secQuarterPeriod(row);
      const key = `${fiscalYear}-${period}`;
      if (!byQuarter.has(key)) {
        byQuarter.set(key, { fiscalYear, period, date: row.end, value: row.val });
      }
    }
  }

  return new Map([...byQuarter.entries()].sort(([, left], [, right]) => left.date.localeCompare(right.date)).slice(-QUARTERLY_PERIOD_LIMIT));
}

function addAnnualConcept(rows: RawObject[], facts: CompanyFactsPayload, targetKey: string, concepts: readonly string[]): void {
  for (const [fiscalYear, row] of annualValuesByConcept(facts, concepts)) {
    mergeByFiscalYear(rows, fiscalYear, targetKey, row.value, row.end);
  }
}

function addQuarterlyConcept(rows: RawObject[], facts: CompanyFactsPayload, targetKey: string, concepts: readonly string[]): void {
  for (const row of quarterlyValuesByConcept(facts, concepts).values()) {
    mergeByQuarter(rows, row.fiscalYear, row.period, row.date, targetKey, row.value);
  }
}

function addQuarterlyInstantConcept(rows: RawObject[], facts: CompanyFactsPayload, targetKey: string, concepts: readonly string[]): void {
  for (const row of quarterlyInstantValuesByConcept(facts, concepts).values()) {
    mergeByQuarter(rows, row.fiscalYear, row.period, row.date, targetKey, row.value);
  }
}

function addAnnualSummedConcept(rows: RawObject[], facts: CompanyFactsPayload, targetKey: string, concepts: readonly string[]): void {
  const byYear = new Map<string, { value: number; end: string }>();

  for (const concept of concepts) {
    for (const [fiscalYear, row] of annualValuesByConcept(facts, [concept])) {
      const existing = byYear.get(fiscalYear);
      byYear.set(fiscalYear, {
        value: (existing?.value ?? 0) + row.value,
        end: existing?.end && existing.end > row.end ? existing.end : row.end,
      });
    }
  }

  for (const [fiscalYear, row] of byYear) {
    mergeByFiscalYear(rows, fiscalYear, targetKey, row.value, row.end);
  }
}

function addQuarterlySummedConcept(rows: RawObject[], facts: CompanyFactsPayload, targetKey: string, concepts: readonly string[]): void {
  addQuarterlySummedConceptWithPicker(rows, facts, targetKey, concepts, quarterlyValuesByConcept);
}

function addQuarterlyInstantSummedConcept(rows: RawObject[], facts: CompanyFactsPayload, targetKey: string, concepts: readonly string[]): void {
  addQuarterlySummedConceptWithPicker(rows, facts, targetKey, concepts, quarterlyInstantValuesByConcept);
}

function addQuarterlySummedConceptWithPicker(
  rows: RawObject[],
  facts: CompanyFactsPayload,
  targetKey: string,
  concepts: readonly string[],
  pickValues: typeof quarterlyValuesByConcept,
): void {
  const byQuarter = new Map<string, { fiscalYear: string; period: string; date: string; value: number }>();

  for (const concept of concepts) {
    for (const [key, row] of pickValues(facts, [concept])) {
      const existing = byQuarter.get(key);
      byQuarter.set(key, {
        ...row,
        value: (existing?.value ?? 0) + row.value,
      });
    }
  }

  for (const row of byQuarter.values()) {
    mergeByQuarter(rows, row.fiscalYear, row.period, row.date, targetKey, row.value);
  }
}

function sortAnnualDesc(rows: RawObject[]): RawObject[] {
  return rows.sort((left, right) => String(right.fiscalYear).localeCompare(String(left.fiscalYear))).slice(0, ANNUAL_PERIOD_LIMIT);
}

function sortQuarterDesc(rows: RawObject[]): RawObject[] {
  return rows
    .sort((left, right) => String(right.date ?? "").localeCompare(String(left.date ?? "")))
    .slice(0, QUARTERLY_PERIOD_LIMIT);
}

function finishCashFlows(rows: RawObject[]): void {
  for (const row of rows) {
    const cfo = typeof row.operatingCashFlow === "number" ? row.operatingCashFlow : null;
    const capex = typeof row.capitalExpenditure === "number" ? Math.abs(row.capitalExpenditure) : null;
    row.freeCashFlow = cfo !== null && capex !== null ? cfo - capex : null;
  }
}

/**
 * Derive Q4 rows for duration-based statements (income statement, cash flow).
 *
 * SEC does not file a separate 10-Q for Q4 — the Q4 data is embedded in the
 * 10-K annual report.  This computes Q4 = Annual − Q1 − Q2 − Q3 for each
 * additive metric.  Quarters are matched to their annual period by date range,
 * not fiscal-year label, so non-calendar FY companies (e.g. NVDA, Jan FY end)
 * are handled correctly.
 */
export function deriveQ4Rows(
  annualRows: RawObject[],
  quarterlyRows: RawObject[],
  additiveKeys: readonly string[],
): RawObject[] {
  const sortedAnnual = [...annualRows]
    .filter((r) => typeof r.date === "string" && (r.date as string).length >= 10)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string));

  if (sortedAnnual.length === 0) return [];

  const derived: RawObject[] = [];

  for (let i = 0; i < sortedAnnual.length; i++) {
    const annual = sortedAnnual[i];
    const annualDate = annual.date as string;

    // Lower date bound: previous annual end date, or ~380 days before current
    const lowerBound =
      i > 0
        ? (sortedAnnual[i - 1].date as string)
        : new Date(new Date(annualDate).getTime() - 380 * 86_400_000).toISOString().slice(0, 10);

    // Find Q1/Q2/Q3 whose dates are in (lowerBound, annualDate) — exclusive on both ends
    const matchingQuarters = quarterlyRows.filter((q) => {
      const qDate = String(q.date ?? "");
      return qDate > lowerBound && qDate < annualDate && q.period !== "Q4";
    });

    if (matchingQuarters.length !== 3) continue;

    // Skip if Q4 already exists at this annual end date
    if (quarterlyRows.some((q) => q.period === "Q4" && String(q.date ?? "") === annualDate)) continue;

    const q4Row: RawObject = {
      fiscalYear: String(annual.fiscalYear),
      date: annualDate,
      period: "Q4",
    };

    let anyValue = false;
    for (const key of additiveKeys) {
      const annualVal = typeof annual[key] === "number" ? (annual[key] as number) : null;
      if (annualVal === null) continue;

      let qSum: number | null = 0;
      for (const q of matchingQuarters) {
        const v = typeof q[key] === "number" ? (q[key] as number) : null;
        if (v === null) {
          qSum = null;
          break;
        }
        qSum += v;
      }

      if (qSum !== null) {
        q4Row[key] = annualVal - qSum;
        anyValue = true;
      }
    }

    if (anyValue) derived.push(q4Row);
  }

  return derived;
}

export function buildNormalizedSecStatements(facts: CompanyFactsPayload): NormalizedStatementPayload {
  const annualIncomeStatements: RawObject[] = [];
  const annualBalanceSheets: RawObject[] = [];
  const annualCashFlows: RawObject[] = [];
  const quarterlyIncomeStatements: RawObject[] = [];
  const quarterlyBalanceSheets: RawObject[] = [];
  const quarterlyCashFlows: RawObject[] = [];

  for (const key of ["revenue", "grossProfit", "operatingIncome", "netIncome", "epsdiluted", "weightedAverageShsOutDil", "ebitda"] as const) {
    addAnnualConcept(annualIncomeStatements, facts, key, CONCEPTS[key]);
    addQuarterlyConcept(quarterlyIncomeStatements, facts, key, CONCEPTS[key]);
  }

  // Derive Q4 income rows: SEC files 3×10-Q + 1×10-K; Q4 = Annual − Q1 − Q2 − Q3
  quarterlyIncomeStatements.push(
    ...deriveQ4Rows(annualIncomeStatements, quarterlyIncomeStatements, ["revenue", "grossProfit", "operatingIncome", "netIncome", "ebitda"]),
  );

  for (const key of ["totalAssets", "totalStockholdersEquity", "cashAndCashEquivalents"] as const) {
    addAnnualConcept(annualBalanceSheets, facts, key, CONCEPTS[key]);
    addQuarterlyInstantConcept(quarterlyBalanceSheets, facts, key, CONCEPTS[key]);
  }
  addAnnualSummedConcept(annualBalanceSheets, facts, "totalDebt", CONCEPTS.totalDebt);
  addQuarterlyInstantSummedConcept(quarterlyBalanceSheets, facts, "totalDebt", CONCEPTS.totalDebt);

  for (const key of ["operatingCashFlow", "capitalExpenditure"] as const) {
    addAnnualConcept(annualCashFlows, facts, key, CONCEPTS[key]);
    addQuarterlyConcept(quarterlyCashFlows, facts, key, CONCEPTS[key]);
  }
  // Derive Q4 cash flow rows before computing freeCashFlow
  quarterlyCashFlows.push(
    ...deriveQ4Rows(annualCashFlows, quarterlyCashFlows, ["operatingCashFlow", "capitalExpenditure"]),
  );
  finishCashFlows(annualCashFlows);
  finishCashFlows(quarterlyCashFlows);

  return {
    source: "sec",
    status: annualIncomeStatements.length > 0 ? "ok" : "missing",
    annual: {
      incomeStatements: sortAnnualDesc(annualIncomeStatements),
      balanceSheets: sortAnnualDesc(annualBalanceSheets),
      cashFlows: sortAnnualDesc(annualCashFlows),
    },
    quarterly: {
      incomeStatements: sortQuarterDesc(quarterlyIncomeStatements),
      balanceSheets: sortQuarterDesc(quarterlyBalanceSheets),
      cashFlows: sortQuarterDesc(quarterlyCashFlows),
    },
  };
}

export async function pullNormalizedSecStatements(ticker: string): Promise<NormalizedStatementPayload> {
  const map = await loadSecTickerMap();
  const resolved = resolveCik(ticker, map);
  if (!resolved) return emptyResult("missing");

  const facts = await fetchCompanyFacts(padCik(resolved.cik_str));
  return buildNormalizedSecStatements(facts);
}
