/**
 * Reading and writing data, through our own server.
 *
 * The browser no longer opens a connection to Firestore. Every panel used to,
 * and was answered by security rules edited in a console this repository does
 * not control — so when the rules and the code disagreed, the dashboard filled
 * with empty panels and nothing here could say why. Going through the server
 * means the rules can stay shut: only the Admin SDK touches the database, and
 * it is not subject to them.
 *
 * Signed-in calls carry a Firebase ID token. The server decides from it; this
 * file never decides anything.
 */

async function authHeader(): Promise<Record<string, string>> {
  try {
    const { auth } = await import('./firebase');
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function call(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`/api/data/${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()), ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `request failed (${res.status})`);
  return body;
}

export interface ListOptions {
  orderBy?: string;
  desc?: boolean;
  limit?: number;
  where?: [field: string, equals: string];
}

/** Documents in a collection, newest-first when you say so. */
export async function list<T = any>(collection: string, options: ListOptions = {}): Promise<T[]> {
  const params = new URLSearchParams();
  if (options.orderBy) params.set('orderBy', options.orderBy);
  if (options.desc) params.set('desc', 'true');
  if (options.limit) params.set('limit', String(options.limit));
  if (options.where) { params.set('where', options.where[0]); params.set('equals', options.where[1]); }
  const query = params.toString();
  const body = await call(`${collection}${query ? `?${query}` : ''}`);
  return body.docs || [];
}

/** One document, or null when there is none — absence is not an error here. */
export async function get<T = any>(collection: string, id: string): Promise<T | null> {
  try {
    const body = await call(`${collection}/${encodeURIComponent(id)}`);
    return body.doc ?? null;
  } catch (err: any) {
    if (String(err?.message || '').includes('not found')) return null;
    throw err;
  }
}

/** Create, letting the server name it, or at an id you choose. */
export async function create(collection: string, data: any, id?: string): Promise<string> {
  const body = await call(id ? `${collection}/${encodeURIComponent(id)}` : collection, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return body.id;
}

/** Merge fields into a document, leaving the rest alone. */
export async function update(collection: string, id: string, data: any): Promise<void> {
  await call(`${collection}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function remove(collection: string, id: string): Promise<void> {
  await call(`${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/**
 * A single setting's value.
 *
 * Settings are stored one per document as `{ value }`, which is why this is
 * worth a helper: nearly every caller wants the string, not the wrapper.
 */
export async function getSetting(id: string): Promise<string | null> {
  const doc = await get<{ value?: string }>('settings', id);
  return doc?.value ?? null;
}

export async function setSetting(id: string, value: string | null): Promise<void> {
  await create('settings', { value }, id);
}
