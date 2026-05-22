/**
 * SEC EDGAR Company Facts — shared fetch + statement builder for Edgequity BCTC cache.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SEC_USER_AGENT = process.env.SEC_USER_AGENT ?? "Edgequity/1.0 (research@edgequity.local)";
export const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
export const SEC_FACTS_BASE = "https://data.sec.gov/api/xbrl/companyfacts";
export const SEC_SUBMISSIONS_BASE = "https://data.sec.gov/submissions";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EDGEQUITY_ROOT = path.resolve(__dirname, "../..");
export const EDGEQUITY_RAW_DIR = path.join(EDGEQUITY_ROOT, "public/data/edgequity/raw");
export const SEC_TICKERS_CACHE = path.join(EDGEQUITY_ROOT, "public/data/edgequity/sec/company_tickers.json");

export type SecStatementId = "ic" | "bs" | "cf";

export interface SecStatementRow {
  key: string;
  label: string;
  unit: string;
  taxonomy: string;
  concept: string;
  valuesByYear: Record<number, number | null>;
}

export interface SecStatementsDocument {
  schemaVersion: number;
  ticker: string;
  cik: string | null;
  entityName: string | null;
  source: "sec-edgar";
  fetchedAt: string;
  status: "ok" | "no_cik" | "no_facts";
  recentFilings: Array<{ form: string; filingDate: string; reportDate: string }>;
  statements: Record<SecStatementId, { years: number[]; rows: SecStatementRow[] }>;
}

export interface SecTickerEntry {
  cik_str: string | number;
  ticker: string;
  title: string;
}

type SecTickerMap = Record<string, SecTickerEntry>;

export const TICKER_ALIASES: Record<string, string[]> = {
  "BRK.B": ["BRK-B", "BRK.A", "BRK-A"],
  "BRK.A": ["BRK-A"],
  "HEI.A": ["HEI-A"],
  "PBR.A": ["PBR-A"],
};

/** Full SEC dump groups every annual USD concept into one of three statements (no hand-picked rows). */
export const SEC_STATEMENTS_SCHEMA_VERSION = 2;

const SKIP_CONCEPT_PATTERNS = [
  /Axis$/i,
  /Member$/i,
  /Domain$/i,
  /TableTextBlock/i,
  /PolicyTextBlock/i,
  /DisclosureTextBlock/i,
  /Abstract$/i,
  /^Document/i,
  /^EntityRegistrant/i,
  /^EntityCentral/i,
  /^CityAreaCode/i,
  /^LocalPhoneNumber/i,
  /^TradingSymbol/i,
  /^Security12bTitle/i,
  /^Entity(Incorporation|Tax|File|Number|Address|Listing)/i,
];

const CF_CONCEPT_PATTERNS = [
  /CashProvided|CashUsed/i,
  /OperatingActivities|InvestingActivities|FinancingActivities/i,
  /^PaymentsTo|^ProceedsFrom/i,
  /CapitalExpenditure/i,
  /EffectOfExchangeRate/i,
  /CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecrease/i,
];

const BS_CONCEPT_PATTERNS = [
  /Asset/i,
  /Liabilit/i,
  /Equity/i,
  /Stockholder|Shareholder/i,
  /Inventory/i,
  /Receivable|Payable/i,
  /Debt|Mortgage|Deposit/i,
  /Goodwill|Intangible/i,
  /PropertyPlantAndEquipment/i,
  /RetainedEarnings/i,
  /TreasuryStock/i,
  /CommitmentsAndContingencies/i,
];

const IC_CONCEPT_PATTERNS = [
  /Revenue|Sales/i,
  /Income|Expense|Profit|Loss|Earning|Margin/i,
  /CostOf|Gross/i,
  /OperatingIncome|OperatingLoss/i,
  /Tax|Interest/i,
  /ComprehensiveIncome/i,
  /EarningsPerShare|PerShare/i,
  /ResearchAndDevelopment/i,
  /SellingGeneralAndAdministrative/i,
  /Depreciation|Amortization/i,
];

export function classifySecConcept(concept: string, label: string | null | undefined): SecStatementId | null {
  const haystack = `${concept} ${label ?? ""}`;
  if (SKIP_CONCEPT_PATTERNS.some((pattern) => pattern.test(haystack))) return null;
  if (CF_CONCEPT_PATTERNS.some((pattern) => pattern.test(concept))) return "cf";
  if (BS_CONCEPT_PATTERNS.some((pattern) => pattern.test(concept))) return "bs";
  if (IC_CONCEPT_PATTERNS.some((pattern) => pattern.test(concept))) return "ic";
  return null;
}

