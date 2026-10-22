/**
 * Client reviews.
 *
 * Two sources. Reviews written on this site live in Firestore's `reviews`
 * collection: they arrive unpublished through /api/reviews/submit, Dany reads
 * them under Reviews in the dashboard, and only the ones she publishes are
 * shown. The three below were left on Thumbtack and uploaded by Dany as
 * screenshots to the gallery; they are copied here word for word, typos and
 * all, because a review is a quote.
 */

export interface PublicReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  /** YYYY-MM-DD */
  date: string;
  city?: string;
  service?: string;
  source: 'thumbtack' | 'website';
}

export const THUMBTACK_REVIEWS: PublicReview[] = [
  {
    id: 'thumbtack-matthew-w',
    author: 'Matthew W.',
    rating: 5,
    date: '2026-08-19',
    source: 'thumbtack',
    comment: 'Absolutely amazing, top tier cleaning service - my mother in law recently moved in with us full '
      + 'time and had to discontinue service but Dani is fabulous and I cannot recommend her highly enough. '
      + 'Honest, hard working, punctual, and trustworthy - I am a frequent user of thumbtack and read all '
      + 'reviews - I hope someone reads this and makes a decision based off of it - you will not be sorry!',
  },
  {
    id: 'thumbtack-hannah-b',
    author: 'Hannah B.',
    rating: 5,
    date: '2026-06-01',
    source: 'thumbtack',
    comment: 'So grateful that Dany was able to accommodate our request for a weekend cleaning. She was very '
      + 'kind and flexible and works so AMAZING! Our apartment smelled so good and it was sparkling clean. '
      + 'Dany, we’re very happy to have met you! And we hope to see you again in a few months!',
  },
  {
    id: 'thumbtack-janice-r',
    author: 'Janice R.',
    rating: 5,
    date: '2025-05-03',
    source: 'thumbtack',
    service: 'Move-out deep clean',
    comment: 'Reached out looking to have a move out deep clean done, Dany was very responsive and got back to '
      + 'me right away. She came to look at and and said that she would take care of it, would take about 6hr. '
      + 'She came cleaned the entire apartment in 5hrs and what a difference. The place looks amazing and ready '
      + 'for a new tenant. Would absolutely reach out to her again. Thanks you so much.',
  },
];

/** "May 3, 2025" */
export function reviewDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function averageRating(reviews: PublicReview[]): number {
  if (!reviews.length) return 0;
  return Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
}

export interface ReviewSubmission {
  name: string;
  city: string;
  rating: number;
  service: string;
  comment: string;
  email: string;
  consent: boolean;
  /** A field people cannot see; anything in it was typed by a bot. */
  website: string;
  /** When the form was opened, so a submit within a blink can be told apart. */
  startedAt: number;
}

export async function submitReview(review: ReviewSubmission): Promise<void> {
  const response = await fetch('/api/reviews/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  let body: any = {};
  try { body = await response.json(); } catch {}
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error || 'We could not send your review. Please try again.');
  }
}

/**
 * Opening the "write a review" form, from any page. The form is mounted once,
 * in the public layout; the review-request e-mail links to /reviews?write=1,
 * which opens it on arrival.
 */
export const REVIEW_FORM_EVENT = 'open-review-form';

export function openReviewForm() {
  window.dispatchEvent(new CustomEvent(REVIEW_FORM_EVENT));
}
