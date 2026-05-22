import { readFile } from "node:fs/promises";
import path from "node:path";

import { FUNDAMENTALS_CATALOG, type FundamentalsFormat, type FundamentalsMetricDef } from "./fundamentals-catalog.ts";
import {
  type CompanyFactsPayload,
  EDGEQUITY_RAW_DIR,
  pickAnnualUsdValues,
  pickQuarterlyUsdRows,
  type SecStatementsDocument,
} from "./sec-edgar.ts";
import { resolveSecMetricSeries } from "./sec-metric-resolver.ts";

export const FUNDAMENTALS_CHARTS_SCHEMA_VERSION = 2;
export const FUNDAMENTALS_ANNUAL_LIMIT = 5;
export const FUNDAMENTALS_QUARTERLY_LIMIT = 20;

export interface FundamentalsChartPoint {
  period: string;
  value: number;
}

export interface FundamentalsChartMetric {
  id: string;
  label: string;
  description: string;
  format: FundamentalsFormat;
  annual: FundamentalsChartPoint[];
  quarterly: FundamentalsChartPoint[];
}

export interface FundamentalsChartsSection {
  id: string;
  title: string;
  description: string;
  metrics: FundamentalsChartMetric[];
}

export interface FundamentalsChartsDocument {
  schemaVersion: number;
  ticker: string;
  source: "sec-edgar+finnhub";
  fetchedAt: string;
  status: "ok" | "partial" | "missing";
  sections: FundamentalsChartsSection[];
}

type FinnhubSeriesBucket = Record<string, Array<{ period: string; v: number }>>;

export function fundamentalsChartsPath(ticker: string): string {
  return path.join(EDGEQUITY_RAW_DIR, ticker.toUpperCase(), "fundamentals-charts.json");
}

export function pickQuarterlyUsdValues(
  series: { units: Record<string, Array<{ end: string; val: number; fy?: number; fp?: string; start?: string }>> } | undefined,
  maxQuarters = FUNDAMENTALS_QUARTERLY_LIMIT,
): FundamentalsChartPoint[] {
  const rows = pickQuarterlyUsdRows(series, maxQuarters);
  return sortPeriods(
    rows.map((row) => ({
      period: formatQuarterPeriod(row.end, row.fy, row.fp),
      value: row.val,
    })),
  );
}

function formatQuarterPeriod(end: string, fy?: number, fp?: string): string {
  if (fy && fp && /^Q[1-4]$/.test(fp)) return `${fy}-${fp}`;
  const year = fy ?? Number.parseInt(end.slice(0, 4), 10);
  const month = Number.parseInt(end.slice(5, 7), 10);
  const quarter = month <= 3 ? "Q1" : month <= 6 ? "Q2" : month <= 9 ? "Q3" : "Q4";
  return `${year}-${quarter}`;
}

function annualFromSec(
  facts: CompanyFactsPayload["facts"],
  def: FundamentalsMetricDef,
  maxYears = FUNDAMENTALS_ANNUAL_LIMIT,
): FundamentalsChartPoint[] {
  if (!def.secConcepts?.length) return [];
  const hit = resolveSecMetricSeries(facts, {
    metricId: def.id,
    preferredConcepts: def.secConcepts,
  });
  if (!hit) return [];
  return sortPeriods(
    pickAnnualUsdValues(hit.series, maxYears).map((row) => ({
      period: String(row.fy),
      value: row.value,
    })),
  );
}

function quarterlyFromSec(
  facts: CompanyFactsPayload["facts"],
  def: FundamentalsMetricDef,
): FundamentalsChartPoint[] {
  if (!def.secConcepts?.length) return [];
  const hit = resolveSecMetricSeries(facts, {
    metricId: def.id,
    preferredConcepts: def.secConcepts,
  });
  if (!hit) return [];
  return pickQuarterlyUsdValues(hit.series);
}

function annualFromStatements(
  statements: SecStatementsDocument | null,
  def: FundamentalsMetricDef,
): FundamentalsChartPoint[] {
  if (!statements || statements.status !== "ok" || !def.secConcepts?.length) return [];
  const rows = [...statements.statements.ic.rows, ...statements.statements.bs.rows, ...statements.statements.cf.rows];
  const preferred = new Set(def.secConcepts);
  const row = rows.find((candidate) => preferred.has(candidate.concept));
  if (!row) return [];
  return sortPeriods(
    Object.entries(row.valuesByYear).map(([period, value]) => ({
      period,
      value: value ?? NaN,
    })).filter((point) => Number.isFinite(point.value)),
  ).slice(-FUNDAMENTALS_ANNUAL_LIMIT);
}

