import { useCallback } from 'react';

export function useVibration() {
  const vibrate = useCallback((pattern: number | number[] = [100, 50, 100]) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Vibration API非対応 (iOS Safari等)
    }
  }, []);

  const isSupported = 'vibrate' in navigator;

  return { vibrate, isSupported };
}
