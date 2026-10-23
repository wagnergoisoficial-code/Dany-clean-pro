import { useQuery } from '@tanstack/react-query';
import { afterPageLoad } from '../lib/timing';
import { listDocuments } from '../lib/firestoreRest';
import { cdnUrl } from '../lib/images';

export interface GalleryPhoto {
  url: string;
  title: string;
  category: string;
}

/**
 * Photos of Dany's work, as uploaded from the dashboard's gallery, newest
 * first.
 *
 * Only uploads: the dashboard's built-in samples are stock photos, and a
 * gallery of someone's work is the one place stock would be a lie. Uploads
 * titled "Review" are screenshots of customer reviews, not work, and are left
 * out. Nothing uploaded, or the database out of reach, gives an empty list and
 * the section stays hidden.
 *
 * Sorted here rather than with orderBy: Firestore drops every document that
 * lacks the ordered field, and some older uploads have no createdAt.
 */
export function useGallery(): { photos: GalleryPhoto[]; loading: boolean } {
  const { data, isLoading } = useQuery<GalleryPhoto[]>({
    queryKey: ['gallery-photos'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // Below the fold: read once the page has loaded, over plain REST
      // (see firestoreRest) — no database SDK for a list of photos.
      await afterPageLoad();
      try {
        const docs = await listDocuments('gallery');
        const seen = new Set<string>();
        return docs
          .map(doc => {
            const d = doc.data;
            const at = d?.createdAt ? Date.parse(d.createdAt) : 0;
            return {
              url: String(d?.url || '').trim(),
              title: String(d?.title || '').trim(),
              category: String(d?.category || '').trim(),
              at: Number.isFinite(at) ? at : 0,
            };
          })
          .filter(p => p.url && !/\breview\b/i.test(p.title))
          .sort((a, b) => b.at - a.at)
          .filter(p => (seen.has(p.url) ? false : (seen.add(p.url), true)))
          .map(({ url, title, category }) => ({ url, title, category }));
      } catch (err) {
        console.warn('Gallery unavailable:', err);
        return [];
      }
    },
  });
  return { photos: data || [], loading: isLoading };
}

/**
 * A title worth showing. Camera names ("IMG 1873") and file hashes
 * ("CAAA5398 274E 4829…") are what an upload is called when nobody named it.
 */
export function photoTitle(title: string): string {
  const t = title.trim();
  if (!t) return '';
  if (/^(img|dsc|dcim|photo|image|pxl)[\s_-]*\d+/i.test(t)) return '';
  if (/^[a-f0-9]{4,}([\s_-][a-f0-9]{2,}){2,}/i.test(t)) return '';
  return t;
}

/** A smaller copy of a gallery photo for the grid (Firebase Storage originals are phone-sized). */
export function thumbUrl(url: string, width: number): string {
  return /^https:\/\/firebasestorage\.googleapis\.com\//.test(url) ? cdnUrl(url, width, 72) : url;
}
