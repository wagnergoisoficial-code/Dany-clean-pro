import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, Edit3, X, Save, Download } from 'lucide-react';
import { GalleryItem, AuthState } from '../../types';
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseReady } from '../../lib/firebase';

interface GalleryManagerProps {
  auth: AuthState;
}

export default function GalleryManager({ auth }: GalleryManagerProps) {
  const queryClient = useQueryClient();
  const [newImage, setNewImage] = useState({ url: '', title: '', category: 'Residential' });
  const [sourceType, setSourceType] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadedUrl, setFileUploadedUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download helper action
  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileExt = url.split('.').pop()?.split('?')[0] || 'jpg';
      link.download = `${title.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'image'}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: direct anchor link in new window for remote or CORS-blocked images
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
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editSourceType, setEditSourceType] = useState<'upload' | 'url'>('url');
  const [editingFileName, setEditingFileName] = useState('');
  const [editingFileUploading, setEditingFileUploading] = useState(false);
  const [editingUploadError, setEditingUploadError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const isProd = window.location.hostname === 'danycleanpro.com' || 
                 window.location.hostname === 'www.danycleanpro.com' ||
                 window.location.hostname.includes('netlify.app');

  const handleUpload = async (file: File) => {
    setUploadingFile(true);
    setUploadError(null);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Only JPG, PNG and WEBP formats are allowed.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size allowed is 5MB.');
      }

      setFileName(file.name);

      if (isProd) {
        if (!isFirebaseReady() || !storage) {
          throw new Error('Firebase Storage is currently not connected or initialized.');
        }
        const fileExt = file.name.split('.').pop() || 'jpg';
        const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const imgRef = storageRef(storage, `gallery/${newImage.category}/${safeName}`);
        
        const snapshot = await uploadBytes(imgRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        setFileUploadedUrl(downloadUrl);
        setNewImage(prev => ({ ...prev, url: downloadUrl }));
      } else {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Str = reader.result as string;
          try {
            const response = await fetch('/api/admin/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
              },
              body: JSON.stringify({
                base64: base64Str,
                filename: file.name
              })
            });
            
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Server rejected file upload.');
            }
            
            const result = await response.json();
            setFileUploadedUrl(result.url);
            setNewImage(prev => ({ ...prev, url: result.url }));
          } catch (innerErr: any) {
            setUploadError(innerErr.message || 'Server upload failed.');
          } finally {
            setUploadingFile(false);
          }
        };
        reader.onerror = () => {
          setUploadError('Failed to read file on the device.');
          setUploadingFile(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err: any) {
      console.error('Upload operation error:', err);
      setUploadError(err.message || 'Failed to complete upload.');
    } finally {
      if (isProd) {
        setUploadingFile(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

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

  const handleReplaceUpload = async (file: File) => {
    if (!editingItem) return;
    setEditingFileUploading(true);
    setEditingUploadError(null);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Only JPG, PNG and WEBP formats are allowed.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size allowed is 5MB.');
      }

      setEditingFileName(file.name);

      if (isProd) {
        if (!isFirebaseReady() || !storage) {
          throw new Error('Firebase Storage is currently not connected or initialized.');
        }
        const fileExt = file.name.split('.').pop() || 'jpg';
        const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const imgRef = storageRef(storage, `gallery/${editingItem.category}/${safeName}`);
        
        const snapshot = await uploadBytes(imgRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        setEditingItem(prev => prev ? { ...prev, url: downloadUrl } : null);
      } else {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Str = reader.result as string;
          try {
            const response = await fetch('/api/admin/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
              },
              body: JSON.stringify({
                base64: base64Str,
                filename: file.name
              })
            });
            
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Server rejected file upload.');
            }
            
            const result = await response.json();
            setEditingItem(prev => prev ? { ...prev, url: result.url } : null);
          } catch (innerErr: any) {
            setEditingUploadError(innerErr.message || 'Server upload failed.');
          } finally {
            setEditingFileUploading(false);
          }
        };
        reader.onerror = () => {
          setEditingUploadError('Failed to read file on the device.');
          setEditingFileUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err: any) {
      console.error('Editing upload operation error:', err);
      setEditingUploadError(err.message || 'Failed to complete upload.');
    } finally {
      if (isProd) {
        setEditingFileUploading(false);
      }
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
        throw new Error('Title is required.');
      }
      if (!trimmedUrl) {
        throw new Error('Please enter a valid image URL or upload an image file first.');
      }
      if (!trimmedCategory) {
        throw new Error('Category is required.');
      }

      if (!isProd) {
        let response;
        try {
          response = await fetch('/api/admin/gallery', {
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
        } catch (err) {
          throw new Error('Local SQLite server is offline or unreachable.');
        }

        if (response.ok) {
          return;
        } else {
          if (response.status === 401) {
            throw new Error('Your session expired. Please sign in to the local SQLite panel again.');
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Server rejected adding this item.');
        }
      }

      // Firestore
      if (isFirebaseReady()) {
        await addDoc(collection(db, 'gallery'), {
          url: trimmedUrl,
          title: trimmedTitle,
          category: trimmedCategory,
          createdAt: serverTimestamp()
        });
        return;
      }
      throw new Error('Firestore Database is currently offline or unconfigured.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setNewImage({ url: '', title: '', category: 'Residential' });
      setFileUploadedUrl('');
      setFileName('');
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Failed to add image.');
    }
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error('Cannot delete: No image ID provided.');
      }
      if (!isProd) {
        let response;
        try {
          response = await fetch(`/api/admin/gallery/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${auth?.token || ''}`
            }
          });
        } catch (err) {
          throw new Error('Local SQLite server unreachable for deletion.');
        }

        if (response.ok) return;

        if (response.status === 401) {
          throw new Error('Session unauthorized. Please sign in to local SQLite panel again.');
        }
        throw new Error('Server issues while deleting image.');
      }

      // Firestore
      if (isFirebaseReady()) {
        await deleteDoc(doc(db, 'gallery', id));
        return;
      }
      throw new Error('Database is currently not available.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Failed to delete image.');
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

      if (!trimmedTitle) throw new Error('Title is required.');
      if (!trimmedUrl) throw new Error('Image URL is required.');

      if (!isProd) {
        let response;
        try {
          response = await fetch(`/api/admin/gallery/${item.id}`, {
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
        } catch (err) {
          throw new Error('Local SQLite server unreachable for update.');
        }

        if (response.ok) return;

        if (response.status === 401) {
          throw new Error('Session unauthorized. Please sign in to local SQLite panel again.');
        }
        throw new Error('Server issues while updating image.');
      }

      // Firestore
      if (isFirebaseReady()) {
        const docRef = doc(db, 'gallery', String(item.id));
        await updateDoc(docRef, {
          url: trimmedUrl,
          title: trimmedTitle,
          category: trimmedCategory
        });
        return;
      }
      throw new Error('Database is offline or not configured.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setEditingItem(null);
      setEditingUploadError(null);
    },
    onError: (err: any) => {
      setEditingUploadError(err.message || 'Failed to update image.');
    }
  });

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-8">
        <h3 className="font-bold text-xl sm:text-2xl text-slate-900 mb-6">Add New Gallery Image</h3>
        
        {/* Toggle options */}
        <div className="flex gap-4 mb-6 border-b border-slate-100 pb-3">
          <button 
            type="button"
            onClick={() => { setSourceType('upload'); setNewImage(prev => ({ ...prev, url: fileUploadedUrl })); }}
            className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${sourceType === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Upload image
          </button>
          <button 
            type="button"
            onClick={() => { setSourceType('url'); setNewImage(prev => ({ ...prev, url: '' })); }}
            className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${sourceType === 'url' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Image URL (External)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {sourceType === 'upload' ? (
            <div className="md:col-span-2">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[143px] ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : fileUploadedUrl 
                      ? 'border-green-300 bg-green-50/20' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                />
                
                {uploadingFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uploading...</p>
                  </div>
                ) : fileUploadedUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={fileUploadedUrl} className="w-12 h-12 object-cover rounded-lg shadow-sm border border-slate-200" alt="Uploaded Preview" />
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">✓ Ready</p>
                    <p className="text-[9px] text-slate-400 truncate max-w-[200px]">{fileName}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="text-slate-400 w-6 h-6" />
                    <p className="text-[11px] text-slate-600 font-bold uppercase">Drag file or click to select</p>
                    <p className="text-[9px] text-slate-400">JPG, PNG, WEBP (Max 5MB)</p>
                  </div>
                )}
              </div>
              {uploadError && <p className="text-red-500 text-xs font-semibold mt-1">{uploadError}</p>}
            </div>
          ) : (
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Image URL</label>
              <input 
                className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full"
                placeholder="https://example.com/image.jpg"
                value={newImage.url}
                onChange={(e) => setNewImage({...newImage, url: e.target.value})}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Title</label>
            <input 
              className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full"
              placeholder="Ex: Kitchen Detailing"
              value={newImage.title}
              onChange={(e) => setNewImage({...newImage, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Category</label>
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
        </div>
        <button 
          onClick={() => addImage.mutate(newImage)}
          disabled={!newImage.url || addImage.isPending || uploadingFile}
          className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 w-full md:w-auto cursor-pointer"
        >
          {addImage.isPending ? 'Adding...' : <><Plus size={18} /> Add to Gallery</>}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic">Loading gallery items...</div>
        ) : Array.isArray(gallery) ? (
          gallery.map((item) => (
            <div 
              key={item.id} 
              onClick={() => {
                setEditingItem(item);
                const hasExtUrl = (item?.url || '').startsWith('http') && !(item?.url || '').includes('/uploads/');
                setEditSourceType(hasExtUrl ? 'url' : 'upload');
                setEditingFileName('');
                setEditingUploadError(null);
              }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 aspect-square cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-300"
            >
              <img src={item?.url || ''} className="w-full h-full object-cover" alt={item?.title || ''} />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                <p className="text-white font-bold text-sm mb-1">{item?.title || 'Untitled'}</p>
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
                      const hasExtUrl = (item?.url || '').startsWith('http') && !(item?.url || '').includes('/uploads/');
                      setEditSourceType(hasExtUrl ? 'url' : 'upload');
                      setEditingFileName('');
                      setEditingUploadError(null);
                    }}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center cursor-pointer"
                    title="Replace photo / Edit details"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this image?')) {
                        deleteImage.mutate(String(item.id));
                      }
                    }}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all shadow-lg flex items-center justify-center cursor-pointer"
                    disabled={deleteImage.isPending}
                    title="Delete image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 italic">No gallery items found.</div>
        )}
      </div>

      {/* Edit and Replace Image Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-slate-900">Replace Photo & Edit Details</h3>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Toggle upload vs URL */}
              <div className="flex gap-4 border-b border-slate-100 pb-2">
                <button 
                  type="button"
                  onClick={() => setEditSourceType('upload')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${editSourceType === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Upload New Photo
                </button>
                <button 
                  type="button"
                  onClick={() => setEditSourceType('url')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${editSourceType === 'url' ? 'border-primary text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  External Image URL
                </button>
              </div>

              {editSourceType === 'upload' ? (
                <div>
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
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="text-slate-400 w-6 h-6" />
                        <p className="text-[11px] text-slate-600 font-bold uppercase">Click to select file</p>
                        <p className="text-[9px] text-slate-400">JPG, PNG, WEBP (Max 5MB)</p>
                        {editingFileName && (
                          <p className="text-[10px] text-blue-600 font-bold max-w-[250px] truncate mt-1">Selected: {editingFileName}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {editingUploadError && (
                    <p className="text-red-500 text-xs font-semibold mt-2">{editingUploadError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Image URL</label>
                  <input 
                    className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="https://example.com/image.jpg"
                    value={editingItem?.url || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, url: e.target.value } : null)}
                  />
                </div>
              )}

              {/* Current Preview */}
              {editingItem?.url && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Preview</label>
                  <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-[150px] relative bg-slate-50 flex items-center justify-center">
                    <img src={editingItem.url} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                </div>
              )}

              {/* Edit Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Title</label>
                  <input 
                    className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm w-full focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ex: Kitchen Detailing"
                    value={editingItem?.title || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Category</label>
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
                Cancel
              </button>
              <button 
                onClick={() => updateImage.mutate(editingItem)}
                disabled={updateImage.isPending || editingFileUploading || !editingItem?.url}
                className="flex-grow bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {updateImage.isPending ? 'Saving...' : <><Save size={16} /> Save Changes</>}
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
