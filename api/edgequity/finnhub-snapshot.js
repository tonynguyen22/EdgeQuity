import path from 'node:path';

import { buildFinnhubSnapshot, isValidTicker } from '../edgequity-finnhub-cache.js';

function sendJson(response, statusCode, payload, headers = {}) {
  response.status(statusCode).setHeader('Content-Type', 'application/json');
  for (const [key, value] of Object.entries(headers)) {
    response.setHeader(key, value);
  }
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  const requestUrl = new URL(request.url, `https://${request.headers.host ?? 'localhost'}`);

  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  const ticker = requestUrl.searchParams.get('ticker') ?? '';
  if (!isValidTicker(ticker)) {
    return sendJson(response, 400, { error: 'Invalid ticker' });
  }

  try {
    const snapshot = await buildFinnhubSnapshot({
      ticker,
      token: process.env.FINNHUB_API_KEY,
      cacheDir: process.env.EDGEQUITY_CACHE_DIR ?? path.join('/tmp', 'edgequity-finnhub-cache'),
    });
    sendJson(response, 200, snapshot, { 'Cache-Control': 'private, max-age=30' });
  } catch {
    sendJson(response, 502, { error: 'Failed to fetch Finnhub snapshot' });
  }
}
