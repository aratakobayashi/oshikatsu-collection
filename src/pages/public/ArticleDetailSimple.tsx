import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, ArrowLeft, Clock, Eye, Share2, Heart, BookOpen, ListOrdered, ChevronRight, Twitter, Facebook, MessageCircle, Copy, CheckCircle } from 'lucide-react'
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

interface TocItem {
  id: string
  text: string
  level: number
}

// 読了時間を計算
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// シェア機能
// 各SNSプラットフォーム用のシェア関数
function shareToTwitter(title: string, url: string) {
  const text = `${title} | 推し活ガイド`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  window.open(twitterUrl, '_blank', 'width=600,height=400')
}

function shareToFacebook(url: string) {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  window.open(facebookUrl, '_blank', 'width=600,height=400')
}

function shareToLine(title: string, url: string) {
  const text = `${title} | 推し活ガイド`
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(`${text}\n${url}`)}`
  window.open(lineUrl, '_blank')
}

async function copyUrlToClipboard(url: string, setCopiedUrl: (value: boolean) => void) {
  try {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  } catch (error) {
    // フォールバック：古いブラウザ対応
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }
}

// 汎用シェア関数（ネイティブシェアAPI対応）
function handleShare(title: string, url: string) {
  if (navigator.share) {
    navigator.share({
      title,
      url
    })
  } else {
    // フォールバック：URLコピー
    copyUrlToClipboard(url, () => {})
    alert('URLをコピーしました！')
  }
}

export default function ArticleDetailSimple() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [showToc, setShowToc] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

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

      const { data, error: supabaseError } = await supabase
        .from('articles')
        .select('id, title, slug, content, excerpt, published_at, featured_image_url')
        .eq('slug', encodedSlug)
        .eq('status', 'published')
        .single()

      if (supabaseError) {
        setError('記事が見つかりませんでした')
      } else {
        setArticle(data)
      }
    } catch (error) {
      console.error('予期しないエラー:', error)
      setError('記事の読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 関連記事を取得するuseEffect
  useEffect(() => {
    if (article && article.id && article.category_id) {
      fetchRelatedArticles(article.id, article.category_id).then(setRelatedArticles)
    }
  }, [article])

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

    // 見出しにIDを追加してTOC用のアンカーを作成
    let headingIdCounter = 0
    const generateHeadingId = (text: string): string => {
      headingIdCounter++
      const cleanText = text.replace(/<[^>]*>/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
      return `heading-${headingIdCounter}-${cleanText.substring(0, 30)}`
    }

    // WordPressスタイルの見出しを強化（IDを追加）
    formatted = formatted.replace(/<h2([^>]*?)>(.*?)<\/h2>/g, (match, attrs, content) => {
      const id = generateHeadingId(content)
      return `<h2${attrs} id="${id}" class="wp-h2 text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 my-8 rounded-lg shadow-md border-t-4 border-b-4 border-teal-800">${content}</h2>`
    })
    formatted = formatted.replace(/<h3([^>]*?)>(.*?)<\/h3>/g, (match, attrs, content) => {
      const id = generateHeadingId(content)
      return `<h3${attrs} id="${id}" class="wp-h3 text-xl md:text-2xl font-semibold text-gray-800 pb-2 mb-4 mt-8 border-b-2 border-gradient bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-border" style="border-image: linear-gradient(to right, #0d9488, #3b82f6) 1;">${content}</h3>`
    })
    formatted = formatted.replace(/<h4([^>]*?)>(.*?)<\/h4>/g, (match, attrs, content) => {
      const id = generateHeadingId(content)
      return `<h4${attrs} id="${id}" class="wp-h4 text-lg md:text-xl font-semibold text-gray-800 mb-3 mt-6 pl-4 border-l-4 border-teal-500 bg-teal-50 py-2">${content}</h4>`
    })

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

  function generateToc(content: string): TocItem[] {
    const tocItems: TocItem[] = []
    const headingRegex = /<h([234])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[234]>/gi
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1])
      const id = match[2]
      const text = match[3].replace(/<[^>]*>/g, '').trim()
      
      tocItems.push({
        id,
        text,
        level
      })
    }

    return tocItems
  }

  useEffect(() => {
    if (article && article.content) {
      const formattedContent = formatContent(article.content)
      const tocItems = generateToc(formattedContent)
      setTocItems(tocItems)
      setShowToc(tocItems.length > 2)
    }
  }, [article])

  function scrollToHeading(id: string) {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async function fetchRelatedArticles(currentArticleId: string, categoryId?: string): Promise<Article[]> {
    if (!categoryId) return []

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at, featured_image_url, category_id')
        .eq('status', 'published')
        .eq('category_id', categoryId)
        .neq('id', currentArticleId)
        .order('published_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('関連記事取得エラー:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('関連記事取得エラー:', error)
      return []
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents */}
          {showToc && tocItems.length > 0 && (
            <div className="lg:w-80">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-8">
                <div className="flex items-center mb-4">
                  <ListOrdered className="w-5 h-5 text-teal-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">目次</h3>
                </div>
                <nav className="space-y-2">
                  {tocItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToHeading(item.id)}
                      className={`
                        flex items-start w-full text-left p-2 rounded-lg transition-all hover:bg-gray-50 group
                        ${item.level === 2 ? 'text-gray-900 font-medium' :
                          item.level === 3 ? 'text-gray-700 ml-4' :
                          'text-gray-600 ml-8 text-sm'}
                      `}
                    >
                      <ChevronRight className="w-4 h-4 text-teal-500 mr-2 mt-0.5 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                      <span className="leading-relaxed">{item.text}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Article Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-8 md:px-12 md:py-12">
                {/* Content Body */}
                <div
                  ref={contentRef}
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

              {/* SNSシェアボタン */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-gray-900 font-semibold mb-4 text-center">この記事をシェア</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Twitter */}
                  <button
                    onClick={() => shareToTwitter(article.title, window.location.href)}
                    className="flex flex-col items-center p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors duration-200 group"
                  >
                    <Twitter className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Twitter</span>
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={() => shareToFacebook(window.location.href)}
                    className="flex flex-col items-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 group"
                  >
                    <Facebook className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Facebook</span>
                  </button>

                  {/* LINE */}
                  <button
                    onClick={() => shareToLine(article.title, window.location.href)}
                    className="flex flex-col items-center p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 group"
                  >
                    <MessageCircle className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">LINE</span>
                  </button>

                  {/* URLコピー */}
                  <button
                    onClick={() => copyUrlToClipboard(window.location.href, setCopiedUrl)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${
                      copiedUrl
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {copiedUrl ? (
                      <CheckCircle className="w-6 h-6 mb-1" />
                    ) : (
                      <Copy className="w-6 h-6 mb-1" />
                    )}
                    <span className="text-xs font-medium">
                      {copiedUrl ? 'コピー済' : 'URLコピー'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">関連記事</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    to={`/articles/${relatedArticle.slug}`}
                    className="group block bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:bg-gray-100"
                  >
                    {/* Featured Image */}
                    <div className="aspect-video w-full overflow-hidden bg-gray-200">
                      {relatedArticle.featured_image_url ? (
                        <img
                          src={relatedArticle.featured_image_url}
                          alt={relatedArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-4xl">📄</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {relatedArticle.title}
                      </h4>
                      {relatedArticle.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {relatedArticle.excerpt}
                        </p>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <time dateTime={relatedArticle.published_at}>
                          {new Date(relatedArticle.published_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </time>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  to="/articles"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  記事一覧を見る
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  )
}