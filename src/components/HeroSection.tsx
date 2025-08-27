import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, Heart, Sparkles, Star, Package, MapPin, Users, MessageCircle } from 'lucide-react'
import { getPopularSearches, detectSearchType, getSearchTypeLabel } from '../utils/searchHelper'

// アニメーション用のアイコンコンポーネント
const FloatingIcon = ({ icon: Icon, delay = 0, size = "h-6 w-6" }: { 
  icon: React.ElementType, 
  delay?: number, 
  size?: string 
}) => (
  <div 
    className={`absolute text-rose-300 opacity-70 animate-bounce ${size}`}
    style={{ 
      animationDelay: `${delay}ms`,
      animationDuration: '3s' 
    }}
  >
    <Icon />
  </div>
)

// キラキラエフェクト
const SparkleEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="absolute text-yellow-400 opacity-30 animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${i * 200}ms`,
          animationDuration: `${2 + Math.random() * 2}s`
        }}
      >
        <Sparkles className="h-4 w-4" />
      </div>
    ))}
  </div>
)

interface HeroSectionProps {
  onSearch: (query: string) => void
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
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
      {/* Background Effects */}
      <SparkleEffect />
      
      {/* Floating Icons */}
      <FloatingIcon icon={Heart} delay={0} size="h-8 w-8" />
      <FloatingIcon icon={Star} delay={1000} size="h-6 w-6" />
      <FloatingIcon icon={Sparkles} delay={2000} size="h-7 w-7" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-16 lg:pb-24 z-10">
        <div className="text-center">
          {/* Compact Main Headline */}
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
            
            {/* Inline Feature Subtitle */}
            <p className="text-base md:text-lg text-gray-600 mb-2">
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

          {/* 🔍 Enhanced Smart Search Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative group">
              <div className="relative">
                <input
                  type="text"
                  placeholder="推し・アイテム・場所を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                  onFocus={() => setShowSearchPreview(true)}
                  onBlur={() => setTimeout(() => setShowSearchPreview(false), 200)}
                  className="w-full pl-14 pr-16 py-5 md:py-6 text-base md:text-xl border-3 border-gray-200 rounded-3xl focus:border-rose-400 focus:outline-none shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white/95 backdrop-blur-sm group-hover:bg-white"
                />
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                  <Search className="h-6 w-6 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                </div>
                
                {/* リアルタイム検索タイプ表示 */}
                {searchQuery.length > 1 && (
                  <div className="absolute left-16 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getSearchTypeLabel(currentSearchType)}
                    </span>
                  </div>
                )}
                
                <button 
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white p-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  disabled={!searchQuery.trim()}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* 🔥 Dynamic Popular Searches */}
            <div className="mt-6 space-y-2">
              <div className="flex flex-wrap gap-2 justify-center items-center">
                <span className="text-sm text-gray-500 mr-2">人気:</span>
                {popularSearches.trending.map((term) => (
                  <button
                    key={term}
                    onClick={() => {setSearchQuery(term); onSearch(term);}}
                    className="px-3 py-1.5 bg-white/80 backdrop-blur-sm text-rose-600 text-sm rounded-full border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* 🎯 Quick Access Icons - Simplified */}
          <div className="flex justify-center gap-6 md:gap-8 max-w-2xl mx-auto relative z-20">
            <Link to="/celebrities" className="group flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 group-hover:rotate-3">
                <Users className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <span className="text-sm md:text-base font-semibold text-gray-700 mt-2 group-hover:text-purple-600 transition-colors">推し</span>
            </Link>
            
            <Link to="/items" className="group flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 group-hover:rotate-3">
                <Package className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <span className="text-sm md:text-base font-semibold text-gray-700 mt-2 group-hover:text-rose-600 transition-colors">アイテム</span>
            </Link>
            
            <Link to="/locations" className="group flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 group-hover:rotate-3">
                <MapPin className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <span className="text-sm md:text-base font-semibold text-gray-700 mt-2 group-hover:text-green-600 transition-colors">場所</span>
            </Link>
            
            <Link to="/posts" className="group flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 group-hover:rotate-3">
                <MessageCircle className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <span className="text-sm md:text-base font-semibold text-gray-700 mt-2 group-hover:text-blue-600 transition-colors">質問</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <svg viewBox="0 0 1440 120" className="w-full h-16 text-white">
          <path
            fill="currentColor"
            d="M0,32L48,42.7C96,53,192,75,288,74.7C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </section>
  )
}

export default HeroSection// Force rebuild 月  8 11 13:54:52 JST 2025
