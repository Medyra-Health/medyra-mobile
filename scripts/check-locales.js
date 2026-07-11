// Verifies every locale file has exactly the same key structure as en.json.
// Usage: node scripts/check-locales.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) return flatten(v, key);
    return [key];
  });
}

const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'));
const enKeys = new Set(flatten(en));
let failed = false;

for (const file of files) {
  if (file === 'en.json') continue;
  const keys = new Set(flatten(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))));
  const missing = [...enKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !enKeys.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`${file}: missing [${missing.join(', ')}] extra [${extra.join(', ')}]`);
  } else {
    console.log(`${file}: OK (${keys.size} keys)`);
  }
}

process.exit(failed ? 1 : 0);
