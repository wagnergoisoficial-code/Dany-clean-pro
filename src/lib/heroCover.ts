import { HERO_COVER } from '../generated/heroCover';
import { getDocument } from './firestoreRest';

/**
 * The cover photo: the copy baked at build time (scripts/bake-hero.mjs), and
 * a cheap check for a newer one.
 */

export { HERO_COVER };

/** The widths the CDN serves the cover at. index.html preloads the same set. */
export const HERO_WIDTHS = [640, 960, 1280, 1920];
export const HERO_QUALITY = 65;

/**
 * The cover Dany chose, if she has changed it since this build — otherwise
 * null.
 *
 * Asks Firestore's REST API for the cover document with every field masked
 * out: about 200 bytes carrying its update time, instead of the 200 KB the
 * picture is stored as. Only a newer cover is then fetched in full. Plain
 * REST (firestoreRest), so the page loads no database code for it.
 */
export async function newerCover(): Promise<string | null> {
  const meta = await getDocument('settings/hero_cover', []);
  if (!meta?.updateTime || meta.updateTime === HERO_COVER.updateTime) return null;
  const value = String((await getDocument('settings/hero_cover'))?.data?.value || '').trim();
  return value || null;
}
