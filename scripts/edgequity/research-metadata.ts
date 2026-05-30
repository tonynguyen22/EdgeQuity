import type { EdgequityEarningsMetadata, EdgequityTranscriptMetadata } from "../../src/edgequity/types.ts";
import { fetchDolthubRows } from "./dolthub.ts";
import { buildFinnhubUrl, fetchFinnhubJson } from "./finnhub.ts";

type DoltCalendarRow = {
  act_symbol: string;
  date: string;
  when: string | null;
};

type FinnhubEarningsRow = {
  symbol?: string;
  date?: string;
  hour?: string;
  year?: number;
  quarter?: number;
};

type FinnhubTranscriptList = {
  transcript?: Array<{
    id?: string;
    title?: string;
    time?: string;
    year?: number;
    quarter?: number;
  }>;
};

function periodFromQuarter(year: unknown, quarter: unknown): string {
  return typeof year === "number" && typeof quarter === "number" ? `Q${quarter} ${year}` : "Earnings";
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export async function buildEarningsMetadata(
  ticker: string,
  token: string,
  today = new Date(),
): Promise<EdgequityEarningsMetadata> {
  const fetchedAt = new Date().toISOString();
  const todayText = today.toISOString().slice(0, 10);

  try {
    const url = buildFinnhubUrl("/calendar/earnings", { symbol: ticker }, token);
    const payload = await fetchFinnhubJson<{ earningsCalendar?: FinnhubEarningsRow[] }>(url);
    const rows = (payload.earningsCalendar ?? [])
      .filter((row) => typeof row.date === "string")
      .sort((left, right) => String(left.date).localeCompare(String(right.date)));
    const recent = [...rows].reverse().find((row) => String(row.date) <= todayText);
    const next = rows.find((row) => String(row.date) > todayText);

    if (recent || next) {
      return {
        recent: recent
          ? {
            period: periodFromQuarter(recent.year, recent.quarter),
            date: String(recent.date),
            source: "Finnhub",
            sourceUrl: "https://finnhub.io",
          }
          : null,
        next: next
          ? {
            period: periodFromQuarter(next.year, next.quarter),
            date: String(next.date),
            isEstimated: true,
            source: "Finnhub",
            sourceUrl: "https://finnhub.io",
          }
          : null,
        updatedAt: fetchedAt,
      };
    }
  } catch {
    // Fall through to DoltHub when Finnhub calendar data is unavailable.
  }

  const rows = await fetchDolthubRows<DoltCalendarRow>(
    `SELECT * FROM earnings_calendar WHERE act_symbol='${escapeSqlString(ticker)}' ORDER BY date DESC LIMIT 12`,
  );
  const recent = rows.find((row) => row.date <= todayText) ?? null;
  const next = [...rows].reverse().find((row) => row.date > todayText) ?? null;

  return {
    recent: recent
      ? {
        period: "Recent earnings",
        date: recent.date,
        source: "DoltHub",
        sourceUrl: "https://www.dolthub.com/repositories/post-no-preference/earnings",
      }
      : null,
    next: next
      ? {
        period: "Next earnings",
        date: next.date,
        isEstimated: true,
        source: "DoltHub",
        sourceUrl: "https://www.dolthub.com/repositories/post-no-preference/earnings",
      }
      : null,
    updatedAt: fetchedAt,
  };
}

export async function buildTranscriptMetadata(ticker: string, token: string): Promise<EdgequityTranscriptMetadata> {
  const fetchedAt = new Date().toISOString();

  try {
    const url = buildFinnhubUrl("/stock/transcripts/list", { symbol: ticker }, token);
    const payload = await fetchFinnhubJson<FinnhubTranscriptList>(url);
    const latest = payload.transcript?.[0];

    if (latest?.id || latest?.title) {
      return {
        status: "found",
        title: latest.title ?? `${ticker} latest earnings call transcript`,
        date: latest.time ? latest.time.slice(0, 10) : null,
        source: "Finnhub",
        sourceUrl: "https://finnhub.io",
        fetchedAt,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      title: null,
      date: null,
      source: "Finnhub",
      sourceUrl: "https://finnhub.io",
      fetchedAt,
      message,
    };
  }

  return {
    status: "missing",
    title: null,
    date: null,
    source: null,
    sourceUrl: null,
    fetchedAt,
    message: "Transcript metadata was not available from Finnhub free endpoints during refresh.",
  };
}
