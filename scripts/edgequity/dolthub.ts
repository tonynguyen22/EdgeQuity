export const DOLTHUB_EARNINGS_API_BASE = "https://www.dolthub.com/api/v1alpha1/post-no-preference/earnings/master";

export function buildDolthubSqlUrl(sql: string): URL {
  const url = new URL(DOLTHUB_EARNINGS_API_BASE);
  url.searchParams.set("q", sql);
  return url;
}

export function normalizeDolthubStatementValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchDolthubRows<T extends Record<string, unknown>>(sql: string): Promise<T[]> {
  const response = await fetch(buildDolthubSqlUrl(sql));

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DoltHub request failed ${response.status}: ${body.slice(0, 200)}`);
  }

  const payload = await response.json() as {
    query_execution_status?: string;
    query_execution_message?: string;
    rows?: T[];
  };

  if (payload.query_execution_status !== "Success") {
    throw new Error(payload.query_execution_message ?? "DoltHub query failed");
  }

  return payload.rows ?? [];
}
