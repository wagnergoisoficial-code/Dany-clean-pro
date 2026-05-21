import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, Download } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseReady } from '../../lib/firebase';
import { cn, compressImage } from '../../lib/utils';
import { useSetting } from '../../lib/settings';

interface AboutImageUploaderProps {
  className?: string;
}

export default function AboutImageUploader({ className }: AboutImageUploaderProps) {
  const { value: aboutImage, loading } = useSetting('about_section_image');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const SETTING_ID = 'about_section_image';
  const LEGACY_KEY = 'about-section-image';

  const saveToFirestore = async (value: string | null) => {
    setIsSaving(true);
    let localSaved = false;

    // First attempt to save locally
    try {
      if (value) {
        localStorage.setItem(LEGACY_KEY, value);
      } else {
        localStorage.removeItem(LEGACY_KEY);
      }
      localSaved = true;
      localStorage.setItem('last_updated_section', 'ABOUT');
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: { key: LEGACY_KEY } }));
      window.dispatchEvent(new CustomEvent('last-updated-changed', { detail: 'ABOUT' }));
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
        console.log("Setting about_section_image saved successfully via backend API.");
      } else {
        console.warn('Backend admin auth token not found. Locally stored state remains.');
      }
      
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Firestore about image write failed via API. Falling back to local storage only.', error);
      handleFirestoreError(error, OperationType.WRITE, `settings/${SETTING_ID}`);
      
      // If local hasn't been saved yet, retry fallback saving
      if (!localSaved) {
        try {
          if (value) {
            localStorage.setItem(LEGACY_KEY, value);
          } else {
            localStorage.removeItem(LEGACY_KEY);
          }
          localStorage.setItem('last_updated_section', 'ABOUT');
          window.dispatchEvent(new CustomEvent('settings-updated', { detail: { key: LEGACY_KEY } }));
          window.dispatchEvent(new CustomEvent('last-updated-changed', { detail: 'ABOUT' }));
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
        alert("The image is too large. Choose a file under 10MB.");
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
    if (!aboutImage) return;
    const link = document.createElement('a');
    link.href = aboutImage;
    link.download = 'about-section-image.png';
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
          <h4 className="text-sm font-black uppercase tracking-[0.15em] text-emerald-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            ABOUT SECTION IMAGE
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">Controls ONLY the Connecticut/About section image</p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          Emerald Theme • About Core
        </div>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative w-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden border-2 border-dashed transition-all duration-500 cursor-pointer group flex flex-col items-center justify-center bg-slate-900",
          aboutImage 
            ? "border-transparent h-[220px] sm:h-[280px] lg:h-[460px] shadow-2xl" 
            : "border-emerald-300/60 h-[180px] sm:h-[220px] lg:h-[300px] hover:border-emerald-500 hover:bg-slate-950"
        )}
      >
        {aboutImage ? (
          <>
            <img 
              src={aboutImage} 
              alt="About Section Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
               <button 
                 onClick={handleDownload}
                 className="p-3 bg-white rounded-2xl shadow-xl text-slate-900 hover:bg-emerald-600 hover:text-white transition-all transform hover:scale-110"
                 title="Download Image"
               >
                 <Download size={20} />
               </button>
               <button 
                 onClick={handleClear}
                 className="p-3 bg-white rounded-2xl shadow-xl text-slate-900 hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
                 title="Remove Image"
               >
                 <Trash2 size={20} />
               </button>
            </div>
            
            {/* Action Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
               {isSaving && (
                 <div className="px-4 py-2 bg-emerald-600 text-white rounded-full shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-pulse">
                   <div className="w-2 h-2 rounded-full bg-white border-2 border-white/30 border-t-transparent animate-spin" />
                   Saving...
                 </div>
               )}
               <div className="px-4 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-emerald-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">ABOUT SECTION ACTIVE [LIVE]</span>
               </div>
            </div>
          </>
        ) : (
          <>
            {/* Premium Kitchen Fallback as beautiful dark background preview with 15% opacity */}
            <img 
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200"
              alt="Luxury Kitchen Fallback Background"
              className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none select-none transition-transform duration-700 group-hover:scale-105"
            />
            <div className="flex flex-col items-center gap-4 text-center px-6 relative z-10">
              {isSaving && (
                <div className="absolute top-6 right-6 px-4 py-2 bg-emerald-600 text-white rounded-full shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-pulse z-20">
                  <div className="w-2 h-2 rounded-full bg-white border-2 border-white/30 border-t-transparent animate-spin" />
                  Saving...
                </div>
              )}
              <div className="w-16 h-16 rounded-3xl bg-slate-800 shadow-xl flex items-center justify-center text-emerald-450 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-500">
                 <Upload size={28} />
              </div>
              <div>
                <p className="text-lg font-display font-bold text-white">Upload About Image</p>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Recommended: 4:5 or Square Ratio (Premium Kitchen)</p>
              </div>
              <button className="mt-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20">
                 Select Image File
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
      
      {/* Floating Meta Info if image exists / fallback info */}
      <div className="flex justify-between items-center mt-4 px-4">
         <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-emerald-500" />
            <span className="text-[11px] font-semibold text-slate-400">Fallback: Premium CT Interior Kitchen & Living Room</span>
         </div>
         {aboutImage && (
           <button 
             onClick={handleDownload}
             className="text-[11px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
           >
             Download Current About Image <Download size={14} />
           </button>
         )}
      </div>
    </div>
  );
}
