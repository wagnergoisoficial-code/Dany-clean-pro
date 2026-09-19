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
    let localSaved = false;

    // First attempt to save locally
    try {
      if (value) {
        localStorage.setItem('hero-cover', value);
      } else {
        localStorage.removeItem('hero-cover');
      }
      localSaved = true;
      localStorage.setItem('last_updated_section', 'HERO');
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: { key: 'hero-cover' } }));
      window.dispatchEvent(new CustomEvent('last-updated-changed', { detail: 'HERO' }));
    } catch (localError: any) {
      console.error('Local storage write failed:', localError);
    }

    try {
      const authDataStr = localStorage.getItem('dany_clean_auth');
      const authData = authDataStr ? JSON.parse(authDataStr) : null;
      const token = authData?.token;

      if (token) {
        const response = await fetch('/api/settings/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            settingId: SETTING_ID,
            value
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }
        console.log("Setting hero_cover saved successfully via backend API.");
      } else {
        console.warn('Backend admin auth token not found. Locally stored state remains.');
      }
      
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Firestore cover write failed via API. Falling back to local storage only.', error);
      handleFirestoreError(error, OperationType.WRITE, `settings/${SETTING_ID}`);
      
      // If local hasn't been saved yet, retry fallback saving
      if (!localSaved) {
        try {
          if (value) {
            localStorage.setItem('hero-cover', value);
          } else {
            localStorage.removeItem('hero-cover');
          }
          localStorage.setItem('last_updated_section', 'HERO');
          window.dispatchEvent(new CustomEvent('settings-updated', { detail: { key: 'hero-cover' } }));
          window.dispatchEvent(new CustomEvent('last-updated-changed', { detail: 'HERO' }));
        } catch (localError) {
          console.error('Fallback local storage write failed:', localError);
        }
      }
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-accent-ink flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            MAIN HERO IMAGE
          </h4>
          <p className="text-xs text-ink-muted mt-0.5">Controls the main homepage hero banner only</p>
        </div>
        <div className="text-label-sm uppercase text-accent bg-accent-soft px-3 py-1 border border-accent/20">
          Blue Theme • Hero Core
        </div>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative w-full overflow-hidden border-2 border-dashed transition-all duration-500 cursor-pointer group flex flex-col items-center justify-center bg-ink",
          coverImage 
            ? "border-transparent h-[220px] sm:h-[280px] lg:h-[460px] shadow-2xl" 
            : "border-accent/60 h-[180px] sm:h-[220px] lg:h-[300px] hover:border-accent hover:bg-ink"
        )}
      >
        {coverImage ? (
          <>
            <img 
              src={coverImage} 
              alt="Hero Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
               <button 
                 onClick={handleDownload}
                 className="p-3 bg-surface text-ink hover:bg-accent hover:text-white transition-all transform hover:scale-110"
                 title="Download Cover"
               >
                 <Download size={20} />
               </button>
               <button 
                 onClick={handleClear}
                 className="p-3 bg-surface text-ink hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
                 title="Remove Cover"
               >
                 <Trash2 size={20} />
               </button>
            </div>
            
            {/* Action Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
               {isSaving && (
                 <div className="px-4 py-2 bg-accent text-white flex items-center gap-2 text-label-sm uppercase animate-pulse">
                   <div className="w-2 h-2 rounded-full bg-surface border-2 border-white/30 border-t-transparent animate-spin" />
                   Saving...
                 </div>
               )}
               <div className="px-4 py-2 bg-white/95 backdrop-blur-md border border-white/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-label-sm uppercase text-ink">MAIN HERO ACTIVE [LIVE]</span>
               </div>
            </div>
          </>
        ) : (
          <>
            {/* Premium House Fallback as beautiful dark background preview with 15% opacity */}
            <img 
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200"
              alt="Mansion Fallback Background"
              className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none select-none transition-transform duration-700 group-hover:scale-105"
            />
            <div className="flex flex-col items-center gap-4 text-center px-6 relative z-10">
              {isSaving && (
                <div className="absolute top-6 right-6 px-4 py-2 bg-accent text-white flex items-center gap-2 text-label-sm uppercase animate-pulse z-20">
                  <div className="w-2 h-2 rounded-full bg-surface border-2 border-white/30 border-t-transparent animate-spin" />
                  Saving...
                </div>
              )}
              <div className="w-16 h-16 bg-ink flex items-center justify-center text-accent group-hover:text-accent group-hover:scale-110 transition-all duration-500">
                 <Upload size={28} />
              </div>
              <div>
                <p className="text-lg font-display font-bold text-white">Upload Hero Cover</p>
                <p className="text-label-md uppercase text-ink-faint mt-1">Recommended: 1920x1080 (CT Mansion Yard)</p>
              </div>
              <button className="mt-2 bg-accent text-white px-6 py-3 text-label-sm uppercase">
                 Select Cover Image
              </button>
            </div>
          </>
        )}

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {/* Floating Meta Info if cover exists / fallback info */}
      <div className="flex justify-between items-center mt-4 px-4">
         <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-accent" />
            <span className="text-[11px] font-semibold text-ink-faint">Fallback: Premium CT Exterior House</span>
         </div>
         {coverImage && (
           <button 
             onClick={handleDownload}
             className="text-label-sm uppercase text-accent hover:text-accent-ink flex items-center gap-2"
           >
             Download Current Cover <Download size={14} />
           </button>
         )}
      </div>
    </div>
  );
}
