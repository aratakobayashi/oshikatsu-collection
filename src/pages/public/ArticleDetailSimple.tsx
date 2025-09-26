import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, ArrowLeft, Clock, Eye, Share2, Heart, BookOpen } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Instagram埋め込み用の型定義
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void
      }
    }
  }
}

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

  useEffect(() => {
    // Instagram埋め込み用スクリプトを動的に読み込み
    const loadInstagramScript = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process()
        return
      }

      const script = document.createElement('script')
      script.async = true
      script.src = 'https://www.instagram.com/embed.js'
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process()
        }
      }
      document.body.appendChild(script)
    }

    if (article && article.content.includes('instagram.com')) {
      loadInstagramScript()
    }
  }, [article])

  async function fetchArticle(articleSlug: string) {
    try {
      setLoading(true)
      setError(null)

      // URLパラメータをエンコードしたまま保持
      // ブラウザが自動的にデコードしてしまうので、再度エンコードする
      const encodedSlug = encodeURIComponent(articleSlug).toLowerCase()

      console.log('記事取得開始')
      console.log('  元のスラッグ:', articleSlug)
      console.log('  エンコード済みスラッグ:', encodedSlug)

      // まず全記事のスラッグを確認してデバッグ
      const { data: allArticles } = await supabase
        .from('articles')
        .select('slug, title')
        .eq('status', 'published')
        .limit(5)

      console.log('🔍 データベース内の記事スラッグ (最初の5件):')
      allArticles?.forEach((art, index) => {
        console.log(`${index + 1}. "${art.slug}" - ${art.title}`)
      })
      console.log('🎯 検索中のスラッグ (エンコード済み):', `"${encodedSlug}"`)

      const { data, error: supabaseError } = await supabase
        .from('articles')
        .select('id, title, slug, content, excerpt, published_at, featured_image_url')
        .eq('slug', encodedSlug)
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

    let formatted = content

    // YouTube URLを埋め込みiframeに変換
    formatted = formatted.replace(
      /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
      '<div class="my-8 mx-auto max-w-4xl"><div class="relative w-full" style="padding-bottom: 56.25%;"><iframe class="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>'
    )

    // Instagram URLを埋め込みに変換
    formatted = formatted.replace(
      /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)\/?/g,
      '<div class="my-8 mx-auto max-w-lg"><blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/$1/" data-instgrm-version="14"></blockquote></div>'
    )

    // HTMLタグをそのまま保持（WordPressからのHTMLコンテンツ対応）
    // 段落タグ、見出しタグ、リストタグなどを保持

    // WordPressスタイルの見出しを強化
    formatted = formatted.replace(/<h2([^>]*)>/g, '<h2$1 class="wp-h2 text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 my-8 rounded-lg shadow-md border-t-4 border-b-4 border-teal-800">')
    formatted = formatted.replace(/<h3([^>]*)>/g, '<h3$1 class="wp-h3 text-xl md:text-2xl font-semibold text-gray-800 pb-2 mb-4 mt-8 border-b-2 border-gradient bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-border" style="border-image: linear-gradient(to right, #0d9488, #3b82f6) 1;">')
    formatted = formatted.replace(/<h4([^>]*)>/g, '<h4$1 class="wp-h4 text-lg md:text-xl font-semibold text-gray-800 mb-3 mt-6 pl-4 border-l-4 border-teal-500 bg-teal-50 py-2">')

    // 段落のスタイリング
    formatted = formatted.replace(/<p([^>]*)>/g, '<p$1 class="mb-6 leading-relaxed text-gray-700 text-lg">')

    // リストのスタイリング
    formatted = formatted.replace(/<ul([^>]*)>/g, '<ul$1 class="mb-6 pl-6 space-y-2 list-none">')
    formatted = formatted.replace(/<ol([^>]*)>/g, '<ol$1 class="mb-6 pl-6 space-y-2 list-decimal list-inside">')
    formatted = formatted.replace(/<li([^>]*)>/g, '<li$1 class="relative pl-4 text-gray-700 leading-relaxed before:content-[\'✓\'] before:absolute before:left-0 before:text-teal-500 before:font-bold">')

    // 引用のスタイリング
    formatted = formatted.replace(/<blockquote([^>]*)>/g, '<blockquote$1 class="my-8 pl-6 pr-4 py-4 border-l-4 border-teal-400 bg-gradient-to-r from-teal-50 to-blue-50 italic text-gray-700 text-lg rounded-r-lg shadow-sm">')

    // 強調テキストのスタイリング
    formatted = formatted.replace(/<strong([^>]*)>/g, '<strong$1 class="font-bold text-gray-900 bg-yellow-100 px-1 py-0.5 rounded">')
    formatted = formatted.replace(/<em([^>]*)>/g, '<em$1 class="italic text-teal-700 font-medium">')

    // 画像のスタイリング
    formatted = formatted.replace(/<img([^>]*?)>/g, '<img$1 class="my-8 mx-auto max-w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300" loading="lazy">')

    // リンクのスタイリング
    formatted = formatted.replace(/<a([^>]*?)>/g, '<a$1 class="text-teal-600 hover:text-teal-800 underline decoration-2 underline-offset-2 hover:decoration-teal-800 transition-colors font-medium">')

    // 改行を適切に処理
    if (!formatted.includes('<p>') && !formatted.includes('<h')) {
      formatted = formatted.replace(/\n\n/g, '</p><p class="mb-6 leading-relaxed text-gray-700 text-lg">')
      formatted = formatted.replace(/\n/g, '<br>')
      formatted = '<p class="mb-6 leading-relaxed text-gray-700 text-lg">' + formatted + '</p>'
    }

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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 md:px-12 md:py-12">
            {/* Content Body */}
            <div
              className="wordpress-content max-w-none"
              style={{
                fontFamily: '"Yu Gothic", "游ゴシック", YuGothic, "游ゴシック体", sans-serif',
                lineHeight: '1.8',
                color: '#333'
              }}
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />
          </div>
        </div>

        {/* WordPress-like Custom Styles */}
        <style jsx>{`
          .wordpress-content {
            font-size: 16px;
          }

          .wordpress-content .wp-h2 {
            font-family: inherit;
            font-weight: bold;
            text-align: center;
            position: relative;
            margin: 2rem 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .wordpress-content .wp-h3 {
            font-family: inherit;
            position: relative;
            background: linear-gradient(90deg, #0d9488, #3b82f6);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            border-bottom: 3px solid;
            border-image: linear-gradient(90deg, #0d9488, #3b82f6) 1;
          }

          .wordpress-content .wp-h4 {
            font-family: inherit;
            border-radius: 6px;
            background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
          }

          .wordpress-content ul li::before {
            content: "✓";
            font-weight: bold;
            color: #0d9488;
            position: absolute;
            left: 0;
          }

          .wordpress-content blockquote {
            position: relative;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .wordpress-content blockquote::before {
            content: """;
            font-size: 4rem;
            color: #0d9488;
            position: absolute;
            top: -10px;
            left: 10px;
            font-family: serif;
          }

          .wordpress-content img {
            transition: transform 0.3s ease;
          }

          .wordpress-content img:hover {
            transform: scale(1.02);
          }

          .wordpress-content a:hover {
            text-decoration-thickness: 3px;
          }

          /* YouTube iframe responsive */
          .wordpress-content iframe {
            max-width: 100%;
            border-radius: 12px;
          }

          /* Instagram embed styling */
          .wordpress-content .instagram-media {
            margin: 2rem auto !important;
            max-width: 540px !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
          }
        `}</style>

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