import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { GalleryItem, AuthState } from '../../types';
import { collection, query, orderBy, getDocs, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';

interface GalleryManagerProps {
  auth: AuthState;
}

export default function GalleryManager({ auth }: GalleryManagerProps) {
  const queryClient = useQueryClient();
  const [newImage, setNewImage] = useState({ url: '', title: '', category: 'Residential' });
  const isProd = window.location.hostname === 'danycleanpro.com' || 
                 window.location.hostname === 'www.danycleanpro.com' ||
                 window.location.hostname.includes('netlify.app');

  const { data: gallery, isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['admin-gallery'],
    queryFn: async () => {
      if (!isProd) {
        try {
          const response = await fetch('/api/gallery');
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              return await response.json();
            }
          }
        } catch (err) {
          console.warn('Admin Gallery API unavailable');
        }
      }

      // Firestore
      try {
        if (isFirebaseReady()) {
          const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any;
        }
      } catch (err) {
        console.error('Firestore gallery fetch failed:', err);
      }
      return [];
    }
  });

  const addImage = useMutation({
    mutationFn: async (item: typeof newImage) => {
      if (!isProd) {
        try {
          const response = await fetch('/api/admin/gallery', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify(item)
          });
          if (response.ok) return;
        } catch (err) {
          console.warn('Add Image API failed');
        }
      }

      // Firestore
      if (isFirebaseReady()) {
        await addDoc(collection(db, 'gallery'), {
          ...item,
          createdAt: serverTimestamp()
        });
        return;
      }
      throw new Error('Failed to add image');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setNewImage({ url: '', title: '', category: 'Residential' });
    }
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      if (!isProd) {
        try {
          const response = await fetch(`/api/admin/gallery/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${auth.token}`
            }
          });
          if (response.ok) return;
        } catch (err) {
          console.warn('Delete Image API failed');
        }
      }

      // Firestore
      if (isFirebaseReady()) {
        await deleteDoc(doc(db, 'gallery', id));
        return;
      }
      throw new Error('Failed to delete image');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-gallery'] })
  });

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-8">
        <h3 className="font-bold text-xl sm:text-2xl text-slate-900 mb-6">Add New Gallery Image</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            className="md:col-span-2 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full"
            placeholder="Image URL"
            value={newImage.url}
            onChange={(e) => setNewImage({...newImage, url: e.target.value})}
          />
          <input 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full"
            placeholder="Title"
            value={newImage.title}
            onChange={(e) => setNewImage({...newImage, title: e.target.value})}
          />
          <select 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full"
            value={newImage.category}
            onChange={(e) => setNewImage({...newImage, category: e.target.value})}
          >
            <option>Residential</option>
            <option>Commercial</option>
            <option>Deep Clean</option>
            <option>Event Prep</option>
          </select>
        </div>
        <button 
          onClick={() => addImage.mutate(newImage)}
          disabled={!newImage.url || addImage.isPending}
          className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 w-full md:w-auto"
        >
          {addImage.isPending ? 'Adding...' : <><Plus size={18} /> Add to Gallery</>}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic">Loading gallery items...</div>
        ) : gallery?.map((item) => (
          <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 aspect-square">
            <img src={item.url} className="w-full h-full object-cover" alt={item.title} />
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
              <p className="text-white font-bold text-sm mb-1">{item.title}</p>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">{item.category}</p>
              <button 
                onClick={() => { if(confirm('Delete this image?')) deleteImage.mutate(String(item.id)) }}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all shadow-lg"
                disabled={deleteImage.isPending}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
