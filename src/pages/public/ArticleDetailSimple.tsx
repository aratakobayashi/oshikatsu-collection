import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, ArrowLeft, Clock, Eye, Share2, Heart, BookOpen } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  published_at: string
  featured_image_url?: string
  category_id?: string
}

// 読了時間を計算
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// シェア機能
function handleShare(title: string, url: string) {
  if (navigator.share) {
    navigator.share({
      title,
      url
    })
  } else {
    navigator.clipboard.writeText(url)
    alert('URLをコピーしました！')
  }
}

export default function ArticleDetailSimple() {
  const { slug } = useParams<{ slug: string }>()
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
      setError(null)

      console.log('記事取得開始 - slug:', articleSlug)

      const { data, error: supabaseError } = await supabase
        .from('articles')
        .select('id, title, slug, content, excerpt, published_at, featured_image_url')
        .eq('slug', articleSlug)
        .eq('status', 'published')
        .single()

      if (supabaseError) {
        console.error('記事取得エラー:', supabaseError)
        setError('記事が見つかりませんでした')
      } else {
        console.log('記事取得成功:', data)
        setArticle(data)
      }
    } catch (error) {
      console.error('予期しないエラー:', error)
      setError('記事の読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  function formatContent(content: string): string {
    if (!content) return ''

    // 改行をHTMLの改行タグに変換
    let formatted = content.replace(/\n/g, '<br>')

    // 【見出し】パターンを見出しタグに変換
    formatted = formatted.replace(/【([^】]+)】/g, '<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h3>')

    // 「引用」パターンを引用タグに変換
    formatted = formatted.replace(/「([^」]+)」/g, '<blockquote class="border-l-4 border-purple-300 pl-4 italic text-gray-700 my-4">$1</blockquote>')

    return formatted
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">記事が見つかりません</h2>
          <p className="text-gray-600 mb-6">{error || '指定された記事は存在しないか、削除されました。'}</p>
          <Link
            to="/articles"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            記事一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  const readingTime = calculateReadingTime(article.content)
  const randomViews = Math.floor(Math.random() * 1000) + 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-white/80 mb-6">
            <Link to="/" className="hover:text-white transition-colors">ホーム</Link>
            <span className="mx-2">/</span>
            <Link to="/articles" className="hover:text-white transition-colors">記事一覧</Link>
            <span className="mx-2">/</span>
            <span className="text-white">記事詳細</span>
          </nav>

          {/* Back Button */}
          <Link
            to="/articles"
            className="inline-flex items-center text-white/90 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            記事一覧に戻る
          </Link>

          {/* Title and Meta */}
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-white/90 mb-6 leading-relaxed max-w-3xl">
                {article.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4" />
                <time dateTime={article.published_at}>
                  {new Date(article.published_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>

              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Clock className="w-4 h-4" />
                <span>{readingTime}分で読める</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Eye className="w-4 h-4" />
                <span>{randomViews} views</span>
              </div>

              <button
                onClick={() => handleShare(article.title, window.location.href)}
                className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>シェア</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="mb-12">
            <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Content Body */}
            <div
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed prose-headings:text-purple-900 prose-headings:font-bold prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:mb-6 prose-blockquote:border-l-purple-300 prose-blockquote:bg-purple-50 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:my-6"
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />
          </div>
        </div>

        {/* Article Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                推
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">推し活ガイド編集部</h3>
                <p className="text-gray-600 text-sm">推し活をもっと楽しく、もっとお得に</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/articles"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                他の記事も読む
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              <button
                onClick={() => handleShare(article.title, window.location.href)}
                className="inline-flex items-center px-6 py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200"
              >
                <Share2 className="w-5 h-5 mr-2" />
                この記事をシェア
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}