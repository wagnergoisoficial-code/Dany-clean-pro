import { useQuery } from '@tanstack/react-query';
import { Star, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { Review } from '../../types';
import Container from '../ui/Container';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';

export default function Reviews() {
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: async () => {
      const path = 'reviews';
      try {
        const q = query(collection(db, path), where('isPublished', '==', true));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  });

  return (
    <section id="reviews" className="py-32 bg-white overflow-hidden">
      <Container>
        <div className="text-center mb-20">
          <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
            Amado pelas Famílias <br />
            Em Todo o Connecticut.
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {reviews?.map((review, i) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 relative group hover:bg-white hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] transition-all duration-500"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={idx} 
                      size={14} 
                      className={idx < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} 
                    />
                  ))}
                </div>
                <p className="text-slate-600 font-medium leading-relaxed mb-8 italic">
                   "{review.comment}"
                </p>
                <div className="flex items-center gap-4">
                   <div className="w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-sm">
                     {review.author[0]}
                   </div>
                   <div>
                     <p className="font-bold text-slate-900 text-base leading-none mb-1">{review.author}</p>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Residente Verificado</p>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
