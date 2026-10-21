import { useId, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';
import SiteContainer from './SiteContainer';
import { REASONS, REASON_DEFAULT } from './content';

/**
 * "Why Choose Us?" — three reasons on a ruled line, a stack of three photos
 * and the words for the reason that is open.
 *
 * `front` lets Dany's own uploads take the front photo of each reason; the
 * stock photo behind it stays as the frame.
 */
export default function WhyChooseUs({ front = [] }: { front?: string[] }) {
  const [open, setOpen] = useState(REASON_DEFAULT);
  const reduce = useReducedMotion();
  const ids = useId();
  const reason = REASONS[open];
  const [back, middle, stockFront] = reason.photos;
  const frontPhoto = front[open] || stockFront;

  return (
    <section id="why" className="scroll-mt-6 bg-white pb-[90px] pt-[110px] lg:pb-[110px] lg:pt-[135px]">
      <SiteContainer>
        <h2 className="text-center text-[28px] font-bold leading-tight text-site-navy lg:text-[33px]">
          Why Choose Us?
        </h2>

        <div role="tablist" aria-label="Why choose us" className="relative mx-auto mt-7 grid max-w-[540px] grid-cols-3">
          <span aria-hidden className="absolute bottom-[7px] left-[16.66%] right-[16.66%] h-px bg-[#dfe4ec]" />
          {REASONS.map((r, i) => {
            const on = i === open;
            return (
              <button
                key={r.label.join(' ')}
                type="button"
                role="tab"
                id={`${ids}-tab-${i}`}
                aria-selected={on}
                aria-controls={`${ids}-panel`}
                onClick={() => setOpen(i)}
                className="group relative flex flex-col items-center"
              >
                <span
                  className={cn(
                    'text-[12.5px] leading-[1.35] transition-colors',
                    on ? 'font-semibold text-site-blue' : 'font-medium text-[#9aa4b2] group-hover:text-site-navy',
                  )}
                >
                  {r.label[0]}<br />{r.label[1]}
                </span>
                <span aria-hidden className="relative mt-4 flex h-[15px] w-[15px] items-center justify-center">
                  {on ? (
                    <span className="flex h-[15px] w-[15px] items-center justify-center rounded-full border-2 border-site-blue bg-white">
                      <span className="h-[5px] w-[5px] rounded-full bg-site-blue" />
                    </span>
                  ) : (
                    <span className="h-[9px] w-[9px] rounded-full bg-[#c9d0da] transition-colors group-hover:bg-site-navy/50" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${ids}-panel`}
          aria-labelledby={`${ids}-tab-${open}`}
          className="mt-[60px] grid items-center gap-12 lg:mt-[75px] lg:grid-cols-[480px_minmax(0,1fr)] lg:gap-[58px]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={open}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="relative mx-auto aspect-[480/343] w-full max-w-[480px]"
            >
              <img src={back} alt="" loading="lazy"
                className="absolute left-0 top-[15.7%] h-[72.3%] w-[62.5%] rounded-[3px] object-cover brightness-[0.45] saturate-[0.6]" />
              <img src={middle} alt="" loading="lazy"
                className="absolute left-[7.7%] top-0 h-[78.4%] w-[88.5%] rounded-[3px] object-cover shadow-[0_18px_40px_-18px_rgba(4,19,42,0.55)]" />
              <img src={frontPhoto} alt="" loading="lazy"
                className="absolute left-[15.6%] top-[14.9%] h-[85.1%] w-[84.4%] rounded-[3px] object-cover shadow-[0_34px_60px_-16px_rgba(13,118,242,0.55)]" />
            </motion.div>
          </AnimatePresence>

          <div className="mx-auto max-w-[540px] lg:mx-0">
            <p className="text-[14.5px] leading-[1.9] text-site-text">{reason.lead}</p>
            <p className="mt-5 text-[18px] leading-[1.6] text-[#8a93a3]">{reason.follow}</p>
          </div>
        </div>
      </SiteContainer>
    </section>
  );
}
