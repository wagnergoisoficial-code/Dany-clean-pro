/**
 * Waiting for the right moment, so that what can wait does not compete with
 * the first screen for a phone's connection and processor.
 */

/** Resolves once the page has loaded and the browser has a quiet moment. */
export function afterPageLoad(): Promise<void> {
  return new Promise((resolve) => {
    const idle = () => {
      const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: { timeout: number }) => number);
      if (ric) ric(() => resolve(), { timeout: 2000 });
      else window.setTimeout(resolve, 200);
    };
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
  });
}

/**
 * Resolves on the visitor's first touch, click, key or scroll — or after
 * `timeoutMs`, for someone who only reads. For things that matter once
 * someone is engaging with the page, like the chat bubble.
 */
export function afterFirstInteraction(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
    const done = () => {
      events.forEach((e) => window.removeEventListener(e, done));
      window.clearTimeout(timer);
      resolve();
    };
    events.forEach((e) => window.addEventListener(e, done, { once: true, passive: true }));
    const timer = window.setTimeout(done, timeoutMs);
  });
}
