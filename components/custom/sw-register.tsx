'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function SwRegister() {
  const prompted = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller &&
            !prompted.current
          ) {
            prompted.current = true;
            toast('Nouvelle version disponible', {
              duration: Infinity,
              action: {
                label: 'Rafraîchir',
                onClick: () => {
                  newWorker.postMessage('SKIP_WAITING');
                  window.location.reload();
                },
              },
            });
          }
        });
      });
    });
  }, []);

  return null;
}
