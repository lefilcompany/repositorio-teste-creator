import { useState, useCallback, useRef } from 'react';
import type { Action } from '@/types/action';

interface CacheEntry {
  data: Action;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useActionCache() {
  const cache = useRef<Map<string, CacheEntry>>(new Map());

  const getCachedAction = useCallback((actionId: string): Action | null => {
    const entry = cache.current.get(actionId);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      cache.current.delete(actionId);
      return null;
    }

    return entry.data;
  }, []);

  const setCachedAction = useCallback((actionId: string, action: Action) => {
    cache.current.set(actionId, {
      data: action,
      timestamp: Date.now(),
    });
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    getCachedAction,
    setCachedAction,
    clearCache,
  };
}
