import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export function useSetting(settingId: string, defaultValue: string | null = null) {
  const [value, setValue] = useState<string | null>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If db is mocked/empty, don't try to use it
    if (!db || typeof db.doc !== 'function' && typeof db.collection !== 'function') {
      // Fallback logic
      const legacyKey = settingId === 'app_logo' ? 'app-logo' : 
                       settingId === 'hero_cover' ? 'hero-cover' : null;
      if (legacyKey) {
        const saved = localStorage.getItem(legacyKey);
        if (saved) setValue(saved);
      }
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'settings', settingId);
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setValue(docSnap.data().value);
      } else {
        // Fallback to localStorage for legacy or if doc doesn't exist yet
        const legacyKey = settingId === 'app_logo' ? 'app-logo' : 
                         settingId === 'hero_cover' ? 'hero-cover' : null;
        if (legacyKey) {
          const saved = localStorage.getItem(legacyKey);
          if (saved) setValue(saved);
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `settings/${settingId}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [settingId]);

  return { value, loading };
}
