import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { GalleryItem } from '../../types';
import Container from '../ui/Container';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Info, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import { defaultImages } from '../../lib/galleryDefaults';

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [itemsLimit, setItemsLimit] = useState<number>(9);

  const { data: galleryItems, isLoading } = useQuery<GalleryItem[]>({
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

  // Unique key deduplication and combining user uploads with default collection 
  const userItems = galleryItems || [];
  
  // Dedup fallback default list if matching URLs (to avoid showing the same thing twice)
  const dedupedDefaults = defaultImages.filter(def => 
    !userItems.some(userItem => userItem.url === def.url)
  );

  // User uploaded work comes FIRST, then beautiful reference catalog fills up to ensure 30+ items at all times
  const displayImages = [...userItems, ...dedupedDefaults];

  // Filtering Logic
  const filteredImages = selectedCategory === 'All' 
    ? displayImages 
    : displayImages.filter(img => img.category?.toLowerCase() === selectedCategory.toLowerCase());

  // Pagination / Collapsing display limit
  const visibleImages = filteredImages.slice(0, itemsLimit);

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

  const categories = ['All', 'Residential', 'Commercial', 'Deep Clean', 'Event Prep'];

  return (
    <section id="gallery" className="py-24 sm:py-32 bg-slate-50/50">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-blue-600 text-xs font-black uppercase tracking-[0.2em] block">Portfólio & Amostras</span>
            <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
              Galeria de <br />
              Nossos Trabalhos.
            </h3>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl">
              Nossa galeria conta com mais de 30 fotos reais e profissionais de limpezas residenciais, comerciais, profundas e pós-eventos. Veja os resultados com seus próprios olhos!
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-2xl border border-blue-100/50 text-xs font-bold">
            <LayoutGrid className="w-4 h-4 text-blue-500" />
            <span>Exibindo {filteredImages.length} fotos</span>
          </div>
        </div>

        {/* Category Filter Selector Buttons */}
        <div className="flex flex-wrap gap-2 mb-10 pb-2 border-b border-slate-200/50">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setItemsLimit(9); // Reset view size to 9 on filter change
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10 scale-102' 
                  : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60'
              }`}
            >
              {translateCategory(cat)}
            </button>
          ))}
        </div>

        {/* Dynamic Gallery Container */}
        <AnimatePresence mode="popLayout">
          {visibleImages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-16 text-center text-slate-400 italic font-medium"
            >
              Nenhuma imagem cadastrada para esta categoria.
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              id="platform-gallery-grid-container"
            >
              {visibleImages.map((img, i) => {
                const isUserUpload = (img as any).createdAt || !defaultImages.some(def => def.url === img.url);
                return (
                  <motion.div
                    layout
                    key={`${img.url}-${i}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
                    whileHover={{ y: -6 }}
                    className="relative group rounded-[2rem] overflow-hidden bg-white aspect-[4/5] shadow-sm hover:shadow-xl transition-all border border-slate-100"
                  >
                    {isUserUpload && (
                      <div className="absolute top-4 left-4 z-10 bg-blue-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        Nosso Serviço
                      </div>
                    )}
                    <img 
                      src={img.url} 
                      alt={img.title} 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-450 flex flex-col justify-end p-8">
                      <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">
                        {translateCategory(img.category || 'Residential')}
                      </span>
                      <h4 className="text-white font-bold text-xl tracking-tight leading-tight">{img.title || 'Foto de Serviço'}</h4>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsible Pagination controls */}
        {filteredImages.length > 9 && (
          <div className="mt-16 text-center">
            {itemsLimit < filteredImages.length ? (
              <button
                id="gallery-load-more-btn"
                onClick={() => setItemsLimit(prev => Math.min(prev + 12, filteredImages.length))}
                className="inline-flex items-center gap-2 bg-white text-slate-800 hover:text-blue-600 font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-2xl shadow-sm border border-slate-200/80 active:scale-95 transition-all cursor-pointer hover:shadow-md hover:border-slate-300"
              >
                Ver mais fotos ({filteredImages.length - itemsLimit} restantes)
                <ChevronDown className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="gallery-show-less-btn"
                onClick={() => setItemsLimit(9)}
                className="inline-flex items-center gap-2 bg-white text-slate-800 hover:text-blue-600 font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-2xl shadow-sm border border-slate-200/80 active:scale-95 transition-all cursor-pointer hover:shadow-md hover:border-slate-300"
              >
                Ver menos (Recolher galeria)
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
