import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';
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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-xl sm:text-2xl text-slate-900">Review Moderation</h3>
          <p className="text-sm text-slate-500">Manage customer feedback visibility on your site.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400 italic py-8">Loading reviews...</div>
      ) : (
        <div className="space-y-4">
          {reviews?.length === 0 && <p className="text-slate-400 italic py-8 text-center bg-slate-50 rounded-2xl">No reviews yet.</p>}
          {reviews?.map((review: any) => {
            const isPublished = review.isPublished !== undefined ? review.isPublished : review.is_published;
            return (
              <div key={review.id} className={cn(
                "p-4 sm:p-6 rounded-2xl border transition-all",
                isPublished ? "bg-white border-slate-100" : "bg-slate-50 border-slate-200 opacity-60"
              )}>
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                       <span className="font-bold text-slate-900 truncate">{review.author}</span>
                       <div className="flex text-amber-500">
                         {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                       </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-2">{review.comment}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleReview.mutate(review)}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        isPublished ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      )}
                      title={isPublished ? "Unpublish Review" : "Publish Review"}
                    >
                      {isPublished ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button 
                      onClick={() => { if(confirm('Are you sure you want to delete this review?')) deleteReview.mutate(String(review.id)) }}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                      title="Delete Review"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
