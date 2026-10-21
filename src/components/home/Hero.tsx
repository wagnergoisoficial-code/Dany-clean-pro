import { useEffect, useState } from 'react';
import { useSetting } from '../../lib/settings';
import { openQuote } from '../../lib/quote';
import { PHOTOS } from './content';

/**
 * The opening photograph, toned the reference's deep blue.
 *
 * The photo is whatever Dany set as the cover in the dashboard; until then, a
 * bright cleaned room. Any photograph goes through the same treatment — grey,
 * then multiplied with blue — so an upload sits in the design instead of
 * fighting it.
 *
 * The bottom padding is the space the service strip covers.
 */
export default function Hero() {
  const { value: cover } = useSetting('hero_cover');
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [cover]);

  return (
    <section id="top" className="relative overflow-hidden bg-site-deep">
      <img
        src={cover && !failed ? cover : PHOTOS.hero}
        onError={() => setFailed(true)}
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
      </div>
    </section>
  );
}
