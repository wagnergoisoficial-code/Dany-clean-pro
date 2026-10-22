import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Star, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { fieldClass, labelClass, SERVICES } from '../../lib/forms';
import { REVIEW_FORM_EVENT, submitReview } from '../../lib/reviews';

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const MAX = 1000;

/**
 * "Write a review", as a window over the page.
 *
 * Mounted once in the public layout and opened from anywhere with
 * openReviewForm(); /reviews?write=1 — the link in the review-request e-mail —
 * opens it on arrival. What is sent goes to Dany first: the window says so,
 * so nobody wonders why their review is not on the page a second later.
 */
export default function ReviewModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const onOpen = () => { opener.current = document.activeElement; setOpen(true); };
    window.addEventListener(REVIEW_FORM_EVENT, onOpen);
    return () => window.removeEventListener(REVIEW_FORM_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('write') === '1') setOpen(true);
  }, [location.search]);

  const close = () => {
    setOpen(false);
    // Arrived through the e-mail link: drop ?write=1, so a reload does not reopen it.
    if (new URLSearchParams(location.search).has('write')) navigate(location.pathname + location.hash, { replace: true });
    (opener.current as HTMLElement | null)?.focus?.();
  };

  if (!open) return null;
  return <Dialog onClose={close} />;
}

function Dialog({ onClose }: { onClose: () => void }) {
  const ids = useId();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const startedAt = useRef(Date.now());
  const panel = useRef<HTMLDivElement>(null);

  // Once, on opening: lock the page behind, put the cursor on the first
  // control, and let Escape close. The latest onClose is read through a ref so
  // a re-render of the parent does not run this again and steal the focus.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('[role=radio]')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === 'sending') return;
    const form = new FormData(e.currentTarget);
    if (!rating) { setError('Please choose a rating from 1 to 5 stars.'); return; }
    if (comment.trim().length < 20) { setError('Please write a few more words about your cleaning.'); return; }
    setError('');
    setState('sending');
    const name = String(form.get('name') || '');
    try {
      await submitReview({
        name,
        city: String(form.get('city') || ''),
        rating,
        service: String(form.get('service') || ''),
        comment,
        email: String(form.get('email') || ''),
        consent,
        website: String(form.get('website') || ''),
        startedAt: startedAt.current,
      });
      setFirstName(name.trim().split(/\s+/)[0] || '');
      setState('sent');
    } catch (err: any) {
      setError(err?.message || 'We could not send your review. Please try again.');
      setState('idle');
    }
  };

  const shown = hover || rating;

  return (
    // The outer layer scrolls and the inner one is at least as tall as the
    // screen: centred when the form fits, and scrollable from its very top when
    // it does not. Centring the panel itself would cut its top off on a short
    // screen, with no way to scroll back to it.
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-site-night/75 font-site">
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="flex min-h-full items-center justify-center px-4 py-6 sm:py-10"
      >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-title`}
        className="relative w-full max-w-[640px] rounded-[3px] bg-white shadow-[0_40px_80px_-24px_rgba(4,19,42,0.6)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-site-navy transition-colors hover:bg-site-mist"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {state === 'sent' ? (
          <div className="flex flex-col items-center px-6 py-14 text-center sm:px-12">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-site-blue text-white">
              <CheckCircle size={30} strokeWidth={1.75} />
            </span>
            <h2 id={`${ids}-title`} className="mt-6 text-[24px] font-bold text-site-navy">
              Thank you{firstName ? `, ${firstName}` : ''}
            </h2>
            <p className="mt-3 max-w-[420px] text-[14.5px] leading-[1.85] text-site-text">
              Your review was sent to Dany. Every review is read before it appears on the site, so yours
              will show up once it has been published.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 inline-flex h-[52px] min-w-[160px] items-center justify-center rounded-full bg-site-blue px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-site-blue-strong"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="px-6 pb-8 pt-10 sm:px-10 sm:pb-10">
            <h2 id={`${ids}-title`} className="pr-10 text-[24px] font-bold leading-tight text-site-navy sm:text-[26px]">
              Write a Review
            </h2>
            <p className="mt-2 text-[14px] leading-[1.75] text-site-text">
              Tell others how your cleaning went. Dany reads every review before it appears on the site.
            </p>

            <fieldset className="mt-7">
              <legend className={labelClass}>Your rating *</legend>
              <div className="flex items-center gap-4">
                <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''} — ${WORDS[n]}`}
                      onClick={() => { setRating(n); setError(''); }}
                      onMouseEnter={() => setHover(n)}
                      className="rounded-[3px] p-1 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-site-blue active:scale-90"
                    >
                      <Star
                        size={30}
                        strokeWidth={1.4}
                        className={n <= shown ? 'text-site-blue' : 'text-[#c9d0da]'}
                        fill={n <= shown ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[13px] font-semibold text-site-navy" aria-live="polite">{WORDS[shown]}</span>
              </div>
            </fieldset>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`${ids}-name`}>Your name *</label>
                <input id={`${ids}-name`} name="name" required minLength={2} maxLength={60} autoComplete="name"
                  placeholder="e.g. Sarah Miller" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${ids}-city`}>Town</label>
                <input id={`${ids}-city`} name="city" maxLength={60} autoComplete="address-level2"
                  placeholder="e.g. Waterbury" className={fieldClass} />
              </div>
            </div>

            <div className="mt-5">
              <label className={labelClass} htmlFor={`${ids}-service`}>Service</label>
              <select id={`${ids}-service`} name="service" defaultValue="" className={cn(fieldClass, 'select-chevron cursor-pointer appearance-none')}>
                <option value="">Choose the service you had</option>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="mt-5">
              <label className={labelClass} htmlFor={`${ids}-comment`}>Your review *</label>
              <textarea
                id={`${ids}-comment`}
                name="comment"
                required
                minLength={20}
                maxLength={MAX}
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did we clean, and how did it turn out?"
                className={cn(fieldClass, 'h-auto resize-y py-3.5 leading-[1.7]')}
              />
              <p className="mt-1.5 text-right text-[12px] font-medium text-site-text tabular-nums">{comment.length} / {MAX}</p>
            </div>

            <div className="mt-2">
              <label className={labelClass} htmlFor={`${ids}-email`}>E-mail</label>
              <input id={`${ids}-email`} name="email" type="email" maxLength={120} autoComplete="email"
                placeholder="Only Dany sees this" className={fieldClass} />
            </div>

            {/* Hidden from people; a bot that fills every field fills this one too. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-[3px] bg-site-mist p-4">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-site-blue)]"
              />
              <span className="text-[12.5px] leading-[1.7] text-site-text">
                I agree that my first name, last initial, town and review may be shown on danycleanpro.com.
                My e-mail is never shown.
              </span>
            </label>

            {error && <p role="alert" className="mt-4 text-[13px] font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={state === 'sending'}
              className={cn(
                'mt-6 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-site-blue px-10 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-12px_rgba(13,118,242,0.7)] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-[0.98] sm:w-auto',
                state === 'sending' && 'cursor-not-allowed opacity-70',
              )}
            >
              {state === 'sending' ? 'Sending…' : 'Send Review'}
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
