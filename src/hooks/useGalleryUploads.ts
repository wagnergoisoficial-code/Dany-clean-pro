import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';

/**
 * Photos Dany uploaded from the dashboard's gallery, newest first.
 *
 * The home page has no gallery section any more, so these are what fills its
 * picture frames: a real photo of a job beats a stock one. Only uploads count;
 * the dashboard's built-in samples are stock, and some of them are not even of
 * cleaning. Nothing uploaded, or the database out of reach, gives an empty
 * list and the page keeps its own photos.
 */
export function useGalleryUploads(): string[] {
  const { data } = useQuery<string[]>({
    queryKey: ['gallery-uploads'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!isFirebaseReady()) return [];
      try {
        const snapshot = await getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')));
        const urls = snapshot.docs
          .map(doc => String((doc.data() as any)?.url || '').trim())
          .filter(Boolean);
        return Array.from(new Set(urls));
      } catch (err) {
        console.warn('Gallery uploads unavailable:', err);
        return [];
      }
    },
  });
  return data || [];
}