function extractFinnhubSeries(
  metricsPayload: Record<string, unknown>,
  keys: string[] | undefined,
  bucket: "annual" | "quarterly",
  limit: number,
): FundamentalsChartPoint[] {
  if (!keys?.length) return [];
  const series = metricsPayload.series as { annual?: FinnhubSeriesBucket; quarterly?: FinnhubSeriesBucket } | undefined;
  const source = series?.[bucket];
  if (!source) return [];

  for (const key of keys) {
    const points = source[key];
    if (!points?.length) continue;
    const normalized = points
      .filter((point) => typeof point.v === "number" && Number.isFinite(point.v))
      .map((point) => ({ period: formatFinnhubPeriod(point.period, bucket), value: point.v }));
    if (normalized.length > 0) {
      return sortPeriods(normalized).slice(-limit);
    }
  }
  return [];
}

function formatFinnhubPeriod(period: string, bucket: "annual" | "quarterly"): string {
  if (bucket === "annual") return period.slice(0, 4);
  const date = period.slice(0, 10);
  const year = Number.parseInt(date.slice(0, 4), 10);
  const month = Number.parseInt(date.slice(5, 7), 10);
  const quarter = month <= 3 ? "Q1" : month <= 6 ? "Q2" : month <= 9 ? "Q3" : "Q4";
  return `${year}-${quarter}`;
}

function sortPeriods(points: FundamentalsChartPoint[]): FundamentalsChartPoint[] {
  const byPeriod = new Map<string, FundamentalsChartPoint>();
  for (const point of points) {
    if (!Number.isFinite(point.value)) continue;
    byPeriod.set(point.period, point);
  }
  return [...byPeriod.values()].sort((left, right) => periodSortKey(left.period) - periodSortKey(right.period));
}

function periodSortKey(period: string): number {
  const quarter = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) return Number(quarter[1]) * 10 + Number(quarter[2]);
  const year = Number.parseInt(period.slice(0, 4), 10);
  return Number.isFinite(year) ? year * 10 : 0;
}

function buildMetric(
  def: FundamentalsMetricDef,
  facts: CompanyFactsPayload | null,
  statements: SecStatementsDocument | null,
  metricsPayload: Record<string, unknown> | null,
): FundamentalsChartMetric | null {
  let annual: FundamentalsChartPoint[] = [];
  let quarterly: FundamentalsChartPoint[] = [];

  if (def.secConcepts?.length && facts?.facts) {
    annual = annualFromSec(facts.facts, def);
    quarterly = quarterlyFromSec(facts.facts, def);
  }

  if (annual.length === 0 && def.secConcepts?.length) {
    annual = annualFromStatements(statements, def);
  }

  if (metricsPayload) {
    if (annual.length === 0) {
      annual = extractFinnhubSeries(metricsPayload, def.finnhubAnnualKeys, "annual", FUNDAMENTALS_ANNUAL_LIMIT);
    }
    if (quarterly.length === 0) {
      quarterly = extractFinnhubSeries(metricsPayload, def.finnhubQuarterlyKeys, "quarterly", FUNDAMENTALS_QUARTERLY_LIMIT);
    }
  }

  if (def.format === "percent") {
    annual = annual.map((point) => ({ ...point, value: normalizePercent(point.value) }));
    quarterly = quarterly.map((point) => ({ ...point, value: normalizePercent(point.value) }));
  }

  if (annual.length === 0 && quarterly.length === 0) return null;

  return {
    id: def.id,
    label: def.label,
    description: def.description,
    format: def.format,
    annual,
    quarterly,
  };
}

function normalizePercent(value: number): number {
  return Math.abs(value) <= 1.5 ? value * 100 : value;
}

export function buildFundamentalsChartsDocument(
  ticker: string,
  facts: CompanyFactsPayload | null,
  statements: SecStatementsDocument | null,
  metricsPayload: Record<string, unknown> | null,
): FundamentalsChartsDocument {
  const sections: FundamentalsChartsSection[] = [];

  for (const sectionDef of FUNDAMENTALS_CATALOG) {
    const metrics: FundamentalsChartMetric[] = [];
    for (const metricDef of sectionDef.metrics) {
      const built = buildMetric(metricDef, facts, statements, metricsPayload);
      if (built) metrics.push(built);
    }
    if (metrics.length > 0) {
      sections.push({
        id: sectionDef.id,
        title: sectionDef.title,
        description: sectionDef.description,
        metrics,
      });
    }
  }

  const hasSec = Boolean(facts?.facts);
  const hasFinnhub = Boolean(metricsPayload?.series);
  const status = sections.length === 0 ? "missing" : hasSec && hasFinnhub ? "ok" : "partial";

  return {
    schemaVersion: FUNDAMENTALS_CHARTS_SCHEMA_VERSION,
    ticker,
    source: "sec-edgar+finnhub",
    fetchedAt: new Date().toISOString(),
    status,
    sections,
  };
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}
