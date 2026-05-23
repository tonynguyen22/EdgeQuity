const ALLOWED_HOSTS = new Set([
  'finnhub.io',
  'api.massive.com',
  'api.polygon.io',
  'api.twelvedata.com',
  'www.alphavantage.co',
  'api.taapi.io',
  'api.shopaikey.com',
  'api-v2.shopaikey.com',
  'generativelanguage.googleapis.com',
]);

function shouldSet(value) {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '' || normalized === 'undefined' || normalized === 'null';
}

function setQueryKey(url, key, value) {
  if (!value) return;
  if (shouldSet(url.searchParams.get(key))) {
    url.searchParams.set(key, value);
  }
}

function setHeader(headers, key, value) {
  if (!value) return;
  const existing = headers.get(key);
  if (shouldSet(existing)) {
    headers.set(key, value);
  }
}

function applyProviderAuth(url, headers, body) {
  const host = url.hostname.toLowerCase();

  if (host === 'finnhub.io') {
    setQueryKey(url, 'token', process.env.FINNHUB_API_KEY);
    return body;
  }
  if (host === 'api.massive.com') {
    setQueryKey(url, 'apiKey', process.env.MASSIVE_API_KEY);
    return body;
  }
  if (host === 'api.polygon.io') {
    setQueryKey(url, 'apiKey', process.env.POLYGON_API_KEY);
    return body;
  }
  if (host === 'api.twelvedata.com') {
    setQueryKey(url, 'apikey', process.env.TWELVE_API_KEY);
    return body;
  }
  if (host === 'www.alphavantage.co') {
    setQueryKey(url, 'apikey', process.env.ALPHAVANTAGE_API_KEY);
    return body;
  }
  if (host === 'api.taapi.io') {
    if (!body || !process.env.TAAPI_API_KEY) return body;
    try {
      const parsed = JSON.parse(body);
      if (parsed && shouldSet(typeof parsed.secret === 'string' ? parsed.secret : null)) {
        parsed.secret = process.env.TAAPI_API_KEY;
      }
      return JSON.stringify(parsed);
    } catch {
      return body;
    }
  }
  if (host === 'api.shopaikey.com' || host === 'api-v2.shopaikey.com' || host === 'generativelanguage.googleapis.com') {
    if (process.env.GEMINI_API_KEY) {
      setHeader(headers, 'Authorization', `Bearer ${process.env.GEMINI_API_KEY}`);
      setQueryKey(url, 'key', process.env.GEMINI_API_KEY);
    }
    return body;
  }

  return body;
}

function sendJson(response, statusCode, message) {
  response.status(statusCode).setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ error: message }));
}

function parsePayload(request) {
  if (!request.body) return null;
  if (typeof request.body === 'string') return JSON.parse(request.body);
  return request.body;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, 'Method not allowed');

  let payload;
  try {
    payload = parsePayload(request);
  } catch {
    return sendJson(response, 400, 'Invalid JSON body');
  }

  if (!payload?.url) return sendJson(response, 400, 'Missing target URL');

  let target;
  try {
    target = new URL(payload.url);
  } catch {
    return sendJson(response, 400, 'Invalid target URL');
  }

  if (!ALLOWED_HOSTS.has(target.hostname.toLowerCase())) {
    return sendJson(response, 403, 'Target host is not allowed');
  }

  const method = payload.init?.method || 'GET';
  const headers = new Headers(payload.init?.headers || {});
  const body = applyProviderAuth(target, headers, payload.init?.body);

  try {
    const upstream = await fetch(target.toString(), { method, headers, body });
    const text = await upstream.text();
    response.status(upstream.status).setHeader('Content-Type', upstream.headers.get('content-type') || 'text/plain');
    response.end(text);
  } catch {
    sendJson(response, 502, 'Failed to reach upstream API');
  }
}
