import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseReady } from './firebase';

export function useSetting(settingId: string, defaultValue: string | null = null) {
  const [value, setValue] = useState<string | null>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocal = () => {
      const legacyKey = settingId === 'app_logo' ? 'app-logo' : 
                       settingId === 'hero_cover' ? 'hero-cover' : null;
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
                       settingId === 'hero_cover' ? 'hero-cover' : null;
      
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
        if (docSnap.exists()) {
          setValue(docSnap.data().value);
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
