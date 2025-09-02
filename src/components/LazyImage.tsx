import { useState, useRef, useEffect } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export default function LazyImage({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder-image.jpg',
  placeholder = '/placeholder-image.jpg',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Load image 50px before it comes into view
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setIsError(true)
    onError?.()
  }

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Placeholder/Loading state */}
      {(!isVisible || !isLoaded) && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}

      {/* Actual image */}
      {isVisible && (
        <img
          src={isError ? fallbackSrc : src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  )
}

// YouTube Thumbnail Component with optimized loading
export function LazyYouTubeThumbnail({
  videoId,
  alt,
  className = '',
  quality = 'hqdefault'
}: {
  videoId: string
  alt: string
  className?: string
  quality?: 'hqdefault' | 'mqdefault' | 'maxresdefault'
}) {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
  const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  return (
    <LazyImage
      src={thumbnailUrl}
      alt={alt}
      className={className}
      fallbackSrc={fallbackUrl}
      placeholder="/placeholder-video.jpg"
    />
  )
}

// Celebrity Image Component with optimized loading
export function LazyCelebrityImage({
  src,
  alt,
  className = ''
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  const imageSrc = src || '/placeholder-celebrity.jpg'
  
  return (
    <LazyImage
      src={imageSrc}
      alt={alt}
      className={className}
      fallbackSrc="/placeholder-celebrity.jpg"
      placeholder="/placeholder-celebrity.jpg"
    />
  )
}

// Location Image Component with optimized loading  
export function LazyLocationImage({
  src,
  alt,
  className = ''
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  const imageSrc = src || '/placeholder-location.jpg'
  
  return (
    <LazyImage
      src={imageSrc}
      alt={alt}
      className={className}
      fallbackSrc="/placeholder-location.jpg"
      placeholder="/placeholder-location.jpg"
    />
  )
}

// Item Image Component with optimized loading
export function LazyItemImage({
  src,
  alt,
  className = ''
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  const imageSrc = src || '/placeholder-item.jpg'
  
  return (
    <LazyImage
      src={imageSrc}
      alt={alt}
      className={className}
      fallbackSrc="/placeholder-item.jpg"
      placeholder="/placeholder-item.jpg"
    />
  )
}