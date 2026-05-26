export const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export type FinnhubProfile = {
  ticker?: string;
  name?: string;
  exchange?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
  currency?: string;
  shareOutstanding?: number;
  weburl?: string;
  logo?: string;
};

export type FinnhubQuote = {
  c?: number;
};

export type FinnhubMetricPayload = {
  metric?: Record<string, number | string | null>;
};

const ADR_RATIO_BY_TICKER: Record<string, number> = {
  TSM: 5,
};

export function buildFinnhubUrl(pathname: string, params: Record<string, string>, token: string): URL {
  const url = new URL(`${FINNHUB_BASE_URL}${pathname}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  url.searchParams.set("token", token);
  return url;
}

export function normalizeFinnhubMarketCap(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value * 1_000_000 : null;
}

export function normalizeFinnhubMarketCapUsd({
  ticker,
  profile,
  quotePrice,
}: {
  ticker: string;
  profile: FinnhubProfile;
  quotePrice?: number | null;
}): number | null {
  const marketCap = normalizeFinnhubMarketCap(profile.marketCapitalization);
  const currency = profile.currency?.toUpperCase();

  if (!currency || currency === "USD") return marketCap;
  if (typeof quotePrice !== "number" || !Number.isFinite(quotePrice)) return marketCap;
  if (typeof profile.shareOutstanding !== "number" || !Number.isFinite(profile.shareOutstanding)) return marketCap;

  const adrRatio = ADR_RATIO_BY_TICKER[ticker.toUpperCase()] ?? 1;
  return Math.round(quotePrice * profile.shareOutstanding * 1_000_000 / adrRatio);
}

export async function fetchFinnhubJson<T>(url: URL): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Finnhub request failed ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json() as Promise<T>;
}
