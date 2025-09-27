import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, ArrowRight, Clock, Eye, Tag, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string
  published_at: string
  featured_image_url?: string
  category_id?: string
  content?: string
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

const ARTICLES_PER_PAGE = 9

// カテゴリー設定
const categoryConfig = {
  'beginner-oshi': {
    name: '推し活初心者',
    icon: '🌟',
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  'live-preparation': {
    name: 'ライブ準備',
    icon: '🎤',
    color: 'bg-pink-100 text-pink-800 border-pink-300'
  },
  'venue-guide': {
    name: '会場ガイド',
    icon: '🏢',
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  'idol-introduction': {
    name: 'アイドル紹介',
    icon: '💖',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  'live-report': {
    name: 'ライブレポート',
    icon: '📝',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  'saving-tips': {
    name: '節約術',
    icon: '💰',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }
}

// 読了時間を計算
function calculateReadingTime(content?: string): number {
  if (!content) return 1
  const wordsPerMinute = 200 // 日本語の平均読み速度
  const wordCount = content.length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

export default function ArticlesList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [totalArticles, setTotalArticles] = useState(0)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  const selectedCategory = searchParams.get('category')
  const currentPage = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    // カテゴリが読み込まれてから記事をフェッチ
    if (categories.length > 0 || !selectedCategory) {
      fetchArticles()
    }
  }, [selectedCategory, currentPage, categories, searchParams.get('search')])

  // 検索クエリの変更を監視
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''
    if (searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl)
    }
  }, [searchParams])

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('article_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('❌ Category Error:', error)
      } else {
        console.log('✅ カテゴリデータを設定:', data?.length, '件')
        setCategories(data || [])
      }
    } catch (error) {
      console.error('❌ Category fetch error:', error)
    }
  }

  async function fetchArticles() {
    console.log('🔥 fetchArticles関数が実行されました')
    try {
      setLoading(true)
      console.log('📡 Supabaseにリクエスト送信中...')
      console.log('🏷️ 選択されたカテゴリ:', selectedCategory)
      console.log('📄 現在のページ:', currentPage)
      console.log('🔍 検索クエリ:', searchParams.get('search'))

      let query = supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at, featured_image_url, category_id', { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      // 検索クエリフィルターを適用
      const searchTerm = searchParams.get('search')
      if (searchTerm && searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`)
        console.log('🎯 検索フィルター適用:', searchTerm)
      }

      // カテゴリフィルターを適用
      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory)
        if (category) {
          query = query.eq('category_id', category.id)
          console.log('🎯 カテゴリフィルター適用:', category.name)
        }
      }

      // ページネーション
      const from = (currentPage - 1) * ARTICLES_PER_PAGE
      const to = from + ARTICLES_PER_PAGE - 1
      query = query.range(from, to)
      console.log(`📊 ページネーション: ${from}-${to} (ページ ${currentPage})`)

      const { data, error, count } = await query

      console.log('📊 Supabase応答:', { data: data?.length, error, totalCount: count })

      if (error) {
        console.error('❌ Error:', error)
      } else {
        console.log('✅ 記事データを設定:', data?.length, '件')
        setArticles(data || [])
        setTotalArticles(count || 0)
      }
    } catch (error) {
      console.error('❌ Fetch error:', error)
    } finally {
      console.log('🔄 Loading終了')
      setLoading(false)
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearchQuery(value)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newParams = new URLSearchParams(searchParams)
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim())
    } else {
      newParams.delete('search')
    }
    // 検索時はページを1にリセット
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  function clearSearch() {
    setSearchQuery('')
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('search')
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  function handleCategoryClick(categorySlug: string) {
    const newParams = new URLSearchParams(searchParams)
    if (selectedCategory === categorySlug) {
      // 同じカテゴリをクリックした場合はフィルターを解除
      newParams.delete('category')
    } else {
      // 新しいカテゴリを選択
      newParams.set('category', categorySlug)
    }
    // カテゴリ変更時はページを1にリセット
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  function handlePageChange(page: number) {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', page.toString())
    setSearchParams(newParams)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const currentSearchTerm = searchParams.get('search')
  const hasActiveFilters = selectedCategory || currentSearchTerm

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Top Header with Search */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {selectedCategory
                  ? `${categories.find(c => c.slug === selectedCategory)?.name || '推し活ガイド'}`
                  : '推し活ガイド'
                }
              </h1>
              {selectedCategory && (
                <span className="text-sm text-gray-500">の記事</span>
              )}
            </div>
            
            {/* Search Form */}
            <div className="w-full sm:w-auto sm:min-w-80">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="記事を検索..."
                  className="w-full px-4 py-2.5 pr-24 text-gray-900 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all duration-200"
                      title="検索をクリア"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-600">活性フィルター:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {categories.find(c => c.slug === selectedCategory)?.name}
                  <button
                    onClick={() => handleCategoryClick(selectedCategory)}
                    className="p-0.5 hover:bg-purple-200 rounded-full transition-colors duration-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {currentSearchTerm && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                  検索: "{currentSearchTerm}"
                  <button
                    onClick={clearSearch}
                    className="p-0.5 hover:bg-pink-200 rounded-full transition-colors duration-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">カテゴリで絞り込み</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams)
                newParams.delete('category')
                newParams.set('page', '1')
                setSearchParams(newParams)
              }}
              className={`p-3 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-md border-2 ${
                !selectedCategory
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md scale-105'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50'
              }`}
            >
              <div className="font-semibold text-sm">すべて</div>
              <div className="text-xs opacity-75 mt-1">{totalArticles}記事</div>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.slug)}
                className={`p-3 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-md border-2 ${
                  selectedCategory === category.slug
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md scale-105'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50'
                }`}
              >
                <div className="font-semibold text-sm">{category.name}</div>
                <div className="text-xs opacity-75 mt-1">{category.article_count || 0}記事</div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentSearchTerm ? `"${currentSearchTerm}"の検索結果` : '記事一覧'}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {totalArticles > 0 ? (
                  <>全{totalArticles}件中 {((currentPage - 1) * ARTICLES_PER_PAGE) + 1}-{Math.min(currentPage * ARTICLES_PER_PAGE, totalArticles)}件を表示</>
                ) : (
                  hasActiveFilters ? '条件に一致する記事が見つかりませんでした' : '記事がありません'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-12">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-3 border border-gray-100 hover:border-purple-200 backdrop-blur-sm hover:bg-gradient-to-br hover:from-white hover:to-purple-50"
              >
                {article.featured_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(article.published_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="group-hover:text-purple-600 transition-colors duration-300">
                      読む →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 opacity-50">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? '条件に一致する記事がありません' : '記事がまだありません'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters 
                ? '検索条件やカテゴリフィルターを変更してみてください'
                : '記事が公開されるまでしばらくお待ちください'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  const newParams = new URLSearchParams()
                  newParams.set('page', '1')
                  setSearchParams(newParams)
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                すべての記事を表示
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalArticles > ARTICLES_PER_PAGE && (
          <div className="mt-12">
            <nav className="flex justify-center items-center space-x-2" aria-label="Pagination">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-600 border border-gray-300'
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                前のページ
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.ceil(totalArticles / ARTICLES_PER_PAGE) }, (_, i) => {
                  const pageNumber = i + 1
                  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE)

                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    Math.abs(pageNumber - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`
                          px-3 py-2 text-sm font-medium rounded-lg transition-colors
                          ${pageNumber === currentPage
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-600 border border-gray-300'
                          }
                        `}
                      >
                        {pageNumber}
                      </button>
                    )
                  } else if (
                    (pageNumber === 2 && currentPage > 4) ||
                    (pageNumber === totalPages - 1 && currentPage < totalPages - 3)
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 py-2 text-gray-400">
                        ...
                      </span>
                    )
                  }
                  return null
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === Math.ceil(totalArticles / ARTICLES_PER_PAGE)}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${currentPage === Math.ceil(totalArticles / ARTICLES_PER_PAGE)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-600 border border-gray-300'
                  }
                `}
              >
                次のページ
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </nav>

            {/* Page Info */}
            <div className="mt-4 text-center text-sm text-gray-600">
              {totalArticles}件中 {((currentPage - 1) * ARTICLES_PER_PAGE) + 1}-{Math.min(currentPage * ARTICLES_PER_PAGE, totalArticles)}件を表示
            </div>
          </div>
        )}
      </div>
    </div>
  )
}