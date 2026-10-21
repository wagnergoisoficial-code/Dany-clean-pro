import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useGallery, photoTitle, thumbUrl } from '../../hooks/useGallery';
import SiteContainer from './SiteContainer';

/** Two full rows on a computer, four on a phone, before "View all". */
const FIRST = 8;

/**
 * "Our Work" — the photos Dany uploads from the dashboard.
 *
 * Built from the reference's own parts: the centred navy heading of "Why
 * Choose Us?", photos with the same slight corner, the round buttons, and the
 * blue pill of the hero for "View all". A photo opens full size; arrows and
 * the keyboard move through the rest.
 */
export default function Gallery() {
  const { photos } = useGallery();
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const lastThumb = useRef<HTMLButtonElement | null>(null);

  if (!photos.length) return null;
  const shown = expanded ? photos : photos.slice(0, FIRST);

  return (
    <section id="gallery" className="scroll-mt-6 bg-white py-[90px] lg:py-[125px]">
      <SiteContainer>
        <h2 className="text-center text-[28px] font-bold leading-tight text-site-navy lg:text-[33px]">Our Work</h2>
        <p className="mx-auto mt-4 max-w-[560px] text-center text-[14.5px] leading-[1.85] text-site-text">
          Real homes and workplaces, cleaned by the Dany Clean Pro team across Connecticut.
        </p>

        <ul className="mt-[55px] grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:mt-[65px] lg:grid-cols-4 lg:gap-6">
          {shown.map((photo, i) => {
            const title = photoTitle(photo.title);
            return (
              <li key={photo.url}>
                <button
                  type="button"
                  onClick={(e) => { lastThumb.current = e.currentTarget; setOpen(i); }}
                  aria-label={title ? `Open photo: ${title}` : `Open photo ${i + 1} of ${photos.length}`}
                  className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[3px] bg-site-mist focus:outline-none focus-visible:ring-2 focus-visible:ring-site-blue focus-visible:ring-offset-2"
                >
                  <img
                    src={thumbUrl(photo.url, 640)}
                    // If the resized copy cannot be had, the original will do.
                    onError={(e) => { if (e.currentTarget.src !== photo.url) e.currentTarget.src = photo.url; }}
                    alt={title || 'Cleaning by Dany Clean Pro'}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-settle)] group-hover:scale-[1.04]"
                  />
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-site-deep/0 transition-colors duration-300 group-hover:bg-site-deep/35">
                    <span className="flex h-11 w-11 scale-90 items-center justify-center rounded-full bg-white text-site-blue opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-settle)] group-hover:scale-100 group-hover:opacity-100">
                      <Plus size={18} strokeWidth={2.25} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {photos.length > FIRST && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="inline-flex h-[52px] min-w-[200px] items-center justify-center rounded-full bg-site-blue px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-12px_rgba(13,118,242,0.7)] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-[0.98]"
            >
              {expanded ? 'Show fewer' : `View all ${photos.length} photos`}
            </button>
          </div>
        )}
      </SiteContainer>

      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onIndex={setOpen}
          onClose={() => { setOpen(null); lastThumb.current?.focus(); }}
        />
      )}
    </section>
  );
}

function Lightbox({ photos, index, onIndex, onClose }: {
  photos: { url: string; title: string }[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = photos.length;
  const step = useCallback((by: number) => onIndex((index + by + count) % count), [index, count, onIndex]);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  const photo = photos[index];
  const title = photoTitle(photo.title);
  const round = 'flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-site-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-site-night/95 px-4 py-16 font-site"
    >
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className={`${round} absolute right-4 top-4 sm:right-6 sm:top-6`}>
        <X size={20} strokeWidth={2} />
      </button>

      <img
        key={photo.url}
        src={photo.url}
        alt={title || 'Cleaning by Dany Clean Pro'}
        className="max-h-[78vh] max-w-full rounded-[3px] object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:max-w-[88vw]"
      />

      <div className="mt-6 flex items-center gap-5">
        <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={round}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <p className="min-w-[120px] text-center text-[13px] font-medium text-white/70">
          {title && <span className="block text-[14px] font-semibold text-white">{title}</span>}
          {index + 1} / {count}
        </p>
        <button type="button" onClick={() => step(1)} aria-label="Next photo" className={round}>
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
