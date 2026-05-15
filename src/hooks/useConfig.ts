import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';

export function useConfig() {
  const [config, setConfig] = useState<{ businessPhone: string }>({
    businessPhone: '(203) 456-7890' // Initial generic fallback
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const isProd = window.location.hostname === 'danycleanpro.com' || 
                     window.location.hostname === 'www.danycleanpro.com' ||
                     window.location.hostname.includes('netlify.app');

      // 1. Try API if NOT in production
      if (!isProd) {
        try {
          const res = await fetch('/api/config');
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await res.json();
              if (data && data.businessPhone) {
                setConfig(data);
                return; // Success
              }
            }
          }
        } catch (err) {
          console.warn('API config unavailable');
        }
      }

      // 2. Try Firestore
      if (isFirebaseReady()) {
        try {
          const docRef = doc(db, 'settings', 'general');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.businessPhone) {
              setConfig(data as any);
            }
          }
        } catch (err) {
          console.error('Firestore config fetch failed:', err);
        }
      }
    };

    fetchConfig();
  }, []);

  return config;
}
