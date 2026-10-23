/**
 * Public reads from Firestore over its REST API — plain fetch, no SDK.
 *
 * What a visitor's page reads from the database (the published reviews, the
 * gallery, a few settings) is readable by anyone under firestore.rules. The
 * Firebase SDK for it is about 480 KB of JavaScript that a phone has to
 * download and run; these reads are a few small requests. The SDK is still
 * used where it earns its weight: the dashboard, and the quote form's write
 * (see firestoreLazy.ts).
 *
 * The same security rules apply to these requests as to the SDK's.
 */

const env = (value: unknown) => String(value ?? '').replace(/^["'](.+)["']$/, '$1').trim();
const KEY = env(import.meta.env.VITE_FIREBASE_API_KEY);
const PROJECT = env(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const DATABASE = env(import.meta.env.VITE_FIREBASE_DATABASE_ID) || '(default)';
const ROOT = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${encodeURIComponent(DATABASE)}/documents`;

export const restReady = () => !!KEY && !!PROJECT;

export interface RestDoc {
  id: string;
  data: Record<string, any>;
  updateTime?: string;
}

/** Firestore's typed REST values, as plain JavaScript. Timestamps stay ISO strings. */
function decode(value: any): any {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return !!value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('mapValue' in value) return fieldsOf(value.mapValue?.fields);
  if ('arrayValue' in value) return (value.arrayValue?.values || []).map(decode);
  return null;
}

function fieldsOf(fields: Record<string, any> | undefined): Record<string, any> {
  return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decode(value)]));
}

const toDoc = (raw: any): RestDoc => ({
  id: String(raw?.name || '').split('/').pop() || '',
  data: fieldsOf(raw?.fields),
  updateTime: raw?.updateTime,
});

/**
 * One document, or null if it does not exist or cannot be read. `fields`
 * limits what comes back; [] returns no fields at all, just the metadata,
 * which is how the cover's update time is read without its 200 KB.
 */
export async function getDocument(path: string, fields?: string[]): Promise<RestDoc | null> {
  if (!restReady()) return null;
  const mask = fields
    ? (fields.length ? fields : ['x']).map((f) => `mask.fieldPaths=${encodeURIComponent(f)}`).join('&') + '&'
    : '';
  try {
    const res = await fetch(`${ROOT}/${path}?${mask}key=${KEY}`);
    if (!res.ok) return null;
    return toDoc(await res.json());
  } catch {
    return null;
  }
}

/** Every document in a collection. */
export async function listDocuments(collection: string): Promise<RestDoc[]> {
  if (!restReady()) return [];
  const docs: RestDoc[] = [];
  let pageToken = '';
  try {
    do {
      const res = await fetch(`${ROOT}/${collection}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}&key=${KEY}`);
      if (!res.ok) break;
      const body = await res.json();
      docs.push(...(body.documents || []).map(toDoc));
      pageToken = body.nextPageToken || '';
    } while (pageToken);
  } catch {
    // whatever arrived is still worth showing
  }
  return docs;
}

/** Documents whose `field` equals `value` — e.g. the published reviews. */
export async function whereEqual(collection: string, field: string, value: boolean | string | number): Promise<RestDoc[]> {
  if (!restReady()) return [];
  const typed = typeof value === 'boolean' ? { booleanValue: value }
    : typeof value === 'number' ? { doubleValue: value }
    : { stringValue: value };
  try {
    const res = await fetch(`${ROOT}:runQuery?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collection }],
          where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: typed } },
        },
      }),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return (Array.isArray(rows) ? rows : []).filter((row: any) => row?.document).map((row: any) => toDoc(row.document));
  } catch {
    return [];
  }
}
