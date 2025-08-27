import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Users, User, Youtube, Sparkles, Heart } from 'lucide-react'
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

export default function IdolSearchComponentV2() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'group' | 'individual' | 'youtube_channel'>('all')
  const [results, setResults] = useState<Celebrity[]>([])
  const [popularCelebrities, setPopularCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // 初期表示：人気のタレント
  useEffect(() => {
    const initLoad = async () => {
      setInitialLoading(true)
      try {
        const data = await db.celebrities.getPopular(100)
        // 複数タイプのデモ用に一時的にデータを加工（本来はDBで管理）
        const enhancedData = data.map(celebrity => {
          // 例：SixTONES、Snow Man等はグループ＋YouTubeチャンネルとして扱う
          if (['SixTONES', 'Snow Man', 'なにわ男子'].includes(celebrity.name)) {
            return {
              ...celebrity,
              secondary_types: ['youtube_channel'] as ('individual' | 'group' | 'youtube_channel')[]
            }
          }
          // 例：二宮和也等はソロ＋YouTubeチャンネルとして扱う
          if (['二宮和也', '中丸雄一'].includes(celebrity.name)) {
            return {
              ...celebrity,
              type: 'individual' as const,
              secondary_types: ['youtube_channel'] as ('individual' | 'group' | 'youtube_channel')[]
            }
          }
          return celebrity
        })
        setPopularCelebrities(enhancedData)
        
        // URLパラメータから検索クエリを読み取り
        const searchFromUrl = searchParams.get('search')
        if (searchFromUrl) {
          setSearchQuery(searchFromUrl)
          performSearch(searchFromUrl, 'all')
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setInitialLoading(false)
      }
    }
    initLoad()
  }, [])

  // 検索実行（デバウンス付き）
  const performSearch = async (query: string, filter: string) => {
    if (!query.trim() && filter === 'all') {
      setResults([])
      return
    }

    setLoading(true)
    try {
      let data
      if (filter !== 'all' && filter !== 'youtube_channel') {
        data = await db.celebrities.getByType(filter as any)
      } else if (query.trim()) {
        data = await db.celebrities.unifiedSearch(query, filter !== 'all' ? { type: filter } : {})
      } else {
        data = popularCelebrities
      }
      
      // 検索結果にも同様のデータ加工を適用
      const enhancedResults = (data || []).map(celebrity => {
        if (['SixTONES', 'Snow Man', 'なにわ男子'].includes(celebrity.name)) {
          return {
            ...celebrity,
            secondary_types: ['youtube_channel'] as ('individual' | 'group' | 'youtube_channel')[]
          }
        }
        if (['二宮和也', '中丸雄一'].includes(celebrity.name)) {
          return {
            ...celebrity,
            type: 'individual' as const,
            secondary_types: ['youtube_channel'] as ('individual' | 'group' | 'youtube_channel')[]
          }
        }
        return celebrity
      })
      
      setResults(enhancedResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // デバウンスされた検索関数
  const debouncedSearch = useCallback(
    debounce((query: string, filter: string) => {
      performSearch(query, filter)
      // URLパラメータ更新
      if (query.trim()) {
        setSearchParams({ search: query })
      } else {
        setSearchParams({})
      }
    }, 300),
    []
  )

  // 検索入力の処理
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value, activeFilter)
  }

  // フィルター変更の処理
  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter)
    performSearch(searchQuery, filter)
  }

  // タイプラベル取得
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'group': return 'グループ'
      case 'individual': return 'ソロ'
      case 'youtube_channel': return 'YouTube'
      default: return ''
    }
  }

  // 複数タイプを持つセレブリティのすべてのタイプを取得
  const getAllTypes = (celebrity: Celebrity) => {
    const types = [celebrity.type]
    if (celebrity.secondary_types) {
      types.push(...celebrity.secondary_types)
    }
    return [...new Set(types)] // 重複削除
  }

  // 複数タイプのバッジを生成
  const getTypeBadges = (celebrity: Celebrity) => {
    const allTypes = getAllTypes(celebrity)
    return allTypes.map(type => ({
      type,
      label: getTypeLabel(type),
      color: type === 'group' ? 'bg-purple-500/90 text-white' :
             type === 'youtube_channel' ? 'bg-red-500/90 text-white' :
             'bg-blue-500/90 text-white'
    }))
  }


  // シンプル化されたカードコンポーネント
  const CelebrityCard = ({ celebrity }: { celebrity: Celebrity }) => (
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

  const displayData = searchQuery.trim() || activeFilter !== 'all' ? results : popularCelebrities

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* タイトル */}
          <div className="text-center mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              推し・タレント検索
            </h1>
          </div>

          {/* 統合検索バー */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="名前・グループ・事務所で検索..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border border-gray-200 rounded-full focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
              
              {/* インラインフィルター */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden md:flex items-center space-x-1">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'all' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => handleFilterChange('group')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'group' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  グループ
                </button>
                <button
                  onClick={() => handleFilterChange('individual')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'individual' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ソロ
                </button>
                <button
                  onClick={() => handleFilterChange('youtube_channel')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'youtube_channel' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  YouTube
                </button>
              </div>
            </div>

            {/* モバイル用フィルター */}
            <div className="md:hidden mt-3 flex justify-center space-x-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => handleFilterChange('group')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === 'group' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                グループ
              </button>
              <button
                onClick={() => handleFilterChange('individual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === 'individual' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ソロ
              </button>
              <button
                onClick={() => handleFilterChange('youtube_channel')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === 'youtube_channel' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                YouTube
              </button>
            </div>

            {/* 検索状態の表示 */}
            {(searchQuery.trim() || activeFilter !== 'all') && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  {loading ? '検索中...' : `${displayData.length}件の結果`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* セクションタイトル */}
        {!searchQuery.trim() && activeFilter === 'all' && (
          <div className="mb-6 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">人気のタレント・推し</h2>
          </div>
        )}

        {/* 結果グリッド */}
        {initialLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayData.map((celebrity) => (
              <CelebrityCard key={celebrity.id} celebrity={celebrity} />
            ))}
          </div>
        )}

        {/* 結果なし */}
        {!loading && !initialLoading && displayData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600">検索結果が見つかりませんでした</p>
            <p className="text-sm text-gray-500 mt-2">別のキーワードでお試しください</p>
          </div>
        )}
      </div>
    </div>
  )
}