import { useEffect, useState } from 'react';
import { MessageSquareText, PhoneCall } from 'lucide-react';
import { useConfig } from '../../hooks/useConfig';
import { openQuote } from '../../lib/quote';
import { smsHref, SMS_NUMBER_DISPLAY } from '../../lib/smsLine';
import { triggerAICall, handleSMSLaunch } from '../../lib/contact';
import { PHOTOS } from './content';
import { HERO_COVER, HERO_QUALITY, HERO_WIDTHS, newerCover } from '../../lib/heroCover';
import { cdnSrcSet, cdnUrl } from '../../lib/images';
import { afterPageLoad } from '../../lib/timing';

/**
 * The opening photograph, toned the reference's deep blue.
 *
 * The photo is the cover Dany chose in the dashboard, baked into a file at
 * build time (scripts/bake-hero.mjs) so it can be preloaded by index.html and
 * served by the CDN at the size of the screen: it is the largest thing on the
 * first screen, and it used to arrive last. If she has changed the cover since
 * the build, the new one is swapped in once the page has loaded. Any
 * photograph goes through the same treatment — grey, then multiplied with
 * blue — so an upload sits in the design instead of fighting it.
 *
 * The bottom padding is the space the service strip covers.
 */
export default function Hero() {
  const { businessPhone } = useConfig();
  const [override, setOverride] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    afterPageLoad().then(newerCover).then((cover) => { if (live && cover) setOverride(cover); });
    return () => { live = false; };
  }, []);

  return (
    <section id="top" className="relative overflow-hidden bg-site-deep">
      <img
        src={override || cdnUrl(HERO_COVER.file, 1280, HERO_QUALITY)}
        srcSet={override ? undefined : cdnSrcSet(HERO_COVER.file, HERO_WIDTHS, HERO_QUALITY)}
        sizes="100vw"
        width={HERO_COVER.width}
        height={HERO_COVER.height}
        fetchPriority="high"
        onError={() => setOverride(PHOTOS.hero)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover grayscale"
      />
      <div aria-hidden className="absolute inset-0 bg-[#0b4a82] mix-blend-multiply" />
      <div aria-hidden className="absolute inset-0 bg-[#031a33]/35" />

      <div className="relative flex min-h-[600px] flex-col items-center justify-center px-5 pb-[150px] pt-[150px] text-center lg:min-h-[790px] lg:pb-[150px] lg:pt-[210px]">
        <p className="text-[14px] font-light uppercase tracking-[0.2em] text-white/85 sm:text-[20px] sm:tracking-[0.32em] lg:text-[23px]">
          Spotless Homes &amp; Offices
        </p>
        <h1 className="mt-1 text-[30px] font-bold uppercase leading-tight tracking-[0.02em] text-white sm:text-[36px] lg:text-[42px]">
          Across Connecticut
        </h1>
        <button
          type="button"
          onClick={() => openQuote()}
          className="mt-8 inline-flex h-[52px] min-w-[180px] items-center justify-center rounded-full bg-white px-9 text-[13px] font-semibold uppercase tracking-[0.12em] text-site-blue shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] transition-[transform,background-color] duration-300 ease-[var(--ease-settle)] hover:bg-[#eef5ff] active:scale-[0.98]"
        >
          Free Quote
        </button>

        {/* On a computer the two contacts sit top right in the header. On a
            phone or tablet the header has room only for the menu button, so
            they come here, in the first view, drawn the same way: a thin icon,
            the line to tap, a quieter line under it, and a rule between the
            two like the one between the menu's links. */}
        <div className="mt-10 grid w-full max-w-[400px] grid-cols-2 border-t border-white/20 pt-6 lg:hidden">
          <a
            href={`tel:${businessPhone.replace(/\D/g, '')}`}
            onClick={triggerAICall}
            className="flex min-w-0 items-center justify-center gap-2.5 pr-2"
          >
            <PhoneCall size={22} strokeWidth={1.4} className="shrink-0 text-white/70" />
            <span className="text-left leading-none">
              <span className="block whitespace-nowrap text-[13.5px] font-semibold text-white">{businessPhone}</span>
              <span className="mt-1.5 block text-[11.5px] font-medium text-white/60">Call Dany</span>
            </span>
          </a>
          <a
            href={smsHref()}
            onClick={handleSMSLaunch}
            className="relative flex min-w-0 items-center justify-center gap-2.5 pl-2 before:absolute before:left-0 before:top-1/2 before:h-9 before:w-px before:-translate-y-1/2 before:bg-white/20"
          >
            <MessageSquareText size={22} strokeWidth={1.4} className="shrink-0 text-white/70" />
            <span className="text-left leading-none">
              <span className="block text-[13px] font-semibold uppercase tracking-[0.04em] text-white">Text Us</span>
              <span className="mt-1.5 block whitespace-nowrap text-[11.5px] font-medium text-white/60">{SMS_NUMBER_DISPLAY}</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
