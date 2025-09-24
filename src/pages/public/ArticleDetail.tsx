import React, { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Calendar, Eye, Tag, ArrowLeft, Share2, Clock, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.Tk25ml7Cj4y8CrSkUSC-Xogg_hYO_nvMnAJLrvdpD88'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image_url: string
  published_at: string
  status: string
  created_at: string
  reading_time?: number
}

export default function ArticleDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
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

      // Supabaseから記事を取得
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', articleSlug)
        .eq('status', 'published')
        .single()

      if (error) {
        console.error('記事取得エラー:', error)
        setError('記事が見つかりませんでした')
        return
      }

      if (data) {
        setArticle(data)
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

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">記事が見つかりません</h1>
            <p className="text-gray-600 mb-8">お探しの記事は削除されたか、URLが間違っている可能性があります。</p>
            <Link
              to="/articles"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              記事一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
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
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              約 {article.reading_time || Math.max(1, Math.ceil(article.content.length / 400))} 分で読めます
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="mb-8">
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Article Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </CardContent>
        </Card>


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