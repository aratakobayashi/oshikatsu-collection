import React, { useState, useEffect } from 'react'
import { Search, Calendar, Users, Play, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../lib/supabase'

interface EpisodeWithDetails {
  id: string
  title: string
  date: string
  thumbnail_url?: string
  celebrity_id: string
  celebrities?: {
    id: string
    name: string
    slug: string
  }
  episode_locations?: Array<{
    locations: {
      id: string
      name: string
    }
  }>
  locations_count?: number
}

interface Celebrity {
  id: string
  name: string
  slug: string
}

export function EpisodeSearchV2() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCelebrity, setActiveCelebrity] = useState<string>('all')
  const [results, setResults] = useState<EpisodeWithDetails[]>([])
  const [popularEpisodes, setPopularEpisodes] = useState<EpisodeWithDetails[]>([])
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // 初期データ取得
  useEffect(() => {
    const initLoad = async () => {
      setInitialLoading(true)
      try {
        console.log('🔍 Fetching all episodes with celebrity info')
        const episodes = await db.episodes.getAll()
        console.log('📊 Total episodes loaded:', episodes.length)
        
        console.log('🔍 Fetching all celebrities')
        const celebs = await db.celebrities.getAll()
        console.log('👥 Total celebrities loaded:', celebs.length)

        setPopularEpisodes(episodes.slice(0, 100))
        setCelebrities(celebs)
        setResults(episodes.slice(0, 20)) // 初期表示は最新20件
      } catch (error) {
        console.error('❌ Error loading episodes:', error)
      } finally {
        setInitialLoading(false)
      }
    }
    initLoad()
  }, [])

  // 検索実行
  const performSearch = async (query: string, celebrity: string) => {
    if (!query.trim() && celebrity === 'all') {
      setResults(popularEpisodes.slice(0, 20))
      return
    }

    setLoading(true)
    try {
      let filteredEpisodes = popularEpisodes

      // セレブリティフィルタ
      if (celebrity !== 'all') {
        filteredEpisodes = filteredEpisodes.filter(episode => 
          episode.celebrities?.slug === celebrity
        )
      }

      // テキスト検索
      if (query.trim()) {
        filteredEpisodes = filteredEpisodes.filter(episode =>
          episode.title.toLowerCase().includes(query.toLowerCase()) ||
          episode.celebrities?.name.toLowerCase().includes(query.toLowerCase())
        )
      }

      setResults(filteredEpisodes.slice(0, 50))
    } catch (error) {
      console.error('❌ Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 検索クエリ変更時
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, activeCelebrity)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeCelebrity, popularEpisodes])

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">エピソードを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📺 エピソード検索
          </h1>
          <p className="text-gray-600 text-lg">
            {popularEpisodes.length}話のエピソードから検索
          </p>
        </div>

        {/* 検索バー */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="エピソード名、セレブリティ名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={activeCelebrity}
              onChange={(e) => setActiveCelebrity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">すべてのセレブリティ</option>
              {celebrities.map(celeb => (
                <option key={celeb.id} value={celeb.slug}>
                  {celeb.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 検索結果 */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
              <p className="text-gray-600">検索中...</p>
            </div>
          )}

          {results.map(episode => (
            <div key={episode.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* エピソード情報 */}
                <div className="flex-1">
                  <Link 
                    to={`/episodes/${episode.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors"
                  >
                    {episode.title}
                  </Link>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {episode.celebrities && (
                      <Link
                        to={`/celebrities/${episode.celebrities.slug}`}
                        className="flex items-center gap-1 hover:text-pink-600"
                      >
                        <Users className="h-4 w-4" />
                        {episode.celebrities.name}
                      </Link>
                    )}
                    
                    {episode.date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(episode.date).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                  </div>
                </div>

                {/* アクション */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/episodes/${episode.id}`}
                    className="flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-sm hover:bg-pink-100"
                  >
                    <Play className="h-4 w-4" />
                    詳細
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {results.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                エピソードが見つかりませんでした
              </h3>
              <p className="text-gray-600">
                別のキーワードで検索してみてください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EpisodeSearchV2