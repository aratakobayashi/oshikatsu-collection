import React, { useState, useCallback, useRef, useEffect } from 'react'

interface OptimizedImageProps {
  src?: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: 'high' | 'normal' | 'low'
  placeholder?: React.ReactNode
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  // WebP/AVIF support
  enableModernFormats?: boolean
  // Responsive images
  sizes?: string
  srcSet?: string
  // Lazy loading
  loading?: 'lazy' | 'eager'
  // Intersection observer options
  rootMargin?: string
  threshold?: number
}

// 🚀 Phase 4: Advanced Image Optimization Component
// Features: WebP/AVIF, lazy loading, progressive enhancement, error handling

export const OptimizedImageV2: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = 'normal',
  placeholder,
  fallback,
  onLoad,
  onError,
  enableModernFormats = true,
  sizes,
  srcSet,
  loading = 'lazy',
  rootMargin = '50px',
  threshold = 0.1
}) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [currentSrc, setCurrentSrc] = useState<string>('')
  const [isInView, setIsInView] = useState(priority === 'high')
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 🎯 Modern format detection and URL generation
  const generateModernSrc = useCallback((originalSrc: string): string[] => {
    if (!enableModernFormats || !originalSrc) return [originalSrc]
    
    const sources = []
    const baseSrc = originalSrc.split('?')[0] // Remove query params
    const hasQuery = originalSrc.includes('?')
    const queryParams = hasQuery ? originalSrc.split('?')[1] : ''
    
    // Add WebP version if supported
    if (supportsWebP()) {
      const webpSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp') + (queryParams ? `?${queryParams}` : '')
      sources.push(webpSrc)
    }
    
    // Add AVIF version if supported (highest priority)
    if (supportsAVIF()) {
      const avifSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.avif') + (queryParams ? `?${queryParams}` : '')
      sources.unshift(avifSrc) // AVIF first
    }
    
    // Always include original as fallback
    sources.push(originalSrc)
    
    return sources
  }, [enableModernFormats])

  // 📱 Responsive srcSet generation
  const generateResponsiveSrcSet = useCallback((baseSrc: string): string => {
    if (!baseSrc || srcSet) return srcSet || ''
    
    const sizes = [400, 800, 1200, 1600] // Common breakpoints
    const srcSetEntries = sizes.map(size => {
      // Append size parameter for dynamic resizing (if using image service like Supabase Storage)
      const resizedSrc = baseSrc.includes('?') 
        ? `${baseSrc}&width=${size}` 
        : `${baseSrc}?width=${size}`
      return `${resizedSrc} ${size}w`
    }).join(', ')
    
    return srcSetEntries
  }, [srcSet])

  // 🔍 Intersection Observer setup for lazy loading
  useEffect(() => {
    if (priority === 'high' || !imgRef.current) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observerRef.current?.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    observerRef.current.observe(imgRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [priority, rootMargin, threshold])

  // 🚀 Progressive image loading with format fallback
  useEffect(() => {
    if (!src || !isInView || loadState === 'loaded') return

    setLoadState('loading')

    const modernSources = generateModernSrc(src)
    let sourceIndex = 0

    const tryLoadImage = () => {
      if (sourceIndex >= modernSources.length) {
        setLoadState('error')
        onError?.()
        return
      }

      const img = new Image()
      const currentSource = modernSources[sourceIndex]

      img.onload = () => {
        setCurrentSrc(currentSource)
        setLoadState('loaded')
        onLoad?.()
      }

      img.onerror = () => {
        sourceIndex++
        tryLoadImage() // Try next format
      }

      // Set up responsive loading
      if (sizes) img.sizes = sizes
      const responsiveSrcSet = generateResponsiveSrcSet(currentSource)
      if (responsiveSrcSet) img.srcset = responsiveSrcSet

      img.src = currentSource
    }

    tryLoadImage()
  }, [src, isInView, loadState, generateModernSrc, generateResponsiveSrcSet, sizes, onLoad, onError])

  // 🎨 Render logic based on state
  const renderContent = () => {
    switch (loadState) {
      case 'idle':
      case 'loading':
        return placeholder || <DefaultPlaceholder width={width} height={height} />

      case 'error':
        return fallback || <ErrorFallback alt={alt} />

      case 'loaded':
        return (
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            className={`transition-opacity duration-300 ${className}`}
            width={width}
            height={height}
            sizes={sizes}
            srcSet={generateResponsiveSrcSet(currentSrc)}
            loading={loading}
            decoding="async"
            style={{
              opacity: loadState === 'loaded' ? 1 : 0
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {renderContent()}
      
      {/* Loading indicator overlay */}
      {loadState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  )
}

// 🎨 Default placeholder component
const DefaultPlaceholder: React.FC<{ width?: number; height?: number }> = ({ width, height }) => (
  <div 
    className="bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center animate-pulse"
    style={{ width, height, minHeight: height || '200px' }}
  >
    <div className="text-gray-400">
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
)

// ❌ Error fallback component
const ErrorFallback: React.FC<{ alt: string }> = ({ alt }) => (
  <div className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
    <div className="text-center text-gray-500 p-4">
      <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <p className="text-sm">{alt}</p>
      <p className="text-xs text-gray-400 mt-1">画像を読み込めません</p>
    </div>
  </div>
)

// 🔧 Format support detection utilities
let webpSupport: boolean | null = null
let avifSupport: boolean | null = null

const supportsWebP = (): boolean => {
  if (webpSupport !== null) return webpSupport

  if (typeof window === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    webpSupport = canvas.toDataURL('image/webp', 0.1).indexOf('webp') > -1
  } catch {
    webpSupport = false
  }

  return webpSupport
}

const supportsAVIF = (): boolean => {
  if (avifSupport !== null) return avifSupport

  if (typeof window === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    // AVIF support detection is more complex, simplified for now
    avifSupport = 'OffscreenCanvas' in window && CSS.supports('(image-rendering: pixelated)')
  } catch {
    avifSupport = false
  }

  return avifSupport
}

// 🎯 Presets for common use cases
export const ProfileImage: React.FC<Omit<OptimizedImageProps, 'className'> & { size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md', 
  ...props 
}) => {
  const sizeMap = {
    sm: { width: 48, height: 48, className: 'w-12 h-12 rounded-full' },
    md: { width: 80, height: 80, className: 'w-20 h-20 rounded-full' },
    lg: { width: 120, height: 120, className: 'w-30 h-30 rounded-full' }
  }

  const config = sizeMap[size]

  return (
    <OptimizedImageV2
      {...props}
      {...config}
      priority="high"
      enableModernFormats={true}
    />
  )
}

export const ThumbnailImage: React.FC<OptimizedImageProps> = (props) => (
  <OptimizedImageV2
    {...props}
    className={`aspect-video object-cover rounded-lg ${props.className || ''}`}
    enableModernFormats={true}
    loading="lazy"
  />
)

export const HeroImage: React.FC<OptimizedImageProps> = (props) => (
  <OptimizedImageV2
    {...props}
    priority="high"
    loading="eager"
    enableModernFormats={true}
    className={`w-full object-cover ${props.className || ''}`}
  />
)

export default OptimizedImageV2