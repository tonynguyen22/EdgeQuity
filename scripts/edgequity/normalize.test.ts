import assert from "node:assert/strict";
import test from "node:test";

import { buildWarnings, cagr, normalizeEdgequityRecord, normalizeNumber, ratio } from "./normalize.ts";

test("ratio returns null when denominator is zero or missing", () => {
  assert.equal(ratio(10, 0), null);
  assert.equal(ratio(10, null), null);
  assert.equal(ratio(null, 10), null);
});

test("ratio returns numerator divided by denominator", () => {
  assert.equal(ratio(25, 100), 0.25);
});

test("cagr returns null for invalid inputs", () => {
  assert.equal(cagr(0, 100, 3), null);
  assert.equal(cagr(100, 0, 3), null);
  assert.equal(cagr(100, 200, 0), null);
});

test("cagr calculates annual growth rate", () => {
  assert.equal(Number(cagr(100, 133.1, 3)?.toFixed(3)), 0.1);
});

test("normalizeNumber returns finite numbers and null otherwise", () => {
  assert.equal(normalizeNumber(undefined), null);
  assert.equal(normalizeNumber(Number.NaN), null);
  assert.equal(normalizeNumber(42), 42);
});

test("normalizeEdgequityRecord builds a stock record with full-unit money values and decimal ratios", () => {
  const record = normalizeEdgequityRecord({
    ticker: "AAPL",
    profile: {
      name: "Apple Inc",
      country: "US",
      currency: "USD",
      exchange: "NASDAQ",
      finnhubIndustry: "Technology",
      ipo: "1980-12-12",
      marketCapitalization: 3000000,
      shareOutstanding: 15500,
      ticker: "AAPL",
      weburl: "https://www.apple.com",
      logo: "",
      phone: "",
    },
    metrics: {
      metric: {
        "10DayAverageTradingVolume": 50,
        "13WeekPriceReturnDaily": 0.1,
        "26WeekPriceReturnDaily": 0.2,
        "3MonthAverageTradingVolume": 60,
        "52WeekHigh": 240,
        "52WeekHighDate": "2025-12-01",
        "52WeekLow": 160,
        "52WeekLowDate": "2025-04-01",
        "52WeekPriceReturnDaily": 0.15,
        beta: 1.2,
        currentRatioAnnual: 1,
        dividendYieldIndicatedAnnual: 0.005,
        epsGrowth3Y: 0.07,
        evToEbitdaAnnual: 21,
        evToRevenueAnnual: 7,
        forwardPE: 25,
        grossMarginAnnual: 0.45,
        netDebtToEbitdaAnnual: 0.7,
        netProfitMarginAnnual: 0.25,
        operatingMarginAnnual: 0.3,
        payoutRatioAnnual: 0.15,
        pbAnnual: 38,
        peTTM: 28,
        psTTM: 7.2,
        quickRatioAnnual: 0.9,
        returnOnAssetsAnnual: 0.27,
        returnOnEquityAnnual: 1.4,
        returnOnInvestedCapitalAnnual: 0.55,
      },
    },
    incomeStatements: [
      {
        calendarYear: "2025",
        revenue: 390000000000,
        grossProfit: 175000000000,
        operatingIncome: 120000000000,
        netIncome: 97000000000,
        ebitda: 140000000000,
        epsdiluted: 6.2,
        weightedAverageShsOutDil: 15500000000,
      },
      {
        calendarYear: "2024",
        revenue: 370000000000,
        grossProfit: 165000000000,
        operatingIncome: 110000000000,
        netIncome: 91000000000,
        epsdiluted: 5.9,
      },
      {
        calendarYear: "2023",
        revenue: 340000000000,
        grossProfit: 150000000000,
        operatingIncome: 98000000000,
        netIncome: 83000000000,
        epsdiluted: 5.4,
      },
      {
        calendarYear: "2022",
        revenue: 320000000000,
        grossProfit: 140000000000,
        operatingIncome: 90000000000,
        netIncome: 76000000000,
        epsdiluted: 4.8,
      },
    ],
    balanceSheets: [
      {
        calendarYear: "2025",
        totalAssets: 350000000000,
        totalDebt: 100000000000,
        totalStockholdersEquity: 70000000000,
        cashAndCashEquivalents: 50000000000,
      },
      { calendarYear: "2024", totalAssets: 330000000000, totalDebt: 95000000000, totalStockholdersEquity: 68000000000 },
      { calendarYear: "2023", totalAssets: 310000000000, totalDebt: 90000000000, totalStockholdersEquity: 66000000000 },
      { calendarYear: "2022", totalAssets: 300000000000, totalDebt: 85000000000, totalStockholdersEquity: 64000000000 },
    ],
    cashFlows: [
      {
        calendarYear: "2025",
        operatingCashFlow: 110000000000,
        freeCashFlow: 95000000000,
        capitalExpenditure: -15000000000,
      },
      { calendarYear: "2024", operatingCashFlow: 102000000000, freeCashFlow: 88000000000, capitalExpenditure: -14000000000 },
      { calendarYear: "2023", operatingCashFlow: 96000000000, freeCashFlow: 81000000000, capitalExpenditure: -13000000000 },
      { calendarYear: "2022", operatingCashFlow: 90000000000, freeCashFlow: 76000000000, capitalExpenditure: -12000000000 },
    ],
  });

  assert.equal(record.marketCap, 3000000000000);
  assert.equal(record.enterpriseValue, 3050000000000);
  assert.equal(record.valuation.peTTM, 28);
  assert.equal(record.valuation.fcfYield, 95000000000 / 3000000000000);
  assert.equal(record.cashFlow.capexToRevenue, 15000000000 / 390000000000);
  assert.equal(record.history.length, 4);
  assert.equal(record.warnings.length, 0);
});

