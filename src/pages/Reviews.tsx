import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import { averageRating, openReviewForm, reviewDate } from '../lib/reviews';
import { openQuote } from '../lib/quote';
import Stars from '../components/reviews/Stars';
import SiteContainer from '../components/home/SiteContainer';

/** Ten at a time: enough to read on, few enough that fifty reviews stay one page. */
const PAGE = 10;

/**
 * Every published review, newest first, in the home page's design: the navy
 * band under the header, then white cards with the service strip's shadow on
 * the grey of the "about" band.
 */
export default function Reviews() {
  const { reviews } = useReviews();
  const [count, setCount] = useState(PAGE);
  const average = averageRating(reviews);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Client Reviews — Dany Clean Pro';
    return () => { document.title = previous; };
  }, []);

  return (
    <div className="font-site">
      <section className="bg-site-deep pb-[80px] pt-[70px] lg:pb-[100px] lg:pt-[90px]">
        <SiteContainer className="text-center">
          <h1 className="text-[32px] font-bold leading-tight text-white lg:text-[42px]">Client Reviews</h1>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[14.5px] font-medium text-white/70">
            <Stars rating={Math.round(average)} size={17} className="text-white" emptyClassName="text-white/30" />
            <span>{average.toFixed(1)} average from {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
          </p>
          <p className="mx-auto mt-4 max-w-[560px] text-[14.5px] leading-[1.85] text-white/70">
            What homeowners and businesses across Connecticut say about Dany Clean Pro.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={openReviewForm}
              className="inline-flex h-[52px] min-w-[200px] items-center justify-center rounded-full bg-site-blue px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-12px_rgba(13,118,242,0.7)] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-[0.98]"
            >
              Write a review
            </button>
            <button
              type="button"
              onClick={() => openQuote()}
              className="inline-flex h-[52px] min-w-[200px] items-center justify-center rounded-full bg-white px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-site-blue transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-[#eef5ff] active:scale-[0.98]"
            >
              Get a free quote
            </button>
          </div>
        </SiteContainer>
      </section>

      <section className="bg-site-mist py-[80px] lg:py-[100px]">
        <SiteContainer>
          <ul className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            {reviews.slice(0, count).map(review => {
              const meta = [
                review.source === 'thumbtack' ? 'Hired on Thumbtack' : review.city,
                review.service,
                reviewDate(review.date),
              ].filter(Boolean).join(' · ');
              return (
                <li key={review.id} className="flex">
                  <figure className="flex w-full flex-col bg-white p-7 shadow-[0_30px_60px_-30px_rgba(7,37,79,0.3)] sm:p-9">
                    <div className="flex items-start justify-between gap-4">
                      <Stars rating={review.rating} size={16} className="text-site-blue" emptyClassName="text-[#c9d0da]" />
                      <Quote aria-hidden size={34} strokeWidth={1.1} className="-mt-1 shrink-0 text-[#c9d4e3]" />
                    </div>
                    <blockquote className="mt-4 whitespace-pre-line text-[14.5px] leading-[1.9] text-site-text">
                      {review.comment}
                    </blockquote>
                    <figcaption className="mt-auto pt-6">
                      <span className="block text-[13px] font-bold uppercase tracking-[0.06em] text-site-navy">{review.author}</span>
                      <span className="mt-1 block text-[12.5px] font-medium text-site-text">{meta}</span>
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>

          {reviews.length > count && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => setCount(c => c + PAGE)}
                className="inline-flex h-[52px] min-w-[220px] items-center justify-center rounded-full bg-site-blue px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-12px_rgba(13,118,242,0.7)] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-[0.98]"
              >
                Load more reviews
              </button>
            </div>
          )}
        </SiteContainer>
      </section>
    </div>
  );
}
