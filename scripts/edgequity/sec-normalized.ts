import {
  fetchCompanyFacts,
  findConceptSeries,
  loadSecTickerMap,
  padCik,
  pickAnnualUsdValues,
  pickQuarterlyUsdRows,
  resolveCik,
  type CompanyFactsPayload,
} from "./sec-edgar.ts";

type RawObject = Record<string, unknown>;

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
  capitalExpenditure: ["PaymentsToAcquirePropertyPlantAndEquipment"],
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

function rowKey(row: { fy?: number; end: string; fp?: string }): string {
  return row.fy && row.fp ? `${row.fy}-${row.fp}` : row.end;
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
  for (const concept of concepts) {
    const series = findConceptSeries(facts.facts, [concept])?.series;
    const values = pickAnnualUsdValues(series, 5);
    if (values.length === 0) continue;

    return new Map(values.map((row) => [String(row.fy), { value: row.value, end: row.end }]));
  }

  return new Map();
}

function quarterlyValuesByConcept(
  facts: CompanyFactsPayload,
  concepts: readonly string[],
): Map<string, { fiscalYear: string; period: string; date: string; value: number }> {
  for (const concept of concepts) {
    const series = findConceptSeries(facts.facts, [concept])?.series;
    const values = pickQuarterlyUsdRows(series, 5);
    if (values.length === 0) continue;

    return new Map(values.map((row) => {
      const fiscalYear = String(row.fy ?? Number.parseInt(row.end.slice(0, 4), 10));
      const period = row.fp ?? "Q";
      return [rowKey(row), { fiscalYear, period, date: row.end, value: row.val }];
    }));
  }

  return new Map();
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
  const byQuarter = new Map<string, { fiscalYear: string; period: string; date: string; value: number }>();

  for (const concept of concepts) {
    for (const [key, row] of quarterlyValuesByConcept(facts, [concept])) {
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
  return rows.sort((left, right) => String(right.fiscalYear).localeCompare(String(left.fiscalYear))).slice(0, 5);
}

function sortQuarterDesc(rows: RawObject[]): RawObject[] {
  return rows
    .sort((left, right) => `${right.fiscalYear}-${right.period}`.localeCompare(`${left.fiscalYear}-${left.period}`))
    .slice(0, 5);
}

function finishCashFlows(rows: RawObject[]): void {
  for (const row of rows) {
    const cfo = typeof row.operatingCashFlow === "number" ? row.operatingCashFlow : null;
    const capex = typeof row.capitalExpenditure === "number" ? Math.abs(row.capitalExpenditure) : null;
    row.freeCashFlow = cfo !== null && capex !== null ? cfo - capex : null;
  }
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

  for (const key of ["totalAssets", "totalStockholdersEquity", "cashAndCashEquivalents"] as const) {
    addAnnualConcept(annualBalanceSheets, facts, key, CONCEPTS[key]);
    addQuarterlyConcept(quarterlyBalanceSheets, facts, key, CONCEPTS[key]);
  }
  addAnnualSummedConcept(annualBalanceSheets, facts, "totalDebt", CONCEPTS.totalDebt);
  addQuarterlySummedConcept(quarterlyBalanceSheets, facts, "totalDebt", CONCEPTS.totalDebt);

  for (const key of ["operatingCashFlow", "capitalExpenditure"] as const) {
    addAnnualConcept(annualCashFlows, facts, key, CONCEPTS[key]);
    addQuarterlyConcept(quarterlyCashFlows, facts, key, CONCEPTS[key]);
  }
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
