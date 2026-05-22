import assert from "node:assert/strict";
import test from "node:test";

import { buildFundamentalsChartsDocument } from "./fundamentals-charts.ts";
import { pickBetterQuarterFact, pickQuarterlyUsdRows } from "./sec-edgar.ts";
import { resolveSecMetricSeries } from "./sec-metric-resolver.ts";

test("pickBetterQuarterFact prefers fiscal quarter over YTD cumulative", () => {
  const ytd = {
    end: "2025-07-27",
    start: "2025-01-27",
    fp: "Q2",
    fy: 2026,
    val: 90_805_000_000,
  };
  const quarter = {
    end: "2025-07-27",
    start: "2025-04-28",
    fp: "Q2",
    fy: 2026,
    val: 46_743_000_000,
  };
  const picked = pickBetterQuarterFact(ytd, quarter);
  assert.equal(picked.val, 46_743_000_000);
});

test("resolveSecMetricSeries picks Revenues with latest fiscal years for NVDA", async () => {
  const ua = process.env.SEC_USER_AGENT ?? "Edgequity/1.0 (research@edgequity.local)";
  const response = await fetch("https://data.sec.gov/api/xbrl/companyfacts/CIK0001045810.json", {
    headers: { "User-Agent": ua, Accept: "application/json" },
  });
  assert.equal(response.ok, true);
  const facts = (await response.json()) as { facts: import("./sec-edgar.ts").CompanyFactsPayload["facts"] };

  const hit = resolveSecMetricSeries(facts.facts, {
    metricId: "revenue",
    preferredConcepts: [
      "Revenues",
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "SalesRevenueNet",
      "Revenue",
    ],
  });
  assert.ok(hit);
  assert.equal(hit.concept, "Revenues");

  const quarterly = pickQuarterlyUsdRows(hit.series);
  assert.ok(quarterly.length >= 4);
  for (let i = 1; i < quarterly.length; i++) {
    assert.ok(quarterly[i]!.end >= quarterly[i - 1]!.end, "quarterly ends should ascend by time");
  }
  const ytdRow = quarterly.find(
    (row) => row.end === "2025-07-27" && row.start === "2025-01-27" && row.val > 80_000_000_000,
  );
  assert.equal(ytdRow, undefined, "should not keep YTD duplicate for Jul-2025");
});

test("buildFundamentalsChartsDocument NVDA revenue quarterly is not YTD-inflated", async () => {
  const ua = process.env.SEC_USER_AGENT ?? "Edgequity/1.0 (research@edgequity.local)";
  const response = await fetch("https://data.sec.gov/api/xbrl/companyfacts/CIK0001045810.json", {
    headers: { "User-Agent": ua, Accept: "application/json" },
  });
  const facts = (await response.json()) as import("./sec-edgar.ts").CompanyFactsPayload;
  const document = buildFundamentalsChartsDocument("NVDA", facts, null, null);
  const revenue = document.sections
    .find((section) => section.id === "growth")
    ?.metrics.find((metric) => metric.id === "revenue");
  assert.ok(revenue);
  const q2 = revenue.quarterly.find((point) => point.period === "2026-Q2");
  assert.ok(q2);
  assert.ok(q2.value < 60_000_000_000);
});
