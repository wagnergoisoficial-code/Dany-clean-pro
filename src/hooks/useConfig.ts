import { useState, useEffect } from 'react';

export function useConfig() {
  const [config, setConfig] = useState<{ businessPhone: string }>({
    businessPhone: '(203) 456-7890' // Initial generic fallback
  });

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.businessPhone) {
          setConfig(data);
        }
      })
      .catch(err => console.error('Failed to load business config:', err));
  }, []);

  return config;
}
