import { ClipboardList, Tag, Sparkles } from 'lucide-react';
import { openQuote } from '../../lib/quote';
import SiteContainer from './SiteContainer';
import { HOW_IT_WORKS } from './content';

const ICONS = [ClipboardList, Tag, Sparkles];

/**
 * "How It Works": the three steps the large cleaning sites put near the top,
 * so a first-time visitor knows exactly what happens after the form.
 */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 bg-site-mist py-[90px] lg:py-[115px]">
      <SiteContainer>
        <h2 className="text-center text-[28px] font-bold leading-tight text-site-navy lg:text-[33px]">
          How It Works
        </h2>
        <p className="mx-auto mt-4 max-w-[520px] text-center text-[14.5px] leading-[1.8] text-site-text">
          Three simple steps from your first message to a clean home.
        </p>

        <ol className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-14 lg:gap-8">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = ICONS[i];
            return (
              <li key={step.title} className="relative bg-white px-7 pb-9 pt-10 shadow-[0_18px_40px_-28px_rgba(15,44,102,0.45)]">
                <span className="absolute right-6 top-5 text-[44px] font-bold leading-none text-[#e8ecf3]" aria-hidden>
                  {i + 1}
                </span>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-site-blue/10 text-site-blue">
                  <Icon size={26} strokeWidth={1.6} />
                </span>
                <h3 className="mt-6 text-[15px] font-bold uppercase tracking-[0.05em] text-site-navy">
                  <span className="sr-only">Step {i + 1}: </span>{step.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.8] text-site-text">{step.text}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => openQuote()}
            className="inline-flex h-[52px] min-w-[220px] items-center justify-center rounded-full bg-site-blue px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-12px_rgba(13,118,242,0.7)] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-[0.98]"
          >
            Get a Free Quote
          </button>
        </div>
      </SiteContainer>
    </section>
  );
}
