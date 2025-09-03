import React, { useEffect, useState, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Play, MapPin, Search, TrendingUp } from 'lucide-react'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import { StructuredData, generateStructuredData } from '../../components/SEO/StructuredData'
import { getSearchPath } from '../../utils/searchHelper'
import { useCriticalHomeData, useProgressiveHomeData } from '../../hooks/useOptimizedFetch'

// 🚀 Phase 4: Balanced Performance + Real Data
// Critical-First strategy: Essential data loads immediately, rest progressively


// 🎯 Critical Path Hero - Real data + instant rendering
const CriticalHero = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { popularCelebrities, isLoading } = useCriticalHomeData()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 min-h-[80vh] flex items-center justify-center overflow-hidden pt-12 md:pt-16">
      {/* Optimized background - CSS only */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-6 text-center z-10">
        {/* Instant heading */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-center">
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                推し活
              </span>
              <span className="text-gray-800">コレクション</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-2">
            みんなで作る推し活辞典
          </p>
          <p className="text-base text-gray-600">
            聖地巡礼・私服特定をもっとリッチに
          </p>
        </div>

        {/* Critical search */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <input
              type="text"
              placeholder="推しの名前、番組名、アイテムなどを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-8 py-5 text-lg bg-white/95 backdrop-blur-sm border-2 border-rose-200/50 rounded-2xl shadow-2xl focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all duration-300 group-hover:shadow-3xl"
            />
            <button
              type="submit"
              className="absolute right-3 top-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white p-3 rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Popular Celebrities Highlight */}
        {popularCelebrities.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <TrendingUp className="h-6 w-6 text-rose-500 mr-2" />
              <h2 className="text-xl font-bold text-gray-800">人気の推し</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {popularCelebrities.map((celeb, index) => (
                <div 
                  key={celeb.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50 cursor-pointer text-center"
                  onClick={() => navigate(`/celebrities/${celeb.slug}`)}
                >
                  <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                    {celeb.image_url ? (
                      <img
                        src={celeb.image_url}
                        alt={celeb.name}
                        className="w-full h-full object-cover"
                        loading={index < 2 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-500" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-gray-800 mb-1">{celeb.name}</h3>
                  {celeb.group_name && (
                    <p className="text-xs text-gray-600">{celeb.group_name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}


// 🔄 Progressive Enhancement Sections
const ProgressiveContent = () => {
  const { recentEpisodes, featuredLocations, isLoading } = useProgressiveHomeData()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="space-y-16 py-16">
        {[1, 2].map((i) => (
          <section key={i} className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded-lg w-64 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="bg-white rounded-2xl h-64 shadow-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-16 py-16">
      {/* Recent Episodes */}
      {recentEpisodes.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-rose-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <Play className="h-8 w-8 text-rose-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">最新エピソード</h2>
              </div>
              <p className="text-lg text-gray-600">話題の動画・番組をチェック</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {recentEpisodes.slice(0, 4).map((episode) => (
                <div key={episode.id} className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="relative aspect-video bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center overflow-hidden">
                    {episode.thumbnail_url ? (
                      <img
                        src={episode.thumbnail_url}
                        alt={episode.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                        <Play className="h-12 w-12 text-rose-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{episode.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{episode.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <button
                onClick={() => navigate('/episodes')}
                className="bg-white/90 backdrop-blur-sm text-gray-800 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                すべて見る
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Locations */}
      {featuredLocations.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">注目スポット</h2>
              </div>
              <p className="text-lg text-gray-600">推しが訪れたカフェ・レストラン</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {featuredLocations.slice(0, 3).map((location) => (
                <div key={location.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                    {(location.image_url || location.image_urls?.[0]) ? (
                      <img
                        src={location.image_url || location.image_urls?.[0]}
                        alt={location.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <MapPin className="h-12 w-12 text-green-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{location.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                    {location.tags?.[0] || '飲食店'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <button
                onClick={() => navigate('/locations')}
                className="bg-white/90 backdrop-blur-sm text-gray-800 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                すべて見る
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// 🏠 Main Component
export default function HomeBalanced() {
  const navigate = useNavigate()
  
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    try {
      const searchPath = getSearchPath(searchQuery.trim())
      navigate(searchPath)
    } catch (error) {
      console.error('Search error:', error)
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  const homeSEO = generateSEO.home()
  const websiteStructuredData = generateStructuredData.website()

  return (
    <div className="bg-white">
      <MetaTags 
        title={homeSEO.title}
        description={homeSEO.description}
        keywords={homeSEO.keywords}
        canonicalUrl="https://collection.oshikatsu-guide.com/"
        ogUrl="https://collection.oshikatsu-guide.com/"
      />
      
      <StructuredData data={websiteStructuredData} />
      
      {/* 🚀 Critical path: Real data + instant rendering */}
      <CriticalHero onSearch={handleSearch} />

      {/* 📱 Progressive enhancement: Load after critical content */}
      <Suspense fallback={
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-2xl h-64"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <ProgressiveContent />
      </Suspense>
    </div>
  )
}