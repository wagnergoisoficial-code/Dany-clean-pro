import { useState, useEffect } from 'react';
import { Globe, CheckCircle2, Clock } from 'lucide-react';
import LogoUpload from '../../components/ui/LogoUpload';
import HeroCoverUploader from '../../components/hero/HeroCoverUploader';
import AboutImageUploader from '../../components/admin/AboutImageUploader';

export default function SettingsManager() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    // Sync with initial local storage value
    setLastUpdated(localStorage.getItem('last_updated_section'));

    const handleLastUpdatedChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setLastUpdated(customEvent.detail);
    };

    window.addEventListener('last-updated-changed', handleLastUpdatedChange);
    return () => {
      window.removeEventListener('last-updated-changed', handleLastUpdatedChange);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900">Brand Identity</h3>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                Manage how your business appears to customers. 
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  <CheckCircle2 size={10} /> Auto-saves
                </span>
              </p>
            </div>
          </div>

          {/* Operational Log Visual Badge */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-2.5 shadow-sm text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-500 font-bold tracking-tight">Última imagem atualizada:</span>
            {lastUpdated ? (
              lastUpdated === 'HERO' ? (
                <span className="px-2.5 py-0.5 bg-blue-600/10 text-blue-700 border border-blue-200/50 rounded-lg text-[10px] font-black tracking-widest uppercase">
                  [ HERO ]
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-600/10 text-emerald-700 border border-emerald-200/50 rounded-lg text-[10px] font-black tracking-widest uppercase">
                  [ ABOUT ]
                </span>
              )
            ) : (
              <span className="px-2.5 py-0.5 bg-slate-200/50 text-slate-600 rounded-lg text-[10px] font-extrabold uppercase select-none">
                [ NENHUMA ]
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-10 max-w-3xl">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Website Logo</label>
              <p className="text-xs text-slate-400 ml-1">Recommended: PNG or SVG with transparent background.</p>
            </div>
            <LogoUpload />
          </div>
          
          <div className="pt-10 border-t border-slate-100 space-y-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 ml-1">MAIN HERO IMAGE CONFIG</label>
              <p className="text-xs text-slate-400 ml-1">Controls the main homepage hero banner only.</p>
            </div>
            <HeroCoverUploader />
          </div>

          <div className="pt-10 border-t border-slate-100 space-y-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 ml-1">ABOUT SECTION IMAGE CONFIG</label>
              <p className="text-xs text-slate-400 ml-1">Controls ONLY the Connecticut/About section image.</p>
            </div>
            <AboutImageUploader />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Business Configuration</h3>
            <p className="text-xs text-slate-500">Coming soon: Automated scheduling and email notifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
