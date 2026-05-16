import { Globe, CheckCircle2, Clock } from 'lucide-react';
import LogoUpload from '../../components/ui/LogoUpload';
import HeroCoverUploader from '../../components/hero/HeroCoverUploader';

export default function SettingsManager() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-8">
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
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Hero Cover Image</label>
              <p className="text-xs text-slate-400 ml-1">This image will appear as the background in the main section of the site.</p>
            </div>
            <HeroCoverUploader />
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
