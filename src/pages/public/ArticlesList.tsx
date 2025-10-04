import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, ArrowRight, Clock, Tag, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'

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
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">記事を読み込み中...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
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
                    if (selectedCategory === category.slug) {
                      newParams.delete('category')
                    } else {
                      newParams.set('category', category.slug)
                    }
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
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.slug)
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      let newTags = [...selectedTags]

                      if (isSelected) {
                        newTags = newTags.filter(t => t !== tag.slug)
                      } else {
                        newTags.push(tag.slug)
                      }

                      if (newTags.length > 0) {
                        newParams.set('tags', newTags.join(','))
                      } else {
                        newParams.delete('tags')
                      }
                      newParams.delete('page')
                      setSearchParams(newParams)
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <Tag className="w-3 h-3 inline mr-1" />
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* アクティブフィルターの表示 */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>フィルター中:</span>
              {selectedCategory && (
                <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded">
                  {categories.find(c => c.slug === selectedCategory)?.name}
                </span>
              )}
              {selectedTags.map(tagSlug => {
                const tag = tags.find(t => t.slug === tagSlug)
                return tag ? (
                  <span key={tagSlug} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tag.name}
                  </span>
                ) : null
              })}
              {searchFromUrl && (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  "{searchFromUrl}"
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchParams({})
                }}
                className="text-pink-600 hover:text-pink-800 font-medium"
              >
                すべてクリア
              </button>
            </div>
          )}
        </div>

        {/* 記事一覧 */}
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">条件に一致する記事がありません</h2>
            <p className="text-gray-600 mb-6">検索条件やカテゴリフィルターを変更してみてください</p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchParams({})
                }}
                className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                すべての記事を見る
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articles.map((article) => {
                const category = categories.find(c => c.id === article.category_id)
                const articleTags = article.tag_ids
                  ? tags.filter(tag => Array.isArray(article.tag_ids) && article.tag_ids.includes(tag.id))
                  : []

                return (
                  <article key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {article.featured_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      {category && (
                        <div className="mb-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${categoryConfig[category.slug] || 'bg-gray-50 text-gray-700'}`}>
                            {category.name}
                          </span>
                        </div>
                      )}

                      <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        <Link to={`/articles/${article.slug}`} className="hover:text-pink-600 transition-colors">
                          {article.title}
                        </Link>
                      </h2>

                      {article.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                      )}

                      {/* タグ表示 */}
                      {articleTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {articleTags.slice(0, 3).map(tag => (
                            <span key={tag.id} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag.name}
                            </span>
                          ))}
                          {articleTags.length > 3 && (
                            <span className="text-xs text-gray-500">+{articleTags.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.published_at).toLocaleDateString('ja-JP')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {calculateReadingTime(article.excerpt || '')}分
                          </span>
                        </div>
                        <Link
                          to={`/articles/${article.slug}`}
                          className="flex items-center gap-1 text-pink-600 hover:text-pink-700 font-medium"
                        >
                          読む
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams)
                    newParams.set('page', String(currentPage - 1))
                    setSearchParams(newParams)
                  }}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNumber = i + 1
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams)
                        newParams.set('page', String(pageNumber))
                        setSearchParams(newParams)
                      }}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === pageNumber
                          ? 'bg-pink-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}

                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams)
                    newParams.set('page', String(currentPage + 1))
                    setSearchParams(newParams)
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}