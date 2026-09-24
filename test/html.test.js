const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

test('sample loading, guide targets, accessible gap diagram and unique attributes', () => {
  for (const id of ['sample-select', 'sample-load', 'guide-section', 'guide-steps', 'gap-diagram', 'gap-description']) {
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.match(html, /<script src="js\/samples.js"><\/script>/);
  for (const id of ['input', 'type', 'repeat', 'key', 'guess']) {
    assert.ok(html.includes(`id="${id}-heading" tabindex="-1"`));
  }
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const tag of withoutComments.matchAll(/<[a-z][^>]*>/gi)) {
    const attributes = [...tag[0].matchAll(/\s([\w:-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g)].map(m => m[1].toLowerCase());
    assert.equal(new Set(attributes).size, attributes.length, tag[0]);
  }
  assert.match(app, /createElementNS/);
  assert.match(app, /'aria-labelledby': 'gap-description'/);
  assert.match(app, /'aria-pressed'/);
});

test('key guess controls, live key, safe embedded samples and no network API', () => {
  for (const id of ['guess-section', 'guess-length', 'guess-reset', 'guess-table', 'trial-preview']) {
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.match(html, /id="guessed-key" aria-live="polite"/);
  for (const file of ['app.js', 'samples.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../js', file), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|innerHTML/);
  }
});

test('strict CSP, referrer and no-script guidance', () => {
  const meta = html.match(/<meta\s+http-equiv="Content-Security-Policy"[^>]+>/)[0];
  assert.match(meta, /default-src 'self'/);
  assert.match(meta, /script-src 'self'/);
  assert.match(meta, /style-src 'self'/);
  assert.match(meta, /object-src 'none'/);
  assert.match(meta, /base-uri 'none'/);
  assert.match(meta, /form-action 'none'/);
  assert.doesNotMatch(meta, /unsafe-inline|frame-ancestors/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /<noscript>[\s\S]+?<\/noscript>/);
});

test('no executable input or inline styles', () => {
  assert.doesNotMatch(html, /\sstyle\s*=|\son\w+\s*=/i);
  assert.doesNotMatch(app, /innerHTML|\.style\s*(?:\.|\[)/);
});

test('external links, explicit button types and scroll regions', () => {
  for (const tag of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(tag[0], /rel="noopener noreferrer"/);
  }
  for (const tag of html.matchAll(/<button\b[^>]*>/g)) assert.match(tag[0], /type="button"/);
  for (const tag of html.matchAll(/<div\b[^>]*class="table-scroll"[^>]*>/g)) {
    assert.match(tag[0], /role="region"/);
    assert.match(tag[0], /tabindex="0"/);
    assert.match(tag[0], /aria-label="[^"]+"/);
  }
  for (const label of html.matchAll(/<label\b[^>]*for="([^"]+)"/g)) {
    assert.ok(html.includes(`id="${label[1]}"`));
  }
});

test('synchronous early theme, native dialog and centered desktop header', () => {
  const head = html.match(/<head>[\s\S]*?<\/head>/)[0];
  assert.match(head, /<script src="js\/theme-init.js"><\/script>/);
  assert.ok(head.indexOf('theme-init.js') < head.indexOf('stylesheet'));
  assert.match(html, /<dialog[^>]+aria-labelledby="help-title"/);
  const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
  assert.match(css, /@media \(min-width: 769px\)[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto minmax\(0, 1fr\)/);
});
