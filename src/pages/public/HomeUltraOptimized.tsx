import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Play, MapPin, Package, Heart, Search, Star, Sparkles } from 'lucide-react'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import { StructuredData, generateStructuredData } from '../../components/SEO/StructuredData'
import { getSearchPath, detectSearchType } from '../../utils/searchHelper'

// 🎯 Ultra-lightweight critical path components only
// No external data fetching on initial render!

interface QuickStats {
  celebrities: number
  episodes: number  
  locations: number
  items: number
}

const STATIC_STATS: QuickStats = {
  celebrities: 25,
  episodes: 600,
  locations: 150, 
  items: 300
}

// 🏠 Critical path hero - renders immediately
const InstantHero = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Optimized background - CSS only, no images */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-6 text-center z-10">
        {/* Instant heading - no external dependencies */}
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

        {/* Instant search - critical functionality */}
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

        {/* Static stats - no API calls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: "推し", count: `${STATIC_STATS.celebrities}+`, icon: Users, color: "from-purple-500 to-indigo-500" },
            { label: "動画", count: `${STATIC_STATS.episodes}+`, icon: Play, color: "from-rose-500 to-pink-500" },
            { label: "スポット", count: `${STATIC_STATS.locations}+`, icon: MapPin, color: "from-green-500 to-emerald-500" },
            { label: "アイテム", count: `${STATIC_STATS.items}+`, icon: Package, color: "from-orange-500 to-amber-500" }
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} p-3 mx-auto mb-3 shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{stat.count}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 🎨 Minimal preview cards - no images, CSS only
const MinimalPreviewSection = ({ title, subtitle, icon: Icon, gradient, linkTo, count }: {
  title: string
  subtitle: string
  icon: any
  gradient: string
  linkTo: string
  count: number
}) => {
  const navigate = useNavigate()

  return (
    <section className={`py-16 bg-gradient-to-br ${gradient}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-gray-700 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          </div>
          <p className="text-lg text-gray-600 mb-4">{subtitle}</p>
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <Sparkles className="h-4 w-4 text-yellow-500 mr-2" />
            <span className="text-sm font-semibold text-gray-700">{count}+ アイテムをチェック</span>
          </div>
        </div>
        
        {/* Placeholder cards - no data loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50">
              <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center">
                <Icon className="h-12 w-12 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <button
            onClick={() => navigate(linkTo)}
            className="bg-white/90 backdrop-blur-sm text-gray-800 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50"
          >
            すべて見る ({count}+)
          </button>
        </div>
      </div>
    </section>
  )
}

// 🚀 Main component - ultra fast loading
export default function HomeUltraOptimized() {
  const navigate = useNavigate()
  
  // 🎯 No data fetching on mount - instant render
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
  
  // Scroll to top immediately  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // SEO data (static)
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
      
      {/* 🚀 Critical path: Instant hero */}
      <InstantHero onSearch={handleSearch} />

      {/* 📱 Minimal preview sections - no API calls */}
      <MinimalPreviewSection
        title="人気のタレント・推し"
        subtitle="よにのちゃんねる、SixTONES、Snow Man..."
        icon={Users}
        gradient="from-purple-50 to-indigo-50"
        linkTo="/celebrities"
        count={STATIC_STATS.celebrities}
      />

      <MinimalPreviewSection
        title="話題のエピソード"
        subtitle="最新の動画・番組をチェック"
        icon={Play}
        gradient="from-rose-50 to-pink-50"
        linkTo="/episodes"
        count={STATIC_STATS.episodes}
      />

      <MinimalPreviewSection
        title="聖地巡礼スポット"
        subtitle="推しが訪れたカフェ・レストラン"
        icon={MapPin}
        gradient="from-green-50 to-emerald-50"
        linkTo="/locations"
        count={STATIC_STATS.locations}
      />

      <MinimalPreviewSection
        title="推しアイテム"
        subtitle="愛用コスメ・ファッション・グッズ"
        icon={Package}
        gradient="from-orange-50 to-amber-50"
        linkTo="/items"
        count={STATIC_STATS.items}
      />

      {/* 🛠️ Development sections load after everything else */}
      {import.meta.env.DEV && (
        <div className="bg-yellow-50 py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4">
              <h3 className="text-yellow-800 font-semibold mb-2">🚧 開発用セクション</h3>
              <p className="text-yellow-700 text-sm">
                開発用コンポーネントは遅延読み込みされます。本番環境では非表示です。
              </p>
              <button 
                onClick={() => {
                  // Lazy load dev components only when needed
                  import('../../components/DevDataCreator').then(({ default: DevDataCreator }) => {
                    // Mount dev components dynamically
                  })
                }}
                className="mt-3 bg-yellow-200 hover:bg-yellow-300 px-4 py-2 rounded-lg text-yellow-800 text-sm"
              >
                開発ツールを読み込む
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}