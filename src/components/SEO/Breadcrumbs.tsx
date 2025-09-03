import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { StructuredData, generateStructuredData } from './StructuredData'

interface BreadcrumbItem {
  name: string
  url?: string
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  // Always include home as the first item
  const breadcrumbItems = [
    { name: 'ホーム', url: 'https://collection.oshikatsu-guide.com' },
    ...items
  ]

  // Generate structured data for SEO
  const breadcrumbStructuredData = generateStructuredData.breadcrumb(breadcrumbItems)

  return (
    <>
      {/* SEO Structured Data */}
      <StructuredData data={breadcrumbStructuredData} />
      
      {/* Visual Breadcrumbs */}
      <nav className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`} aria-label="パンくずリスト">
        <ol className="flex items-center space-x-2">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1
            const isHome = index === 0
            
            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />
                )}
                
                {item.url && !isLast ? (
                  <Link 
                    to={item.url.replace('https://collection.oshikatsu-guide.com', '')} 
                    className="hover:text-purple-600 transition-colors flex items-center"
                  >
                    {isHome && <Home className="h-4 w-4 mr-1" />}
                    {item.name}
                  </Link>
                ) : (
                  <span className={`flex items-center ${isLast ? 'text-gray-900 font-medium' : ''}`}>
                    {isHome && <Home className="h-4 w-4 mr-1" />}
                    {item.name}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

// Utility functions to generate breadcrumbs for different page types
export const generateBreadcrumbs = {
  celebrity: (celebrityName: string, celebritySlug: string): BreadcrumbItem[] => [
    { name: '推し一覧', url: 'https://collection.oshikatsu-guide.com/celebrities' },
    { name: celebrityName, url: `https://collection.oshikatsu-guide.com/celebrities/${celebritySlug}`, current: true }
  ],

  location: (locationName: string, locationSlug: string, celebrityName?: string): BreadcrumbItem[] => {
    const breadcrumbs = [
      { name: 'ロケ地一覧', url: 'https://collection.oshikatsu-guide.com/locations' }
    ]
    
    if (celebrityName) {
      breadcrumbs.push({ name: `${celebrityName}のロケ地` })
    }
    
    breadcrumbs.push({ 
      name: locationName, 
      url: `https://collection.oshikatsu-guide.com/locations/${locationSlug}`, 
      current: true 
    })
    
    return breadcrumbs
  },

  episode: (episodeTitle: string, episodeSlug: string, showName?: string): BreadcrumbItem[] => {
    const breadcrumbs = [
      { name: 'エピソード一覧', url: 'https://collection.oshikatsu-guide.com/episodes' }
    ]
    
    if (showName) {
      breadcrumbs.push({ name: showName })
    }
    
    breadcrumbs.push({ 
      name: episodeTitle, 
      url: `https://collection.oshikatsu-guide.com/episodes/${episodeSlug}`, 
      current: true 
    })
    
    return breadcrumbs
  },

  item: (itemName: string, itemSlug: string, category?: string): BreadcrumbItem[] => {
    const breadcrumbs = [
      { name: 'アイテム一覧', url: 'https://collection.oshikatsu-guide.com/items' }
    ]
    
    if (category) {
      breadcrumbs.push({ name: category })
    }
    
    breadcrumbs.push({ 
      name: itemName, 
      url: `https://collection.oshikatsu-guide.com/items/${itemSlug}`, 
      current: true 
    })
    
    return breadcrumbs
  },

  search: (query?: string): BreadcrumbItem[] => {
    if (query) {
      return [
        { name: '検索', url: 'https://collection.oshikatsu-guide.com/search' },
        { name: `「${query}」の検索結果`, current: true }
      ]
    }
    return [
      { name: '検索', current: true }
    ]
  },

  category: (categoryName: string): BreadcrumbItem[] => [
    { name: categoryName, current: true }
  ]
}

export default Breadcrumbs