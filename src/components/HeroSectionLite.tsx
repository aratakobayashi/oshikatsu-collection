import { useState, Suspense, lazy } from 'react'
import { Heart, Star, Sparkles } from 'lucide-react'
import { detectSearchType, getPopularSearches } from '../utils/searchHelper'

// Lazy load heavy components
const SparkleEffect = lazy(() => import('./effects/SparkleEffect'))
const FloatingIcon = lazy(() => import('./effects/FloatingIcon'))

interface HeroSectionProps {
  onSearch: (query: string) => void
}

// Lightweight version optimized for LCP
export default function HeroSectionLite({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchPreview, setShowSearchPreview] = useState(false)

  // 検索タイプのリアルタイム検出
  const currentSearchType = searchQuery.length > 1 ? detectSearchType(searchQuery) : 'unknown'
  const popularSearches = getPopularSearches()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  return (
    <section className="relative min-h-screen lg:h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden">
      {/* Lazy-loaded Background Effects */}
      <Suspense fallback={null}>
        <SparkleEffect />
        <FloatingIcon icon={Heart} delay={0} size="h-8 w-8" />
        <FloatingIcon icon={Star} delay={1000} size="h-6 w-6" />
        <FloatingIcon icon={Sparkles} delay={2000} size="h-7 w-7" />
      </Suspense>
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-16 lg:pb-24 z-10">
        <div className="text-center">
          {/* Optimized Main Headline - Priority content */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight">
              <span className="relative inline-block">
                推し活を
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500">
                  もっと楽しく
                </span>
                <div className="absolute -top-2 -right-2">
                  <Heart className="h-5 w-5 md:h-6 md:w-6 text-red-400 animate-bounce" fill="currentColor" />
                </div>
              </span>
            </h1>
            
            {/* LCP-optimized subtitle - Critical content */}
            <p 
              className="text-base md:text-lg text-gray-600 mb-2"
              style={{ 
                // Inline critical styles for immediate rendering
                fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                lineHeight: '1.5',
                fontWeight: '400'
              }}
            >
              推し・アイテム・聖地巡礼スポットを検索・発見
            </p>
            
            {/* 推し活ガイドへの自然なリンク */}
            <div className="text-center mb-2">
              <p className="text-sm text-gray-500">
                推し活初心者の方は
                <a 
                  href="https://oshikatsu-guide.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-rose-600 hover:text-rose-800 font-medium ml-1 mr-1 underline decoration-rose-300 hover:decoration-rose-500 transition-all duration-200"
                >
                  推し活ガイド
                </a>
                で基本をマスター！
              </p>
            </div>
          </div>

          {/* Enhanced Smart Search Bar - Optimized */}
          <div className="max-w-4xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="relative group">
              <div className="relative">
                <input
                  type="text"
                  placeholder="推し・アイテム・場所を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchPreview(true)}
                  onBlur={() => setTimeout(() => setShowSearchPreview(false), 200)}
                  className="w-full px-6 py-4 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-lg focus:border-rose-400 focus:ring-4 focus:ring-rose-100 focus:outline-none transition-all duration-300 placeholder-gray-400"
                  style={{
                    // Prevent layout shift
                    minHeight: '56px'
                  }}
                />
                
                {/* Search button */}
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  検索
                </button>
              </div>
              
              {/* Real-time search type indicator - Lazy loaded */}
              {searchQuery.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-100">
                  <div className="text-sm text-gray-600 mb-2">
                    検索タイプ: <span className="font-medium text-rose-600 capitalize">{currentSearchType}</span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Quick Stats - Immediate value */}
          <div className="flex justify-center items-center gap-8 mb-8 text-center flex-wrap">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-rose-500">2600+</div>
              <div className="text-sm text-gray-600">エピソード</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-rose-500">250+</div>
              <div className="text-sm text-gray-600">ロケ地</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-rose-500">100+</div>
              <div className="text-sm text-gray-600">アイテム</div>
            </div>
          </div>

          {/* Popular searches - Lazy loaded */}
          <Suspense fallback={<div className="h-16"></div>}>
            <div className="max-w-4xl mx-auto">
              <div className="text-sm text-gray-500 mb-3">人気の検索:</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {popularSearches.trending.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => onSearch(term)}
                    className="px-4 py-2 bg-white/70 hover:bg-rose-50 text-gray-700 text-sm rounded-full border border-gray-200 hover:border-rose-300 transition-all duration-200 backdrop-blur-sm"
                  >
                    #{term}
                  </button>
                ))}
              </div>
            </div>
          </Suspense>
        </div>
      </div>
    </section>
  )
}