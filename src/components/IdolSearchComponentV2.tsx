import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Users, User, Youtube, Sparkles, Heart, Play, Star, Film, ExternalLink } from 'lucide-react'
import { db } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { debounce } from 'lodash'

interface Celebrity {
  id: string
  name: string
  slug: string
  type: 'individual' | 'group' | 'youtube_channel'
  // 複数タイプ対応のため、セカンダリタイプを追加
  secondary_types?: ('individual' | 'group' | 'youtube_channel')[]
  agency?: string
  image_url?: string
  subscriber_count?: number
  fandom_name?: string
  official_color?: string
}

interface SearchResult {
  id: string
  name: string
  group: string
  image_url: string
  profile_url: string
  category: string
  subscribers?: string
}

const getTypeBadges = (celebrity: any) => {
  return [{ type: celebrity.type, label: celebrity.type, color: 'bg-blue-500 text-white' }]
}

const IdolSearchComponentV2: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', name: '全て', icon: Users },
    { id: 'youtube', name: 'YouTuber', icon: Play },
    { id: 'idol', name: 'アイドル', icon: Star },
    { id: 'actor', name: '俳優・女優', icon: Film }
  ]

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      // 高度な検索APIを呼び出す（仮実装）
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // カテゴリーフィルタリングを含むダミーデータ
      const allResults: SearchResult[] = [
        {
          id: '1',
          name: '架空のYouTuber',
          group: 'YouTube Creator',
          image_url: '/placeholder-celebrity.jpg',
          profile_url: '#',
          category: 'youtube',
          subscribers: '100万'
        },
        {
          id: '2', 
          name: '架空のアイドル',
          group: 'Test Idol Group',
          image_url: '/placeholder-celebrity.jpg',
          profile_url: '#',
          category: 'idol',
          subscribers: '50万'
        }
      ]
      
      const filteredResults = selectedCategory === 'all' 
        ? allResults 
        : allResults.filter(result => result.category === selectedCategory)
      
      setResults(filteredResults)
    } catch (error) {
      console.error('Advanced search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">タレント・推し検索 V2</h2>
          <p className="text-gray-600">お気に入りの推しを見つけよう</p>
        </div>
        
        {/* カテゴリー選択 */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {categories.map(category => {
            const IconComponent = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {category.name}
              </button>
            )
          })}
        </div>

        {/* 検索バー */}
        <div className="flex gap-3 mb-8 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="名前、グループ名で検索..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                検索中...
              </div>
            ) : (
              '検索'
            )}
          </button>
        </div>

        {/* 検索結果 */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(result => (
              <div key={result.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={result.image_url}
                    alt={result.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-celebrity.jpg'
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{result.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{result.group}</p>
                    {result.subscribers && (
                      <p className="text-xs text-blue-600 font-medium">フォロワー: {result.subscribers}</p>
                    )}
                  </div>
                </div>
                <a
                  href={result.profile_url}
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-sm font-medium shadow-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  詳細を見る
                </a>
              </div>
            ))}
          </div>
        )}

        {/* 検索結果なし */}
        {results.length === 0 && !loading && searchTerm && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">検索結果が見つかりませんでした</p>
            <p className="text-gray-400 text-sm mt-1">別のキーワードで検索してみてください</p>
          </div>
        )}

        {/* 検索前のプレースホルダー */}
        {results.length === 0 && !loading && !searchTerm && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-gray-600 text-lg">お気に入りの推しを検索してみよう</p>
            <p className="text-gray-500 text-sm mt-1">名前やグループ名を入力してください</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Celebrity Card Component
const CelebrityCard = ({ celebrity }: { celebrity: any }) => (
  <Link to={`/celebrities/${celebrity.slug}`} className="block">
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {/* 画像エリア */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50">
          {celebrity.image_url ? (
            <img
              src={celebrity.image_url}
              alt={celebrity.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-300">
                {celebrity.type === 'group' ? <Users size={48} /> :
                 celebrity.type === 'youtube_channel' ? <Youtube size={48} /> :
                 <User size={48} />}
              </div>
            </div>
          )}
          
          {/* 複数タイプバッジ（右上） */}
          <div className="absolute top-2 right-2 flex flex-col space-y-1">
            {getTypeBadges(celebrity).map((badge, index) => (
              <span key={badge.type} className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${badge.color}`}>
                {badge.label}
              </span>
            ))}
          </div>

        </div>

        {/* 情報エリア（シンプル化） */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-rose-500 transition-colors">
            {celebrity.name}
          </h3>
          
          {/* 最重要情報のみ表示 */}
          <div className="space-y-1">
            {celebrity.agency && (
              <p className="text-sm text-gray-600 truncate">{celebrity.agency}</p>
            )}
            
            {celebrity.fandom_name && (
              <p className="text-sm text-rose-500 flex items-center">
                <Heart size={14} className="mr-1" />
                {celebrity.fandom_name}
              </p>
            )}
          </div>
        </div>
    </div>
  </Link>
)

export default IdolSearchComponentV2