test("normalizeEdgequityRecord converts provider percentage-point ratio fields to decimals", () => {
  const record = normalizeEdgequityRecord({
    ticker: "PCT",
    profile: { companyName: "Percent Co", mktCap: 100000000 },
    metrics: {
      metric: {
        grossMarginTTM: 45,
        operatingMarginTTM: 30,
        netProfitMarginTTM: 25,
        dividendYieldIndicatedAnnual: 0.5,
        payoutRatioAnnual: 15,
      },
    },
    incomeStatements: [{ calendarYear: "2025" }],
    balanceSheets: [{}],
    cashFlows: [{}],
  });

  assert.equal(record.profitability.grossMargin, 0.45);
  assert.equal(record.profitability.operatingMargin, 0.3);
  assert.equal(record.profitability.netMargin, 0.25);
  assert.equal(record.dividends.dividendYield, 0.5);
  assert.equal(record.dividends.payoutRatio, 0.15);
});

test("normalizeEdgequityRecord preserves provider ratio fields that are already decimals", () => {
  const record = normalizeEdgequityRecord({
    ticker: "DEC",
    profile: { companyName: "Decimal Co", mktCap: 100000000 },
    metrics: {
      metric: {
        grossMarginTTM: 0.45,
        operatingMarginTTM: 0.3,
        netProfitMarginTTM: 0.25,
        dividendYieldIndicatedAnnual: 0.005,
        payoutRatioAnnual: 0.15,
      },
    },
    incomeStatements: [{ calendarYear: "2025" }],
    balanceSheets: [{}],
    cashFlows: [{}],
  });

  assert.equal(record.profitability.grossMargin, 0.45);
  assert.equal(record.profitability.operatingMargin, 0.3);
  assert.equal(record.profitability.netMargin, 0.25);
  assert.equal(record.dividends.dividendYield, 0.005);
  assert.equal(record.dividends.payoutRatio, 0.15);
});

test("normalizeEdgequityRecord preserves valid decimal ratios above generic thresholds", () => {
  const record = normalizeEdgequityRecord({
    ticker: "HIGH",
    profile: { companyName: "High Return Co", mktCap: 100000000 },
    metrics: {
      metric: {
        returnOnEquityAnnual: 1.4,
        returnOnInvestedCapitalAnnual: 1.2,
        dividendYieldIndicatedAnnual: 0.12,
      },
    },
    incomeStatements: [{ calendarYear: "2025" }],
    balanceSheets: [{}],
    cashFlows: [{}],
  });

  assert.equal(record.profitability.roe, 1.4);
  assert.equal(record.profitability.roic, 1.2);
  assert.equal(record.dividends.dividendYield, 0.12);
});

test("normalizeEdgequityRecord returns null CAGR values when required history points are missing", () => {
  const record = normalizeEdgequityRecord({
    ticker: "SHORT",
    profile: { companyName: "Short History Co", mktCap: 100000000 },
    metrics: { metric: {} },
    incomeStatements: [
      { calendarYear: "2025", revenue: 130, epsdiluted: 1.3 },
      { calendarYear: "2024", revenue: 120, epsdiluted: 1.2 },
      { calendarYear: "2023", revenue: 110, epsdiluted: 1.1 },
    ],
    balanceSheets: [{}, {}, {}],
    cashFlows: [
      { calendarYear: "2025", freeCashFlow: 130 },
      { calendarYear: "2024", freeCashFlow: 120 },
      { calendarYear: "2023", freeCashFlow: 110 },
    ],
  });

  assert.equal(record.growth.revenueCagr3y, null);
  assert.equal(record.growth.revenueCagr5y, null);
  assert.equal(record.growth.epsCagr3y, null);
  assert.equal(record.growth.fcfCagr3y, null);
});

test("normalizeEdgequityRecord uses mktCap fallback and warnings preserve unavailable values as null", () => {
  const record = normalizeEdgequityRecord({
    ticker: "TEST",
    profile: { companyName: "Test Co", mktCap: 123000000 },
    metrics: { metric: {} },
    incomeStatements: [{ calendarYear: "2025", revenue: null }],
    balanceSheets: [{}],
    cashFlows: [{}],
  });

  assert.equal(record.name, "Test Co");
  assert.equal(record.marketCap, 123000000);
  assert.equal(record.valuation.peTTM, null);
  assert.equal(record.cashFlow.freeCashFlow, null);
  assert.deepEqual(record.warnings, ["P/E unavailable", "Less than three years of financial history"]);
});

test("buildWarnings reports missing valuation, market cap, and short history", () => {
  assert.deepEqual(buildWarnings({ peTTM: null, marketCap: null, historyLength: 2 }), [
    "P/E unavailable",
    "Market cap unavailable",
    "Less than three years of financial history",
  ]);
});
