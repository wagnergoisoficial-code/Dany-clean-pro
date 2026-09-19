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
      <div className="bg-surface border border-rule p-8">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8 pb-6 border-b border-rule">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-soft text-accent flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-ink">Brand Identity</h3>
              <p className="text-sm text-ink-muted flex items-center gap-2">
                Manage how your business appears to customers. 
                <span className="inline-flex items-center gap-1 text-label-sm text-accent bg-accent-soft px-2 py-0.5 uppercase">
                  <CheckCircle2 size={10} /> Auto-saves
                </span>
              </p>
            </div>
          </div>

          {/* Operational Log Visual Badge */}
          <div className="flex items-center gap-2.5 bg-surface-low border border-rule/60 px-4 py-2.5 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-ink-muted font-bold tracking-tight">Última imagem atualizada:</span>
            {lastUpdated ? (
              lastUpdated === 'HERO' ? (
                <span className="px-2.5 py-0.5 bg-accent/10 text-accent-ink border border-accent/50 text-label-sm uppercase">
                  [ HERO ]
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-600/10 text-emerald-700 border border-emerald-200/50 text-label-sm uppercase">
                  [ ABOUT ]
                </span>
              )
            ) : (
              <span className="px-2.5 py-0.5 bg-surface-high/50 text-ink-muted text-label-sm uppercase select-none">
                [ NENHUMA ]
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-10 max-w-3xl">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-sm uppercase text-ink-faint ml-1">Website Logo</label>
              <p className="text-xs text-ink-faint ml-1">Recommended: PNG or SVG with transparent background.</p>
            </div>
            <LogoUpload />
          </div>
          
          <div className="pt-10 border-t border-rule space-y-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-sm uppercase text-accent ml-1">MAIN HERO IMAGE CONFIG</label>
              <p className="text-xs text-ink-faint ml-1">Controls the main homepage hero banner only.</p>
            </div>
            <HeroCoverUploader />
          </div>

          <div className="pt-10 border-t border-rule space-y-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-sm uppercase text-emerald-600 ml-1">ABOUT SECTION IMAGE CONFIG</label>
              <p className="text-xs text-ink-faint ml-1">Controls ONLY the Connecticut/About section image.</p>
            </div>
            <AboutImageUploader />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-rule p-8 opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-surface-low text-ink-faint flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-ink">Business Configuration</h3>
            <p className="text-xs text-ink-muted">Coming soon: Automated scheduling and email notifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