interface GaapFactSeries {
  label?: string | null;
  units: Record<string, Array<{ end: string; val: number; fy?: number; fp?: string; form?: string }>>;
}

export interface CompanyFactsPayload {
  cik: number;
  entityName: string;
  facts?: {
    "us-gaap"?: Record<string, GaapFactSeries>;
    "ifrs-full"?: Record<string, GaapFactSeries>;
  };
}

export async function secFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": SEC_USER_AGENT,
      Accept: "application/json",
    },
  });
}

export function padCik(cik: string | number): string {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}

export async function loadSecTickerMap(): Promise<Map<string, SecTickerEntry>> {
  try {
    const cached = await readFile(SEC_TICKERS_CACHE, "utf8");
    const raw = JSON.parse(cached) as SecTickerMap;
    return indexTickerMap(raw);
  } catch {
    const response = await secFetch(SEC_TICKERS_URL);
    if (!response.ok) {
      throw new Error(`SEC company_tickers.json failed: ${response.status}`);
    }
    const raw = (await response.json()) as SecTickerMap;
    await mkdir(path.dirname(SEC_TICKERS_CACHE), { recursive: true });
    await writeFile(SEC_TICKERS_CACHE, JSON.stringify(raw));
    return indexTickerMap(raw);
  }
}

function indexTickerMap(raw: SecTickerMap): Map<string, SecTickerEntry> {
  const byTicker = new Map<string, SecTickerEntry>();
  for (const entry of Object.values(raw)) {
    byTicker.set(entry.ticker.toUpperCase(), entry);
  }
  return byTicker;
}

export function resolveCik(ticker: string, map: Map<string, SecTickerEntry>): SecTickerEntry | null {
  const upper = ticker.toUpperCase();
  const candidates = [upper, upper.replace(".", "-"), ...((TICKER_ALIASES[upper] ?? []).map((t) => t.toUpperCase()))];
  for (const candidate of candidates) {
    const hit = map.get(candidate);
    if (hit) return hit;
  }
  return null;
}

export function findConceptSeries(
  facts: CompanyFactsPayload["facts"],
  concepts: string[],
): { taxonomy: string; concept: string; series: GaapFactSeries } | null {
  for (const taxonomy of ["us-gaap", "ifrs-full"] as const) {
    const bucket = facts?.[taxonomy];
    if (!bucket) continue;
    for (const name of concepts) {
      const series = bucket[name];
      if (series) return { taxonomy, concept: name, series };
    }
  }
  return null;
}

export function pickAnnualUsdValues(
  series: GaapFactSeries | undefined,
  maxYears = 5,
): Array<{ fy: number; end: string; value: number; form?: string }> {
  if (!series?.units) return [];
  const usd = series.units.USD ?? series.units.usd ?? Object.values(series.units)[0];
  if (!usd) return [];

  const annual = usd
    .filter((row) => row.fp === "FY" || row.form === "10-K" || row.form === "20-F" || row.form === "40-F")
    .filter((row) => typeof row.val === "number" && Number.isFinite(row.val));

  const byFy = new Map<number, { fy: number; end: string; value: number; form?: string }>();
  for (const row of annual) {
    const fy = row.fy ?? Number.parseInt(row.end.slice(0, 4), 10);
    const existing = byFy.get(fy);
    if (!existing || row.end > existing.end) {
      byFy.set(fy, { fy, end: row.end, value: row.val, form: row.form });
    }
  }

  return [...byFy.values()].sort((a, b) => b.fy - a.fy).slice(0, maxYears);
}

function valuesToMap(years: Array<{ fy: number; value: number }>): Record<number, number | null> {
  const out: Record<number, number | null> = {};
  for (const row of years) out[row.fy] = row.value;
  return out;
}

function collectAllStatementRows(
  facts: CompanyFactsPayload["facts"],
  maxYears: number,
): Record<SecStatementId, SecStatementRow[]> {
  const buckets: Record<SecStatementId, SecStatementRow[]> = { ic: [], bs: [], cf: [] };
  const seen = new Set<string>();

  for (const taxonomy of ["us-gaap", "ifrs-full"] as const) {
    const bucket = facts?.[taxonomy];
    if (!bucket) continue;

    for (const [concept, series] of Object.entries(bucket)) {
      const dedupeKey = concept;
      if (seen.has(dedupeKey)) continue;

      const statementId = classifySecConcept(concept, series.label);
      if (!statementId) continue;

      const annual = pickAnnualUsdValues(series, maxYears);
      if (annual.length === 0) continue;

      seen.add(dedupeKey);
      buckets[statementId].push({
        key: `${taxonomy}:${concept}`,
        label: (series.label ?? concept).trim(),
        unit: "usd",
        taxonomy,
        concept,
        valuesByYear: valuesToMap(annual),
      });
    }
  }

  for (const statementId of ["ic", "bs", "cf"] as const) {
    buckets[statementId].sort((left, right) => left.label.localeCompare(right.label, "en"));
  }

  return buckets;
}

