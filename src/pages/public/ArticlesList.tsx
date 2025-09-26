import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, ArrowRight, Clock, Eye, Tag, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

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
  }, [selectedCategory, currentPage, categories])

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

      let query = supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at, featured_image_url, category_id', { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                ✨ 推し活をもっと楽しく
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              {selectedCategory
                ? `${categories.find(c => c.slug === selectedCategory)?.name || '推し活ガイド'}の記事`
                : '推し活ガイド'
              }
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              {selectedCategory
                ? `${categories.find(c => c.slug === selectedCategory)?.name}に関する記事を${articles.length}件お届け`
                : `推し活初心者からベテランまで、あなたの推し活をサポートする記事を${articles.length}件お届け`
              }
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>ライブ準備ガイド</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>会場情報</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>節約術</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">カテゴリーで絞り込む</h2>
              <p className="text-gray-600">気になるテーマの記事を見つけよう</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => {
                const config = categoryConfig[category.slug as keyof typeof categoryConfig] || {
                  icon: '📄',
                  color: 'bg-gray-100 text-gray-800 border-gray-300'
                }
                const isActive = selectedCategory === category.slug

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.slug)}
                    className={`
                      group relative p-6 rounded-2xl border-2 transition-all duration-300 text-center
                      ${isActive
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400 ring-4 ring-purple-200 shadow-lg transform scale-105'
                        : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg hover:transform hover:scale-105'
                      }
                    `}
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {config.icon}
                    </div>
                    <h3 className={`font-semibold text-sm ${isActive ? 'text-purple-900' : 'text-gray-900'}`}>
                      {category.name}
                    </h3>
                    {isActive && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedCategory && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => handleCategoryClick(selectedCategory)}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
                >
                  🗂️ フィルターをクリア
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">記事を準備中...</h3>
            <p className="text-gray-600">素敵な推し活記事をお楽しみに！</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">最新の推し活記事</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                推し活を充実させるためのノウハウやガイドをご紹介しています
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => {
                const readingTime = calculateReadingTime(article.content)
                const randomViews = Math.floor(Math.random() * 1000) + 100
                const category = categories.find(c => c.id === article.category_id)


                return (
                  <article
                    key={article.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-2 border border-gray-100"
                  >
                    {/* Image */}
                    <Link to={`/articles/${article.slug}`} className="block">
                      <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                        {article.featured_image_url ? (
                          <img
                            src={article.featured_image_url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-300">
                            <span className="text-6xl">📝</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-6">
                      {/* Category Badge */}
                      {category && (
                        <div className="mb-3">
                          <button
                            onClick={() => handleCategoryClick(category.slug)}
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border transition-colors hover:bg-opacity-80 ${categoryConfig[category.slug as keyof typeof categoryConfig]?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                          >
                            {categoryConfig[category.slug as keyof typeof categoryConfig]?.icon} {category.name}
                          </button>
                        </div>
                      )}

                      <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        <Link to={`/articles/${article.slug}`}>
                          {article.title}
                        </Link>
                      </h2>

                      {article.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                          {article.excerpt.substring(0, 150)}...
                        </p>
                      )}

                      {/* Meta Information */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{readingTime}分</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{randomViews}</span>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/articles/${article.slug}`}
                        className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold text-sm group-hover:gap-2 transition-all duration-200"
                      >
                        続きを読む
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Pagination */}
            {Math.ceil(totalArticles / ARTICLES_PER_PAGE) > 1 && (
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
          </>
        )}
      </div>
    </div>
  )
}