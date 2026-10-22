/**
 * Fails the build when an /api route cannot reach its function.
 *
 * Netlify reads public/_redirects before netlify.toml, and the first rule that
 * matches a path wins. A catch-all ("/*  /index.html  200") in _redirects
 * therefore answered every /api path that file did not list itself, and a
 * route declared only in netlify.toml was never reached: /api/reviews/submit
 * went live returning 404 and nobody could send a review. Nothing in a normal
 * build notices that, so this does — it replays Netlify's order for every
 * function route and stops the deploy if another rule answers first. A failed
 * build leaves the last good deploy online.
 *
 * Runs before `vite build` in `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => {
  const full = path.join(root, file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
};

function tomlRules(text) {
  const rules = [];
  for (const block of text.split(/^\[\[redirects\]\]\s*$/m).slice(1)) {
    const body = block.split(/^\[/m)[0];
    const get = (key) => body.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, 'm'))?.[1];
    if (get('from') && get('to')) rules.push({ from: get('from'), to: get('to'), file: 'netlify.toml' });
  }
  return rules;
}

function redirectsFileRules(text) {
  return text.split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts.length >= 2)
    .map(([from, to]) => ({ from, to, file: 'public/_redirects' }));
}

/** Netlify's matching for the rules this site uses: exact paths and trailing splats. */
function matches(from, pathname) {
  if (from === '/*') return true;
  if (from.endsWith('/*')) {
    const base = from.slice(0, -2);
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return pathname.replace(/\/$/, '') === from.replace(/\/$/, '');
}

const toml = read('netlify.toml') ?? '';
const redirectsFile = read('public/_redirects');
const rules = [...(redirectsFile ? redirectsFileRules(redirectsFile) : []), ...tomlRules(toml)];

const errors = [];
const functionRoutes = rules.filter((rule) => rule.to.startsWith('/.netlify/functions/'));

for (const rule of functionRoutes) {
  const name = rule.to.split('/').pop();
  if (!['ts', 'js', 'mts', 'mjs'].some((ext) => fs.existsSync(path.join(root, 'netlify/functions', `${name}.${ext}`)))) {
    errors.push(`${rule.from} (${rule.file}) points to a function that does not exist: netlify/functions/${name}`);
  }
  const probe = rule.from.replace('*', 'probe');
  const winner = rules.find((candidate) => matches(candidate.from, probe));
  if (winner && winner.to !== rule.to) {
    errors.push(
      `${rule.from} (${rule.file}) never reaches ${rule.to}: "${winner.from} ${winner.to}" in ${winner.file} answers ${probe} first.`,
    );
  }
}

// A function nobody can reach is usually a forgotten route. Scheduled ones are
// started by Netlify itself and need none.
const scheduled = new Set([...toml.matchAll(/^\[functions\."([^"]+)"\][^[]*?schedule\s*=/gms)].map((m) => m[1]));
const routed = new Set(functionRoutes.map((rule) => rule.to.split('/').pop()));
const unrouted = fs.readdirSync(path.join(root, 'netlify/functions'))
  .filter((file) => /\.(ts|js|mts|mjs)$/.test(file))
  .map((file) => file.replace(/\.[^.]+$/, ''))
  .filter((name) => !routed.has(name) && !scheduled.has(name));

if (errors.length) {
  console.error('\nRoute check failed — these API routes would not work once deployed:\n');
  for (const error of errors) console.error(`  ✗ ${error}`);
  console.error('\nDeclare API routes in netlify.toml only, above the "/*" rule, and keep public/_redirects free of catch-alls.\n');
  process.exit(1);
}

for (const name of unrouted) console.warn(`  ! netlify/functions/${name} has no /api route in netlify.toml`);
console.log(`Route check: ${functionRoutes.length} API routes reach their functions.`);
