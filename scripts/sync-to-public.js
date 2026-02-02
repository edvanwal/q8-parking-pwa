/**
 * Sync root source files to public/ for deployment.
 * Root = development source, public = deploy target.
 * Run before: npm run deploy
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const FILES = [
  'app.js',
  'services.js',
  'state.js',
  'ui.js',
  'utils.js',
  'design-system.css',
  'index.html',
  'firebase-config.js',
  'kenteken.js',
  'manifest.webmanifest',
  'sw.js'
];

let ok = 0, err = 0;
for (const f of FILES) {
  const src = path.join(ROOT, f);
  const dst = path.join(PUBLIC, f);
  if (!fs.existsSync(src)) {
    console.warn('Skip (not in root):', f);
    continue;
  }
  try {
    fs.copyFileSync(src, dst);
    console.log('Synced:', f);
    ok++;
  } catch (e) {
    console.error('Error:', f, e.message);
    err++;
  }
}
console.log(`\nDone: ${ok} synced${err ? `, ${err} errors` : ''}`);
