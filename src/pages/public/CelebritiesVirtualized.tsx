import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Users, Filter, Star, Heart, TrendingUp } from 'lucide-react'
import { useCelebritiesList, useSearchCelebrities, useTotalCelebritiesCount } from '../../hooks/useOptimizedFetch'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import { debounce } from 'lodash'

// 🚀 Phase 4: Virtualized Celebrities List
// High-performance infinite scroll with search optimization

interface Celebrity {
  id: string
  name: string
  slug: string
  bio?: string
  image_url?: string
  view_count: number
  group_name?: string
  type: string
}

interface CelebCardProps {
  celebrity: Celebrity
  index: number
  isVisible: boolean
}

// 🎯 Optimized Celebrity Card with lazy loading
const CelebCard = React.memo(({ celebrity, index, isVisible }: CelebCardProps) => {
  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Don't render content for non-visible cards (virtual scrolling optimization)
  if (!isVisible) {
    return (
      <div className="bg-white rounded-2xl shadow-lg h-80" /> // Placeholder with fixed height
    )
  }

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden"
      onClick={() => navigate(`/celebrities/${celebrity.slug}`)}
    >
      {/* Image section with lazy loading */}
      <div className="relative h-48 overflow-hidden">
        {celebrity.image_url && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Users className="h-12 w-12 text-purple-300 animate-pulse" />
              </div>
            )}
            <img
              src={celebrity.image_url}
              alt={celebrity.name}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true)
                setImageLoaded(true)
              }}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Users className="h-12 w-12 text-purple-400" />
          </div>
        )}
        
        {/* Popularity indicator */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center">
          <TrendingUp className="h-3 w-3 mr-1" />
          {celebrity.view_count || 0}
        </div>
      </div>

      {/* Content section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-xl text-gray-800 truncate flex-1">{celebrity.name}</h3>
          <Heart className="h-5 w-5 text-rose-400 ml-2 flex-shrink-0" />
        </div>
        
        {celebrity.bio && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
            {celebrity.bio}
          </p>
        )}
        
        {(celebrity.group_name || celebrity.type) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {celebrity.group_name && (
              <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
                {celebrity.group_name}
              </span>
            )}
            {celebrity.type && (
              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                {celebrity.type === 'individual' ? '個人' : celebrity.type}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

CelebCard.displayName = 'CelebCard'

// 🔍 Search Header Component
const SearchHeader = ({ searchQuery, setSearchQuery, onFilterToggle }: {
  searchQuery: string
  setSearchQuery: (query: string) => void
  onFilterToggle: () => void
}) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              推し一覧
            </h1>
          </div>
          
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="推しの名前で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            <button
              onClick={onFilterToggle}
              className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 📱 Virtual Scrolling Hook
const useVirtualScroll = (itemHeight: number, containerHeight: number, totalItems: number) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 2, // Buffer items
    totalItems - 1
  )
  
  return { startIndex, endIndex, setScrollTop }
}

// 🏠 Main Component
export default function CelebritiesVirtualized() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [showFilters, setShowFilters] = useState(false)
  const [allCelebrities, setAllCelebrities] = useState<Celebrity[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  const ITEMS_PER_PAGE = 12
  const ITEM_HEIGHT = 320 // Height of each card + gap

  // Data fetching
  const { data: listData, loading } = useCelebritiesList(ITEMS_PER_PAGE, offset)
  const { data: searchResults } = useSearchCelebrities(searchQuery, 20)
  const { data: totalCount } = useTotalCelebritiesCount()

  // Debounced search query update
  const debouncedSetSearchQuery = useCallback(
    debounce((query: string) => {
      if (query) {
        setSearchParams({ q: query })
      } else {
        setSearchParams({})
      }
    }, 300),
    [setSearchParams]
  )

  useEffect(() => {
    debouncedSetSearchQuery(searchQuery)
  }, [searchQuery, debouncedSetSearchQuery])

  // Load more data
  useEffect(() => {
    if (listData?.data && !searchQuery) {
      if (offset === 0) {
        setAllCelebrities(listData.data)
      } else {
        setAllCelebrities(prev => [...prev, ...listData.data])
      }
      setHasMore(listData.hasMore)
    }
  }, [listData, offset, searchQuery])

  // Infinite scroll setup
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchQuery) {
        setOffset(prev => prev + ITEMS_PER_PAGE)
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, searchQuery])

  // Virtual scrolling for search results
  const [containerHeight, setContainerHeight] = useState(800)
  const { startIndex, endIndex, setScrollTop } = useVirtualScroll(
    ITEM_HEIGHT, 
    containerHeight, 
    searchQuery ? searchResults?.length || 0 : allCelebrities.length
  )

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // Determine which data to show
  const displayData = searchQuery ? searchResults || [] : allCelebrities
  const showVirtualScroll = searchQuery && (searchResults?.length || 0) > 20

  // Grid layout calculation
  const getGridItems = () => {
    const itemsPerRow = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : window.innerWidth >= 640 ? 2 : 1
    const items = []
    
    if (showVirtualScroll) {
      // Virtual scrolling for large search results
      const totalHeight = Math.ceil(displayData.length / itemsPerRow) * ITEM_HEIGHT
      
      return (
        <div style={{ height: totalHeight }}>
          <div 
            style={{ 
              transform: `translateY(${Math.floor(startIndex / itemsPerRow) * ITEM_HEIGHT}px)`,
              display: 'grid',
              gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
              gap: '1.5rem'
            }}
          >
            {displayData.slice(startIndex, endIndex + 1).map((celebrity, idx) => (
              <CelebCard 
                key={celebrity.id} 
                celebrity={celebrity}
                index={startIndex + idx}
                isVisible={true}
              />
            ))}
          </div>
        </div>
      )
    }
    
    // Regular grid for normal browsing
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayData.map((celebrity, index) => (
          <CelebCard 
            key={celebrity.id} 
            celebrity={celebrity}
            index={index}
            isVisible={true}
          />
        ))}
      </div>
    )
  }

  const seoData = generateSEO.celebrities(totalCount || 28)

  return (
    <div className="min-h-screen bg-gray-50">
      <MetaTags 
        title={searchQuery ? `「${searchQuery}」の検索結果 | 推し一覧` : seoData.title}
        description={searchQuery ? `「${searchQuery}」に関連する推し・タレントの検索結果` : seoData.description}
        keywords={seoData.keywords}
        canonicalUrl="https://collection.oshikatsu-guide.com/celebrities"
      />

      <SearchHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFilterToggle={() => setShowFilters(!showFilters)}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Results info */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-gray-600">
            {searchQuery ? (
              <span>「{searchQuery}」の検索結果: {searchResults?.length || 0}件</span>
            ) : (
              <span>全{totalCount || 28}人の推し</span>
            )}
          </div>
          
          {loading && (
            <div className="flex items-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500 mr-2"></div>
              読み込み中...
            </div>
          )}
        </div>

        {/* Main content */}
        <div 
          ref={scrollContainerRef}
          className={showVirtualScroll ? "overflow-auto" : ""}
          style={showVirtualScroll ? { height: containerHeight } : {}}
          onScroll={showVirtualScroll ? handleScroll : undefined}
        >
          {displayData.length > 0 ? (
            getGridItems()
          ) : searchQuery ? (
            <div className="text-center py-20">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">「{searchQuery}」に該当する推しが見つかりませんでした</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                すべての推しを見る
              </button>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-500">推しを読み込み中...</p>
            </div>
          )}
        </div>

        {/* Load more trigger for infinite scroll */}
        {!searchQuery && hasMore && (
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
            {loading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}