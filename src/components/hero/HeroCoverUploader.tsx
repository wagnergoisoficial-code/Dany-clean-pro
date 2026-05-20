import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, Download } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseReady } from '../../lib/firebase';
import { cn, compressImage } from '../../lib/utils';
import { useSetting } from '../../lib/settings';

interface HeroCoverUploaderProps {
  className?: string;
}

export default function HeroCoverUploader({ className }: HeroCoverUploaderProps) {
  const { value: coverImage, loading } = useSetting('hero_cover');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const SETTING_ID = 'hero_cover';

  const saveToFirestore = async (value: string | null) => {
    setIsSaving(true);
    try {
      if (isFirebaseReady() && auth.currentUser) {
        const docRef = doc(db, 'settings', SETTING_ID);
        await setDoc(docRef, { value });
      } else if (!auth.currentUser) {
        console.warn('Firebase Admin not authenticated. Saving locally first.');
      }
      
      if (value) {
        localStorage.setItem('hero-cover', value);
      } else {
        localStorage.removeItem('hero-cover');
      }
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: { key: 'hero-cover' } }));
      
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Firestore cover write failed. Falling back to local storage.', error);
      handleFirestoreError(error, OperationType.WRITE, `settings/${SETTING_ID}`);
      
      // Fallback: Save local anyway so it works in browser immediately
      if (value) {
        localStorage.setItem('hero-cover', value);
      } else {
        localStorage.removeItem('hero-cover');
      }
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: { key: 'hero-cover' } }));
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Allow up to 10MB input, we will compress it
      if (file.size > 10 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha um arquivo com menos de 10MB.");
        return;
      }
      setIsSaving(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          // Compress to max 1200px width with quality reduction
          const compressed = await compressImage(base64, 1200, 0.7);
          await saveToFirestore(compressed);
        } catch (error) {
          console.error("Compression error:", error);
          await saveToFirestore(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!coverImage) return;
    const link = document.createElement('a');
    link.href = coverImage;
    link.download = 'hero-cover.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveToFirestore(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("w-full mb-12", className)}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative w-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden border-2 border-dashed transition-all duration-500 cursor-pointer group flex flex-col items-center justify-center bg-slate-50",
          coverImage 
            ? "border-transparent h-[220px] sm:h-[280px] lg:h-[460px] shadow-2xl" 
            : "border-slate-200 h-[180px] sm:h-[220px] lg:h-[300px] hover:border-blue-400 hover:bg-blue-50/50"
        )}
      >
        {coverImage ? (
          <>
            <img 
              src={coverImage} 
              alt="Hero Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
               <button 
                 onClick={handleDownload}
                 className="p-3 bg-white rounded-2xl shadow-xl text-slate-900 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                 title="Download Cover"
               >
                 <Download size={20} />
               </button>
               <button 
                 onClick={handleClear}
                 className="p-3 bg-white rounded-2xl shadow-xl text-slate-900 hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
                 title="Remove Cover"
               >
                 <Trash2 size={20} />
               </button>
            </div>
            
            {/* Action Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
               {isSaving && (
                 <div className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-pulse">
                   <div className="w-2 h-2 rounded-full bg-white border-2 border-white/30 border-t-transparent animate-spin" />
                   Saving...
                 </div>
               )}
               <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Custom Live Cover</span>
               </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            {isSaving && (
              <div className="absolute top-6 right-6 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-pulse z-20">
                <div className="w-2 h-2 rounded-full bg-white border-2 border-white/30 border-t-transparent animate-spin" />
                Saving...
              </div>
            )}
            <div className="w-16 h-16 rounded-3xl bg-white shadow-xl shadow-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-500">
               <Upload size={28} />
            </div>
            <div>
              <p className="text-lg font-display font-bold text-slate-900">Upload Hero Cover</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Recommended: 1920x1080 (High Qual)</p>
            </div>
            <button className="mt-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-blue-600/20">
               Select Cover Image
            </button>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {/* Floating Meta Info if cover exists */}
      {coverImage && (
        <div className="flex justify-between items-center mt-4 px-4">
           <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-blue-600" />
              <span className="text-[11px] font-bold text-slate-500">Customized Website Experience</span>
           </div>
           <button 
             onClick={handleDownload}
             className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-2"
           >
             Download Current Cover <Download size={14} />
           </button>
        </div>
      )}
    </div>
  );
}
