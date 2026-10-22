import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, MessageSquare } from 'lucide-react';
import { PageHeader, Panel, Empty, Skeleton } from '../../components/admin/ui/Panel';
import { Badge } from '../../components/admin/ui/Table';
import Button, { IconButton } from '../../components/admin/ui/Button';
import { Review, AuthState } from '../../types';
import { cn } from '../../lib/utils';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';

interface ReviewManagerProps {
  auth: AuthState;
}

export default function ReviewManager({ auth }: ReviewManagerProps) {
  const queryClient = useQueryClient();
  const isProd = window.location.hostname === 'danycleanpro.com' || 
                 window.location.hostname === 'www.danycleanpro.com' ||
                 window.location.hostname.includes('netlify.app');
 
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      if (!isProd) {
        try {
          const response = await fetch('/api/admin/reviews', {
            headers: {
              'Authorization': `Bearer ${auth.token}`
            }
          });
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              return await response.json();
            }
          }
        } catch (err) {
          console.warn('Admin Reviews API unavailable');
        }
      }

      // Firestore
      try {
        if (isFirebaseReady()) {
          const q = query(collection(db, 'reviews'), orderBy('date', 'desc'));
          const snapshot = await getDocs(q);
          // Waiting ones first: they are the ones that need Dany.
          return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as any)
            .sort((a: any, b: any) => Number(!!a.isPublished) - Number(!!b.isPublished));
        }
      } catch (err) {
        console.error('Firestore reviews fetch failed:', err);
      }
      return [];
    }
  });

  const toggleReview = useMutation({
    mutationFn: async (review: any) => {
      const isPublished = review.isPublished !== undefined ? review.isPublished : review.is_published;
      const newStatus = !isPublished;

      if (!isProd) {
        try {
          const response = await fetch(`/api/admin/reviews/${review.id}/toggle`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${auth.token}`
            }
          });
          if (response.ok) return;
        } catch (err) {
          console.warn('Toggle Review API failed');
        }
      }

      // Firestore
      if (isFirebaseReady()) {
        const docRef = doc(db, 'reviews', review.id);
        await updateDoc(docRef, { isPublished: newStatus });
        return;
      }
      throw new Error('Failed to toggle review');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      if (!isProd) {
        try {
          const response = await fetch(`/api/admin/reviews/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${auth.token}`
            }
          });
          if (response.ok) return;
        } catch (err) {
          console.warn('Delete Review API failed');
        }
      }

      // Firestore
      if (isFirebaseReady()) {
        await deleteDoc(doc(db, 'reviews', id));
        return;
      }
      throw new Error('Failed to delete review');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
  });

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl">
      <PageHeader
        title="Reviews"
        hint="Reviews written on your site arrive here first, and by e-mail with the writer's full name and address. Publish the ones you want shown — nothing appears on the site until you do. The three Thumbtack reviews are always shown."
      />
      <Panel>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="space-y-3">
          {reviews?.length === 0 && (
            <Empty
              icon={<MessageSquare size={19} />}
              title="No reviews yet"
              hint="Ask a customer you have just finished with — that is when they are most willing."
            />
          )}
          {reviews?.map((review: any) => {
            const isPublished = review.isPublished !== undefined ? review.isPublished : review.is_published;
            return (
              <div key={review.id} className={cn(
                "p-4 rounded-xl ring-1 transition-colors duration-150",
                isPublished ? "bg-white ring-slate-900/[0.07]" : "bg-amber-50/40 ring-amber-900/[0.08]"
              )}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                       <span className="text-sm font-bold text-slate-900 truncate">{review.author}</span>
                       <div className="flex gap-0.5 text-amber-400" aria-label={`${review.rating} out of 5 stars`}>
                         {[...Array(Math.max(0, Math.min(5, Number(review.rating) || 0)))].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                       </div>
                       {isPublished
                         ? <Badge tone="green" dot>On the site</Badge>
                         : <Badge tone="amber" dot>Waiting for you</Badge>}
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed mb-2 whitespace-pre-line">{review.comment}</p>
                    <p className="text-[12px] text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span className="tabular-nums">{review.date}</span>
                      {review.city && <span>· {review.city}</span>}
                      {review.service && <span>· {review.service}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      intent={isPublished ? 'neutral' : 'green'}
                      variant={isPublished ? 'smooth' : 'solid'}
                      onClick={() => toggleReview.mutate(review)}
                      disabled={toggleReview.isPending}
                    >
                      {isPublished ? 'Hide from site' : 'Publish'}
                    </Button>
                    <IconButton
                      label="Delete review"
                      intent="red"
                      size="sm"
                      onClick={() => { if (confirm('Delete this review for good?')) deleteReview.mutate(String(review.id)); }}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </Panel>
    </div>
  );
}
