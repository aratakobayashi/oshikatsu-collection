import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, ArrowLeft } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-purple-600">ホーム</Link>
            <span className="mx-2">/</span>
            <Link to="/articles" className="hover:text-purple-600">記事一覧</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Featured Image */}
          {article.featured_image_url && (
            <div className="aspect-video w-full">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center text-gray-600 mb-6 pb-6 border-b">
              <Calendar className="w-4 h-4 mr-2" />
              <time dateTime={article.published_at}>
                {new Date(article.published_at).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>

            {/* Content */}
            <div
              className="prose max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />
          </div>
        </div>

        {/* Back to Articles */}
        <div className="mt-8 text-center">
          <Link
            to="/articles"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            記事一覧に戻る
          </Link>
        </div>
      </article>
    </div>
  )
}