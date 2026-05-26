import assert from 'node:assert/strict';
import test from 'node:test';

import { getEdgequityAnalysisNote } from './analysis.ts';

test('getEdgequityAnalysisNote returns null while the research workflow is paused', () => {
  assert.equal(getEdgequityAnalysisNote('AAPL'), null);
  assert.equal(getEdgequityAnalysisNote('NVDA'), null);
});
