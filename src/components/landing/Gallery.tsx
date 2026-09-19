import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { GalleryItem } from '../../types';
import Container from '../ui/Container';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, ArrowRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import { defaultImages } from '../../lib/galleryDefaults';

const categories = ['All', 'Residential', 'Commercial', 'Deep Clean', 'Event Prep'];

const translateCategory = (cat: string) => {
  switch (cat.toLowerCase()) {
    case 'residential': return 'Residencial';
    case 'commercial': return 'Comercial';
    case 'deep clean': return 'Pesada (Deep Clean)';
    case 'event prep': return 'Pré/Pós Evento';
    case 'all': return 'Todos';
    default: return cat;
  }
};

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [view, setView] = useState<'carousel' | 'grid'>('carousel');
  const [itemsLimit, setItemsLimit] = useState<number>(12);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const { data: galleryItems } = useQuery<GalleryItem[]>({
    queryKey: ['gallery'],
    queryFn: async () => {
      let localItems: GalleryItem[] = [];
      try {
        const response = await fetch('/api/gallery');
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            localItems = await response.json();
          }
        }
      } catch (err) {
        console.warn('Local SQLite Gallery API issue: ', err);
      }

      let firestoreItems: GalleryItem[] = [];
      try {
        if (db && db.type !== 'mock') {
          const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          firestoreItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any;
        }
      } catch (err) {
        console.warn('Firestore gallery fetch issue: ', err);
      }

      // Merge and remove duplicates by URL
      const merged = [...firestoreItems, ...localItems];
      const uniqueMap = new Map<string, GalleryItem>();
      for (const item of merged) {
        if (item.url && !uniqueMap.has(item.url)) {
          uniqueMap.set(item.url, item);
        }
      }
      return Array.from(uniqueMap.values());
    }
  });

  const userItems = galleryItems || [];

  // Dedup fallback default list if matching URLs (to avoid showing the same thing twice)
  const dedupedDefaults = defaultImages.filter(def =>
    !userItems.some(userItem => userItem.url === def.url)
  );

  // User uploaded work comes FIRST, then the reference catalog fills the gallery out
  const displayImages = [...userItems, ...dedupedDefaults];

  const filteredImages = selectedCategory === 'All'
    ? displayImages
    : displayImages.filter(img => img.category?.toLowerCase() === selectedCategory.toLowerCase());

  const visibleImages = view === 'grid' ? filteredImages.slice(0, itemsLimit) : filteredImages;

  /* ---------------- Carousel controls ---------------- */

  const syncArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);
    return () => {
      el.removeEventListener('scroll', syncArrows);
      window.removeEventListener('resize', syncArrows);
    };
  }, [syncArrows, view, filteredImages.length]);

  const slide = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.82, behavior: 'smooth' });
  };

  /* ---------------- Lightbox ---------------- */

  const step = useCallback((direction: 1 | -1) => {
    setLightbox(prev => {
      if (prev === null) return prev;
      const next = prev + direction;
      if (next < 0) return filteredImages.length - 1;
      if (next >= filteredImages.length) return 0;
      return next;
    });
  }, [filteredImages.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightbox, step]);

  const active = lightbox !== null ? filteredImages[lightbox] : null;

  return (
    <section id="gallery" className="w-full bg-surface py-16 lg:py-24">
      <Container>
        {/* Section head */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
          <div className="max-w-2xl">
            <span className="block text-label-sm uppercase text-accent mb-3">Portfólio &amp; Amostras</span>
            <h2 className="font-display text-headline-md lg:text-headline-lg text-ink">
              Galeria de Nossos Trabalhos
            </h2>
            <p className="text-body-md text-ink-muted mt-3">
              Mais de 30 fotos reais de limpezas residenciais, comerciais, profundas e pós-eventos.
              Arraste para o lado ou abra a grade completa para ver os resultados.
            </p>
          </div>

          {/* Filters, dot separated — no pills, no cards */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-label-md uppercase">
            {categories.map((cat, i) => (
              <span key={cat} className="flex items-center gap-3">
                {i > 0 && <span className="text-rule">·</span>}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setItemsLimit(12);
                    trackRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                  }}
                  className={
                    selectedCategory === cat
                      ? "text-ink border-b border-accent pb-0.5"
                      : "text-ink-faint hover:text-ink transition-colors pb-0.5 border-b border-transparent"
                  }
                >
                  {translateCategory(cat)}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Counter + view switch */}
        <div className="flex items-center justify-between gap-6 border-y border-rule py-4 mb-8">
          <span className="text-label-sm uppercase text-ink-faint">
            Exibindo {filteredImages.length} fotos
          </span>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setView(view === 'carousel' ? 'grid' : 'carousel')}
              className="text-label-md uppercase text-ink hover:text-accent transition-colors"
            >
              {view === 'carousel' ? 'Ver grade completa' : 'Ver carrossel'}
            </button>

            {view === 'carousel' && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => slide(-1)}
                  disabled={atStart}
                  aria-label="Fotos anteriores"
                  className="w-10 h-10 flex items-center justify-center bg-surface-low text-ink hover:bg-ink hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-surface-low disabled:hover:text-ink"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => slide(1)}
                  disabled={atEnd}
                  aria-label="Próximas fotos"
                  className="w-10 h-10 flex items-center justify-center bg-surface-low text-ink hover:bg-ink hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-surface-low disabled:hover:text-ink"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {filteredImages.length === 0 ? (
          <p className="py-16 text-center text-body-md text-ink-faint italic">
            Nenhuma imagem cadastrada para esta categoria.
          </p>
        ) : view === 'carousel' ? (
          /* Left-to-right filmstrip */
          <div
            ref={trackRef}
            className="no-scrollbar flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-0 -mx-6 px-6 lg:mx-0 lg:px-0"
          >
            {filteredImages.map((img, i) => (
              <figure
                key={`${img.url}-${i}`}
                onClick={() => setLightbox(i)}
                className="group relative shrink-0 snap-start cursor-pointer w-[78%] sm:w-[46%] lg:w-[31%] aspect-4/5 overflow-hidden bg-surface-mid"
              >
                <img
                  src={img.url}
                  alt={img.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent p-6 pt-16">
                  <span className="block text-label-sm uppercase text-white/70 mb-1">
                    {translateCategory(img.category || 'Residential')}
                  </span>
                  <figcaption className="font-display text-headline-sm text-white leading-tight">
                    {img.title || 'Foto de Serviço'}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        ) : (
          /* Full mosaic */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleImages.map((img, i) => (
              <figure
                key={`${img.url}-${i}`}
                onClick={() => setLightbox(i)}
                className="group relative cursor-pointer aspect-4/5 overflow-hidden bg-surface-mid"
              >
                <img
                  src={img.url}
                  alt={img.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <span className="block text-label-sm uppercase text-white/70 mb-1">
                    {translateCategory(img.category || 'Residential')}
                  </span>
                  <figcaption className="font-display text-body-lg text-white leading-tight">
                    {img.title || 'Foto de Serviço'}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        )}

        {/* Grid pagination */}
        {view === 'grid' && filteredImages.length > 12 && (
          <div className="mt-10 text-center">
            {itemsLimit < filteredImages.length ? (
              <button
                id="gallery-load-more-btn"
                onClick={() => setItemsLimit(prev => Math.min(prev + 12, filteredImages.length))}
                className="inline-flex items-center gap-2 text-label-md uppercase text-ink hover:text-accent transition-colors border-b border-rule hover:border-accent pb-1"
              >
                Ver mais fotos ({filteredImages.length - itemsLimit} restantes)
                <ChevronDown size={14} />
              </button>
            ) : (
              <button
                id="gallery-show-less-btn"
                onClick={() => setItemsLimit(12)}
                className="inline-flex items-center gap-2 text-label-md uppercase text-ink hover:text-accent transition-colors border-b border-rule hover:border-accent pb-1"
              >
                Ver menos (recolher galeria)
                <ChevronUp size={14} />
              </button>
            )}
          </div>
        )}
      </Container>

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-ink flex flex-col"
            onClick={() => setLightbox(null)}
          >
            <div className="flex items-center justify-between px-6 lg:px-12 h-20 shrink-0">
              <span className="text-label-sm uppercase text-white/60">
                {(lightbox ?? 0) + 1} / {filteredImages.length}
              </span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Fechar"
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="flex-grow flex items-center justify-center px-4 sm:px-16 pb-10 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Foto anterior"
                className="hidden sm:flex w-12 h-12 items-center justify-center text-white hover:bg-surface transition-colors shrink-0"
              >
                <ArrowLeft size={20} />
              </button>

              <figure className="flex-grow h-full flex flex-col items-center justify-center min-w-0">
                <img
                  src={active.url}
                  alt={active.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[70vh] max-w-full object-contain"
                />
                <figcaption className="mt-6 text-center">
                  <span className="block text-label-sm uppercase text-white/60 mb-1.5">
                    {translateCategory(active.category || 'Residential')}
                  </span>
                  <span className="block font-display text-headline-sm text-white">
                    {active.title || 'Foto de Serviço'}
                  </span>
                </figcaption>
              </figure>

              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Próxima foto"
                className="hidden sm:flex w-12 h-12 items-center justify-center text-white hover:bg-surface transition-colors shrink-0"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
