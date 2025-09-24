import React, { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Calendar, Eye, Tag, ArrowLeft, Share2, Clock, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
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

      console.log('Received slug:', articleSlug)
      console.log('Encoded slug:', encodeURIComponent(articleSlug))
      console.log('Decoded slug:', decodeURIComponent(articleSlug))

      // Try the slug as-is first
      let { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', articleSlug)
        .eq('status', 'published')
        .single()

      // If not found and slug contains Japanese characters, try encoding it
      if (error && /[^\x00-\x7F]/.test(articleSlug)) {
        console.log('Article not found with decoded slug, trying encoded version...')
        const encodedSlug = encodeURIComponent(articleSlug)
        console.log('Trying encoded slug:', encodedSlug)

        const result = await supabase
          .from('articles')
          .select('*')
          .eq('slug', encodedSlug)
          .eq('status', 'published')
          .single()

        data = result.data
        error = result.error
      }

      // If still not found and slug is already encoded, try decoding it
      if (error && articleSlug.includes('%')) {
        console.log('Article not found with original slug, trying decoded version...')
        const decodedSlug = decodeURIComponent(articleSlug)
        console.log('Trying decoded slug:', decodedSlug)

        const result = await supabase
          .from('articles')
          .select('*')
          .eq('slug', decodedSlug)
          .eq('status', 'published')
          .single()

        data = result.data
        error = result.error
      }

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
    if (!content) return null

    // Split content into sections by empty lines
    const sections = content.split('\n\n').filter(section => section.trim())

    return sections.map((section, sectionIndex) => {
      const trimmedSection = section.trim()

      // Check if it's a heading (starts with 【 or looks like a title)
      if (trimmedSection.startsWith('【') && trimmedSection.includes('】')) {
        return (
          <h2 key={sectionIndex} className="text-2xl font-bold text-purple-900 mb-6 mt-10 pb-3 border-b-2 border-purple-200">
            {trimmedSection}
          </h2>
        )
      }

      // Check if it's a subheading (longer lines that end with specific patterns)
      if (trimmedSection.length > 20 && (
        trimmedSection.includes('｜') ||
        trimmedSection.endsWith('？') ||
        trimmedSection.endsWith('！') ||
        /^[0-9]+\./.test(trimmedSection) ||
        trimmedSection.startsWith('■') ||
        trimmedSection.startsWith('◆')
      )) {
        return (
          <h3 key={sectionIndex} className="text-xl font-semibold text-purple-800 mb-4 mt-8">
            {trimmedSection}
          </h3>
        )
      }

      // Check if it's a list item (starts with emoji, bullet, or number)
      if (/^[🔸🔹💫💖📷🎥💬✔️▼◎・]./.test(trimmedSection) || /^[0-9]+\./.test(trimmedSection)) {
        return (
          <div key={sectionIndex} className="bg-purple-50 rounded-lg p-4 mb-4 border-l-4 border-purple-200">
            <p className="text-gray-700 leading-relaxed font-medium">{trimmedSection}</p>
          </div>
        )
      }

      // Check if it's a special callout box (contains multiple lines with special formatting)
      if (trimmedSection.includes('✔') && trimmedSection.includes('\n')) {
        const lines = trimmedSection.split('\n').filter(line => line.trim())
        return (
          <div key={sectionIndex} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-100">
            {lines.map((line, lineIndex) => {
              if (line.includes('✔')) {
                return <h4 key={lineIndex} className="text-lg font-bold text-purple-900 mb-3">{line}</h4>
              }
              return <p key={lineIndex} className="text-purple-700 mb-2 font-medium">{line}</p>
            })}
          </div>
        )
      }

      // Regular paragraph - split by single line breaks
      const paragraphs = trimmedSection.split('\n').filter(p => p.trim())

      return paragraphs.map((paragraph, paragraphIndex) => {
        const trimmedParagraph = paragraph.trim()

        // Skip empty paragraphs
        if (!trimmedParagraph) return null

        // Check if it's a quote or special emphasis (contains quotes or dashes)
        if (trimmedParagraph.startsWith('「') || trimmedParagraph.includes('──')) {
          return (
            <blockquote key={`${sectionIndex}-${paragraphIndex}`} className="border-l-4 border-purple-300 pl-6 py-3 mb-6 bg-purple-50 rounded-r-lg">
              <p className="text-gray-700 italic text-lg leading-relaxed">{trimmedParagraph}</p>
            </blockquote>
          )
        }

        return (
          <p key={`${sectionIndex}-${paragraphIndex}`} className="text-gray-700 leading-relaxed mb-6 text-lg">
            {trimmedParagraph}
          </p>
        )
      }).filter(Boolean)
    })
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/articles"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              記事一覧に戻る
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="inline-flex items-center text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 mr-2" />
              シェア
            </Button>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <header className="mb-8">
          {/* Featured Image */}
          {article.featured_image_url && (
            <div className="mb-8">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed font-light">
              {article.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <time dateTime={article.published_at}>
                {formatDate(article.published_at!)}
              </time>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              約 {article.reading_time || Math.max(1, Math.ceil(article.content.length / 400))} 分で読めます
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-2 text-gray-400" />
              {Math.floor(Math.random() * 1000) + 100} views
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-8 md:p-12">
            <div className="max-w-none">
              {formatContent(article.content)}
            </div>
          </div>
        </div>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                推
              </div>
              <div>
                <p className="font-semibold text-gray-900">推し活ガイド編集部</p>
                <p className="text-sm text-gray-500">推し活をもっと楽しく、もっとお得に</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 mr-2" />
              記事をシェア
            </Button>
          </div>
        </footer>

        {/* Back to Articles */}
        <div className="text-center mt-12">
          <Link to="/articles">
            <Button variant="outline" className="inline-flex items-center bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 px-8 py-3">
              <ArrowLeft className="h-5 w-5 mr-2" />
              他の記事も読む
            </Button>
          </Link>
        </div>
      </article>
    </div>
  )
}