import { useEffect, useState } from 'react';
import { openQuote } from '../../lib/quote';

/**
 * The quote button that stays at the foot of a phone's screen once the hero
 * has scrolled away, and steps aside while the quote form itself is in view.
 * It stops short of the right edge, where the chat button sits.
 */
export default function StickyQuote() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let formInView = false;
    const form = document.getElementById('quote');
    const observer = form
      ? new IntersectionObserver(([entry]) => { formInView = entry.isIntersecting; update(); })
      : null;
    if (form && observer) observer.observe(form);

    function update() {
      setShow(window.scrollY > 520 && !formInView);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={
        'fixed bottom-6 left-5 right-[100px] z-[90] transition-[opacity,transform] duration-300 lg:hidden '
        + (show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')
      }
    >
      <button
        type="button"
        tabIndex={show ? 0 : -1}
        onClick={() => openQuote()}
        className="flex h-14 w-full items-center justify-center rounded-full bg-site-blue text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-10px_rgba(13,118,242,0.8)] active:scale-[0.98]"
      >
        Get a Free Quote
      </button>
    </div>
  );
}
