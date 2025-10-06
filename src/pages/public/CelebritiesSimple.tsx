import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Users, Star, Heart } from 'lucide-react'
import { useAllCelebrities, useSearchCelebrities } from '../../hooks/useOptimizedFetch'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'

// 🌟 Simplified Celebrities List - All celebrities displayed at once
// No pagination, no virtual scrolling - perfect for small datasets

interface Celebrity {
  id: string
  name: string
  slug: string
  bio?: string
  image_url?: string
  view_count: number
  group_name?: string
  type: string
}

// 🎯 Simple Celebrity Card
const CelebCard = ({ celebrity }: { celebrity: Celebrity }) => {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'group': return <Users className="h-4 w-4" />
      case 'youtube_channel': return <Star className="h-4 w-4" />
      default: return <Heart className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'group': return 'グループ'
      case 'youtube_channel': return 'YouTuber'
      case 'individual': return '個人'
      default: return 'セレブリティ'
    }
  }

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 group"
      onClick={() => navigate(`/celebrities/${celebrity.slug}`)}
    >
      {/* 画像セクション */}
      <div className="aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-pink-50 to-purple-50">
        {celebrity.image_url && !imageError ? (
          <img
            src={celebrity.image_url}
            alt={celebrity.name}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="h-16 w-16 text-gray-300" />
          </div>
        )}
      </div>

      {/* コンテンツセクション */}
      <div className="p-6">
        {/* タイトル */}
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {celebrity.name}
        </h3>

        {/* グループ名 */}
        {celebrity.group_name && (
          <p className="text-sm text-purple-600 font-medium mb-2">
            {celebrity.group_name}
          </p>
        )}

        {/* 説明 */}
        {celebrity.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {celebrity.bio}
          </p>
        )}

        {/* フッター */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-purple-600">
            {getTypeIcon(celebrity.type)}
            <span className="text-xs font-medium">
              {getTypeLabel(celebrity.type)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 🔍 Search Header Component
const SearchHeader = ({ searchQuery, setSearchQuery, totalCount }: {
  searchQuery: string
  setSearchQuery: (query: string) => void
  totalCount: number
}) => (
  <div className="mb-8">
    {/* 検索バー */}
    <div className="relative max-w-2xl mx-auto mb-6">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        placeholder="セレブリティを検索..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 text-lg"
      />
    </div>

    {/* 統計表示 */}
    <div className="text-center text-gray-600">
      <p className="text-lg">
        {searchQuery ? (
          `"${searchQuery}" の検索結果`
        ) : (
          `全 ${totalCount} 名のセレブリティ`
        )}
      </p>
    </div>
  </div>
)

export default function CelebritiesSimple() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  // データ取得
  const { data: allCelebrities = [], loading: allLoading } = useAllCelebrities()
  const { data: searchResults = [] } = useSearchCelebrities(searchQuery, 50)

  // グループ一覧を抽出（重複なし、ソート済み）
  const availableGroups = React.useMemo(() => {
    const groups = [...new Set(
      (allCelebrities || [])
        .map(c => c.group_name)
        .filter((g): g is string => !!g && g.trim() !== '')
    )].sort()
    return groups
  }, [allCelebrities])

  // URL パラメータの同期
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ q: searchQuery })
    } else {
      setSearchParams({})
    }
  }, [searchQuery, setSearchParams])

  // フィルタリング処理
  const displayData = React.useMemo(() => {
    let data = searchQuery ? (searchResults || []) : (allCelebrities || [])

    // グループフィルター適用
    if (selectedGroup !== 'all') {
      data = data.filter(c => c.group_name === selectedGroup)
    }

    return data
  }, [searchQuery, searchResults, allCelebrities, selectedGroup])

  const isLoading = allLoading

  // SEO データ
  const totalCount = (allCelebrities || []).length
  const seoData = generateSEO.celebrities(totalCount)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">セレブリティを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <MetaTags 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl="https://collection.oshikatsu-guide.com/celebrities"
        ogUrl="https://collection.oshikatsu-guide.com/celebrities"
      />

      <div className="container mx-auto px-6 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              セレブリティ
            </span>
            一覧
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            推し活の中心となるセレブリティたちを一覧で表示
          </p>
        </div>

        {/* 検索セクション */}
        <SearchHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalCount={totalCount}
        />

        {/* グループフィルター（横スクロール可能） */}
        {availableGroups.length > 0 && (
          <div className="mb-8 -mx-6 px-6 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 pb-2 min-w-max">
              {/* 全て表示ボタン */}
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedGroup === 'all'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                全て
              </button>

              {/* グループボタン */}
              {availableGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedGroup === group
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 結果表示 */}
        {(displayData || []).length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? '検索結果が見つかりませんでした' : 'セレブリティがいません'}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? '別のキーワードで検索してみてください' : '後で再度確認してください'}
            </p>
          </div>
        ) : (
          <>
            {/* セレブリティグリッド */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {(displayData || []).map((celebrity) => (
                <CelebCard 
                  key={celebrity.id} 
                  celebrity={celebrity}
                />
              ))}
            </div>

            {/* フッター統計 */}
            <div className="text-center mt-12 text-gray-500">
              <p>
                {(displayData || []).length} 件を表示中
                {searchQuery && ` (全 ${totalCount} 件中)`}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}