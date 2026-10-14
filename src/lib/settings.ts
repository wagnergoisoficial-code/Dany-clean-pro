import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseReady } from './firebase';

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

    // If db is ready, try to subscribe
    if (isFirebaseReady()) {
      const docRef = doc(db, 'settings', settingId);
      
      // Use onSnapshot for real-time updates
      unsubscribe = onSnapshot(docRef, (docSnap) => {
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
        handleFirestoreError(error, OperationType.GET, `settings/${settingId}`);
        // Even on error, try to load from local
        fetchLocal();
      });
    } else {
      fetchLocal();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settings-updated' as any, handleStorageChange);
      if (unsubscribe) unsubscribe();
    };
  }, [settingId]);

  return { value, loading };
}
