import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, Users, User, Youtube, Building2, Calendar, Heart } from 'lucide-react'
import { db } from '../lib/supabase'
import Card, { CardContent } from './ui/Card'
import Button from './ui/Button'
import { Link } from 'react-router-dom'

interface Celebrity {
  id: string
  name: string
  slug: string
  type: 'individual' | 'group' | 'youtube_channel'
  agency?: string
  debut_date?: string
  member_count?: number
  subscriber_count?: number
  status: string
  image_url?: string
  bio?: string
  fandom_name?: string
  official_color?: string
  parent_group?: {
    id: string
    name: string
    slug: string
    type: string
  }
  group_members?: Array<{
    celebrity: {
      id: string
      name: string
      slug: string
      image_url?: string
      type: string
    }
  }>
}

interface SearchFilters {
  type?: 'individual' | 'group' | 'youtube_channel' | ''
  agency?: string
  status?: string
}

const IdolSearchComponent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      // アイドル検索APIを呼び出す（仮実装）
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // ダミーデータ（実際は API から取得）
      const mockResults: SearchResult[] = [
        {
          id: '1',
          name: '架空のアイドル1',
          group: 'Test Group A',
          image_url: '/placeholder-celebrity.jpg',
          profile_url: '#'
        },
        {
          id: '2', 
          name: '架空のアイドル2',
          group: 'Test Group B',
          image_url: '/placeholder-celebrity.jpg',
          profile_url: '#'
        }
      ]
      
      setResults(mockResults)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">アイドル・タレント検索</h2>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="アイドル・タレント名を入力..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(result => (
              <div key={result.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <img
                    src={result.image_url}
                    alt={result.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-celebrity.jpg'
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{result.name}</h3>
                    <p className="text-sm text-gray-600">{result.group}</p>
                  </div>
                </div>
                <a
                  href={result.profile_url}
                  className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm"
                >
                  プロフィールを見る →
                </a>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            検索結果が見つかりませんでした
          </div>
        )}
      </div>
    </div>
  )
}>
      <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            {celebrity.image_url ? (
              <img
                src={celebrity.image_url}
                alt={celebrity.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                {getTypeIcon(celebrity.type)}
              </div>
            )}
            
            {/* タイプバッジ */}
            <div className="absolute top-2 left-2">
              <div className="flex items-center space-x-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                {getTypeIcon(celebrity.type)}
                <span>{getTypeLabel(celebrity.type)}</span>
              </div>
            </div>

            {/* 公式カラー */}
            {celebrity.official_color && (
              <div 
                className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: celebrity.official_color }}
              />
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-rose-600 transition-colors">
              {celebrity.name}
            </h3>
            
            {/* 事務所 */}
            {celebrity.agency && (
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Building2 className="h-3 w-3 mr-1" />
                <span>{celebrity.agency}</span>
              </div>
            )}
            
            {/* デビュー日 */}
            {celebrity.debut_date && (
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{new Date(celebrity.debut_date).getFullYear()}年デビュー</span>
              </div>
            )}
            
            {/* メンバー数 */}
            {celebrity.member_count && (
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Users className="h-3 w-3 mr-1" />
                <span>{celebrity.member_count}人組</span>
              </div>
            )}
            
            {/* 登録者数 */}
            {celebrity.subscriber_count && celebrity.subscriber_count > 0 && (
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Youtube className="h-3 w-3 mr-1" />
                <span>{formatSubscriberCount(celebrity.subscriber_count)} subscribers</span>
              </div>
            )}

            {/* ファンダム名 */}
            {celebrity.fandom_name && (
              <div className="flex items-center text-sm text-rose-600 mb-2">
                <Heart className="h-3 w-3 mr-1" />
                <span>{celebrity.fandom_name}</span>
              </div>
            )}
            
            {/* 所属グループ（個人の場合） */}
            {celebrity.type === 'individual' && celebrity.parent_group && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block mb-2">
                {celebrity.parent_group.name} メンバー
              </div>
            )}
            
            {/* グループメンバー（グループの場合） */}
            {celebrity.type === 'group' && celebrity.group_members && celebrity.group_members.length > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                <div className="flex flex-wrap gap-1">
                  {celebrity.group_members.slice(0, 3).map((member) => (
                    <span key={member.celebrity.id} className="bg-gray-100 px-2 py-1 rounded">
                      {member.celebrity.name}
                    </span>
                  ))}
                  {celebrity.group_members.length > 3 && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      他{celebrity.group_members.length - 3}名
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {celebrity.bio && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {celebrity.bio}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      {/* 検索ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          国内アイドル検索
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          アイドル・グループ・YouTubeチャンネルを統一検索
        </p>
        
        {/* 検索窓 */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="アイドル名、グループ名、チャンネル名、事務所名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-full focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        {/* クイックフィルター */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Button
            onClick={() => handleTypeFilter('group')}
            className={`${filters.type === 'group' ? 'bg-rose-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Users className="h-4 w-4 mr-2" />
            グループ
          </Button>
          <Button
            onClick={() => handleTypeFilter('individual')}
            className={`${filters.type === 'individual' ? 'bg-rose-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <User className="h-4 w-4 mr-2" />
            個人アイドル
          </Button>
          <Button
            onClick={() => handleTypeFilter('youtube_channel')}
            className={`${filters.type === 'youtube_channel' ? 'bg-rose-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Youtube className="h-4 w-4 mr-2" />
            YouTubeチャンネル
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            詳細フィルター
          </Button>
        </div>

        {/* 検索・クリアボタン */}
        <div className="flex justify-center gap-3 mb-6">
          <Button
            onClick={handleSearch}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 px-8"
          >
            検索する
          </Button>
          <Button
            onClick={clearFilters}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            クリア
          </Button>
        </div>
      </div>

      {/* 検索結果 */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">検索中...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            検索結果 ({results.length}件)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((celebrity) => (
              <CelebrityCard key={celebrity.id} celebrity={celebrity} />
            ))}
          </div>
        </div>
      )}

      {/* 人気アイドル・チャンネル */}
      {results.length === 0 && !loading && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            人気アイドル・チャンネル
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {popularCelebrities.map((celebrity) => (
              <CelebrityCard key={celebrity.id} celebrity={celebrity} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}