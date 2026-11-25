// Builds the translated pages of the website (docs/<lang>/index.html) from the English page.
//   node scripts/site/build.mjs
// docs/en/index.html is the source. Each scripts/site/<lang>.json maps an English fragment of that
// page (text between tags, or an attribute value, markup included) to its translation.
// French (docs/index.html) is written by hand. Edit the English page, then the string tables,
// then run this script: it fails if a fragment is missing from the page or from a table.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const LANGS = (process.env.LANGS || 'es,de,it,pt,ru,zh,ja,hi,bn,ur,ar,id').split(',');
const RTL = new Set(['ar', 'ur']);
const en = fs.readFileSync(path.join(root, 'docs/en/index.html'), 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let keys = null;
for (const lang of LANGS) {
  const table = JSON.parse(fs.readFileSync(path.join(root, `scripts/site/${lang}.json`), 'utf8'));
  const { _copy, _copied, _shot, ...strings } = table;
  const k = Object.keys(strings).sort();
  if (keys && k.join('\n') !== keys.join('\n')) {
    const a = new Set(keys), b = new Set(k);
    throw new Error(`${lang}.json: keys differ (missing ${keys.filter((x) => !b.has(x))}, extra ${k.filter((x) => !a.has(x))})`);
  }
  keys = k;
  let s = en;
  // longest first, so a fragment is never replaced inside a longer one
  for (const from of [...k].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(>\\s*|=")${esc(from)}(\\s*<|")`, 'g');
    if (!re.test(s)) throw new Error(`${lang}: "${from}" not found in docs/en/index.html`);
    s = s.replace(re, (_, a, b) => a + strings[from].replace(/\$/g, '$$$$') + b);
  }
  s = s
    .replace(/<html lang="en"[^>]*>/, `<html lang="${lang}"${RTL.has(lang) ? ' dir="rtl"' : ''} data-copy="${_copy}" data-copied="${_copied}" data-shot="${_shot}">`)
    .replace('https://pickywawa.github.io/cyberstream/en/" />\n  <meta property="og:image"', `https://pickywawa.github.io/cyberstream/${lang}/" />\n  <meta property="og:image"`)
    .replace(' selected>English</option>', '>English</option>')
    .replace(`lang="${lang}">`, `lang="${lang}" selected>`);
  fs.mkdirSync(path.join(root, 'docs', lang), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', lang, 'index.html'), s);
  console.log(`docs/${lang}/index.html`);
}
