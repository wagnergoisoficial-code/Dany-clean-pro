/**
 * Sized copies of images, from Netlify's image CDN.
 *
 * On the live site /.netlify/images resizes an image and picks the best
 * format the browser takes (AVIF or WebP), so a phone gets a picture its own
 * size instead of the original. netlify.toml allows Firebase Storage as a
 * source too. Anywhere else — a local preview — there is no CDN and the
 * original is used.
 *
 * index.html builds the same URLs by hand for the cover-photo preload. A
 * preload only helps if it asks for exactly what the <img> will ask for, so
 * keep the two in step.
 */

export function onImageCdn(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'danycleanpro.com' || host === 'www.danycleanpro.com' || host.endsWith('.netlify.app');
}

export function cdnUrl(src: string, width: number, quality = 70): string {
  if (!onImageCdn()) return src;
  return `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** A srcset of CDN copies, or undefined where there is no CDN. */
export function cdnSrcSet(src: string, widths: number[], quality = 70): string | undefined {
  if (!onImageCdn()) return undefined;
  return widths.map((w) => `${cdnUrl(src, w, quality)} ${w}w`).join(', ');
}
