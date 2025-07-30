import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, Heart, Sparkles, Star, Users, Package, MapPin } from 'lucide-react'

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
      animationDuration: '3s',
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 80 + 10}%`
    }}
  >
    <Icon />
  </div>
)

// キラキラエフェクト
const SparkleEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
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
  const [currentFeature, setCurrentFeature] = useState(0)
  
  const features = [
    { icon: Package, text: "推しの愛用アイテムを発見", color: "text-rose-500" },
    { icon: MapPin, text: "聖地巡礼スポットを探索", color: "text-blue-500" },
    { icon: Users, text: "ファン同士で情報共有", color: "text-purple-500" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden">
      {/* Background Effects */}
      <SparkleEffect />
      
      {/* Floating Icons */}
      <FloatingIcon icon={Heart} delay={0} size="h-8 w-8" />
      <FloatingIcon icon={Star} delay={1000} size="h-6 w-6" />
      <FloatingIcon icon={Sparkles} delay={2000} size="h-7 w-7" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Main Headline with Animation */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              推し活を
              <span className="relative inline-block mx-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 animate-pulse">
                  もっと
                </span>
                <div className="absolute -top-4 -right-4">
                  <Heart className="h-8 w-8 text-red-400 animate-bounce" fill="currentColor" />
                </div>
              </span>
              楽しく
            </h1>
            
            {/* Dynamic Feature Display */}
            <div className="h-16 flex items-center justify-center mb-8">
              <div className="relative">
                {features.map((feature, index) => (
                  <div
                    key={index} 
                    className={`flex items-center space-x-3 text-xl md:text-2xl font-medium transition-all duration-500 ${
                      index === currentFeature 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95 absolute inset-0'
                    }`}
                  >
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative group">
              <div className="relative">
                <input
                  type="text"
                  placeholder="推し名・ブランド・場所で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                  className="w-full px-8 py-6 text-xl border-3 border-gray-200 rounded-3xl focus:border-rose-400 focus:outline-none shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white/90 backdrop-blur-sm group-hover:bg-white"
                />
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                  <Search className="h-7 w-7 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                </div>
                <button 
                  onClick={handleSearch}
                  className="absolute right-3 top-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  disabled={!searchQuery.trim()}
                >
                  <ArrowRight className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Popular Searches */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <span className="text-sm text-gray-500">人気検索:</span>
              {['二宮和也', 'GUCCI', '代官山カフェ', 'Nike'].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-4 py-2 bg-white/70 backdrop-blur-sm text-rose-600 text-sm rounded-full border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            {[
              { number: "1,000+", label: "推しアイテム", icon: Package, color: "from-rose-500 to-pink-500" },
              { number: "500+", label: "聖地スポット", icon: MapPin, color: "from-blue-500 to-purple-500" },
              { number: "10,000+", label: "ファン", icon: Users, color: "from-purple-500 to-indigo-500" }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/50">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/celebrities">
              <button className="group bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center justify-center space-x-2">
                  <Users className="h-6 w-6 group-hover:animate-bounce" />
                  <span>推し一覧を見る</span>
                </span>
              </button>
            </Link>
            
            <Link to="/posts">
              <button className="group border-3 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 px-12 py-4 rounded-full text-lg font-semibold bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center justify-center space-x-2">
                  <Search className="h-6 w-6 group-hover:animate-pulse" />
                  <span>みんなの質問を見る</span>
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-20 text-white">
          <path
            fill="currentColor"
            d="M0,32L48,42.7C96,53,192,75,288,74.7C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </section>
  )
}

export default HeroSection