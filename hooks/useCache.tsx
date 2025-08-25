'use client';

import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

interface UseCacheOptions {
  defaultTTL?: number; // Time to live in milliseconds
}

export function useCache<T>({ defaultTTL = 5 * 60 * 1000 }: UseCacheOptions = {}) {
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());

  const set = useCallback((key: string, data: T, ttl = defaultTTL) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    });
  }, [defaultTTL]);

  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    
    if (isExpired) {
      cache.current.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  const invalidate = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = cache.current.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    if (isExpired) {
      cache.current.delete(key);
      return false;
    }

    return true;
  }, []);

  return {
    set,
    get,
    has,
    invalidate
  };
}
