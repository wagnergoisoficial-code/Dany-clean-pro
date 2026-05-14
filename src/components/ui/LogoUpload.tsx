import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Download } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn, compressImage } from '../../lib/utils';
import { useSetting } from '../../lib/settings';

interface LogoUploadProps {
  onLogoChange?: (file: File | null) => void;
  className?: string;
}

export default function LogoUpload({ onLogoChange, className }: LogoUploadProps) {
  const { value: preview, loading } = useSetting('app_logo');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const SETTING_ID = 'app_logo';

  const saveToFirestore = async (value: string | null) => {
    setIsSaving(true);
    try {
      if (auth.currentUser) {
        const docRef = doc(db, 'settings', SETTING_ID);
        await setDoc(docRef, { value });
      } else {
        alert("Você precisa estar conectado com o Google para salvar permanentemente.");
      }
      
      if (value) localStorage.setItem('app-logo', value);
      else localStorage.removeItem('app-logo');
      
      setTimeout(() => setIsSaving(false), 800);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${SETTING_ID}`);
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Allow up to 10MB input, we will compress it anyway
      if (file.size > 10 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha um arquivo com menos de 10MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const compressed = await compressImage(base64, 800, 0.6);
          saveToFirestore(compressed);
        } catch (error) {
          console.error("Compression error:", error);
          saveToFirestore(base64);
        }
      };
      reader.readAsDataURL(file);
      onLogoChange?.(file);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!preview) return;
    const link = document.createElement('a');
    link.href = preview;
    link.download = 'app-logo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveToFirestore(null);
    onLogoChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className={cn(
        "relative group flex items-center justify-center cursor-pointer",
        className
      )}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className={cn(
        "w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 relative border-2 border-dashed",
        preview ? "bg-white shadow-sm border-transparent" : "bg-blue-50 border-slate-200 hover:border-blue-400"
      )}>
        {preview ? (
          <img src={preview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Camera size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Logo</span>
          </div>
        )}
        
        {isSaving && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Hover Overlay */}
        {preview && (
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-2xl">
            <button 
              onClick={handleDownload}
              className="p-2 bg-white rounded-xl shadow-lg text-slate-900 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
              title="Download Logo"
            >
              <Download size={16} />
            </button>
            <button 
              onClick={handleClear}
              className="p-2 bg-white rounded-xl shadow-lg text-slate-900 hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
              title="Remove Logo"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
