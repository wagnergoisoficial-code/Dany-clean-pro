/**
 * Turns the cover photo Dany chose in the dashboard into a file the site can
 * serve fast.
 *
 * The dashboard stores the cover inside a Firestore document, as 200 KB of
 * base64 text. A phone could only get it after downloading the site's
 * JavaScript, starting the Firebase SDK and opening a live connection — the
 * cover, the largest thing on the first screen, appeared after 11 seconds.
 * Written to public/hero/ as an ordinary file, the browser fetches it while
 * the page is still arriving (index.html preloads it), and on Netlify the
 * image CDN serves a copy sized for the screen.
 *
 * The file name carries a hash of the picture, so a new cover is a new URL
 * and no cache can show the old one. The document's update time is recorded
 * too: the page asks Firestore for just that timestamp after it has loaded and
 * swaps the cover in if Dany has changed it since this build.
 *
 * Runs before `vite build` in `npm run build`. If Firestore cannot be reached,
 * the last baked cover stays and the build carries on.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/hero');
const manifestPath = path.join(root, 'src/generated/heroCover.ts');

const env = (name) => String(process.env[name] || '').replace(/^["'](.+)["']$/, '$1').trim();
const apiKey = env('VITE_FIREBASE_API_KEY');
const projectId = env('VITE_FIREBASE_PROJECT_ID');
const databaseId = env('VITE_FIREBASE_DATABASE_ID') || '(default)';

const keep = (why) => {
  console.log(`Hero cover: ${why} — keeping the cover from the last bake.`);
  process.exit(0);
};

if (!apiKey || !projectId) keep('no Firebase settings in this environment');

/** Width and height from a JPEG or PNG header, enough for the <img> attributes. */
function dimensions(buf) {
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  for (let i = 2; i + 9 < buf.length;) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    const length = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    i += 2 + length;
  }
  return { width: 1200, height: 675 };
}

const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}/documents/settings/hero_cover`;
let doc;
try {
  const res = await fetch(`${base}?key=${apiKey}`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) keep(`Firestore answered ${res.status}`);
  doc = await res.json();
} catch (err) {
  keep(`Firestore unreachable (${err?.message || err})`);
}

const value = String(doc?.fields?.value?.stringValue || '').trim();
const updateTime = String(doc?.updateTime || '');
if (!value) keep('no cover chosen in the dashboard');

let bytes;
let type;
const dataUrl = value.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
if (dataUrl) {
  type = dataUrl[1].toLowerCase();
  bytes = Buffer.from(dataUrl[2], 'base64');
} else if (/^https?:\/\//.test(value)) {
  try {
    const res = await fetch(value, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) keep(`the cover's URL answered ${res.status}`);
    type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].toLowerCase();
    bytes = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    keep(`the cover's URL could not be fetched (${err?.message || err})`);
  }
} else {
  keep('the stored cover is neither an image nor a link');
}

const ext = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[type];
if (!ext) keep(`unsupported image type ${type}`);

const hash = crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 10);
const fileName = `cover-${hash}.${ext}`;
fs.mkdirSync(outDir, { recursive: true });
for (const old of fs.readdirSync(outDir)) {
  if (old.startsWith('cover-') && old !== fileName) fs.rmSync(path.join(outDir, old));
}
fs.writeFileSync(path.join(outDir, fileName), bytes);

const { width, height } = dimensions(bytes);
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `// Written by scripts/bake-hero.mjs on every build — do not edit by hand.
export const HERO_COVER = ${JSON.stringify({ file: `/hero/${fileName}`, width, height, updateTime }, null, 2)} as const;
`);
console.log(`Hero cover: /hero/${fileName} (${width}x${height}, ${Math.round(bytes.length / 1024)} KB, updated ${updateTime}).`);
