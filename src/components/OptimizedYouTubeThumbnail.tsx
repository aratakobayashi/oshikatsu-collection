import React, { useState, useCallback, useEffect } from 'react'
import { getOptimalThumbnailQuality, getThumbnailUrl } from '../utils/youtubeOptimization'

interface OptimizedYouTubeThumbnailProps {
  videoId: string
  alt: string
  className?: string
  fallbackSrc?: string
  priority?: boolean // Above the fold用
}

const OptimizedYouTubeThumbnail: React.FC<OptimizedYouTubeThumbnailProps> = ({
  videoId,
  alt,
  className = '',
  fallbackSrc,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [currentQuality, setCurrentQuality] = useState<'mqdefault' | 'hqdefault'>(
    priority ? getOptimalThumbnailQuality() : 'mqdefault'
  )

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    setError(false)
    setRetryCount(0)
  }, [])

  const handleError = useCallback(() => {
    // 最大1回のリトライのみ許可
    if (currentQuality === 'mqdefault' && retryCount < 1) {
      setCurrentQuality('hqdefault')
      setRetryCount(prev => prev + 1)
      setError(false)
    } else {
      // リトライ回数上限に達した場合はエラー状態に設定
      setError(true)
    }
  }, [currentQuality, retryCount])

  // IntersectionObserver for lazy upgrade to higher quality
  useEffect(() => {
    if (priority || isLoaded || currentQuality === 'hqdefault' || error) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          // ビューポートに入り、4G接続なら高品質に切り替え
          const connection = (navigator as any).connection
          if (!connection || connection.effectiveType === '4g') {
            setCurrentQuality('hqdefault')
          }
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const imgElement = document.querySelector(`[data-video-id="${videoId}"]`)
    if (imgElement) {
      observer.observe(imgElement)
    }

    return () => observer.disconnect()
  }, [videoId, priority, isLoaded, currentQuality, error])

  if (error && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }

  if (error) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-gray-500 text-sm">画像なし</span>
      </div>
    )
  }

  return (
    <img
      data-video-id={videoId}
      src={getThumbnailUrl(videoId, currentQuality)}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoaded ? 1 : 0.7
      }}
    />
  )
}

export default OptimizedYouTubeThumbnail

// 使用例:
// <OptimizedYouTubeThumbnail
//   videoId="dQw4w9WgXcQ"
//   alt="YouTube thumbnail"
//   className="w-full h-48 object-cover rounded"
// />