import { useState, useEffect } from 'react';
import { firestoreWhenIdle } from './firestoreLazy';

export function useSetting(settingId: string, defaultValue: string | null = null) {
  const [value, setValue] = useState<string | null>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocal = () => {
      const legacyKey = settingId === 'app_logo' ? 'app-logo' : 
                       settingId === 'hero_cover' ? 'hero-cover' : 
                       settingId === 'about_section_image' ? 'about-section-image' : null;
      if (legacyKey) {
        const saved = localStorage.getItem(legacyKey);
        if (saved) setValue(saved);
      }
      setLoading(false);
    };

    // Listen for local storage changes (from other tabs or same tab via custom event)
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      const key = e instanceof StorageEvent ? e.key : (e as any).detail?.key;
      const legacyKey = settingId === 'app_logo' ? 'app-logo' : 
                       settingId === 'hero_cover' ? 'hero-cover' : 
                       settingId === 'about_section_image' ? 'about-section-image' : null;
      
      if (key === legacyKey) {
        fetchLocal();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settings-updated' as any, handleStorageChange);
    
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    // The database is fetched once the page has loaded (see firestoreLazy):
    // a setting refines what is already on screen, so it never holds up the
    // first paint.
    firestoreWhenIdle().then((kit) => {
      if (cancelled) return;
      if (!kit) { fetchLocal(); return; }
      const docRef = kit.fs.doc(kit.db, 'settings', settingId);

      // Real-time, so a change made in the dashboard shows without a reload.
      unsubscribe = kit.fs.onSnapshot(docRef, (docSnap) => {
        const stored = docSnap.exists() ? docSnap.data().value : undefined;
        // An empty stored value means "nothing chosen", not "show nothing" —
        // removing a logo in the dashboard should land back on the one the
        // site ships with, not on a placeholder letter.
        if (stored !== undefined && stored !== null && String(stored).trim() !== '') {
          setValue(stored);
        } else if (docSnap.exists() && defaultValue !== null) {
          setValue(defaultValue);
        } else if (docSnap.exists()) {
          setValue(null);
        } else {
          // Fallback to localStorage for legacy or if doc doesn't exist yet
          fetchLocal();
        }
        setLoading(false);
      }, (error) => {
        console.warn(`settings/${settingId} could not be read:`, error?.message || error);
        // Even on error, try to load from local
        fetchLocal();
      });
    });

    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settings-updated' as any, handleStorageChange);
      if (unsubscribe) unsubscribe();
    };
  }, [settingId]);

  return { value, loading };
}
