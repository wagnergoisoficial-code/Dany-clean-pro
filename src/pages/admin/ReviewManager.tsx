import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import { PageHeader, Panel, Empty, Skeleton } from '../../components/admin/ui/Panel';
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
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any;
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
        hint="What customers wrote. Published ones appear on your site; the rest stay here."
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
                isPublished ? "bg-white ring-slate-900/[0.07]" : "bg-slate-50/70 ring-slate-900/[0.05]"
              )}>
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                       <span className="text-sm font-bold text-slate-900 truncate">{review.author}</span>
                       <div className="flex gap-0.5 text-amber-400">
                         {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                       </div>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed mb-2">{review.comment}</p>
                    <span className="text-[12px] text-slate-400 tabular-nums">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleReview.mutate(review)}
                      className={cn(
                        "w-9 h-9 grid place-items-center rounded-lg transition-colors duration-150",
                        isPublished
                          ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                      title={isPublished ? "Unpublish Review" : "Publish Review"}
                    >
                      {isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button 
                      onClick={() => { if(confirm('Are you sure you want to delete this review?')) deleteReview.mutate(String(review.id)) }}
                      className="w-9 h-9 grid place-items-center rounded-lg bg-white text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
                      title="Delete review"
                    >
                      <Trash2 size={16} />
                    </button>
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
