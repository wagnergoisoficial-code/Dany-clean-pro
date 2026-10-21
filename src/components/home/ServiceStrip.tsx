import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { openQuote } from '../../lib/quote';
import { STRIP_SERVICES, STRIP_DEFAULT } from './content';

/**
 * The white strip across the foot of the hero: five services, one raised in
 * blue. The raised card follows the pointer, so the blue always marks what you
 * are about to choose, and settles back on its usual place when the pointer
 * leaves. Choosing one opens the quote request with that service filled in.
 */
export default function ServiceStrip() {
  const [active, setActive] = useState(STRIP_DEFAULT);

  return (
    <section aria-label="Services" className="relative z-10 -mt-[100px] px-5 sm:px-8">
      <ul
        onMouseLeave={() => setActive(STRIP_DEFAULT)}
        className="mx-auto grid max-w-[1100px] grid-cols-2 bg-white shadow-[0_30px_60px_-24px_rgba(7,37,79,0.28)] md:grid-cols-5"
      >
        {STRIP_SERVICES.map(({ title, tagline, service, Icon }, i) => {
          const on = i === active;
          // A rule between neighbours, but never against the raised card.
          const rule = i > 0 && !on && i - 1 !== active;
          return (
            <li key={title} className={cn('relative', i === STRIP_SERVICES.length - 1 && 'col-span-2 md:col-span-1')}>
              {rule && (
                <span aria-hidden className="absolute left-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-[#e3e7ee] lg:block" />
              )}
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => openQuote({ service_type: service })}
                className={cn(
                  'flex w-full flex-col items-center justify-center px-3 text-center transition-[background-color,box-shadow,margin,height] duration-300 ease-[var(--ease-settle)]',
                  'h-[170px] lg:h-[200px]',
                  on && 'relative z-10 bg-site-blue shadow-[0_22px_40px_-14px_rgba(13,118,242,0.65)] lg:-my-5 lg:h-[240px]',
                )}
              >
                <Icon size={46} strokeWidth={1.1} className={cn('transition-colors', on ? 'text-white' : 'text-[#9fadbd]')} />
                <span className={cn('mt-4 block text-[13px] font-bold uppercase tracking-[0.05em]', on ? 'text-white' : 'text-site-navy')}>
                  {title}
                </span>
                <span className={cn('mt-1 block text-[12px] font-medium', on ? 'text-white/80' : 'text-site-text')}>
                  {tagline}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-site-blue transition-opacity duration-300',
                    on ? 'opacity-100' : 'hidden',
                  )}
                >
                  <ChevronRight size={16} strokeWidth={2.25} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
