import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, ArrowRight, Clock, Tag, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string
  published_at: string
  featured_image_url?: string
  category_id?: string
  tag_ids?: string[]
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
const categoryConfig: Record<string, string> = {
  'beginner-oshi': 'bg-purple-50 text-purple-700',
  'live-preparation': 'bg-pink-50 text-pink-700',
  'venue-guide': 'bg-blue-50 text-blue-700',
  'idol-introduction': 'bg-red-50 text-red-700',
  'live-report': 'bg-green-50 text-green-700',
  'saving-tips': 'bg-yellow-50 text-yellow-700'
}

// 読了時間を計算
function calculateReadingTime(content?: string): number {
  if (!content) return 1
  const wordsPerMinute = 200 // 日本語の平均読み速度
  const wordCount = content.length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

export default function ArticlesList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [totalArticles, setTotalArticles] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')

  const selectedCategory = searchParams.get('category') || ''
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || []
  const currentPage = parseInt(searchParams.get('page') || '1')
  const searchFromUrl = searchParams.get('search') || ''

  // 初期データロード
  useEffect(() => {
    loadCategories()
    loadTags()
  }, [])

  // データロード後とフィルター変更時に記事フェッチ
  useEffect(() => {
    if (categories.length > 0 && tags.length > 0) {
      fetchArticles()
    }
  }, [categories.length, tags.length, selectedCategory, selectedTags.join(','), currentPage, searchFromUrl])

  // 検索クエリの同期
  useEffect(() => {
    if (searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl)
    }
  }, [searchFromUrl, searchQuery])

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('article_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading categories:', error)
      } else {
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  async function loadTags() {
    try {
      const { data, error } = await supabase
        .from('article_tags')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading tags:', error)
      } else {
        setTags(data || [])
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  async function fetchArticles() {
    console.log('🔥 fetchArticles関数が実行されました')
    try {
      setLoading(true)
      console.log('📡 Supabaseにリクエスト送信中...')

      let query = supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at, featured_image_url, category_id, tag_ids', { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      // 検索クエリフィルターを適用
      if (searchFromUrl && searchFromUrl.trim()) {
        query = query.or(`title.ilike.%${searchFromUrl}%,excerpt.ilike.%${searchFromUrl}%`)
      }

      // カテゴリフィルターを適用
      if (selectedCategory && categories.length > 0) {
        const category = categories.find(c => c.slug === selectedCategory)
        if (category) {
          query = query.eq('category_id', category.id)
        }
      }

      // タグフィルターを適用
      if (selectedTags.length > 0 && tags.length > 0) {
        const tagIds = selectedTags.map(tagSlug =>
          tags.find(t => t.slug === tagSlug)?.id
        ).filter(Boolean)

        if (tagIds.length > 0) {
          query = query.overlaps('tag_ids', tagIds)
        }
      }

      // ページネーション
      const from = (currentPage - 1) * ARTICLES_PER_PAGE
      const to = from + ARTICLES_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error, count } = await query

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newParams = new URLSearchParams(searchParams)

    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim())
    } else {
      newParams.delete('search')
    }

    newParams.delete('page')
    setSearchParams(newParams)
  }

  const clearSearch = () => {
    setSearchQuery('')
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('search')
    newParams.delete('page')
    setSearchParams(newParams)
  }

  const hasActiveFilters = selectedCategory || selectedTags.length > 0 || searchFromUrl
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">記事を読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">

      {/* 検索フォーム */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="記事を検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            検索
          </button>
          {searchFromUrl && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              クリア
            </button>
          )}
        </form>
      </div>

      {/* フィルター */}
      <div className="mb-8 space-y-4">
        {/* カテゴリフィルター */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">カテゴリ</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams)
                newParams.delete('category')
                newParams.delete('page')
                setSearchParams(newParams)
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams)
                  newParams.set('category', category.slug)
                  newParams.delete('page')
                  setSearchParams(newParams)
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.slug
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* タグフィルター */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">タグ</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams)
                  const currentTags = newParams.get('tags')?.split(',').filter(Boolean) || []

                  if (currentTags.includes(tag.slug)) {
                    const updatedTags = currentTags.filter(t => t !== tag.slug)
                    if (updatedTags.length > 0) {
                      newParams.set('tags', updatedTags.join(','))
                    } else {
                      newParams.delete('tags')
                    }
                  } else {
                    currentTags.push(tag.slug)
                    newParams.set('tags', currentTags.join(','))
                  }

                  newParams.delete('page')
                  setSearchParams(newParams)
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag.slug)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* アクティブフィルターのクリア */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">フィルター:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 text-sm rounded">
                カテゴリ: {categories.find(c => c.slug === selectedCategory)?.name}
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams)
                    newParams.delete('category')
                    newParams.delete('page')
                    setSearchParams(newParams)
                  }}
                  className="text-pink-600 hover:text-pink-800"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTags.map(tagSlug => {
              const tag = tags.find(t => t.slug === tagSlug)
              return tag ? (
                <span key={tagSlug} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                  #{tag.name}
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      const currentTags = selectedTags.filter(t => t !== tagSlug)
                      if (currentTags.length > 0) {
                        newParams.set('tags', currentTags.join(','))
                      } else {
                        newParams.delete('tags')
                      }
                      newParams.delete('page')
                      setSearchParams(newParams)
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ) : null
            })}
            {searchFromUrl && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                検索: "{searchFromUrl}"
                <button
                  onClick={clearSearch}
                  className="text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchParams(new URLSearchParams())
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              すべてクリア
            </button>
          </div>
        )}
      </div>

      {/* 記事一覧 */}
      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">記事が見つかりませんでした。</p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchParams(new URLSearchParams())
              }}
              className="mt-4 text-pink-500 hover:text-pink-600 underline"
            >
              フィルターをクリアして全ての記事を表示
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {articles.map((article) => {
              const category = categories.find(c => c.id === article.category_id)
              const articleTags = tags.filter(tag =>
                article.tag_ids && Array.isArray(article.tag_ids) && article.tag_ids.includes(tag.id)
              )

              return (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {article.featured_image_url && (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      {category && (
                        <span className="inline-block px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                          {category.name}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {calculateReadingTime(article.excerpt || '')}分で読める
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {articleTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            #{tag.name}
                          </span>
                        ))}
                        {articleTags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{articleTags.length - 3}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(article.published_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams)
                  newParams.set('page', String(Math.max(1, currentPage - 1)))
                  setSearchParams(newParams)
                }}
                disabled={currentPage <= 1}
                className="px-3 py-2 text-gray-500 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                前へ
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.set('page', String(pageNumber))
                      setSearchParams(newParams)
                    }}
                    className={`px-3 py-2 border rounded-lg ${
                      currentPage === pageNumber
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}

              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams)
                  newParams.set('page', String(Math.min(totalPages, currentPage + 1)))
                  setSearchParams(newParams)
                }}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 text-gray-500 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}