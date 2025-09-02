/**
 * Core Web Vitals最適化ユーティリティ
 * LCP、FID、CLS、INP、TTFBの最適化
 */

import React, { Suspense, lazy } from 'react'

// 1. Code Splitting - 遅延ロード可能なコンポーネント
export const LazyLocationSearchV2 = lazy(() => import('../components/LocationSearchV2'))
export const LazyEpisodeSearchV2 = lazy(() => import('../components/EpisodeSearchV2'))
export const LazyStructuredData = lazy(() => import('../components/SEO/StructuredData'))

// 2. 画像最適化
export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  loading?: 'lazy' | 'eager'
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  loading = 'lazy'
}) => {
  const imgRef = React.useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  const handleLoad = () => {
    setIsLoaded(true)
    // LCPの改善: 重要な画像が読み込まれたことをマーク
    if (priority) {
      performance.mark('lcp-image-loaded')
    }
  }

  const handleError = () => {
    setHasError(true)
  }

  // プレースホルダー用の軽量Base64画像
  const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Im0xNSAxNSA2IDYgNi02IiBzdHJva2U9IiNBNzFCNTEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo='

  return (
    <div className={`relative ${className}`}>
      {/* プレースホルダー */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center"
          style={{ width: width || '100%', height: height || 'auto' }}
        >
          <img src={placeholder} alt="" className="w-8 h-8 opacity-50" />
        </div>
      )}
      
      {/* 実際の画像 */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={{
          aspectRatio: width && height ? `${width}/${height}` : undefined
        }}
      />
      
      {/* エラー時のフォールバック */}
      {hasError && (
        <div className="bg-gray-100 flex items-center justify-center" style={{ width: width || '100%', height: height || 200 }}>
          <span className="text-gray-400 text-sm">画像を読み込めません</span>
        </div>
      )}
    </div>
  )
}

// 3. インターセクション・オブザーバーによる遅延ロード
export const useLazyLoad = (threshold = 0.1) => {
  const [isInView, setIsInView] = React.useState(false)
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return [ref, isInView] as const
}

// 4. Virtual Scrolling コンポーネント（大量データ用）
interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )

  const visibleItems = items.slice(visibleStart, visibleEnd)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleStart * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, visibleStart + index)
          )}
        </div>
      </div>
    </div>
  )
}

// 5. リソースのプリロード
export const preloadResource = (href: string, as: 'script' | 'style' | 'image' | 'font') => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (as === 'font') {
    link.crossOrigin = 'anonymous'
  }
  document.head.appendChild(link)
}

// 6. Critical Resources の早期ロード
export const preloadCriticalResources = () => {
  // 重要なフォント
  preloadResource('/fonts/NotoSansJP-Regular.woff2', 'font')
  preloadResource('/fonts/NotoSansJP-Bold.woff2', 'font')
  
  // 重要な画像（ヒーロー画像など）
  preloadResource('/images/hero-bg.webp', 'image')
}

// 7. パフォーマンス監視
export const measureWebVitals = () => {
  // LCP (Largest Contentful Paint)
  if ('web-vital' in window) {
    // @ts-ignore
    import('web-vitals').then(({ getLCP, getFID, getCLS, getINP, getTTFB }) => {
      getLCP(console.log)
      getFID(console.log)
      getCLS(console.log)
      getINP(console.log)
      getTTFB(console.log)
    })
  }

  // Custom Performance Marks
  performance.mark('app-init-start')
  
  // アプリ初期化完了をマーク
  setTimeout(() => {
    performance.mark('app-init-end')
    performance.measure('app-init', 'app-init-start', 'app-init-end')
    
    const measure = performance.getEntriesByName('app-init')[0]
    console.log(`App initialization took: ${measure.duration}ms`)
  }, 0)
}

// 8. メモリリーク防止
export const useCleanupEffect = (cleanup: () => void) => {
  React.useEffect(() => {
    return cleanup
  }, [cleanup])
}

// 9. Debounced Search Hook
export const useDebouncedSearch = (searchTerm: string, delay: number = 300) => {
  const [debouncedTerm, setDebouncedTerm] = React.useState(searchTerm)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, delay])

  return debouncedTerm
}

// 10. パフォーマンス最適化の初期化
export const initializePerformanceOptimizations = () => {
  // Critical resources のプリロード
  preloadCriticalResources()
  
  // Web Vitals の監視開始
  measureWebVitals()
  
  // Service Worker の登録（PWA対応）
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error)
  }
  
  // パフォーマンスヒント
  if ('connection' in navigator) {
    // @ts-ignore
    const connection = navigator.connection
    if (connection?.effectiveType === '4g') {
      // 高速回線では積極的にプリフェッチ
      document.documentElement.dataset.preload = 'aggressive'
    }
  }
}

// 11. Loading Fallback Components
export const PerformanceLoadingFallback: React.FC<{ text?: string }> = ({ 
  text = '読み込み中...' 
}) => (
  <div className="min-h-[200px] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
      <p className="text-gray-600">{text}</p>
    </div>
  </div>
)

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
)

// 12. Bundle Size 最適化のための動的import helper
export const dynamicImport = <T,>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn)
  
  return (props: any) => (
    <Suspense fallback={fallback ? React.createElement(fallback) : <PerformanceLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}