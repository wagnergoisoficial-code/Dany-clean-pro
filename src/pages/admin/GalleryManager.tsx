import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, Edit3, X, Save, Download } from 'lucide-react';
import { GalleryItem, AuthState } from '../../types';
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db, storage, isFirebaseReady, auth as firebaseAuth } from '../../lib/firebase';
import { compressImage } from '../../lib/utils';
import { defaultImages } from '../../lib/galleryDefaults';

interface GalleryManagerProps {
  auth: AuthState;
}

export default function GalleryManager({ auth }: GalleryManagerProps) {
  const queryClient = useQueryClient();
  const [newImage, setNewImage] = useState({ url: '', title: '', category: 'Residential' });
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [firebaseAuthLoading, setFirebaseAuthLoading] = useState(true);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseAuth) {
      setFirebaseAuthLoading(false);
      return;
    }
    const unsubscribe = firebaseAuth.onAuthStateChanged((user: any) => {
      setFirebaseUser(user);
      setFirebaseAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const allowedEmails = ['wagnergoisoficial@gmail.com', 'danycleanenpro@gmail.com'];
  const isGoogleAdmin = firebaseUser?.email && allowedEmails.includes(firebaseUser.email.toLowerCase());

  const handleGoogleSignIn = async () => {
    setGoogleAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;
      const emailLower = user?.email?.toLowerCase();
      if (!emailLower || !allowedEmails.includes(emailLower)) {
        setGoogleAuthError('This Google account is not authorized for admin uploads.');
      }
    } catch (err: any) {
      console.error('Google Auth Popup failed:', err);
      setGoogleAuthError(err?.message || 'Failed to authenticate with Google. Please try again.');
    }
  };
  const [sourceType, setSourceType] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadedUrl, setFileUploadedUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download helper action via secure backend proxy
  const handleDownload = (url: string, title: string) => {
    try {
      const link = document.createElement('a');
      link.href = `/api/gallery/download?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Direct proxy download trigger failed:', err);
      // Clean fallback
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Editing logic state variables
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editSourceType, setEditSourceType] = useState<'upload' | 'url'>('url');
  const [editingFileName, setEditingFileName] = useState('');
  const [editingFileUploading, setEditingFileUploading] = useState(false);
  const [editingUploadError, setEditingUploadError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const isProd = window.location.hostname === 'danycleanpro.com' || 
                 window.location.hostname === 'www.danycleanpro.com' ||
                 window.location.hostname.includes('netlify.app') ||
                 window.location.hostname.includes('run.app');

  // Reusable local upload helper
  const performLocalUploadFallback = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Str = reader.result as string;
        try {
          const response = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${auth?.token || ''}`
            },
            body: JSON.stringify({
              base64: base64Str,
              filename: file.name
            })
          });
          
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Server rejected file upload.');
          }
          
          const result = await response.json();
          resolve(result.url);
        } catch (innerErr: any) {
          reject(new Error(innerErr.message || 'Server upload failed.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file on the device.'));
      reader.readAsDataURL(file);
    });
  };

  // Synchronous conversion of base64 to Blob without network fetch, bypassing any sandboxed iframe blocks
  const base64ToBlobSync = (base64DataUrl: string): Blob => {
    try {
      const parts = base64DataUrl.split(',');
      const contentType = parts[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(parts[1]);
      const byteArrays = [];
      const sliceSize = 1024;
      
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      return new Blob(byteArrays, { type: contentType });
    } catch (err) {
      console.warn("base64ToBlobSync failed, trying alternative converter", err);
      const binary = atob(base64DataUrl?.split(',')[1] || '');
      const array = [];
      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
    }
  };

  // Unified safe single upload helper targeting Firebase Storage or Node.js disk
  const uploadSingleFileToStorageOrLocal = async (file: File, category: string): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Apenas arquivos de imagem são permitidos.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Apenas formatos JPG, PNG e WEBP são permitidos.');
    }

    // Read to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    // Compress using top-notch helper
    const compressedBase64 = await compressImage(base64, 1200, 0.75);

    // High reliability Node.js backend upload direct flow (Authorized via Admin Token) - Bypasses Firebase Storage to avoid iframe hangs and CORS blocks
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token || ''}`
        },
        body: JSON.stringify({
          base64: compressedBase64,
          filename: file.name
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server rejected file upload.');
      }
      
      const result = await response.json();
      return result.url;
    } catch (innerErr: any) {
      throw new Error(innerErr.message || 'Falha ao salvar imagem no servidor.');
    }
  };

  const handleMultipleUploads = async (files: FileList) => {
    setUploadingFile(true);
    setUploadError(null);
    
    const fileArray = Array.from(files);
    let successCount = 0;
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setFileName(`Salvando imagem ${i + 1} de ${fileArray.length}... (${file.name})`);
      
      try {
        const downloadUrl = await uploadSingleFileToStorageOrLocal(file, newImage.category);
        const filenameNoExt = file.name.replace(/\.[^/.]+$/, "");
        const formattedTitle = filenameNoExt
          .replace(/[-_]/g, ' ')
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const trimmedTitle = formattedTitle || 'Foto do Trabalho';
        const trimmedUrl = downloadUrl;
        const trimmedCategory = (newImage.category || 'Residential').trim();

        let firestoreSuccess = false;
        if (isFirebaseReady()) {
          try {
            await addDoc(collection(db, 'gallery'), {
              url: trimmedUrl,
              title: trimmedTitle,
              category: trimmedCategory,
              createdAt: serverTimestamp()
            });
            firestoreSuccess = true;
          } catch (fireErr) {
            console.warn('Silent fallback to SQLite database');
          }
        }

        // SQLite db sync
        const response = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.token || ''}`
          },
          body: JSON.stringify({
            url: trimmedUrl,
            title: trimmedTitle,
            category: trimmedCategory
          })
        });

        if (!response.ok && !firestoreSuccess) {
          throw new Error('Falha ao registrar imagem na base de dados.');
        }

        successCount++;
      } catch (err: any) {
        console.error(`Upload failed for ${file.name}:`, err);
        setUploadError(`Falha na imagem ${file.name}: ${err.message}`);
      }
    }

    setUploadingFile(false);
    setFileName('');
    queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleUploads(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleUploads(e.target.files);
    }
  };

  const { data: gallery, isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['admin-gallery'],
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
        console.warn('Local SQLite Gallery fetch failed, ignoring');
      }

      let firestoreItems: GalleryItem[] = [];
      try {
        if (isFirebaseReady()) {
          const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          firestoreItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any;
        }
      } catch (err) {
        console.warn('Firestore gallery fetch failed, ignoring:', err);
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

  const handleReplaceUpload = async (file: File) => {
    if (!editingItem) return;
    setEditingFileUploading(true);
    setEditingUploadError(null);
    try {
      const downloadUrl = await uploadSingleFileToStorageOrLocal(file, editingItem.category);
      setEditingItem(prev => prev ? { ...prev, url: downloadUrl } : null);
    } catch (err: any) {
      console.error('Editing replace upload error:', err);
      setEditingUploadError(err.message || 'Erro ao substituir arquivo.');
    } finally {
      setEditingFileUploading(false);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleReplaceUpload(e.target.files[0]);
    }
  };

  const addImage = useMutation({
    mutationFn: async (item: typeof newImage) => {
      const trimmedTitle = (item?.title || '').trim();
      const trimmedUrl = (item?.url || '').trim();
      const trimmedCategory = (item?.category || '').trim();

      if (!trimmedTitle) {
        throw new Error('Título é obrigatório.');
      }
      if (!trimmedUrl) {
        throw new Error('Por favor, informe uma URL ou carregue uma imagem.');
      }
      if (!trimmedCategory) {
        throw new Error('Categoria é obrigatória.');
      }

      let firestoreSuccess = false;
      if (isFirebaseReady()) {
        try {
          await addDoc(collection(db, 'gallery'), {
            url: trimmedUrl,
            title: trimmedTitle,
            category: trimmedCategory,
            createdAt: serverTimestamp()
          });
          firestoreSuccess = true;
        } catch (firebaseErr: any) {
          console.warn('Firebase document insert issue; using SQL fallback:', firebaseErr);
        }
      }

      // Sync SQLite
      try {
        const response = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.token || ''}`
          },
          body: JSON.stringify({
            url: trimmedUrl,
            title: trimmedTitle,
            category: trimmedCategory
          })
        });
        if (!response.ok && !firestoreSuccess) {
          throw new Error('SQLite registration rejected.');
        }
      } catch (err) {
        if (!firestoreSuccess) {
          throw new Error('Falha ao adicionar imagem ao banco local SQLite.');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setNewImage({ url: '', title: '', category: 'Residential' });
      setFileUploadedUrl('');
      setFileName('');
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Erro ao adicionar imagem.');
    }
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error('Cannot delete: No image ID provided.');
      }

      let deletedFromFirestore = false;
      if (isFirebaseReady() && !String(id).startsWith('default')) {
        try {
          await deleteDoc(doc(db, 'gallery', id));
          deletedFromFirestore = true;
        } catch (err) {
          console.warn('Firestore deletion failed, trying SQLite: ', err);
        }
      }

      // SQLite try
      try {
        const response = await fetch(`/api/admin/gallery/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${auth?.token || ''}`
          }
        });
        if (response.ok) return;
      } catch (err) {
        if (deletedFromFirestore) return; // Silent success if firestore worked
        throw new Error('Failed to delete image from either SQL database or Firestore.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Erro ao excluir imagem.');
    }
  });

  const updateImage = useMutation({
    mutationFn: async (item: GalleryItem | null) => {
      if (!item) {
        throw new Error('No image context selected for update.');
      }
      const trimmedTitle = (item.title || '').trim();
      const trimmedUrl = (item.url || '').trim();
      const trimmedCategory = (item.category || '').trim();

      if (!trimmedTitle) throw new Error('Título é obrigatório.');
      if (!trimmedUrl) throw new Error('URL da imagem é obrigatória.');

      const isDefault = String(item.id).startsWith('default');

      if (isDefault) {
        // Since it's a default placeholder, save as a NEW custom image in DBs
        let firestoreSuccess = false;
        if (isFirebaseReady()) {
          try {
            await addDoc(collection(db, 'gallery'), {
              url: trimmedUrl,
              title: trimmedTitle,
              category: trimmedCategory,
              createdAt: serverTimestamp()
            });
            firestoreSuccess = true;
          } catch (firebaseErr: any) {
            console.warn('Firebase default replacement save failed, trying SQL: ', firebaseErr);
          }
        }

        const response = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.token || ''}`
          },
          body: JSON.stringify({
            url: trimmedUrl,
            title: trimmedTitle,
            category: trimmedCategory
          })
        });
        if (!response.ok && !firestoreSuccess) {
          throw new Error('SQLite insert rejected.');
        }
        return;
      }

      // Regular update for non-default elements
      let firestoreUpdated = false;
      if (isFirebaseReady()) {
        try {
          const docRef = doc(db, 'gallery', String(item.id));
          await updateDoc(docRef, {
            url: trimmedUrl,
            title: trimmedTitle,
            category: trimmedCategory
          });
          firestoreUpdated = true;
        } catch (err) {
          console.warn('Firestore update failed, trying SQL: ', err);
        }
      }

      try {
        const response = await fetch(`/api/admin/gallery/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.token || ''}`
          },
          body: JSON.stringify({
            url: trimmedUrl,
            title: trimmedTitle,
            category: trimmedCategory
          })
        });
        if (response.ok) return;
      } catch (err) {
        if (firestoreUpdated) return; // Silent success if firestore worked
        throw new Error('Falha ao atualizar imagem.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setEditingItem(null);
      setEditingUploadError(null);
    },
    onError: (err: any) => {
      setEditingUploadError(err.message || 'Erro ao atualizar dados.');
    }
  });

  // Unique key deduplication and combining user uploads with default collection 
  const userItems = gallery || [];

  // Dedup fallback default list if matching URLs
  const dedupedDefaults = defaultImages.map((def, idx) => ({
    id: `default-${idx}`,
    url: def.url,
    title: def.title,
    category: def.category,
    isDefault: true,
    created_at: new Date().toISOString()
  })).filter(def => 
    !userItems.some(userItem => userItem.url === def.url)
  );

  const displayImages = [...userItems, ...dedupedDefaults];

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-8">
        <h3 className="font-bold text-xl sm:text-2xl text-slate-900 mb-6 font-display">Adicionar Novas Fotos ao Portfólio</h3>
        
        {/* Information banner about uploads */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-50 text-blue-600">
              <Upload size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">Envio de Fotos do Dispositivo</p>
              <p className="text-[11px] text-slate-500">Selecione fotos da galeria do seu celular ou do seu notebook</p>
            </div>
          </div>
          {firebaseUser && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Google Auth: {firebaseUser.email}
            </div>
          )}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">1ª Etapa: Escolha a Categoria</label>
            <select 
              className="bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm w-full focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700 shadow-sm cursor-pointer"
              value={newImage.category}
              onChange={(e) => setNewImage({...newImage, category: e.target.value})}
            >
              <option value="Residential">Limpeza Residencial (Residential)</option>
              <option value="Commercial">Limpeza Comercial (Commercial)</option>
              <option value="Deep Clean">Limpeza Pesada (Deep Clean)</option>
              <option value="Event Prep">Pós-Obra / Eventos (Event Prep)</option>
            </select>
            <p className="text-[11px] text-slate-400">As fotos que você selecionar serão categorizadas sob este grupo no site automaticamente.</p>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">2ª Etapa: Carregar Fotos da Galeria</label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${isDragging ? 'border-blue-500 bg-blue-50/50 shadow-inner' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-blue-400'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                multiple
              />
              
              {uploadingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent" />
                  <p className="text-[12px] text-blue-600 font-bold uppercase tracking-wider animate-pulse">{fileName || 'Salvando fotos no banco de dados...'}</p>
                  <p className="text-[10px] text-slate-400">Processando e enviando de forma 100% direta e automática</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 p-1">
                  <Upload className="text-blue-500 w-8 h-8 animate-pulse mb-1" />
                  <p className="text-xs text-slate-700 font-bold uppercase tracking-wide">Arraste fotos aqui ou Clique para buscar</p>
                  <p className="text-[11px] text-slate-500 max-w-md">
                    Selecione uma ou mais fotos do seu celular (abrindo sua galeria de fotos) ou notebook. Elas serão salvas no site imediatamente!
                  </p>
                  
                  <button
                    type="button"
                    id="new-gallery-item-upload-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2 hover:shadow animate-bounce"
                  >
                    <Upload className="w-4 h-4" />
                    Abrir Minha Galeria
                  </button>
                </div>
              )}
            </div>
            
            {uploadError && (
              <p className="text-red-500 text-xs font-semibold mt-2">{uploadError}</p>
            )}
          </div>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic">Carregando itens do portfólio...</div>
        ) : Array.isArray(displayImages) && displayImages.length > 0 ? (
          (displayImages as any[]).map((item) => (
            <div 
              key={item.id} 
              onClick={() => {
                setEditingItem(item);
                setEditSourceType('upload');
                setEditingFileName('');
                setEditingUploadError(null);
              }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-150 aspect-square cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-300"
            >
              {item.isDefault ? (
                <div className="absolute top-2 left-2 z-10 bg-slate-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  Foto de Exemplo
                </div>
              ) : (
                <div className="absolute top-2 left-2 z-10 bg-emerald-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                  Sua Foto
                </div>
              )}
              <img src={item?.url || ''} className="w-full h-full object-cover" alt={item?.title || ''} />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                <p className="text-white font-bold text-sm mb-1">{item?.title || 'Sem título'}</p>
                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">{item?.category || 'Residential'}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item?.url || '', item?.title || 'image');
                    }}
                    className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center cursor-pointer"
                    title="Baixar imagem"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                      setEditSourceType('upload');
                      setEditingFileName('');
                      setEditingUploadError(null);
                    }}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center cursor-pointer"
                    title="Substituir foto / Editar detalhes"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      if (item.isDefault) {
                        alert('Esta é uma imagem padrão do sistema. Clique no botão azul de editar para substituí-la por uma foto real do seu próprio trabalho!');
                        return;
                      }
                      if (confirm('Tem certeza de que deseja excluir esta imagem?')) {
                        deleteImage.mutate(String(item.id));
                      }
                    }}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all shadow-lg flex items-center justify-center cursor-pointer"
                    disabled={deleteImage.isPending}
                    title="Excluir imagem"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 italic font-medium">Nenhum item encontrado no portfólio.</div>
        )}
      </div>

      {/* Edit and Replace Image Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-slate-900 font-display">Substituir Foto & Detalhes</h3>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Substituir Foto (Upload do Dispositivo)</label>
                <div 
                  onClick={() => editFileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 min-h-[140px] border-slate-200"
                >
                  <input 
                    type="file" 
                    ref={editFileInputRef} 
                    onChange={handleEditFileChange} 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                  />
                  
                  {editingFileUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider animate-pulse">Enviando nova imagem da sua galeria...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="text-blue-500 w-6 h-6 animate-pulse" />
                      <p className="text-xs text-slate-700 font-bold uppercase">Clique para escolher outra foto</p>
                      <p className="text-[9px] text-slate-400">Substitua por um arquivo JPG, PNG ou WEBP da sua galeria</p>
                      {editingFileName ? (
                        <p className="text-[10px] text-emerald-600 font-bold max-w-[250px] truncate mt-1 bg-emerald-50 px-2 py-0.5 rounded">Selecionado: {editingFileName}</p>
                      ) : (
                        editingItem?.url && <p className="text-[9px] text-slate-400">Foto atual já configurada</p>
                      )}
                    </div>
                  )}
                </div>
                {editingUploadError && (
                  <p className="text-red-500 text-xs font-semibold mt-2">{editingUploadError}</p>
                )}
              </div>

              {/* Current Preview */}
              {editingItem?.url && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Pré-visualização da Imagem</label>
                  <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-[150px] relative bg-slate-50 flex items-center justify-center">
                    <img src={editingItem.url} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                </div>
              )}

              {/* Edit Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Título da Foto</label>
                  <input 
                    className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ex: Limpeza de Cozinha Detalhada"
                    value={editingItem?.title || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Categoria</label>
                  <select 
                    className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full focus:outline-none focus:border-blue-500 transition-colors"
                    value={editingItem?.category || 'Residential'}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, category: e.target.value } : null)}
                  >
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Deep Clean</option>
                    <option>Event Prep</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setEditingItem(null)}
                className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={() => updateImage.mutate(editingItem)}
                disabled={updateImage.isPending || editingFileUploading || !editingItem?.url}
                className="flex-grow bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {updateImage.isPending ? 'Salvando...' : <><Save size={16} /> Salvar Alterações</>}
              </button>
            </div>
            {editingUploadError && (
              <p className="text-red-500 text-xs font-semibold mt-2 text-center">{editingUploadError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
