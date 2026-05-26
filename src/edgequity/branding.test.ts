import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('document uses the Edgequity shield SVG as the browser favicon', () => {
  const html = readFileSync('index.html', 'utf8');

  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="\/edgequity-mark.svg" \/>/);
});

test('header brand mark is sized larger than the first logo draft', () => {
  const css = readFileSync('src/index.css', 'utf8');

  assert.match(css, /\.eq-brand-logo svg\s*\{[\s\S]*height: 2\.85rem;[\s\S]*width: 2\.85rem;/);
});

test('fundamentals chart hover target receives pointer input', () => {
  const css = readFileSync('src/index.css', 'utf8');

  assert.match(css, /\.eq-fundamentals-chart-point\s*\{[\s\S]*pointer-events: none;/);
  assert.match(css, /\.eq-fundamentals-chart-hit\s*\{[\s\S]*pointer-events: all;/);
});
