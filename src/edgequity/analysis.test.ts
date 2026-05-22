import assert from 'node:assert/strict';
import test from 'node:test';

import { EDGEQUITY_RESEARCH_BATCH_TICKERS, getEdgequityAnalysisNote } from './analysis.ts';

test('getEdgequityAnalysisNote returns static note for a starter ticker', () => {
  const note = getEdgequityAnalysisNote('AAPL');

  assert.equal(note?.ticker, 'AAPL');
  assert.equal(note?.strengths.length, 2);
  assert.equal(note?.watchItems.length, 2);
  assert.match(note?.quickTake ?? '', /Apple/);
});

test('getEdgequityAnalysisNote returns null for tickers without session-written notes', () => {
  assert.equal(getEdgequityAnalysisNote('NFLX'), null);
});

test('research workflow batch includes ten transcript-informed reports', () => {
  assert.deepEqual(EDGEQUITY_RESEARCH_BATCH_TICKERS, [
    'AAPL',
    'AMZN',
    'COST',
    'GOOGL',
    'JPM',
    'META',
    'MSFT',
    'NVDA',
    'TSLA',
    'V',
  ]);

  for (const ticker of EDGEQUITY_RESEARCH_BATCH_TICKERS) {
    const research = getEdgequityAnalysisNote(ticker)?.research;

    assert.ok(research, `${ticker} should include a research report`);
    assert.equal(research.earningsTakeaways.length, 3);
    assert.equal(research.moatPoints.length, 5);
    assert.equal(research.riskPoints.length, 5);
    assert.match(research.sourceUrl, /^https:\/\//);
  }
});

test('Alphabet research report is educational and not a buy/sell pitch', () => {
  const research = getEdgequityAnalysisNote('GOOGL')?.research;

  assert.ok(research);
  assert.match(research.businessSummary.join(' '), /how Alphabet makes money/i);
  assert.match(research.coreSegmentBody.join(' '), /Google Services/i);
  assert.doesNotMatch(research.finalVerdict, /\bBUY\b|\bSELL\b/);
});

test('NVIDIA research report reflects the Q1 FY2027 earnings update', () => {
  const research = getEdgequityAnalysisNote('NVDA')?.research;

  assert.ok(research);
  assert.equal(research.earningsDate, 'May 20, 2026');
  assert.match(research.earningsTitle, /Q1 FY2027/);
  assert.match(research.earningsTakeaways.join(' '), /\$81\.6B/);
  assert.match(research.coreSegmentBody.join(' '), /Data Center networking revenue reached \$14\.8B/);
  assert.equal(research.valuationModel?.basePriceTarget, 275);
});
