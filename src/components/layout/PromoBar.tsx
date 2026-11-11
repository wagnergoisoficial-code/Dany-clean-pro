import { openQuote } from '../../lib/quote';

/** The end of Nov 26 in Connecticut; the bar leaves the site on its own. Same date as PROMO in businessKnowledge.ts. */
const PROMO_ENDS = Date.parse('2026-11-27T05:00:00Z');

/**
 * The Thanksgiving offer, across the top of every page. It opens the quote
 * form with Deep Cleaning chosen. The pulse stops for visitors who ask their
 * device for less motion.
 */
export default function PromoBar() {
  if (Date.now() >= PROMO_ENDS) return null;
  return (
    <button
      type="button"
      onClick={() => openQuote({ service_type: 'Deep Cleaning' })}
      className="relative z-40 block w-full bg-[#facc15] px-4 py-2.5 font-site text-[#1a1300] motion-safe:animate-[promo-blink_1.4s_ease-in-out_infinite]"
    >
      <span className="mx-auto flex max-w-[1170px] items-center justify-center gap-3">
        <span className="shrink-0 rounded-full bg-[#1a1300] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#facc15]">20% off</span>
        <span className="text-left text-[12.5px] font-semibold leading-tight sm:text-[14px]">
          Thanksgiving Deep Cleaning
          <span className="block font-medium sm:inline"><span className="hidden sm:inline"> · </span>book by Nov 26</span>
        </span>
        <span className="hidden shrink-0 text-[13px] font-bold uppercase tracking-[0.06em] underline underline-offset-4 sm:inline">Claim offer →</span>
        <span aria-hidden className="shrink-0 text-[18px] font-bold sm:hidden">→</span>
      </span>
    </button>
  );
}
