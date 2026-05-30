import assert from 'node:assert/strict';
import test from 'node:test';

import handler from './edgequity/finnhub-snapshot.js';

function createResponse() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    end(body) {
      this.body = body;
      return this;
    },
  };
}

test('finnhub snapshot handler returns 405 for non-GET requests', async () => {
  const response = createResponse();

  await handler({ method: 'POST', url: '/api/edgequity/finnhub-snapshot?ticker=NVDA', headers: {} }, response);

  assert.equal(response.statusCode, 405);
  assert.deepEqual(JSON.parse(response.body), { error: 'Method not allowed' });
});

test('finnhub snapshot handler returns 400 for invalid ticker', async () => {
  const response = createResponse();

  await handler({ method: 'GET', url: '/api/edgequity/finnhub-snapshot?ticker=../secret', headers: {} }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), { error: 'Invalid ticker' });
});
