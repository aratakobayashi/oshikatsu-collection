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
    priority?: 'critical' | 'high' | 'normal' | 'low'; // 🚀 New: Priority levels
    retryCount?: number; // 🚀 New: Retry attempts for critical data
  } = {}
) {
  const { 
    ttl = 30000, 
    dependencies = [], 
    enabled = true,
    priority = 'normal',
    retryCount = priority === 'critical' ? 3 : 1
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🎯 Critical data gets shorter TTL for freshness
  const adjustedTTL = priority === 'critical' ? Math.min(ttl, 300000) : ttl; // Max 5min for critical

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

    // 🚀 Retry logic for critical data
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < retryCount) {
      try {
        const requestPromise = queryFn();
        
        if (attempt === 0) {
          pendingRequests.set(cacheKey, requestPromise);
        }

        const result = await requestPromise;
        
        // Cache the result
        requestCache.set(cacheKey, {
          data: result,
          timestamp: now,
          ttl: adjustedTTL
        });

        setData(result);
        setLoading(false);
        pendingRequests.delete(cacheKey);
        return;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        attempt++;
        
        if (attempt < retryCount && priority === 'critical') {
          // Exponential backoff for retries
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    // All attempts failed
    if (lastError && lastError.name !== 'AbortError') {
      setError(lastError);
    }
    setLoading(false);
    pendingRequests.delete(cacheKey);

  }, [queryKey, enabled, adjustedTTL, priority, retryCount, ...dependencies]);

  useEffect(() => {
    // 🚀 Priority-based delay
    const delay = priority === 'critical' ? 0 : 
                  priority === 'high' ? 50 :
                  priority === 'normal' ? 100 : 200;

    const timeoutId = setTimeout(() => {
      fetchData();
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, priority]);

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
// 🚀 Critical-First Query Hooks for Phase 4
export const useCriticalHomeData = () => {
  // Critical: Only popular celebrities for showcase
  const popularCelebrities = useOptimizedFetch(
    'home-critical-celebrities', 
    () => supabase
      .from('celebrities')
      .select('id, name, slug, bio, image_url, group_name')
      .eq('status', 'active')
      .order('view_count', { ascending: false })
      .limit(3)
      .then(({ data }) => data || []),
    { 
      ttl: 300000, // 5 minutes - short for freshness
      priority: 'critical',
      retryCount: 3
    }
  );

  return {
    popularCelebrities: popularCelebrities.data || [],
    isLoading: popularCelebrities.loading,
    hasError: !!popularCelebrities.error
  };
};

// 🎯 Progressive Enhancement Data for Home
export const useProgressiveHomeData = () => {
  // Delayed loading: Start after 1 second to prioritize critical content
  const recentEpisodes = useOptimizedFetch(
    'home-progressive-episodes',
    () => supabase
      .from('episodes')
      .select('id, title, description, thumbnail_url, celebrity:celebrities(name, slug)')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => data || []),
    {
      ttl: 120000, // 2 minutes - recent content changes frequently
      priority: 'low',    // Changed from 'normal' to 'low'
      enabled: true       // Will be delayed by priority system
    }
  );

  const featuredLocations = useOptimizedFetch(
    'home-progressive-locations',
    () => supabase
      .from('locations')
      .select('id, name, address, image_url, image_urls, website_url, tags')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => data || []),
    {
      ttl: 300000, // 5 minutes
      priority: 'low',    // Changed from 'normal' to 'low'
      enabled: true       // Will be delayed by priority system
    }
  );

  return {
    recentEpisodes: recentEpisodes.data || [],
    featuredLocations: featuredLocations.data || [],
    isLoading: recentEpisodes.loading || featuredLocations.loading
  };
};

// 📱 Celebrities List Page with Virtualization Support
export const useCelebritiesList = (limit = 12, offset = 0) => {
  return useOptimizedFetch(
    `celebrities-list-${limit}-${offset}`,
    () => supabase
      .from('celebrities')
      .select('id, name, slug, bio, image_url, view_count, group_name, type, created_at', { count: 'exact' })
      .eq('status', 'active')
      // 🎯 created_at順（新しい順）のみでソート
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .then(({ data, count }) => ({ 
        data: data || [], 
        total: count || 0,
        hasMore: count ? (offset + limit) < count : false
      })),
    {
      ttl: 300000, // 5 minutes
      priority: offset === 0 ? 'high' : 'normal', // First page is high priority
      dependencies: [limit, offset]
    }
  );
}
// 🌟 All Celebrities (Simplified) - No pagination needed for small dataset
export const useAllCelebrities = () => {
  return useOptimizedFetch(
    'all-celebrities',
    () => supabase
      .from('celebrities')
      .select('id, name, slug, bio, image_url, view_count, group_name, type, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
    {
      ttl: 300000, // 5 minutes
      priority: 'high', // Always high priority for simplicity
    }
  );
};
// 総推し数取得用フック
export const useTotalCelebritiesCount = () => {
  return useOptimizedFetch(
    'total-celebrities-count',
    async () => {
      const { count, error } = await supabase
        .from('celebrities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
      
      if (error) throw error
      return count || 0
    },
    {
      priority: 'high',
      cacheTime: 10 * 60 * 1000, // 10分キャッシュ（頻繁に変わらない）
      refetchOnMount: false
    }
  )
}

// 🔍 Search-optimized query
export const useSearchCelebrities = (query: string, limit = 6) => {
  return useOptimizedFetch(
    `search-celebrities-${query}-${limit}`,
    () => {
      if (!query.trim()) return Promise.resolve([]);
      
      return supabase
        .from('celebrities')
        .select('id, name, slug, image_url')           // ✅ 正しいカラム名に修正
        .ilike('name', `%${query}%`)                   // ✅ シンプルな名前検索（tagsカラム除去）
        .eq('status', 'active')                        // ✅ アクティブな推しのみ検索
        .order('view_count', { ascending: false })
        .limit(limit)
        .then(({ data }) => data || []);
    },
    {
      ttl: 30000, // 30 seconds - search results should be fresh
      priority: 'high', // Search is user-initiated, high priority
      dependencies: [query, limit],
      enabled: query.trim().length >= 2
    }
  );
};;

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