function statementYears(rows: SecStatementRow[], maxYears: number): number[] {
  const years = new Set<number>();
  for (const row of rows) {
    for (const fy of Object.keys(row.valuesByYear)) years.add(Number(fy));
  }
  return [...years].sort((a, b) => a - b).slice(-maxYears);
}

export function buildSecStatementsDocument(
  ticker: string,
  facts: CompanyFactsPayload | null,
  cik: string | null,
  recentFilings: SecStatementsDocument["recentFilings"],
  maxYears = 5,
): SecStatementsDocument {
  const emptyStatement = (): { years: number[]; rows: SecStatementRow[] } => ({ years: [], rows: [] });

  if (!facts?.facts) {
    return {
      schemaVersion: SEC_STATEMENTS_SCHEMA_VERSION,
      ticker,
      cik,
      entityName: facts?.entityName ?? null,
      source: "sec-edgar",
      fetchedAt: new Date().toISOString(),
      status: cik ? "no_facts" : "no_cik",
      recentFilings,
      statements: { ic: emptyStatement(), bs: emptyStatement(), cf: emptyStatement() },
    };
  }

  const rowBuckets = collectAllStatementRows(facts.facts, maxYears);
  const statements = {
    ic: { years: statementYears(rowBuckets.ic, maxYears), rows: rowBuckets.ic },
    bs: { years: statementYears(rowBuckets.bs, maxYears), rows: rowBuckets.bs },
    cf: { years: statementYears(rowBuckets.cf, maxYears), rows: rowBuckets.cf },
  } satisfies SecStatementsDocument["statements"];

  const hasData = Object.values(statements).some((s) => s.rows.length > 0);

  return {
    schemaVersion: SEC_STATEMENTS_SCHEMA_VERSION,
    ticker,
    cik,
    entityName: facts.entityName ?? null,
    source: "sec-edgar",
    fetchedAt: new Date().toISOString(),
    status: hasData ? "ok" : "no_facts",
    recentFilings,
    statements,
  };
}

export async function fetchCompanyFacts(cikPadded: string): Promise<CompanyFactsPayload> {
  const url = `${SEC_FACTS_BASE}/CIK${cikPadded}.json`;
  const response = await secFetch(url);
  if (!response.ok) {
    throw new Error(`companyfacts ${cikPadded}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as CompanyFactsPayload;
}

export async function fetchRecentAnnualFilings(
  cikPadded: string,
): Promise<SecStatementsDocument["recentFilings"]> {
  const url = `${SEC_SUBMISSIONS_BASE}/CIK${cikPadded}.json`;
  const response = await secFetch(url);
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    filings?: { recent?: { form?: string[]; filingDate?: string[]; reportDate?: string[] } };
  };
  const recent = payload.filings?.recent;
  if (!recent?.form) return [];

  const rows: SecStatementsDocument["recentFilings"] = [];
  for (let i = 0; i < recent.form.length && rows.length < 8; i++) {
    const form = recent.form[i] ?? "";
    if (form === "10-K" || form === "20-F" || form === "40-F" || form === "10-K/A" || form === "20-F/A") {
      rows.push({
        form,
        filingDate: recent.filingDate?.[i] ?? "",
        reportDate: recent.reportDate?.[i] ?? "",
      });
    }
  }
  return rows;
}

export function secStatementsPath(ticker: string): string {
  return path.join(EDGEQUITY_RAW_DIR, ticker.toUpperCase(), "sec-statements.json");
}

export async function pullSecStatementsForTicker(
  ticker: string,
  map: Map<string, SecTickerEntry>,
  options: { maxYears?: number; saveRawFacts?: boolean } = {},
): Promise<SecStatementsDocument> {
  const resolved = resolveCik(ticker, map);
  if (!resolved) {
    return buildSecStatementsDocument(ticker, null, null, []);
  }

  const cikPadded = padCik(resolved.cik_str);
  const [facts, filings] = await Promise.all([fetchCompanyFacts(cikPadded), fetchRecentAnnualFilings(cikPadded)]);

  if (options.saveRawFacts) {
    const dir = path.join(EDGEQUITY_RAW_DIR, ticker.toUpperCase());
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "sec-company-facts.json"), JSON.stringify(facts, null, 2));
  }

  const document = buildSecStatementsDocument(ticker, facts, cikPadded, filings, options.maxYears ?? 5);
  const outPath = secStatementsPath(ticker);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(document, null, 2));
  return document;
}
