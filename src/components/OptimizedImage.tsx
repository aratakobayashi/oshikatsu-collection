import { useState, useRef, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  fallbackSrc?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  priority?: boolean // For above-the-fold images
}

// Browser support detection
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
})()

const supportsAVIF = (() => {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  try {
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  } catch {
    return false
  }
})()

// Image format optimization
function getOptimizedImageUrl(src: string, width?: number): string {
  // Skip optimization for external URLs (YouTube, TMDB, etc.)
  if (src.startsWith('http') && !src.includes('oshikatsu-collection')) {
    return src
  }

  // Local images optimization
  if (src.startsWith('/')) {
    const basePath = src.replace(/\.[^/.]+$/, '') // Remove extension
    const widthParam = width ? `?w=${width}` : ''
    
    if (supportsAVIF) {
      return `${basePath}.avif${widthParam}`
    } else if (supportsWebP) {
      return `${basePath}.webp${widthParam}`
    }
  }
  
  return src
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc,
  placeholder = '/placeholder-image.jpg',
  onLoad,
  onError,
  priority = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isVisible, setIsVisible] = useState(priority) // Load immediately if priority
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading (skip if priority)
  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Load 50px before visible
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setIsError(true)
    onError?.()
  }

  // Get optimized source URLs
  const optimizedSrc = getOptimizedImageUrl(src, width)
  const finalSrc = isError ? (fallbackSrc || src) : optimizedSrc

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Loading placeholder */}
      {(!isVisible || !isLoaded) && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}

      {/* Optimized picture element with multiple sources */}
      {isVisible && (
        <picture>
          {/* AVIF source */}
          {supportsAVIF && !src.startsWith('http') && (
            <source
              srcSet={`${src.replace(/\.[^/.]+$/, '')}.avif${width ? `?w=${width}` : ''}`}
              type="image/avif"
            />
          )}
          
          {/* WebP source */}
          {supportsWebP && !src.startsWith('http') && (
            <source
              srcSet={`${src.replace(/\.[^/.]+$/, '')}.webp${width ? `?w=${width}` : ''}`}
              type="image/webp"
            />
          )}
          
          {/* Fallback image */}
          <img
            src={finalSrc}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        </picture>
      )}
    </div>
  )
}

// Specialized components for different image types

export function OptimizedYouTubeThumbnail({
  videoId,
  alt,
  className = '',
  quality = 'hqdefault',
  priority = false
}: {
  videoId: string
  alt: string
  className?: string
  quality?: 'hqdefault' | 'mqdefault' | 'maxresdefault'
  priority?: boolean
}) {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
  const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  return (
    <OptimizedImage
      src={thumbnailUrl}
      alt={alt}
      className={className}
      fallbackSrc={fallbackUrl}
      placeholder="/placeholder-video.jpg"
      priority={priority}
      width={480}
      height={360}
    />
  )
}

export function OptimizedCelebrityImage({
  src,
  alt,
  className = '',
  priority = false
}: {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
}) {
  const imageSrc = src || '/placeholder-celebrity.jpg'
  
  return (
    <OptimizedImage
      src={imageSrc}
      alt={alt}
      className={className}
      fallbackSrc="/placeholder-celebrity.jpg"
      placeholder="/placeholder-celebrity.jpg"
      priority={priority}
      width={300}
      height={300}
    />
  )
}

export function OptimizedLocationImage({
  src,
  alt,
  className = '',
  priority = false
}: {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
}) {
  const imageSrc = src || '/placeholder-location.jpg'
  
  return (
    <OptimizedImage
      src={imageSrc}
      alt={alt}
      className={className}
      fallbackSrc="/placeholder-location.jpg"
      placeholder="/placeholder-location.jpg"
      priority={priority}
      width={400}
      height={300}
    />
  )
}

export function OptimizedItemImage({
  src,
  alt,
  className = '',
  priority = false
}: {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
}) {
  const imageSrc = src || '/placeholder-item.jpg'
  
  return (
    <OptimizedImage
      src={imageSrc}
      alt={alt}
      className={className}
      fallbackSrc="/placeholder-item.jpg"
      placeholder="/placeholder-item.jpg"
      priority={priority}
      width={300}
      height={300}
    />
  )
}