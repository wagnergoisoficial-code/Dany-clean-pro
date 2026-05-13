import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { GalleryItem } from '../../types';
import Container from '../ui/Container';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';

const defaultImages = [
  { url: "https://images.unsplash.com/photo-1527515545081-5db817172677?auto=format&fit=crop&q=80&w=800", title: "Sala de Estar", category: "Residencial" },
  { url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800", title: "Cozinha Moderna", category: "Residencial" },
  { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800", title: "Banheiro de Luxo", category: "Limpeza Profunda" },
  { url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800", title: "Espaço de Escritório", category: "Comercial" },
  { url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&q=80&w=800", title: "Quarto Master", category: "Residencial" },
  { url: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=800", title: "Detalhes do Jantar", category: "Preparação para Eventos" }
];

export default function Gallery() {
  const { data: galleryItems, isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['gallery'],
    queryFn: async () => {
      const path = 'gallery';
      try {
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  });

  const displayImages = galleryItems && galleryItems.length > 0 ? galleryItems : defaultImages;

  return (
    <section id="gallery" className="py-32 bg-slate-50/50">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
              Veja os Resultados <br />
              Por Você Mesmo.
            </h3>
          </div>
          <button className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b-2 border-primary/10 pb-1 hover:border-blue-600 transition-all">
            Ver Galeria de Projetos
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayImages.map((img, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              className="relative group rounded-[2.5rem] overflow-hidden bg-white aspect-[4/5] shadow-sm"
            >
              <img 
                src={img.url} 
                alt={img.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{img.category}</span>
                <h4 className="text-white font-bold text-2xl tracking-tight">{img.title}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
