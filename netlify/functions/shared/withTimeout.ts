/**
 * A read that is only nice to have must never delay a reply.
 *
 * firebase-admin retries a failing read with backoff, which can burn several
 * seconds before it gives up. On a webhook that has ten seconds to answer a
 * customer, that is the difference between a real answer and the fallback
 * line. Context is worth waiting a moment for; it is not worth the reply.
 */
export async function softly<T>(
  work: Promise<T>,
  ms: number,
  label: string,
  fallback: T,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } catch (err: any) {
    console.warn(`[softly] ${label}: ${err?.message || err} — continuing without it`);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
