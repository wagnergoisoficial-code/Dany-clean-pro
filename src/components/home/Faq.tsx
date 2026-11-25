import { ChevronDown } from 'lucide-react';
import SiteContainer from './SiteContainer';
import { FAQS } from './content';

/**
 * Frequently asked questions, answered with the owner's own policies. Plain
 * <details> elements: they open and close without any script, and search
 * engines read the answers.
 */
export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-6 bg-site-mist py-[90px] lg:py-[120px]">
      <SiteContainer className="max-w-[860px]">
        <h2 className="text-center text-[28px] font-bold leading-tight text-site-navy lg:text-[33px]">
          Frequently Asked Questions
        </h2>

        <div className="mt-10 divide-y divide-[#dfe4ec] border-y border-[#dfe4ec] bg-white lg:mt-12">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group px-6 lg:px-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15px] font-semibold text-site-navy [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown
                  size={18}
                  strokeWidth={2}
                  aria-hidden
                  className="shrink-0 text-site-blue transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="-mt-1 pb-6 pr-8 text-[14.5px] leading-[1.8] text-site-text">{a}</p>
            </details>
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
