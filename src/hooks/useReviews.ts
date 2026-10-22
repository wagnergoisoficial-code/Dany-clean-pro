import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { THUMBTACK_REVIEWS, type PublicReview } from '../lib/reviews';

/**
 * Every review the public may see, newest first: the ones Dany published
 * from the dashboard, and the Thumbtack reviews that ship with the site.
 *
 * The query has to ask for isPublished == true — the database refuses a
 * visitor any list that could include unpublished reviews. Sorted here rather
 * than with orderBy, which would need an index and drop documents that lack
 * the field. Unreachable database: the Thumbtack reviews still show.
 */
export function useReviews(): { reviews: PublicReview[]; loading: boolean } {
  const { data, isLoading } = useQuery<PublicReview[]>({
    queryKey: ['public-reviews'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      let published: PublicReview[] = [];
      if (isFirebaseReady()) {
        try {
          const snapshot = await getDocs(query(collection(db, 'reviews'), where('isPublished', '==', true)));
          published = snapshot.docs
            .map(doc => {
              const d = doc.data() as any;
              return {
                id: doc.id,
                author: String(d.author || '').trim(),
                rating: Math.min(5, Math.max(1, Math.round(Number(d.rating) || 0))),
                comment: String(d.comment || '').trim(),
                date: String(d.date || '').slice(0, 10),
                city: d.city ? String(d.city) : undefined,
                service: d.service ? String(d.service) : undefined,
                source: 'website' as const,
              };
            })
            .filter(r => r.author && r.comment && r.rating);
        } catch (err) {
          console.warn('Published reviews unavailable:', err);
        }
      }
      return [...published, ...THUMBTACK_REVIEWS].sort((a, b) => b.date.localeCompare(a.date));
    },
  });
  return { reviews: data || THUMBTACK_REVIEWS, loading: isLoading };
}

/**
 * The three for the home page: newest first, and four or five stars where
 * there are enough of them. The full list, every rating, is on /reviews.
 */
export function homeReviews(reviews: PublicReview[]): PublicReview[] {
  const strong = reviews.filter(r => r.rating >= 4);
  return (strong.length >= 3 ? strong : reviews).slice(0, 3);
}
