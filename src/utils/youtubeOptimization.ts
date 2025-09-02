// YouTube最適化ユーティリティ

export interface YouTubeOptimizationConfig {
  // デフォルト画質（小さいサイズから開始）
  defaultQuality: 'mqdefault' | 'hqdefault' | 'sddefault'
  // プリロード戦略
  preloadStrategy: 'none' | 'lazy' | 'eager'
  // WebP対応チェック
  useWebP: boolean
  // インターセクションオブザーバー設定
  intersectionConfig: {
    threshold: number
    rootMargin: string
  }
}

export const defaultConfig: YouTubeOptimizationConfig = {
  defaultQuality: 'mqdefault', // 320x180 (約30-50KB)
  preloadStrategy: 'lazy',
  useWebP: false, // YouTubeはWebPサムネイルを提供していない
  intersectionConfig: {
    threshold: 0.1,
    rootMargin: '50px'
  }
}

export const getOptimalThumbnailQuality = (): 'mqdefault' | 'hqdefault' => {
  // ネットワーク状況に応じて品質を動的に決定
  const connection = (navigator as any).connection
  
  if (connection) {
    // 高速回線の場合のみ高品質
    if (connection.effectiveType === '4g' && !connection.saveData) {
      return 'hqdefault' // 480x360 (約50-80KB)
    }
  }
  
  // デフォルトは中品質
  return 'mqdefault' // 320x180 (約30-50KB)
}

export const getThumbnailUrl = (videoId: string, quality: string = 'mqdefault'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

export const preloadCriticalThumbnails = (videoIds: string[], maxCount: number = 3) => {
  // 最初の数件のみプリロード
  const criticalIds = videoIds.slice(0, maxCount)
  const quality = getOptimalThumbnailQuality()
  
  criticalIds.forEach(videoId => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = getThumbnailUrl(videoId, quality)
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
}