import assert from "node:assert/strict";
import test from "node:test";

import { cagr, normalizeNumber, ratio } from "./normalize.ts";

test("ratio returns null when denominator is zero or missing", () => {
  assert.equal(ratio(10, 0), null);
  assert.equal(ratio(10, null), null);
  assert.equal(ratio(null, 10), null);
});

test("ratio returns numerator divided by denominator", () => {
  assert.equal(ratio(25, 100), 0.25);
});

test("cagr returns null for invalid inputs", () => {
  assert.equal(cagr(0, 100, 3), null);
  assert.equal(cagr(100, 0, 3), null);
  assert.equal(cagr(100, 200, 0), null);
});

test("cagr calculates annual growth rate", () => {
  assert.equal(Number(cagr(100, 133.1, 3)?.toFixed(3)), 0.1);
});

test("normalizeNumber returns finite numbers and null otherwise", () => {
  assert.equal(normalizeNumber(undefined), null);
  assert.equal(normalizeNumber(Number.NaN), null);
  assert.equal(normalizeNumber(42), 42);
});
