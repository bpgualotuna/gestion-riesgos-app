/**
 * useThrottle Hook
 * Limits the rate at which a function can be called
 */

import { useRef, useCallback } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): T {
  const lastRan = useRef<number>(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        func(...args);
        lastRan.current = Date.now();
      }
    }) as T,
    [func, delay]
  );
}

