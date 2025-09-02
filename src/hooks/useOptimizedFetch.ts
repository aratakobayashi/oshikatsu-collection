import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Request cache with TTL
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const pendingRequests = new Map<string, Promise<any>>();

// Clear expired cache entries
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      requestCache.delete(key);
    }
  }
};

// Cache cleanup interval
setInterval(cleanupCache, 60000); // Clean every minute

export function useOptimizedFetch<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number; // Cache time-to-live in milliseconds
    dependencies?: any[]; // Re-run dependencies
    enabled?: boolean; // Enable/disable the query
  } = {}
) {
  const { ttl = 30000, dependencies = [], enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cacheKey = `${queryKey}-${JSON.stringify(dependencies)}`;
    const cached = requestCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < cached.ttl) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Check if request is already pending
    if (pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey);
        setData(result);
        setLoading(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
      return;
    }

    // Start new request
    setLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const requestPromise = queryFn();
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      requestCache.set(cacheKey, {
        data: result,
        timestamp: now,
        ttl
      });

      setData(result);
      setLoading(false);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
      setLoading(false);
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }, [queryKey, enabled, ttl, ...dependencies]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Optimized Supabase queries
export const optimizedQueries = {
  // Fetch episodes with caching
  episodes: (options: { ttl?: number } = {}) => 
    useOptimizedFetch('episodes', async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('id, title, date, thumbnail_url, view_count, duration, created_at')
        .order('created_at', { ascending: false })
        .limit(20); // Limit to reduce payload
      
      if (error) throw error;
      return data;
    }, { ttl: options.ttl || 60000 }), // 1 minute cache

  // Fetch celebrities with caching
  celebrities: (options: { ttl?: number } = {}) =>
    useOptimizedFetch('celebrities', async () => {
      const { data, error } = await supabase
        .from('celebrities')
        .select('id, name, slug, image_url, group_name, type')
        .order('name')
        .limit(20); // Limit to reduce payload
      
      if (error) throw error;
      return data;
    }, { ttl: options.ttl || 300000 }), // 5 minutes cache

  // Fetch locations with caching
  locations: (options: { ttl?: number } = {}) =>
    useOptimizedFetch('locations', async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, image_url, tabelog_url, description')
        .order('name')
        .limit(20); // Limit to reduce payload
      
      if (error) throw error;
      return data;
    }, { ttl: options.ttl || 300000 }), // 5 minutes cache

  // Fetch items with caching  
  items: (options: { ttl?: number } = {}) =>
    useOptimizedFetch('items', async () => {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, brand, category, image_url, description, purchase_url, price')
        .order('created_at', { ascending: false })
        .limit(20); // Limit to reduce payload
      
      if (error) throw error;
      return data;
    }, { ttl: options.ttl || 300000 }), // 5 minutes cache
};

// Batch fetch function for multiple queries
export function useBatchFetch<T>(
  queries: Array<{
    key: string;
    queryFn: () => Promise<T>;
    ttl?: number;
  }>,
  enabled = true
) {
  const [results, setResults] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBatch = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const promises = queries.map(async (query) => {
        const cacheKey = query.key;
        const cached = requestCache.get(cacheKey);
        const now = Date.now();
        const ttl = query.ttl || 30000;

        if (cached && now - cached.timestamp < cached.ttl) {
          return { key: query.key, data: cached.data };
        }

        const data = await query.queryFn();
        requestCache.set(cacheKey, { data, timestamp: now, ttl });
        return { key: query.key, data };
      });

      const results = await Promise.all(promises);
      const resultMap = results.reduce((acc, result) => {
        acc[result.key] = result.data;
        return acc;
      }, {} as Record<string, T>);

      setResults(resultMap);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Batch fetch error'));
    } finally {
      setLoading(false);
    }
  }, [queries, enabled]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  return { results, loading, error, refetch: fetchBatch };
}