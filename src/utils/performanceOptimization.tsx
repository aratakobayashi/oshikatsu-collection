// パフォーマンス最適化ユーティリティ

import React, { lazy, ComponentType } from 'react'

// Critical CSS用のスタイル定義
export const criticalCSS = `
  /* Above-the-fold styles for faster render */
  .hero-section { 
    background: linear-gradient(135deg, #fef7f0 0%, #f3e8ff 100%); 
    min-height: 500px; 
  }
  .loading-spinner { 
    animation: spin 1s linear infinite; 
  }
  @keyframes spin { 
    to { transform: rotate(360deg); } 
  }
`

// 遅延読み込みコンポーネント定義
interface LazyComponentOptions {
  loading?: ComponentType
  error?: ComponentType<{ error: Error; retry: () => void }>
  preload?: boolean
}

export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) => {
  const LazyComponent = lazy(importFunc)
  
  // プリロード機能
  if (options.preload) {
    // コンポーネントを事前に読み込み
    importFunc()
  }
  
  return LazyComponent
}

// パフォーマンス監視
interface PerformanceMetrics {
  LCP: number // Largest Contentful Paint
  FID: number // First Input Delay
  CLS: number // Cumulative Layout Shift
  FCP: number // First Contentful Paint
  TTFB: number // Time to First Byte
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Partial<PerformanceMetrics> = {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Web Vitals計測
  measureWebVitals(): void {
    // LCP測定
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
      this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime || 0
      this.reportMetrics('LCP', this.metrics.LCP)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // FID測定
    new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[]
      entries.forEach((entry) => {
        this.metrics.FID = entry.processingStart - entry.startTime
        this.reportMetrics('FID', this.metrics.FID)
      })
    }).observe({ entryTypes: ['first-input'] })

    // CLS測定
    new PerformanceObserver((list) => {
      let clsValue = 0
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.metrics.CLS = clsValue
      this.reportMetrics('CLS', this.metrics.CLS)
    }).observe({ entryTypes: ['layout-shift'] })
  }

  private reportMetrics(metric: string, value: number): void {
    // 開発環境でのみログ出力
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance Metric - ${metric}:`, value)
      
      // 閾値チェック
      const thresholds = {
        LCP: 2500, // 2.5秒以下が良好
        FID: 100,  // 100ms以下が良好
        CLS: 0.1   // 0.1以下が良好
      }
      
      const threshold = thresholds[metric as keyof typeof thresholds]
      if (threshold && value > threshold) {
        console.warn(`⚠️ ${metric} exceeds recommended threshold: ${value} > ${threshold}`)
      }
    }

    // 本番環境では分析サービスに送信
    if (process.env.NODE_ENV === 'production') {
      // Google Analytics 4 などに送信
      if (typeof gtag !== 'undefined') {
        gtag('event', 'web_vitals', {
          metric_name: metric,
          metric_value: Math.round(value),
          metric_rating: this.getRating(metric, value)
        })
      }
    }
  }

  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 }
    }
    
    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return 'good'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }
}

// リソースプリロード
export const preloadResource = (href: string, as: string = 'script', crossorigin?: string) => {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (crossorigin) link.crossOrigin = crossorigin
  
  document.head.appendChild(link)
}

// 重要なリソースのプリロード
export const preloadCriticalResources = () => {
  // より厳格な使用チェックを実装
  if (typeof document !== 'undefined') {
    // 実際にNoto Sans JPが使用されているかより厳密にチェック
    const bodyStyles = getComputedStyle(document.body)
    const usesNotoSansJP = bodyStyles.fontFamily.includes('Noto Sans JP')
    
    // 実際にフォントが適用されている要素があるかチェック
    const fontElements = document.querySelectorAll('h1, h2, h3, .font-bold, .font-medium')
    const hasActiveFont = Array.from(fontElements).some(el => 
      getComputedStyle(el).fontFamily.includes('Noto Sans JP')
    )
    
    if (usesNotoSansJP && hasActiveFont) {
      preloadResource('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap', 'style')
    }
    
    // 実際にヒーロー画像が存在し、特定のURLを使用している場合のみプリロード
    const heroImages = document.querySelectorAll('.hero-section img, [class*="hero"] img')
    const hasSpecificImage = Array.from(heroImages).some(img => 
      (img as HTMLImageElement).src.includes('images.unsplash.com/photo-1507003211169-0a1dd7228f2d')
    )
    
    if (hasSpecificImage) {
      preloadResource('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80', 'image')
    }
  }
}

// 画像遅延読み込み
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  const defaultOptions = {
    root: null,
    rootMargin: '50px', // 50px前から読み込み開始
    threshold: 0.1
  }

  return new IntersectionObserver(callback, { ...defaultOptions, ...options })
}

// バンドルサイズ分析用のチャンクサイズ計算
export const calculateBundleSize = () => {
  if (typeof performance === 'undefined') return

  const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

  const jsResources = resourceEntries.filter(entry => 
    entry.name.includes('.js') && entry.transferSize
  )

  const totalJSSize = jsResources.reduce((total, resource) => 
    total + (resource.transferSize || 0), 0
  )

  const cssResources = resourceEntries.filter(entry => 
    entry.name.includes('.css') && entry.transferSize
  )

  const totalCSSSize = cssResources.reduce((total, resource) => 
    total + (resource.transferSize || 0), 0
  )

  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Bundle Analysis:', {
      totalJSSize: `${(totalJSSize / 1024).toFixed(2)} KB`,
      totalCSSSize: `${(totalCSSSize / 1024).toFixed(2)} KB`,
      jsResources: jsResources.length,
      cssResources: cssResources.length
    })
  }

  return {
    totalJSSize,
    totalCSSSize,
    jsResourceCount: jsResources.length,
    cssResourceCount: cssResources.length
  }
}

// Service Worker登録
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    // Service Workerファイルが存在するかチェック
    const response = await fetch('/sw.js', { method: 'HEAD' })
    if (!response.ok) {
      return null
    }

    const registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  } catch (error) {
    return null
  }
}

// パフォーマンス最適化のメインエントリーポイント
export const initializePerformanceOptimizations = () => {
  if (typeof window === 'undefined') return

  // パフォーマンス監視開始
  const monitor = PerformanceMonitor.getInstance()
  monitor.measureWebVitals()

  // DOMが完全に読み込まれてからリソースプリロードを実行
  setTimeout(() => {
    preloadCriticalResources()
  }, 1000)

  // バンドルサイズ分析（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    setTimeout(calculateBundleSize, 2000)
  }

  // Service Worker登録（本番環境のみ）
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      registerServiceWorker()
    }, 500)
  }
}

// React Suspenseのフォールバック用ローディングコンポーネント

export const PerformanceLoadingFallback: React.FC<{ message?: string }> = ({ 
  message = 'コンテンツを読み込み中...' 
}) => {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// コンポーネント遅延読み込み用のフック
export const useLazyLoading = (ref: React.RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const observer = createIntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer?.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current && observer) {
      observer.observe(ref.current)
    }

    return () => observer?.disconnect()
  }, [ref])

  return isVisible
}

export default {
  PerformanceMonitor,
  preloadResource,
  createLazyComponent,
  initializePerformanceOptimizations,
  PerformanceLoadingFallback,
  useLazyLoading
}