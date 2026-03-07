type ProxyPayload = {
  url?: string;
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  };
};

function json(statusCode: number, message: string) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

function shouldSet(value: string | null) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'undefined' || normalized === 'null';
}

function setQueryKey(url: URL, key: string, value: string | undefined) {
  if (!value) return;
  if (shouldSet(url.searchParams.get(key))) {
    url.searchParams.set(key, value);
  }
}

function setHeader(headers: Headers, key: string, value: string | undefined) {
  if (!value) return;
  const existing = headers.get(key);
  if (shouldSet(existing)) {
    headers.set(key, value);
  }
}

function applyProviderAuth(url: URL, headers: Headers, body: string | undefined): string | undefined {
  const host = url.hostname.toLowerCase();
  const fmpKey = process.env.FMP_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;
  const massiveKey = process.env.MASSIVE_API_KEY;
  const polygonKey = process.env.POLYGON_API_KEY;
  const twelveKey = process.env.TWELVE_API_KEY;
  const alphaKey = process.env.ALPHAVANTAGE_API_KEY;
  const taapiKey = process.env.TAAPI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (host === 'financialmodelingprep.com') {
    setQueryKey(url, 'apikey', fmpKey);
    return body;
  }
  if (host === 'finnhub.io') {
    setQueryKey(url, 'token', finnhubKey);
    return body;
  }
  if (host === 'api.massive.com') {
    setQueryKey(url, 'apiKey', massiveKey);
    return body;
  }
  if (host === 'api.polygon.io') {
    setQueryKey(url, 'apiKey', polygonKey);
    return body;
  }
  if (host === 'api.twelvedata.com') {
    setQueryKey(url, 'apikey', twelveKey);
    return body;
  }
  if (host === 'www.alphavantage.co') {
    setQueryKey(url, 'apikey', alphaKey);
    return body;
  }
  if (host === 'api.taapi.io') {
    if (!body || !taapiKey) return body;
    try {
      const parsed = JSON.parse(body);
      if (parsed && shouldSet(typeof parsed.secret === 'string' ? parsed.secret : null)) {
        parsed.secret = taapiKey;
      }
      return JSON.stringify(parsed);
    } catch {
      return body;
    }
  }
  if (host === 'api.shopaikey.com' || host === 'generativelanguage.googleapis.com') {
    if (geminiKey) {
      setHeader(headers, 'Authorization', `Bearer ${geminiKey}`);
      setQueryKey(url, 'key', geminiKey);
    }
    return body;
  }

  return body;
}

const ALLOWED_HOSTS = new Set([
  'financialmodelingprep.com',
  'finnhub.io',
  'api.massive.com',
  'api.polygon.io',
  'api.twelvedata.com',
  'www.alphavantage.co',
  'api.taapi.io',
  'api.shopaikey.com',
  'generativelanguage.googleapis.com',
]);

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') return json(405, 'Method not allowed');
  if (!event.body) return json(400, 'Missing request body');

  let payload: ProxyPayload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return json(400, 'Invalid JSON body');
  }

  if (!payload.url) return json(400, 'Missing target URL');

  let target: URL;
  try {
    target = new URL(payload.url);
  } catch {
    return json(400, 'Invalid target URL');
  }

  if (!ALLOWED_HOSTS.has(target.hostname.toLowerCase())) {
    return json(403, 'Target host is not allowed');
  }

  const method = payload.init?.method || 'GET';
  const headers = new Headers(payload.init?.headers || {});
  let body = payload.init?.body;

  body = applyProviderAuth(target, headers, body);

  try {
    const upstream = await fetch(target.toString(), {
      method,
      headers,
      body,
    });
    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'text/plain';
    return {
      statusCode: upstream.status,
      headers: {
        'Content-Type': contentType,
      },
      body: text,
    };
  } catch {
    return json(502, 'Failed to reach upstream API');
  }
};
