import React, { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Calendar, Eye, Tag, ArrowLeft, Share2, Clock, User } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardContent } from '../../components/ui/Card'
import { db, ArticleWithRelations } from '../../lib/supabase'

export default function ArticleDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState<ArticleWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchArticle(slug)
    }
  }, [slug])

  async function fetchArticle(articleSlug: string) {
    try {
      setLoading(true)
      const articleData = await db.articles.getBySlugWithCategory(articleSlug)
      if (articleData) {
        setArticle(articleData)
        // Increment view count
        await db.articles.incrementViewCount(articleData.id)
      } else {
        setError('記事が見つかりませんでした')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      setError('記事の読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
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

  function formatContent(content: string) {
    // Simple HTML to JSX conversion for basic formatting
    // In a real app, you'd use a proper markdown parser or rich text editor
    return content
      .split('\n')
      .map((paragraph, index) => {
        if (paragraph.trim() === '') return null
        return (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {paragraph}
          </p>
        )
      })
      .filter(Boolean)
  }

  async function handleShare() {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || '',
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      alert('URLをクリップボードにコピーしました')
    }
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

  if (error || !article) {
    return <Navigate to="/articles" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/articles"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              記事一覧に戻る
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="inline-flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              シェア
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <div className="mb-8">
          {/* Category Badge */}
          <div className="mb-4">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: article.category?.color || '#3B82F6' }}
            >
              <span className="mr-1">
                {getCategoryIcon(article.category?.slug || '')}
              </span>
              {article.category?.name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(article.published_at!)}
            </div>
            {article.view_count && article.view_count > 0 && (
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {article.view_count.toLocaleString()} 回閲覧
              </div>
            )}
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              約 {Math.max(1, Math.ceil(article.content.length / 400))} 分で読めます
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="mb-8">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Article Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none">
              {formatContent(article.content)}
            </div>
          </CardContent>
        </Card>

        {/* Related Content */}
        {(article.celebrities?.length || article.items?.length || article.locations?.length) && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {/* Related Celebrities */}
            {article.celebrities && article.celebrities.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-purple-600" />
                    関連する芸能人
                  </h3>
                  <div className="space-y-3">
                    {article.celebrities.slice(0, 3).map((celebrity) => (
                      <Link
                        key={celebrity.id}
                        to={`/celebrities/${celebrity.slug}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {celebrity.image_url && (
                            <img
                              src={celebrity.image_url}
                              alt={celebrity.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium text-gray-900">
                            {celebrity.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Items */}
            {article.items && article.items.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-pink-600" />
                    関連アイテム
                  </h3>
                  <div className="space-y-3">
                    {article.items.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        to={`/items/${item.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {item.name}
                            </div>
                            {item.brand && (
                              <div className="text-xs text-gray-500">
                                {item.brand}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Locations */}
            {article.locations && article.locations.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-green-600" />
                    関連スポット
                  </h3>
                  <div className="space-y-3">
                    {article.locations.slice(0, 3).map((location) => (
                      <Link
                        key={location.id}
                        to={`/locations/${location.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-900 text-sm">
                          {location.name}
                        </div>
                        {location.address && (
                          <div className="text-xs text-gray-500">
                            {location.address}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Back to Articles */}
        <div className="text-center">
          <Link to="/articles">
            <Button variant="outline" className="inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              記事一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}