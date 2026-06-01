import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { EdgequityFinancialStatementPeriod, EdgequityManifest, EdgequityStockRecord } from '../../src/edgequity/types.ts';
import { pickAuditSample } from './audit-sample.ts';
import { buildNormalizedSecStatements, type NormalizedStatementPayload } from './sec-normalized.ts';
import { fetchCompanyFacts, loadSecTickerMap, padCik, resolveCik } from './sec-edgar.ts';

export interface AuditStatementRow {
  period: string;
  values: Record<string, number | string | null>;
}

export interface AuditComparisonResult {
  ok: boolean;
  message: string;
  generated: number | null;
  expected: number | null;
}

interface AuditTickerResult {
  ticker: string;
  status: 'pass' | 'fail' | 'skip';
  checks: number;
  failures: AuditComparisonResult[];
  reason?: string;
}

const ANNUAL_INCOME_KEYS = ['revenue', 'grossProfit', 'operatingIncome', 'netIncome', 'epsdiluted', 'weightedAverageShsOutDil'];
const ANNUAL_BALANCE_KEYS = ['totalAssets', 'totalDebt', 'totalStockholdersEquity', 'cashAndCashEquivalents'];
const ANNUAL_CASH_KEYS = ['operatingCashFlow', 'capitalExpenditure', 'freeCashFlow'];
const QUARTERLY_BALANCE_KEYS = ['totalAssets', 'totalDebt', 'totalStockholdersEquity', 'cashAndCashEquivalents'];

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function compareNumber(label: string, generated: number | null, expected: number | null, tolerancePct: number): AuditComparisonResult {
  if (generated === null || expected === null) {
    return { ok: generated === expected, message: label + ': generated=' + generated + ' expected=' + expected, generated, expected };
  }
  const denominator = Math.max(1, Math.abs(expected));
  const diffPct = Math.abs(generated - expected) / denominator;
  return {
    ok: diffPct <= tolerancePct,
    message: label + ': generated=' + generated + ' expected=' + expected + ' diffPct=' + diffPct,
    generated,
    expected,
  };
}

export function latestAnnualRowsForAudit(rows: EdgequityFinancialStatementPeriod[], limit: number): AuditStatementRow[] {
  return rows
    .slice()
    .sort((left, right) => String(right.fiscalYear).localeCompare(String(left.fiscalYear)))
    .slice(0, limit)
    .map((row) => ({ period: row.fiscalYear, values: row.values }));
}

export function latestQuarterlyRowsForAudit(rows: EdgequityFinancialStatementPeriod[], limit: number): AuditStatementRow[] {
  return rows
    .slice()
    .sort((left, right) => String(right.date ?? '').localeCompare(String(left.date ?? '')))
    .slice(0, limit)
    .map((row) => ({ period: row.fiscalYear + '-' + row.period, values: row.values }));
}

export function compareStatementRows(
  ticker: string,
  cadence: 'annual' | 'quarterly',
  generatedRows: AuditStatementRow[],
  expectedRows: AuditStatementRow[],
  keys: string[],
  tolerancePct: number,
): AuditComparisonResult[] {
  const generatedByPeriod = new Map(generatedRows.map((row) => [row.period, row]));
  const results: AuditComparisonResult[] = [];

  for (const expectedRow of expectedRows) {
    const generatedRow = generatedByPeriod.get(expectedRow.period);
    if (!generatedRow) {
      results.push({ ok: false, message: ticker + ' ' + cadence + ' ' + expectedRow.period + ': missing generated row', generated: null, expected: null });
      continue;
    }
    for (const key of keys) {
      results.push(compareNumber(
        ticker + ' ' + cadence + ' ' + expectedRow.period + ' ' + key,
        numeric(generatedRow.values[key]),
        numeric(expectedRow.values[key]),
        tolerancePct,
      ));
    }
  }

  return results;
}

function statementRowsToAuditRows(rows: Record<string, unknown>[], cadence: 'annual' | 'quarterly'): AuditStatementRow[] {
  return rows.map((row) => ({
    period: cadence === 'annual' ? String(row.fiscalYear) : String(row.fiscalYear) + '-' + String(row.period),
    values: row as Record<string, number | string | null>,
  }));
}

async function loadManifest(): Promise<EdgequityManifest> {
  return JSON.parse(await readFile('public/data/edgequity/manifest.json', 'utf8')) as EdgequityManifest;
}

async function loadStock(dataPath: string): Promise<EdgequityStockRecord> {
  const localPath = dataPath.startsWith('/') ? dataPath.slice(1) : dataPath;
  return JSON.parse(await readFile(path.join('public', localPath), 'utf8')) as EdgequityStockRecord;
}

async function buildPublicSecStatements(ticker: string): Promise<NormalizedStatementPayload | null> {
  const map = await loadSecTickerMap();
  const resolved = resolveCik(ticker, map);
  if (!resolved) return null;
  const facts = await fetchCompanyFacts(padCik(resolved.cik_str));
  return buildNormalizedSecStatements(facts);
}

