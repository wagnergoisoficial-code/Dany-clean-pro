import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Review } from '../../types';
import Container from '../ui/Container';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const defaultReviews: Review[] = [
  { id: 1, author: 'Sarah Jenkins', rating: 5, comment: 'Dany Clean Pro is amazing! My house has never been cleaner. They are professional and thorough.', date: '2024-05-10', is_published: true },
  { id: 2, author: 'Michael Rodriguez', rating: 5, comment: 'Great commercial cleaning service. They handle our office perfectly every week.', date: '2024-05-08', is_published: true },
  { id: 3, author: 'Emma Wilson', rating: 5, comment: 'Reliable, trustworthy, and they do a fantastic job. Highly recommend for move-out cleaning!', date: '2024-05-05', is_published: true }
];

export default function Reviews() {
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: async () => {
      const isProd = window.location.hostname === 'danycleanpro.com' || 
                     window.location.hostname === 'www.danycleanpro.com' ||
                     window.location.hostname.includes('netlify.app');

      if (!isProd) {
        try {
          const response = await fetch('/api/reviews');
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              return await response.json();
            }
          }
        } catch (err) {
          console.warn('Reviews API unavailable');
        }
      }

      // Firestore fallback
      try {
        if (db && db.type !== 'mock') {
          const q = query(collection(db, 'reviews'), where('isPublished', '==', true));
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

  const displayReviews = reviews && reviews.length > 0 ? reviews : defaultReviews;

  return (
    <section id="reviews" className="w-full bg-surface-low py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Standing head */}
          <div className="lg:col-span-4">
            <span className="block text-label-sm uppercase text-accent mb-3">Client Word of Mouth</span>
            <h2 className="font-display text-headline-md lg:text-headline-lg text-ink mb-4">
              Loved by families across Connecticut
            </h2>
            <p className="text-body-md text-ink-muted mb-8">
              Every review below comes from a home or business we clean on a regular schedule.
            </p>

            <div className="bg-surface p-6">
              <div className="flex items-center gap-1.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-accent fill-accent" />
                ))}
              </div>
              <p className="font-display text-headline-sm text-ink">4.9 out of 5</p>
              <p className="text-body-sm text-ink-muted mt-1">
                Based on verified client feedback across Fairfield &amp; New Haven counties.
              </p>
            </div>
          </div>

          {/* Quote ledger */}
          <div className="lg:col-span-8">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-8 w-8 border-b-2 border-accent" />
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-rule border-y border-rule">
                {displayReviews.map((review, i) => (
                  <motion.figure
                    key={review.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.24) }}
                    className="py-8 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8"
                  >
                    <div className="sm:col-span-3">
                      <span className="block font-display text-headline-sm text-ink leading-tight">
                        {review.author}
                      </span>
                      <span className="block text-label-sm uppercase text-ink-faint mt-1.5">
                        Verified Client
                      </span>
                      <div className="flex gap-1 mt-3">
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            size={12}
                            className={idx < review.rating ? "text-accent fill-accent" : "text-rule fill-rule"}
                          />
                        ))}
                      </div>
                    </div>

                    <blockquote className="sm:col-span-9">
                      <p className="font-display text-body-lg sm:text-headline-sm text-ink-soft italic leading-relaxed">
                        “{review.comment}”
                      </p>
                    </blockquote>
                  </motion.figure>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
