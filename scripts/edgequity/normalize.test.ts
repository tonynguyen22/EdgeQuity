import assert from "node:assert/strict";
import test from "node:test";

import { buildWarnings, cagr, normalizeEdgequityRecord, normalizeNumber, ratio } from "./normalize.ts";
import { buildNormalizedSecStatements } from "./sec-normalized.ts";

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

test("normalizeEdgequityRecord builds annual history from five statement periods", () => {
  const stock = normalizeEdgequityRecord({
    ticker: "WMT",
    profile: { name: "Walmart Inc", currency: "USD", marketCapitalization: 700000 },
    metrics: { metric: { peTTM: 38, forwardPE: 30 } },
    incomeStatements: [
      { fiscalYear: "2026", revenue: 713200000000, grossProfit: 177500000000, operatingIncome: 29900000000, netIncome: 21900000000, epsdiluted: 2.4 },
      { fiscalYear: "2025", revenue: 681000000000, grossProfit: 169000000000, operatingIncome: 27600000000, netIncome: 19400000000, epsdiluted: 2.1 },
      { fiscalYear: "2024", revenue: 648000000000, grossProfit: 157000000000, operatingIncome: 27000000000, netIncome: 15500000000, epsdiluted: 1.9 },
      { fiscalYear: "2023", revenue: 611000000000, grossProfit: 147000000000, operatingIncome: 20400000000, netIncome: 11600000000, epsdiluted: 1.4 },
      { fiscalYear: "2022", revenue: 573000000000, grossProfit: 143000000000, operatingIncome: 25900000000, netIncome: 13600000000, epsdiluted: 1.5 },
    ],
    balanceSheets: [
      { fiscalYear: "2026", totalAssets: 284700000000, totalDebt: 62000000000, totalStockholdersEquity: 105900000000, cashAndCashEquivalents: 9700000000 },
    ],
    cashFlows: [
      { fiscalYear: "2026", operatingCashFlow: 41600000000, capitalExpenditure: -23000000000, freeCashFlow: 18600000000 },
    ],
  });

  assert.equal(stock.history.length, 5);
  assert.equal(stock.history[0]?.year, "2026");
  assert.equal(stock.history[0]?.revenue, 713200000000);
  assert.equal(stock.profitability.grossMargin, 177500000000 / 713200000000);
  assert.equal(stock.cashFlow.freeCashFlow, 18600000000);
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
        returnOnEquityAnnual: 140,
        returnOnAssetsAnnual: 28,
        returnOnInvestedCapitalAnnual: 35,
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
  assert.equal(record.profitability.roe, 1.4);
  assert.equal(record.profitability.roa, 0.28);
  assert.equal(record.profitability.roic, 0.35);
  assert.equal(record.dividends.dividendYield, 0.005);
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

test("normalizeEdgequityRecord normalizes Finnhub return and yield metrics from percentage points", () => {
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

  assert.ok(Math.abs((record.profitability.roe ?? 0) - 0.014) < 0.000001);
  assert.ok(Math.abs((record.profitability.roic ?? 0) - 0.012) < 0.000001);
  assert.equal(record.dividends.dividendYield, 0.0012);
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

test("buildNormalizedSecStatements maps SEC facts into summary statement rows", () => {
  const statements = buildNormalizedSecStatements({
    cik: 320193,
    entityName: "Apple Inc.",
    facts: {
      "us-gaap": {
        RevenueFromContractWithCustomerExcludingAssessedTax: {
          label: "Revenue",
          units: { USD: [{ fy: 2025, fp: "FY", form: "10-K", end: "2025-09-27", val: 416_161_000_000 }] },
        },
        GrossProfit: {
          label: "Gross Profit",
          units: { USD: [{ fy: 2025, fp: "FY", form: "10-K", end: "2025-09-27", val: 195_201_000_000 }] },
        },
        LongTermDebtCurrent: {
          label: "Current Debt",
          units: { USD: [{ fy: 2025, fp: "FY", form: "10-K", end: "2025-09-27", val: 9_982_000_000 }] },
        },
        LongTermDebtNoncurrent: {
          label: "Long-Term Debt",
          units: { USD: [{ fy: 2025, fp: "FY", form: "10-K", end: "2025-09-27", val: 78_852_000_000 }] },
        },
        NetCashProvidedByUsedInOperatingActivities: {
          label: "Operating Cash Flow",
          units: { USD: [{ fy: 2025, fp: "FY", form: "10-K", end: "2025-09-27", val: 111_482_000_000 }] },
        },
        PaymentsToAcquirePropertyPlantAndEquipment: {
          label: "Capital Expenditures",
          units: { USD: [{ fy: 2025, fp: "FY", form: "10-K", end: "2025-09-27", val: 12_715_000_000 }] },
        },
      },
    },
  });

  assert.equal(statements.status, "ok");
  assert.equal(statements.annual.incomeStatements[0]?.revenue, 416_161_000_000);
  assert.equal(statements.annual.incomeStatements[0]?.grossProfit, 195_201_000_000);
  assert.equal(statements.annual.balanceSheets[0]?.totalDebt, 88_834_000_000);
  assert.equal(statements.annual.cashFlows[0]?.freeCashFlow, 98_767_000_000);
});

test("buildNormalizedSecStatements chooses the freshest concept when SEC labels change", () => {
  const statements = buildNormalizedSecStatements({
    cik: 1_652_044,
    entityName: "Alphabet Inc.",
    facts: {
      "us-gaap": {
        RevenueFromContractWithCustomerExcludingAssessedTax: {
          label: "Revenue from Contract with Customer, Excluding Assessed Tax",
          units: {
            USD: [
              { fy: 2021, fp: "FY", form: "10-K", end: "2021-01-31", val: 16_675_000_000 },
              { fy: 2022, fp: "FY", form: "10-K", start: "2022-01-01", end: "2022-12-31", val: 282_836_000_000 },
              { fy: 2024, fp: "FY", form: "10-K", start: "2024-01-01", end: "2024-12-31", val: 350_018_000_000 },
            ],
          },
        },
        Revenues: {
          label: "Revenues",
          units: {
            USD: [
              { fy: 2021, fp: "FY", form: "10-K", start: "2021-01-01", end: "2021-12-31", val: 257_637_000_000 },
              { fy: 2025, fp: "FY", form: "10-K", start: "2023-01-01", end: "2023-12-31", val: 307_394_000_000 },
              { fy: 2025, fp: "FY", form: "10-K", start: "2024-01-01", end: "2024-12-31", val: 350_018_000_000 },
              { fy: 2025, fp: "FY", form: "10-K", start: "2025-01-01", end: "2025-12-31", val: 402_836_000_000 },
            ],
          },
        },
        NetCashProvidedByUsedInOperatingActivities: {
          label: "Operating Cash Flow",
          units: { USD: [{ fy: 2025, fp: "FY", form: "10-K", start: "2025-01-01", end: "2025-12-31", val: 100_000_000_000 }] },
        },
        PaymentsToAcquirePropertyPlantAndEquipment: {
          label: "Old Capital Expenditures",
          units: { USD: [{ fy: 2011, fp: "FY", form: "10-K", end: "2011-01-30", val: 98_000_000 }] },
        },
        PaymentsToAcquireProductiveAssets: {
          label: "Payments to Acquire Productive Assets",
          units: { USD: [{ fy: 2025, fp: "FY", form: "10-K", start: "2025-01-01", end: "2025-12-31", val: 6_042_000_000 }] },
        },
      },
    },
  });

  assert.equal(statements.annual.incomeStatements[0]?.fiscalYear, "2025");
  assert.equal(statements.annual.incomeStatements[0]?.revenue, 402_836_000_000);
  assert.equal(statements.annual.incomeStatements[1]?.fiscalYear, "2024");
  assert.equal(statements.annual.incomeStatements[1]?.revenue, 350_018_000_000);
  assert.equal(statements.annual.incomeStatements[2]?.fiscalYear, "2023");
  assert.equal(statements.annual.incomeStatements[2]?.revenue, 307_394_000_000);
  assert.equal(statements.annual.incomeStatements[3]?.fiscalYear, "2022");
  assert.equal(statements.annual.incomeStatements[3]?.revenue, 282_836_000_000);
  assert.equal(statements.annual.cashFlows[0]?.capitalExpenditure, 6_042_000_000);
  assert.equal(statements.annual.cashFlows[0]?.freeCashFlow, 93_958_000_000);
});

test("buildNormalizedSecStatements preserves non-calendar fiscal year labels", () => {
  const statements = buildNormalizedSecStatements({
    cik: 1_045_810,
    entityName: "NVIDIA Corporation",
    facts: {
      "us-gaap": {
        Revenues: {
          label: "Revenues",
          units: {
            USD: [
              {
                fy: 2026,
                fp: "FY",
                form: "10-K",
                start: "2025-01-27",
                end: "2026-01-25",
                val: 215_938_000_000,
                frame: "CY2025",
              },
              {
                fy: 2026,
                fp: "FY",
                form: "10-K",
                start: "2026-01-26",
                end: "2026-04-27",
                val: 44_062_000_000,
              },
            ],
          },
        },
      },
    },
  });

  assert.equal(statements.annual.incomeStatements[0]?.fiscalYear, "2026");
  assert.equal(statements.annual.incomeStatements[0]?.revenue, 215_938_000_000);
});

test("buildNormalizedSecStatements prefers the latest full annual fact inside repeated fiscal-year buckets", () => {
  const statements = buildNormalizedSecStatements({
    cik: 789_019,
    entityName: "Microsoft Corporation",
    facts: {
      "us-gaap": {
        RevenueFromContractWithCustomerExcludingAssessedTax: {
          label: "Revenue from Contract with Customer, Excluding Assessed Tax",
          units: {
            USD: [
              { fy: 2025, fp: "FY", form: "10-K", start: "2022-07-01", end: "2023-06-30", val: 211_915_000_000, frame: "CY2023" },
              { fy: 2025, fp: "FY", form: "10-K", start: "2023-07-01", end: "2024-06-30", val: 245_122_000_000, frame: "CY2024" },
              { fy: 2025, fp: "FY", form: "10-K", start: "2024-07-01", end: "2025-06-30", val: 281_724_000_000, frame: "CY2025" },
              { fy: 2025, fp: "FY", form: "10-K", start: "2025-01-01", end: "2025-03-31", val: 70_066_000_000 },
            ],
          },
        },
      },
    },
  });

  assert.equal(statements.annual.incomeStatements[0]?.fiscalYear, "2025");
  assert.equal(statements.annual.incomeStatements[0]?.revenue, 281_724_000_000);
});

test("buildNormalizedSecStatements dedupes calendar quarterly facts by reporting period", () => {
  const statements = buildNormalizedSecStatements({
    cik: 1_652_044,
    entityName: "Alphabet Inc.",
    facts: {
      "us-gaap": {
        Revenues: {
          label: "Revenues",
          units: {
            USD: [
              { fy: 2026, fp: "Q1", form: "10-Q", start: "2025-01-01", end: "2025-03-31", val: 90_234_000_000, frame: "CY2025Q1" },
              { fy: 2025, fp: "Q3", form: "10-Q", start: "2025-01-01", end: "2025-09-30", val: 289_007_000_000 },
              { fy: 2025, fp: "Q3", form: "10-Q", start: "2025-07-01", end: "2025-09-30", val: 102_346_000_000, frame: "CY2025Q3" },
              { fy: 2026, fp: "Q1", form: "10-Q", start: "2026-01-01", end: "2026-03-31", val: 109_896_000_000, frame: "CY2026Q1" },
            ],
          },
        },
      },
    },
  });

  assert.equal(statements.quarterly.incomeStatements[0]?.fiscalYear, "2026");
  assert.equal(statements.quarterly.incomeStatements[0]?.period, "Q1");
  assert.equal(statements.quarterly.incomeStatements[0]?.revenue, 109_896_000_000);
  assert.equal(statements.quarterly.incomeStatements[1]?.fiscalYear, "2025");
  assert.equal(statements.quarterly.incomeStatements[1]?.period, "Q3");
  assert.equal(statements.quarterly.incomeStatements[1]?.revenue, 102_346_000_000);
});

test("buildNormalizedSecStatements keeps up to twenty quarterly facts for charts", () => {
  const quarters = Array.from({ length: 8 }, (_, index) => {
    const year = 2024 + Math.floor(index / 4);
    const quarter = (index % 4) + 1;
    return {
      fy: year,
      fp: `Q${quarter}`,
      form: "10-Q",
      start: `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}-01`,
      end: `${year}-${String(quarter * 3).padStart(2, "0")}-30`,
      val: 10_000_000_000 + index,
      frame: `CY${year}Q${quarter}`,
    };
  });
  const statements = buildNormalizedSecStatements({
    cik: 1,
    entityName: "Twenty Quarter Test Inc.",
    facts: {
      "us-gaap": {
        Revenues: {
          label: "Revenues",
          units: { USD: quarters },
        },
      },
    },
  });

  assert.equal(statements.quarterly.incomeStatements.length, 8);
  assert.equal(statements.quarterly.incomeStatements.at(0)?.fiscalYear, "2025");
  assert.equal(statements.quarterly.incomeStatements.at(-1)?.fiscalYear, "2024");
});

test("buildNormalizedSecStatements preserves fiscal quarter labels for non-calendar filers", () => {
  const statements = buildNormalizedSecStatements({
    cik: 789_019,
    entityName: "Microsoft Corporation",
    facts: {
      "us-gaap": {
        RevenueFromContractWithCustomerExcludingAssessedTax: {
          label: "Revenue from Contract with Customer, Excluding Assessed Tax",
          units: {
            USD: [
              { fy: 2026, fp: "Q3", form: "10-Q", start: "2025-07-01", end: "2026-03-31", val: 205_283_000_000 },
              { fy: 2026, fp: "Q3", form: "10-Q", start: "2026-01-01", end: "2026-03-31", val: 70_066_000_000, frame: "CY2026Q1" },
            ],
          },
        },
      },
    },
  });

  assert.equal(statements.quarterly.incomeStatements[0]?.fiscalYear, "2026");
  assert.equal(statements.quarterly.incomeStatements[0]?.period, "Q3");
  assert.equal(statements.quarterly.incomeStatements[0]?.revenue, 70_066_000_000);
});
