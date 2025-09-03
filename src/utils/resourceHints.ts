// 🚀 Resource Hints and Preloading Utilities

export interface ResourceHint {
  rel: 'preconnect' | 'dns-prefetch' | 'preload' | 'prefetch' | 'modulepreload'
  href: string
  as?: string
  type?: string
  crossorigin?: string
}

// 🌐 Critical external domains to preconnect
const CRITICAL_DOMAINS = [
  'https://img.youtube.com',
  'https://images.unsplash.com', 
  'https://aml.valuecommerce.com',
  'https://cdn.jsdelivr.net'
]

// 📱 Critical resources to preload
const CRITICAL_RESOURCES: ResourceHint[] = [
  // Preconnect to critical external domains
  ...CRITICAL_DOMAINS.map(domain => ({
    rel: 'preconnect' as const,
    href: domain,
    crossorigin: 'anonymous'
  })),
  
  // DNS prefetch for less critical domains
  {
    rel: 'dns-prefetch',
    href: 'https://www.google-analytics.com'
  },
  
  // Note: Using system fonts (system-ui, -apple-system) instead of external fonts
  // for better performance and reduced network requests
]

/**
 * 🔧 Add resource hints to document head
 * Call this early in the app lifecycle
 */
export function addResourceHints() {
  const head = document.head
  
  CRITICAL_RESOURCES.forEach(hint => {
    // Check if hint already exists
    const existing = head.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)
    if (existing) return
    
    const link = document.createElement('link')
    link.rel = hint.rel
    link.href = hint.href
    
    if (hint.as) link.setAttribute('as', hint.as)
    if (hint.type) link.setAttribute('type', hint.type)
    if (hint.crossorigin) link.setAttribute('crossorigin', hint.crossorigin)
    
    head.appendChild(link)
  })
}

/**
 * 🖼️ Preload critical images
 * Call for above-the-fold images
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'high') {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = src
  link.as = 'image'
  link.setAttribute('fetchpriority', priority)
  
  document.head.appendChild(link)
}

/**
 * ⚡ Prefetch route data
 * Call when user hovers over navigation links
 */
export function prefetchRoute(path: string) {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = path
  
  document.head.appendChild(link)
}

/**
 * 📦 Preload JavaScript modules
 * Call for critical route components
 */
export function preloadModule(href: string) {
  const link = document.createElement('link')
  link.rel = 'modulepreload'
  link.href = href
  link.crossOrigin = 'anonymous'
  
  document.head.appendChild(link)
}

/**
 * 🎯 Smart resource preloading based on user interaction
 * Preloads resources when user shows intent (hover, focus)
 */
export class SmartPreloader {
  private preloadedRoutes = new Set<string>()
  private preloadedImages = new Set<string>()
  
  constructor() {
    this.setupIntersectionObserver()
    this.setupHoverPreloading()
  }
  
  private setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          if (src && !this.preloadedImages.has(src)) {
            preloadImage(src, 'low')
            this.preloadedImages.add(src)
          }
        }
      })
    }, { rootMargin: '200px' })
    
    // Observe images with data-src attribute
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('img[data-src]').forEach(img => {
        observer.observe(img)
      })
    })
  }
  
  private setupHoverPreloading() {
    document.addEventListener('mouseover', (e) => {
      const link = (e.target as Element).closest('a[href]') as HTMLAnchorElement
      if (link && link.hostname === location.hostname) {
        const path = link.pathname
        if (!this.preloadedRoutes.has(path)) {
          prefetchRoute(path)
          this.preloadedRoutes.add(path)
        }
      }
    }, { passive: true })
  }
}

// 🚀 Initialize smart preloader
let smartPreloader: SmartPreloader | null = null

export function initializeSmartPreloading() {
  if (!smartPreloader) {
    smartPreloader = new SmartPreloader()
    addResourceHints()
  }
}

/**
 * 🔄 Resource cleanup for SPA navigation
 * Remove unnecessary preloaded resources to free memory
 */
export function cleanupUnusedResources() {
  const links = document.head.querySelectorAll('link[rel="prefetch"], link[rel="preload"]')
  links.forEach(link => {
    // Remove prefetched resources older than 5 minutes
    const linkElement = link as HTMLLinkElement
    const age = Date.now() - (parseInt(linkElement.dataset.timestamp || '0') || Date.now())
    
    if (age > 5 * 60 * 1000) { // 5 minutes
      link.remove()
    }
  })
}