import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, BookOpen, Calendar, Eye, Tag, TrendingUp, Star, Clock } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { db, ArticleWithCategory, Category } from '../../lib/supabase'

export default function Articles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState<ArticleWithCategory[]>([])
  const [filteredArticles, setFilteredArticles] = useState<ArticleWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'published_at')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterAndSortArticles()
  }, [articles, searchTerm, selectedCategory, sortBy])

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedCategory) params.set('category', selectedCategory)
    if (sortBy !== 'published_at') params.set('sort', sortBy)

    setSearchParams(params)
  }, [searchTerm, selectedCategory, sortBy, setSearchParams])

  async function fetchData() {
    try {
      console.log('記事データ取得開始...')
      
      // Supabaseから記事を取得
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select(`
          *,
          category:article_categories(*)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (articlesError) {
        console.error('記事取得エラー:', articlesError)
        // エラー時はモックデータを表示
        const mockArticles = [
          {
            id: '1',
            title: '記事の読み込みに失敗しました',
            slug: 'error',
            content: 'データベースへの接続に問題があります。',
            excerpt: '後ほど再度お試しください。',
            featured_image: '',
            published_at: new Date().toISOString(),
            status: 'published',
            created_at: new Date().toISOString(),
            view_count: 0,
            featured: false,
            tags: []
          }
        ]
        setArticles(mockArticles)
      } else {
        setArticles(articlesData || [])
      }

      // カテゴリーを取得
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('article_categories')
        .select('*')
        .order('order_index', { ascending: true })

      if (!categoriesError) {
        setCategories(categoriesData || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setArticles([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  function filterAndSortArticles() {
    let filtered = [...articles]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(term) ||
        article.excerpt?.toLowerCase().includes(term) ||
        article.tags?.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category_id === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'published_at':
          return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
        case 'view_count':
          return (b.view_count || 0) - (a.view_count || 0)
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    setFilteredArticles(filtered)
  }

  function getCategoryIcon(categorySlug: string) {
    const icons = {
      'beginner-oshi': '🌟',
      'live-preparation': '👗',
      'venue-guide': '🏢',
      'idol-introduction': '💖',
      'live-report': '📝',
      'saving-tips': '💰',
      'male-oshi': '👨',
      'goods-storage': '🎒'
    }
    return icons[categorySlug as keyof typeof icons] || '📄'
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function clearFilters() {
    setSearchTerm('')
    setSelectedCategory('')
    setSortBy('published_at')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">記事を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <BookOpen className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              推し活ガイド記事
            </h1>
            <p className="text-xl opacity-90 mb-8">
              推し活に役立つ情報をカテゴリー別にお届け。初心者から上級者まで楽しめるコンテンツ
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm opacity-80">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span>実用的な情報</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                <span>体験談</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                <span>詳細ガイド</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            {/* Main Search */}
            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder="記事のタイトルやキーワードで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリー
                </label>
                <select
                  className="w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 border-gray-200"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">すべてのカテゴリー</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryIcon(category.slug)} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  並び順
                </label>
                <select
                  className="w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 border-gray-200"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="published_at">公開日時（新しい順）</option>
                  <option value="title">タイトル順</option>
                  <option value="view_count">閲覧数順</option>
                  <option value="created_at">作成日時順</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  フィルターをクリア
                </Button>
              </div>
            </div>

            {/* Filter Summary */}
            {(searchTerm || selectedCategory) && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{filteredArticles.length}</span> 件の記事が見つかりました
                {searchTerm && (
                  <span className="ml-2">
                    「<span className="font-medium">{searchTerm}</span>」で検索
                  </span>
                )}
                {selectedCategory && (
                  <span className="ml-2">
                    カテゴリー: <span className="font-medium">
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </span>
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">記事が見つかりませんでした</h3>
            <p className="text-gray-500 mb-6">検索条件を変更してもう一度お試しください</p>
            <Button variant="outline" onClick={clearFilters}>
              フィルターをリセット
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">
                        📄
                      </span>
                    </div>
                  )}
                  {article.featured && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        おすすめ
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium text-white bg-blue-500"
                    >
                      記事
                    </span>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(article.published_at!)}
                    </div>
                    {article.view_count && article.view_count > 0 && (
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {article.view_count.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{article.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    to={`/articles/${article.slug}`}
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    続きを読む
                    <Clock className="h-4 w-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button (if needed for pagination) */}
        {filteredArticles.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-600 text-sm">
              {filteredArticles.length} 件の記事を表示中
            </p>
          </div>
        )}
      </div>
    </div>
  )
}