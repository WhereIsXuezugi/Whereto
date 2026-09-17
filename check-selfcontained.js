#!/usr/bin/env node
/**
 * Where to? ships as one file that works offline.
 * This guard fails the build if anything sneaks in that would need the network.
 *
 *   node scripts/check-selfcontained.js
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(APP, 'utf8');

const problems = [];
const notes = [];

// 1. No external scripts or stylesheets.
const externalScript = /<script[^>]+src\s*=/i.exec(html);
if (externalScript) problems.push('external <script src> found: ' + externalScript[0]);

const externalSheet = /<link[^>]+rel\s*=\s*["']?stylesheet/i.exec(html);
if (externalSheet) problems.push('external stylesheet <link> found: ' + externalSheet[0]);

// 2. No remote URLs in resource attributes (src/href), except anchor links.
const attrs = html.match(/\b(?:src|href)\s*=\s*"([^"]*)"/gi) || [];
for (const raw of attrs) {
  const value = raw.replace(/^[^"]*"/, '').replace(/"$/, '');
  if (!/^https?:\/\//i.test(value)) continue;
  const tagStart = html.lastIndexOf('<', html.indexOf(raw));
  const tag = html.slice(tagStart, tagStart + 3).toLowerCase();
  if (tag.startsWith('<a')) continue; // links the user clicks are fine
  problems.push('remote resource referenced: ' + value);
}

// 3. No runtime network calls.
for (const api of ['fetch(', 'XMLHttpRequest', 'importScripts(', 'WebSocket(']) {
  if (html.includes(api)) problems.push('network API used: ' + api);
}

// 4. No browser storage beyond localStorage (documented behaviour).
if (/\bindexedDB\b/.test(html)) problems.push('indexedDB used; the app documents localStorage only');

// 5. Structure sanity.
const count = (re) => (html.match(re) || []).length;
if (count(/<!DOCTYPE html>/gi) !== 1) problems.push('expected exactly one doctype');
if (count(/<\/html>/gi) !== 1) problems.push('expected exactly one </html>');
if (count(/<script>/gi) !== count(/<\/script>/gi)) problems.push('unbalanced <script> tags');
if (!/<h1[^>]*>/i.test(html)) problems.push('no <h1> on the page');
if (!/<html lang=/i.test(html)) problems.push('<html> is missing a lang attribute');

// 6. Images must declare intrinsic size so the layout never jumps.
const imgs = html.match(/<img\b[^>]*>/gi) || [];
for (const img of imgs) {
  if (!/\bwidth\s*=/.test(img) || !/\bheight\s*=/.test(img)) {
    problems.push('img without width/height: ' + img.slice(0, 60) + '...');
  }
}

// 7. Report weight so regressions are visible in the log.
const bytes = Buffer.byteLength(html);
notes.push(`index.html is ${(bytes / 1024).toFixed(1)} KB (${imgs.length} inline image(s))`);
const BUDGET_KB = 140;
if (bytes / 1024 > BUDGET_KB) {
  problems.push(`index.html exceeds the ${BUDGET_KB} KB budget`);
}

for (const n of notes) console.log('  ' + n);
if (problems.length) {
  console.error('\nself-contained check failed:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('  self-contained check passed');
