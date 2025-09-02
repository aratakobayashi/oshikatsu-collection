import React, { useEffect, lazy, Suspense, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Play, MapPin, Package, Heart, Search } from 'lucide-react'
import { optimizedQueries } from '../../hooks/useOptimizedFetch'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import { StructuredData, generateStructuredData } from '../../components/SEO/StructuredData'
import { getSearchPath, detectSearchType } from '../../utils/searchHelper'

// 🚀 Dynamic imports for heavy components
const HeroSection = lazy(() => import('../../components/HeroSection'))
const SectionCarousel = lazy(() => import('../../components/SectionCarousel'))

// 💡 Development components are only loaded in dev environment
const DevDataCreator = lazy(() => import('../../components/DevDataCreator'))
const DataStatusCheck = lazy(() => import('../../components/DataStatusCheck'))
const UserJourneyTest = lazy(() => import('../../components/UserJourneyTest'))
const WikipediaAPITest = lazy(() => import('../../components/WikipediaAPITest'))

// 🎨 Loading component for suspense fallbacks
const SectionLoading = ({ className = "" }: { className?: string }) => (
  <section className={`py-16 ${className}`}>
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-64 mb-4"></div>
        <div className="h-4 bg-gray-100 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-64"></div>
          ))}
        </div>
      </div>
    </div>
  </section>
)

// 🏠 Lightweight Hero component for critical path
const LightweightHero = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-rose-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-6 text-center z-10">
        {/* Main heading */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-rose-500 mr-3" fill="currentColor" />
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                推し活
              </span>
              <span className="text-gray-800">コレクション</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
            みんなで作る推し活辞典
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="推しの名前、番組名、アイテムなどを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 text-lg bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-2xl shadow-xl focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white p-3 rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: "推し", count: "20+", icon: Users },
            { label: "動画", count: "500+", icon: Play },
            { label: "スポット", count: "100+", icon: MapPin },
            { label: "アイテム", count: "200+", icon: Package }
          ].map((stat, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <stat.icon className="h-6 w-6 text-rose-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{stat.count}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomeOptimized() {
  const navigate = useNavigate()
  
  // 🚀 Optimized data fetching - only fetch essential data initially
  const { data: featuredCelebrities = [], loading: celebritiesLoading } = optimizedQueries.celebrities({ 
    limit: 8,
    ttl: 300000 
  })
  
  // 💡 Memoize heavy search handler
  const handleSearch = useMemo(() => 
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return
      
      try {
        const searchPath = getSearchPath(searchQuery.trim())
        const searchType = detectSearchType(searchQuery.trim())
        
        if (import.meta.env.DEV) {
          console.log('🔍 Smart Search:', {
            query: searchQuery,
            type: searchType,
            path: searchPath
          })
        }
        
        navigate(searchPath)
      } catch (error) {
        console.error('Search error:', error)
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      }
    }, [navigate]
  )
  
  // 🎯 Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // 📊 SEO data (memoized)
  const homeSEO = useMemo(() => generateSEO.home(), [])
  const websiteStructuredData = useMemo(() => generateStructuredData.website(), [])

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
      
      {/* 🚀 Critical path: Lightweight Hero loads immediately */}
      <LightweightHero onSearch={handleSearch} />

      {/* 💫 Progressive loading of sections with suspense */}
      
      {/* Load celebrities section first (most important) */}
      <Suspense fallback={<SectionLoading className="bg-purple-50" />}>
        <SectionCarousel
          title="人気のタレント・推し"
          subtitle="よにのちゃんねる、SixTONES、Snow Man..."
          icon={Users}
          color="text-purple-600"
          bgGradient="from-purple-50 to-indigo-50"
          items={featuredCelebrities}
          type="celebrity"
          linkPath="/celebrities"
        />
      </Suspense>

      {/* Load other sections progressively */}
      <Suspense fallback={<SectionLoading className="bg-rose-50" />}>
        <LazyEpisodesSection />
      </Suspense>

      <Suspense fallback={<SectionLoading className="bg-green-50" />}>
        <LazyLocationsSection />
      </Suspense>

      <Suspense fallback={<SectionLoading className="bg-orange-50" />}>
        <LazyItemsSection />
      </Suspense>

      {/* 🛠️ Development sections (only in dev) */}
      {import.meta.env.DEV && (
        <>
          <Suspense fallback={<div className="py-8 bg-gray-50 animate-pulse" />}>
            <section className="py-8 bg-gray-50">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <DataStatusCheck />
                <DevDataCreator />
                <div className="mt-8">
                  <UserJourneyTest />
                </div>
              </div>
            </section>
          </Suspense>

          <Suspense fallback={<div className="py-20 bg-yellow-50 animate-pulse" />}>
            <section className="py-20 bg-yellow-50">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mb-8">
                  <h3 className="text-yellow-800 font-semibold mb-2">🚧 開発用セクション</h3>
                  <p className="text-yellow-700 text-sm">
                    Wikipedia APIのテスト用コンポーネントです。データ収集が完了したら削除予定です。
                  </p>
                </div>
                <WikipediaAPITest />
              </div>
            </section>
          </Suspense>
        </>
      )}
    </div>
  )
}

// 🔄 Lazy-loaded section components
const LazyEpisodesSection = () => {
  const { data: episodes = [] } = optimizedQueries.episodes({ limit: 8, ttl: 60000 })
  
  return (
    <SectionCarousel
      title="話題のエピソード"
      subtitle="最新の動画・番組をチェック"
      icon={Play}
      color="text-rose-600"
      bgGradient="from-rose-50 to-pink-50"
      items={episodes}
      type="episode"
      linkPath="/episodes"
    />
  )
}

const LazyLocationsSection = () => {
  const { data: locations = [] } = optimizedQueries.locations({ limit: 8, ttl: 300000 })
  
  return (
    <SectionCarousel
      title="聖地巡礼スポット"
      subtitle="推しが訪れたカフェ・レストラン"
      icon={MapPin}
      color="text-green-600"
      bgGradient="from-green-50 to-emerald-50"
      items={locations}
      type="location"
      linkPath="/locations"
    />
  )
}

const LazyItemsSection = () => {
  const { data: items = [] } = optimizedQueries.items({ limit: 8, ttl: 300000 })
  
  return (
    <SectionCarousel
      title="推しアイテム"
      subtitle="愛用コスメ・ファッション・グッズ"
      icon={Package}
      color="text-orange-600"
      bgGradient="from-orange-50 to-amber-50"
      items={items}
      type="item"
      linkPath="/items"
    />
  )
}