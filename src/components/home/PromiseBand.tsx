import { openQuote } from '../../lib/quote';
import SiteContainer from './SiteContainer';
import { PROMISE } from './content';

/**
 * The guarantee, named and given its own band, as the large cleaning
 * companies do with theirs. The promise itself is the owner's: a return visit
 * within 24 hours, at no cost.
 */
export default function PromiseBand() {
  return (
    <section id="promise" aria-label={PROMISE.name} className="scroll-mt-6 bg-site-blue py-[70px] lg:py-[80px]">
      <SiteContainer className="flex flex-col items-center gap-8 text-center lg:flex-row lg:gap-12 lg:text-left">
        <Seal />
        <div className="flex-1">
          <h2 className="text-[26px] font-bold leading-tight text-white lg:text-[31px]">{PROMISE.name}</h2>
          <p className="mx-auto mt-4 max-w-[620px] text-[15.5px] leading-[1.8] text-white/90 lg:mx-0">{PROMISE.text}</p>
        </div>
        <button
          type="button"
          onClick={() => openQuote()}
          className="inline-flex h-[52px] min-w-[220px] shrink-0 items-center justify-center rounded-full bg-white px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-site-blue transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-[#eef5ff] active:scale-[0.98]"
        >
          Get a Free Quote
        </button>
      </SiteContainer>
    </section>
  );
}

/** A round seal: "24" large, "hour promise" around it. */
function Seal() {
  return (
    <svg viewBox="0 0 140 140" className="h-[124px] w-[124px] shrink-0" role="img" aria-label="24-hour promise seal">
      <defs>
        <path id="promise-ring" d="M70,70 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" />
      </defs>
      <circle cx="70" cy="70" r="67" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="70" cy="70" r="60" fill="white" fillOpacity="0.1" />
      <text fill="white" fontSize="11" fontWeight="700" letterSpacing="3.2">
        <textPath href="#promise-ring" startOffset="0">HOUR PROMISE · SATISFACTION · </textPath>
      </text>
      <text x="70" y="84" textAnchor="middle" fill="white" fontSize="40" fontWeight="800">24</text>
    </svg>
  );
}
