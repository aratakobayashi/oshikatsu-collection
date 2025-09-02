import React, { useEffect, useState, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Play, MapPin, Package, Heart, Search, Star, Sparkles, TrendingUp } from 'lucide-react'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import { StructuredData, generateStructuredData } from '../../components/SEO/StructuredData'
import { getSearchPath } from '../../utils/searchHelper'
import { useCriticalHomeData, useProgressiveHomeData } from '../../hooks/useOptimizedFetch'

// 🚀 Phase 4: Balanced Performance + Real Data
// Critical-First strategy: Essential data loads immediately, rest progressively

interface CelebCardProps {
  celeb: {
    id: string
    name: string
    slug: string
    description?: string
    image_url?: string
    tags?: string[]
  }
  priority?: 'high' | 'low'
}

// 🎯 Critical Path Hero - Real data + instant rendering
const CriticalHero = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { popularCelebrities, siteStats, isLoading } = useCriticalHomeData()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Optimized background - CSS only */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-6 text-center z-10">
        {/* Instant heading */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <Heart className="h-10 w-10 text-rose-500 mr-4 animate-pulse" fill="currentColor" />
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
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

        {/* Real-time stats with counter animation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: "推し", count: siteStats.celebrities, icon: Users, color: "from-purple-500 to-indigo-500" },
            { label: "動画", count: siteStats.episodes, icon: Play, color: "from-rose-500 to-pink-500" },
            { label: "スポット", count: siteStats.locations, icon: MapPin, color: "from-green-500 to-emerald-500" },
            { label: "アイテム", count: siteStats.items, icon: Package, color: "from-orange-500 to-amber-500" }
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} p-3 mx-auto mb-3 shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                <AnimatedCounter target={stat.count} />+
              </div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Critical celebrities preview */}
        {popularCelebrities.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-center mb-6">
              <TrendingUp className="h-6 w-6 text-rose-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-800">人気の推し</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {popularCelebrities.map((celeb, index) => (
                <CelebCard key={celeb.id} celeb={celeb} priority={index < 2 ? 'high' : 'low'} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// 🎨 Optimized Celebrity Card
const CelebCard = ({ celeb, priority = 'low' }: CelebCardProps) => {
  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div 
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50 cursor-pointer"
      onClick={() => navigate(`/celebrities/${celeb.slug}`)}
    >
      <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
        {celeb.image_url ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <img
              src={celeb.image_url}
              alt={celeb.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
              }`}
              loading={priority === 'high' ? 'eager' : 'lazy'}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        )}
      </div>
      <h3 className="font-bold text-lg text-gray-800 mb-2 text-center">{celeb.name}</h3>
      {celeb.description && (
        <p className="text-sm text-gray-600 text-center line-clamp-2 mb-3">
          {celeb.description}
        </p>
      )}
      {celeb.tags && celeb.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {celeb.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-rose-100 text-rose-600 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// 📊 Animated Counter Component
const AnimatedCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) return

    const duration = 1500 // 1.5 seconds
    const steps = 60
    const increment = target / steps
    const stepDuration = duration / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [target])

  return <>{count}</>
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
                  <div className="aspect-video bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                    <Play className="h-12 w-12 text-rose-400" />
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
                  <div className="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mb-4 flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-green-400" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{location.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                    {location.category || '飲食店'}
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