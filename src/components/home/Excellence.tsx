import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { openQuote } from '../../lib/quote';
import SiteContainer from './SiteContainer';
import { BAND_SERVICES } from './content';

/**
 * The navy band: the tagline, and five outlined boxes whose icons sit on the
 * top rule. One box is drawn in white; the white follows the pointer, as the
 * raised card does in the strip above.
 */
export default function Excellence() {
  const [active, setActive] = useState(0);

  return (
    <section id="services" className="relative scroll-mt-6 overflow-hidden bg-site-deep py-[100px] lg:py-[125px]">
      <Watermark />

      <SiteContainer className="relative">
        <ul
          onMouseLeave={() => setActive(0)}
          className="grid gap-x-[75px] gap-y-[64px] sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-[70px]"
        >
          <li className="relative pb-16 sm:col-span-2 lg:col-span-1 lg:pb-0">
            <h2 className="text-[27px] font-bold leading-[1.3] text-white lg:text-[31px]">
              Professional<br />Cleaning.<br />Exceptional<br />Care.
            </h2>
            <button
              type="button"
              onClick={() => openQuote()}
              aria-label="Request a free estimate"
              className="absolute bottom-0 left-0 flex h-11 w-11 items-center justify-center rounded-full bg-white text-site-deep transition-transform duration-300 ease-[var(--ease-settle)] hover:scale-105 active:scale-95 lg:left-auto lg:right-0"
            >
              <ArrowRight size={18} strokeWidth={2} />
            </button>
          </li>

          {BAND_SERVICES.map(({ title, description, service, Icon }, i) => {
            const on = i === active;
            return (
              <li key={title}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => openQuote({ service_type: service })}
                  className={cn(
                    'relative block h-full min-h-[204px] w-full px-7 pb-8 pt-[54px] text-left transition-colors duration-300',
                    on ? 'border-2 border-white' : 'border border-site-line',
                  )}
                >
                  <span aria-hidden className="absolute -top-[26px] left-[20px] bg-site-deep px-3">
                    <Icon size={44} strokeWidth={1.1} className="text-white" />
                  </span>
                  <span className="block text-[13px] font-bold uppercase tracking-[0.06em] text-white">{title}</span>
                  <span className={cn('mt-3 block text-[13.5px] leading-[1.8] transition-colors', on ? 'text-white' : 'text-[#8496b8]')}>
                    {description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </SiteContainer>
    </section>
  );
}

/**
 * The large faint mark in the lower right — a globe in the reference. Here a
 * house, drawn in a single tone of the band so it reads as texture.
 */
function Watermark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -bottom-[110px] -right-[120px] hidden w-[560px] text-[#0b2f66] lg:block"
      fill="none"
      stroke="currentColor"
      strokeWidth="14"
      strokeLinejoin="round"
    >
      <path d="M20 96 100 26l80 70" />
      <path d="M44 78v96h112V78" />
      <path d="M84 174v-52h32v52" />
    </svg>
  );
}
