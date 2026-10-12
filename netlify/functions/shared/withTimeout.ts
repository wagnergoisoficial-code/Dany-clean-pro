/**
 * Optional work that must never cost a caller their answer.
 *
 * Two rules, both learned on live calls:
 *
 * 1. A read that is only nice to have gets a deadline. firebase-admin retries
 *    a failing read with backoff, and on a webhook that has seconds to reply
 *    that is the difference between an answer and silence on the line.
 *
 * 2. Once something has failed, stop asking. A refused database fails the same
 *    way every time, and paying the deadline on every single call turns a
 *    known outage into a permanent delay. After a failure the resource is left
 *    alone for a few minutes and the fallback is returned immediately.
 *
 * Takes a function rather than a promise so that skipping really means not
 * starting the work at all.
 */

const COOLDOWN_MS = Number(process.env.SOFTLY_COOLDOWN_MS || 5 * 60_000);

/** Module state survives warm invocations; a cold start simply tries again. */
const trippedAt = new Map<string, number>();

function tripped(label: string): boolean {
  const at = trippedAt.get(label);
  if (at === undefined) return false;
  if (Date.now() - at < COOLDOWN_MS) return true;
  trippedAt.delete(label);
  return false;
}

export async function softly<T>(
  work: () => Promise<T>,
  ms: number,
  label: string,
  fallback: T,
): Promise<T> {
  if (tripped(label)) {
    console.warn(`[softly] ${label}: skipped, failed recently`);
    return fallback;
  }

  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      work(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
      }),
    ]);
  } catch (err: any) {
    trippedAt.set(label, Date.now());
    console.warn(`[softly] ${label}: ${err?.message || err} — continuing without it, pausing ${COOLDOWN_MS / 1000}s`);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** For a health endpoint that wants to report what is currently being skipped. */
export const pausedResources = (): string[] =>
  [...trippedAt.keys()].filter(tripped);
