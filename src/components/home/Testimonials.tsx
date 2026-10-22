import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useReviews, homeReviews } from '../../hooks/useReviews';
import { averageRating, openReviewForm, reviewDate, type PublicReview } from '../../lib/reviews';
import Stars from '../reviews/Stars';
import SiteContainer from './SiteContainer';

/** Longer than this and the card shows the start, with the rest on /reviews. */
const LONG = 420;

/**
 * What clients say: three reviews right after "Why Choose Us?", the rest a
 * click away on /reviews, and a way to write one.
 *
 * Not in the reference, so it is made of the reference's own parts: the navy
 * band, outlined boxes with their icon on the top rule, one box drawn in white
 * that follows the pointer, and the white and blue pills of the hero.
 */
export default function Testimonials() {
  const { reviews } = useReviews();
  const shown = homeReviews(reviews);
  const [active, setActive] = useState(1);
  const average = averageRating(reviews);

  return (
    <section id="reviews" className="scroll-mt-6 bg-site-deep py-[100px] lg:py-[125px]">
      <SiteContainer>
        <h2 className="text-center text-[28px] font-bold leading-tight text-white lg:text-[33px]">What Our Clients Say</h2>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[14px] font-medium text-white/70">
          <Stars rating={Math.round(average)} size={16} className="text-white" emptyClassName="text-white/30" />
          <span>{average.toFixed(1)} average from {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
        </p>

        <ul
          onMouseLeave={() => setActive(1)}
          className="mt-[70px] grid gap-x-[30px] gap-y-[60px] lg:mt-[80px] lg:grid-cols-3"
        >
          {shown.map((review, i) => (
            // Two on a phone or tablet, where three stacked cards are a long scroll; three side by side above.
            <li key={review.id} onMouseEnter={() => setActive(i)} className={cn('flex', i === 2 && 'hidden lg:flex')}>
              <ReviewCard review={review} on={i === active} />
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/reviews"
            className="inline-flex h-[52px] min-w-[220px] items-center justify-center rounded-full bg-white px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-site-blue transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-[#eef5ff] active:scale-[0.98]"
          >
            Read all {reviews.length} reviews
          </Link>
          <button
            type="button"
            onClick={openReviewForm}
            className="inline-flex h-[52px] min-w-[220px] items-center justify-center rounded-full bg-site-blue px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-12px_rgba(13,118,242,0.7)] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-[0.98]"
          >
            Write a review
          </button>
        </div>
      </SiteContainer>
    </section>
  );
}

function ReviewCard({ review, on }: { review: PublicReview; on: boolean }) {
  const long = review.comment.length > LONG;
  const text = long ? `${review.comment.slice(0, LONG).replace(/\s+\S*$/, '')}…` : review.comment;
  const meta = [
    review.source === 'thumbtack' ? 'Hired on Thumbtack' : review.city,
    reviewDate(review.date),
  ].filter(Boolean).join(' · ');

  return (
    <figure
      className={cn(
        'relative flex w-full flex-col px-7 pb-8 pt-[54px] transition-colors duration-300',
        on ? 'border-2 border-white' : 'border border-site-line',
      )}
    >
      <span aria-hidden className="absolute -top-[24px] left-[20px] bg-site-deep px-3">
        <Quote size={40} strokeWidth={1.1} className="text-white" />
      </span>
      <Stars rating={review.rating} size={15} className="text-white" emptyClassName="text-white/30" />
      <blockquote className={cn('mt-4 text-[14px] leading-[1.85] transition-colors', on ? 'text-white' : 'text-[#9fb0cf]')}>
        {text}
        {long && (
          <Link to="/reviews" className="ml-1 font-semibold text-white underline underline-offset-2">Read more</Link>
        )}
      </blockquote>
      <figcaption className="mt-auto pt-6">
        <span className="block text-[13px] font-bold uppercase tracking-[0.06em] text-white">{review.author}</span>
        <span className="mt-1 block text-[12.5px] font-medium text-white/55">{meta}</span>
      </figcaption>
    </figure>
  );
}
