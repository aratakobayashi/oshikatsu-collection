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

interface Tag {
  id: string
  name: string
  slug: string
  color?: string
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
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [totalArticles, setTotalArticles] = useState(0)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  const selectedCategory = searchParams.get('category')
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || []
  const currentPage = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    loadCategories()
    loadTags()
  }, [])

  useEffect(() => {
    // カテゴリが読み込まれてから記事をフェッチ
    if (categories.length > 0 || !selectedCategory) {
      fetchArticles()
    }
  }, [selectedCategory, selectedTags, currentPage, categories, tags, searchParams.get('search')])

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

  async function loadTags() {
    try {
      const { data, error } = await supabase
        .from('article_tags')
        .select('*')
        .order('name')

      if (error) {
        console.error('❌ Tag Error:', error)
      } else {
        console.log('✅ タグデータを設定:', data?.length, '件')
        setTags(data || [])
      }
    } catch (error) {
      console.error('❌ Tag fetch error:', error)
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
        .select('id, title, slug, excerpt, published_at, featured_image_url, category_id, tag_ids', { count: 'exact' })
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

      // タグフィルターを適用
      if (selectedTags.length > 0) {
        const tagIds = selectedTags.map(tagSlug =>
          tags.find(t => t.slug === tagSlug)?.id
        ).filter(Boolean)

        if (tagIds.length > 0) {
          // tag_ids配列に指定したタグIDのいずれかが含まれる記事を検索
          query = query.overlaps('tag_ids', tagIds)
          console.log('🏷️ タグフィルター適用:', selectedTags.join(', '))
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

  function handleTagClick(tagSlug: string) {
    const newParams = new URLSearchParams(searchParams)
    let newSelectedTags = [...selectedTags]

    if (selectedTags.includes(tagSlug)) {
      // 既に選択されているタグは除去
      newSelectedTags = newSelectedTags.filter(t => t !== tagSlug)
    } else {
      // 新しいタグを追加
      newSelectedTags.push(tagSlug)
    }

    if (newSelectedTags.length > 0) {
      newParams.set('tags', newSelectedTags.join(','))
    } else {
      newParams.delete('tags')
    }

    // タグ変更時はページを1にリセット
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  function clearAllFilters() {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('category')
    newParams.delete('tags')
    newParams.delete('search')
    newParams.set('page', '1')
    setSearchParams(newParams)
    setSearchQuery('')
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
  const hasActiveFilters = selectedCategory || selectedTags.length > 0 || currentSearchTerm

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Simple Top Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-300 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center">
            {selectedCategory && (
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {categories.find(c => c.slug === selectedCategory)?.name}の記事
              </h1>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              
              {/* Search Form */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">キーワード検索</h2>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="記事を検索..."
                    className="w-full px-4 py-3 pr-12 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
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
                      className="p-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>

              {/* Category Filter */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">カテゴリ</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('category')
                      newParams.set('page', '1')
                      setSearchParams(newParams)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                      !selectedCategory
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">🔸 すべて</span>
                      <span className="text-sm opacity-75">{totalArticles}記事</span>
                    </div>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.slug)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                        selectedCategory === category.slug
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">🔸 {category.name}</span>
                        <span className="text-sm opacity-75">{category.article_count || 0}記事</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Filter */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">タグ</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 20).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagClick(tag.slug)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                        selectedTags.includes(tag.slug)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md'
                          : tag.color || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {tags.length > 20 && (
                    <button
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        // TODO: Show all tags modal
                        console.log('Show all tags modal')
                      }}
                    >
                      +{tags.length - 20}個のタグ
                    </button>
                  )}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('tags')
                      newParams.set('page', '1')
                      setSearchParams(newParams)
                    }}
                    className="mt-3 text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    タグ選択をクリア
                  </button>
                )}
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">活性フィルター</h3>
                  <div className="space-y-2">
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
                    {selectedTags.map(tagSlug => {
                      const tag = tags.find(t => t.slug === tagSlug)
                      return tag ? (
                        <span key={tagSlug} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {tag.name}
                          <button
                            onClick={() => handleTagClick(tagSlug)}
                            className="p-0.5 hover:bg-blue-200 rounded-full transition-colors duration-200"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ) : null
                    })}
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
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                      >
                        すべてクリア
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-3">
            
            {/* Results Summary */}
            <div className="mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentSearchTerm ? `"${currentSearchTerm}"の検索結果` : '記事一覧'}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {totalArticles > 0 ? (
                    <><strong>{totalArticles}件</strong>の記事が見つかりました</>
                  ) : (
                    hasActiveFilters ? '条件に一致する記事が見つかりませんでした' : '記事がありません'
                  )}
                </p>
              </div>
            </div>

            {/* Articles Grid */}
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/articles/${article.slug}`}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-2 border border-gray-100"
                  >
                    {article.featured_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors duration-300 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}

                      {/* Tags */}
                      {article.tag_ids && Array.isArray(article.tag_ids) && article.tag_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {article.tag_ids.slice(0, 3).map(tagId => {
                            const tag = tags.find(t => t.id === tagId)
                            return tag ? (
                              <span
                                key={tag.id}
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  tag.color || 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {tag.name}
                              </span>
                            ) : null
                          })}
                          {article.tag_ids.length > 3 && (
                            <span className="px-2 py-1 text-xs text-gray-400">
                              +{article.tag_ids.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {new Date(article.published_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="group-hover:text-purple-600 transition-colors duration-300 font-medium">
                          読む →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
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
              <div className="mt-8">
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
      </div>
    </div>
  )
}