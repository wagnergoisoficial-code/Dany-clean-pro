import { useState, useEffect } from 'react';

export function useConfig() {
  const [config, setConfig] = useState<{ businessPhone: string }>({
    businessPhone: '(203) 456-7890' // Initial generic fallback
  });

  useEffect(() => {
    fetch('/api/config')
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return res.json();
        } else {
          throw new Error('Not JSON');
        }
      })
      .then(data => {
        if (data && data.businessPhone) {
          setConfig(data);
        }
      })
      .catch(err => {
        console.warn('API config unavailable, using defaults');
      });
  }, []);

  return config;
}
