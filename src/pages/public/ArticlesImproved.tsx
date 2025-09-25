import React, { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, Tag, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../../components/ui/Button'
import { Helmet } from 'react-helmet-async'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  published_at: string
  featured_image_url?: string
  category_id: string
  tag_ids?: string[]
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

interface TagType {
  id: string
  name: string
  slug: string
}

const ARTICLES_PER_PAGE = 12

export default function ArticlesImproved() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [totalArticles, setTotalArticles] = useState(0)

  // URLパラメータから値を取得
  const currentPage = parseInt(searchParams.get('page') || '1')
  const selectedCategory = searchParams.get('category') || ''
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || []

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    async function fetchArticles() {
      console.log('🔍 ArticlesImproved: 記事取得開始...')
      try {
        setLoading(true)

        let query = supabase
          .from('articles')
          .select('*', { count: 'exact' })
          .eq('status', 'published')
          .order('published_at', { ascending: false })

        // カテゴリフィルタ
        if (selectedCategory) {
          const category = categories.find(c => c.slug === selectedCategory)
          if (category) {
            query = query.eq('category_id', category.id)
            console.log('📂 カテゴリフィルタ適用:', category.name)
          }
        }

        // ページネーション
        const from = (currentPage - 1) * ARTICLES_PER_PAGE
        const to = from + ARTICLES_PER_PAGE - 1
        query = query.range(from, to)

        console.log('🎯 クエリ実行中...')
        const { data, error, count } = await query

        console.log('📊 Supabase応答:')
        console.log('  データ数:', data?.length)
        console.log('  エラー:', error)
        console.log('  総件数:', count)

        if (error) {
          console.error('❌ 記事取得エラー:', error)
          return
        }

        console.log('✅ 記事設定中...')
        setArticles(data || [])
        setTotalArticles(count || 0)
        console.log('✅ 記事設定完了')
      } catch (error) {
        console.error('❌ 予期しないエラー:', error)
      } finally {
        console.log('🔄 ローディング終了')
        setLoading(false)
      }
    }

    // カテゴリが読み込まれた後に実行
    if (categories.length > 0 || selectedCategory === '') {
      fetchArticles()
    }
  }, [currentPage, selectedCategory, selectedTags, categories])

  async function loadInitialData() {
    try {
      // カテゴリを取得
      const { data: categoriesData } = await supabase
        .from('article_categories')
        .select('*')
        .order('name')

      setCategories(categoriesData || [])

      // タグ機能を一時的に無効化（tagsテーブルが存在しないため）
      console.log('タグ機能は一時的に無効化されています')
      // const { data: tagsData } = await supabase
      //   .from('tags')
      //   .select('*')
      //   .order('name')

      // setTags(tagsData || [])
    } catch (error) {
      console.error('初期データ読み込みエラー:', error)
    }
  }


  function handleCategoryClick(categorySlug: string) {
    const newParams = new URLSearchParams(searchParams)
    if (categorySlug === selectedCategory) {
      newParams.delete('category')
    } else {
      newParams.set('category', categorySlug)
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  function handleTagToggle(tagSlug: string) {
    const newTags = selectedTags.includes(tagSlug)
      ? selectedTags.filter(t => t !== tagSlug)
      : [...selectedTags, tagSlug]

    const newParams = new URLSearchParams(searchParams)
    if (newTags.length > 0) {
      newParams.set('tags', newTags.join(','))
    } else {
      newParams.delete('tags')
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  function handlePageChange(page: number) {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', page.toString())
    setSearchParams(newParams)
  }

  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE)

  // カテゴリーのアイコンと色を設定
  const categoryConfig: { [key: string]: { icon: string; color: string } } = {
    'beginner-oshi': { icon: '🌟', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    'live-preparation': { icon: '👗', color: 'bg-pink-100 text-pink-800 border-pink-300' },
    'venue-guide': { icon: '🏢', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    'idol-introduction': { icon: '💖', color: 'bg-red-100 text-red-800 border-red-300' },
    'live-report': { icon: '📝', color: 'bg-green-100 text-green-800 border-green-300' },
    'saving-tips': { icon: '💰', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
  }

  return (
    <>
      <Helmet>
        <title>推し活ガイド記事一覧 | 最新の推し活情報をお届け</title>
        <meta name="description" content="推し活に関する最新情報、ライブ参戦準備、会場ガイド、アイドル紹介など、推し活を楽しむための記事をお届けします。" />
        {currentPage > 1 && <link rel="prev" href={`/articles?page=${currentPage - 1}`} />}
        {currentPage < totalPages && <link rel="next" href={`/articles?page=${currentPage + 1}`} />}
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                推し活ガイド記事一覧
              </h1>
              <p className="text-xl text-white/90">
                推し活をもっと楽しく、もっとお得に
              </p>
            </div>
          </div>
        </div>

        {/* Category Banners */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">カテゴリーで絞り込む</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((category) => {
                const config = categoryConfig[category.slug] || { icon: '📄', color: 'bg-gray-100 text-gray-800 border-gray-300' }
                const isActive = selectedCategory === category.slug

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.slug)}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${isActive
                        ? 'ring-2 ring-purple-500 shadow-md scale-105'
                        : 'hover:shadow-md hover:scale-105'
                      }
                      ${config.color}
                    `}
                  >
                    <div className="text-2xl mb-1">{config.icon}</div>
                    <div className="text-sm font-medium">{category.name}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tag Filter - 一時的に無効化 (tagsテーブルが存在しないため) */}
        {false && tags.length > 0 && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">タグで絞り込む（複数選択可）</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isActive = selectedTags.includes(tag.slug)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.slug)}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium transition-all
                        ${isActive
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      <Tag className="inline-block w-3 h-3 mr-1" />
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">記事を読み込み中...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">該当する記事が見つかりませんでした</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {articles.map((article) => {
                  const category = categories.find(c => c.id === article.category_id)
                  const config = category ? categoryConfig[category.slug] : null
                  const articleTags = tags.filter(t => article.tag_ids?.includes(t.id))

                  return (
                    <article key={article.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                      {/* Featured Image */}
                      <Link to={`/articles/${article.slug}`}>
                        <div className="aspect-video w-full overflow-hidden bg-gray-100">
                          {article.featured_image_url ? (
                            <img
                              src={article.featured_image_url}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-6xl">📄</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="p-6">
                        {/* Category Badge */}
                        {category && (
                          <div className="mb-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
                              {config?.icon} {category.name}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          <Link to={`/articles/${article.slug}`}>
                            {article.title}
                          </Link>
                        </h2>

                        {/* Date */}
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="w-4 h-4 mr-1" />
                          <time dateTime={article.published_at}>
                            {new Date(article.published_at).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        </div>

                        {/* Excerpt */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {article.excerpt?.substring(0, 150)}...
                        </p>

                        {/* Tags */}
                        {articleTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {articleTags.slice(0, 3).map(tag => (
                              <Link
                                key={tag.id}
                                to={`/articles?tags=${tag.slug}`}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                #{tag.name}
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Read More Link */}
                        <Link
                          to={`/articles/${article.slug}`}
                          className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
                        >
                          続きを読む
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}