function maySkipMissingSec(stock: EdgequityStockRecord): boolean {
  return stock.statementQuality?.status === 'missing' || stock.financialStatements?.source.status === 'missing';
}

export async function auditTickerAgainstPublicSec(ticker: string, manifest?: EdgequityManifest): Promise<AuditTickerResult> {
  const loadedManifest = manifest ?? await loadManifest();
  const manifestStock = loadedManifest.stocks.find((stock) => stock.ticker.toUpperCase() === ticker.toUpperCase());
  if (!manifestStock) {
    return { ticker, status: 'fail', checks: 1, failures: [{ ok: false, message: ticker + ': missing from manifest', generated: null, expected: null }] };
  }

  const generated = await loadStock(manifestStock.dataPath);
  const expected = await buildPublicSecStatements(ticker);
  if (!expected || expected.status === 'missing') {
    if (maySkipMissingSec(generated)) {
      return { ticker, status: 'skip', checks: 0, failures: [], reason: 'missing public SEC statements and generated metadata is missing' };
    }
    return { ticker, status: 'fail', checks: 1, failures: [{ ok: false, message: ticker + ': public SEC statements missing but generated record claims SEC coverage', generated: null, expected: null }] };
  }

  const generatedFinancials = generated.financialStatements;
  if (!generatedFinancials) {
    return { ticker, status: 'fail', checks: 1, failures: [{ ok: false, message: ticker + ': missing generated financialStatements', generated: null, expected: null }] };
  }

  const expectedAnnualIncome = statementRowsToAuditRows(expected.annual.incomeStatements, 'annual').slice(0, 5);
  const expectedAnnualBalance = statementRowsToAuditRows(expected.annual.balanceSheets, 'annual').slice(0, 5);
  const expectedAnnualCash = statementRowsToAuditRows(expected.annual.cashFlows, 'annual').slice(0, 5);
  const expectedQuarterlyBalance = statementRowsToAuditRows(expected.quarterly.balanceSheets, 'quarterly').slice(0, 8);

  const results = [
    ...compareStatementRows(ticker, 'annual', latestAnnualRowsForAudit(generatedFinancials.annual.incomeStatement, 5), expectedAnnualIncome, ANNUAL_INCOME_KEYS, 0),
    ...compareStatementRows(ticker, 'annual', latestAnnualRowsForAudit(generatedFinancials.annual.balanceSheet, 5), expectedAnnualBalance, ANNUAL_BALANCE_KEYS, 0),
    ...compareStatementRows(ticker, 'annual', latestAnnualRowsForAudit(generatedFinancials.annual.cashFlow, 5), expectedAnnualCash, ANNUAL_CASH_KEYS, 0),
    ...compareStatementRows(ticker, 'quarterly', latestQuarterlyRowsForAudit(generatedFinancials.quarterly?.balanceSheet ?? [], 8), expectedQuarterlyBalance, QUARTERLY_BALANCE_KEYS, 0),
  ];
  const failures = results.filter((result) => !result.ok);
  return { ticker, status: failures.length > 0 ? 'fail' : 'pass', checks: results.length, failures };
}

function parseArgs(argv: string[]): Map<string, string> {
  return new Map(argv.map((arg) => {
    const [key, value = ''] = arg.replace(/^--/, '').split('=');
    return [key, value] as const;
  }));
}

async function main() {
  const manifest = await loadManifest();
  const args = parseArgs(process.argv.slice(2));
  const seed = args.get('seed') || new Date().toISOString().slice(0, 10);
  const sampleSize = Number(args.get('sample') || '10');
  const tickersArg = args.get('tickers');
  const tickers = tickersArg
    ? tickersArg.split(',').map((ticker) => ticker.trim().toUpperCase()).filter(Boolean)
    : pickAuditSample(manifest.universe, sampleSize, seed, ['NVDA']);

  const results: AuditTickerResult[] = [];
  for (const ticker of tickers) {
    const result = await auditTickerAgainstPublicSec(ticker, manifest);
    console.log(JSON.stringify({ ticker: result.ticker, status: result.status, checks: result.checks, failures: result.failures.length, reason: result.reason }, null, 2));
    for (const failure of result.failures) console.error(failure.message);
    results.push(result);
  }

  const failed = results.filter((result) => result.status === 'fail');
  const skipped = results.filter((result) => result.status === 'skip');
  if (failed.length > 0) {
    console.error(JSON.stringify({ status: 'fail', failures: failed.length, skipped: skipped.map((result) => result.ticker), checks: results.reduce((sum, result) => sum + result.checks, 0) }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({ status: 'pass', tickers, skipped: skipped.map((result) => result.ticker), checks: results.reduce((sum, result) => sum + result.checks, 0) }, null, 2));
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = fileURLToPath(import.meta.url);
if (entryPath === modulePath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
