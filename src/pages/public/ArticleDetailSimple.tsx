import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, ArrowLeft, Clock, Eye, Share2, Heart, BookOpen, ListOrdered, ChevronRight, Twitter, Facebook, MessageCircle, Copy, CheckCircle, Home, FolderOpen, Tag, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import OptimizedYouTubeThumbnail from '../../components/OptimizedYouTubeThumbnail'

// Instagram埋め込み型定義削除（シンプルなリンクに変更したため）

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

interface Category {
  id: string
  name: string
  slug: string
  description?: string
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
  const [showToc, setShowToc] = useState(true) // デフォルトで目次セクションを表示
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [readingProgress, setReadingProgress] = useState(0)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (slug) {
      fetchArticle(slug)
    }
  }, [slug])

  // Instagram埋め込みスクリプトは削除（シンプルなリンクに変更したため）

  async function fetchArticle(articleSlug: string) {
    try {
      setLoading(true)
      setError(null)

      // URLパラメータをエンコードしたまま保持
      // ブラウザが自動的にデコードしてしまうので、再度エンコードする
      const encodedSlug = encodeURIComponent(articleSlug).toLowerCase()

      const { data, error: supabaseError } = await supabase
        .from('articles')
        .select(`
          *,
          article_categories(id, name, slug, description)
        `)
        .eq('slug', encodedSlug)
        .eq('status', 'published')
        .single()

      if (supabaseError) {
        setError('記事が見つかりませんでした')
      } else {

        setArticle(data)
        // カテゴリ情報をセット
        if (data.article_categories) {
          setCategory(data.article_categories)
        }
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

    try {
      let formatted = content

      // HTMLエンティティをデコード（&lt; を < に変換など）
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = formatted
      formatted = tempDiv.innerHTML

      // コンテンツがプレーンテキストの場合、基本的なHTMLタグを追加
      const hasHtmlTags = /<(h[1-6]|p|div|ul|ol|li|blockquote|strong|em|a|img)[^>]*>/i.test(formatted)

      if (!hasHtmlTags) {
        // プレーンテキストの場合、段落と見出しを自動生成
        console.log('📝 プレーンテキストを検出 - HTML変換を実行')

        // 基本的な見出し構造を追加
        formatted = formatted
          // 見出しパターン（行頭の■や●など）を h2 に変換
          .replace(/^[■●▼▲◆◇【]\s*(.+?)[\】]?$/gm, '<h2>$1</h2>')
          // 数字付き見出しを h3 に変換
          .replace(/^(\d+)[\.、]\s*(.+)$/gm, '<h3>$2</h3>')
          // 箇条書きをリストに変換
          .replace(/^[・•]\s*(.+)$/gm, '<li>$1</li>')

        // リストタグで囲む
        formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

        // 改行を段落に変換
        const paragraphs = formatted.split(/\n\n+/)
        formatted = paragraphs
          .map(p => {
            // 既にHTMLタグがある場合はそのまま
            if (/<[^>]+>/.test(p)) return p
            // 空行はスキップ
            if (!p.trim()) return ''
            // 通常のテキストは段落タグで囲む
            return `<p>${p.replace(/\n/g, '<br>')}</p>`
          })
          .filter(p => p)
          .join('\n')
      }

    // YouTube URLを最適化されたサムネイルに変換
    formatted = formatted.replace(
      /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
      '<div class="youtube-placeholder my-8 mx-auto max-w-4xl" data-video-id="$1"></div>'
    )

    // Instagram URLをシンプルなリンクに変換（埋め込みは問題があるため）
    formatted = formatted.replace(
      /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)\/?/g,
      '<div class="my-8 mx-auto max-w-lg p-4 border-2 border-pink-200 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50"><a href="https://www.instagram.com/p/$1/" target="_blank" rel="noopener" class="flex items-center justify-center text-pink-600 hover:text-pink-800 font-semibold text-lg"><svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>Instagramで見る</a></div>'
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

    // 段落のスタイリング - より読みやすく
    formatted = formatted.replace(/<p([^>]*)>/g, '<p$1 class="mb-8 leading-loose text-gray-800 text-lg md:text-xl font-light tracking-wide">')

    // リストのスタイリング - より視覚的に
    formatted = formatted.replace(/<ul([^>]*)>/g, '<ul$1 class="mb-8 pl-0 space-y-4 list-none bg-gradient-to-r from-gray-50 to-white p-6 rounded-lg border-l-4 border-teal-400">')
    formatted = formatted.replace(/<ol([^>]*)>/g, '<ol$1 class="mb-8 pl-6 space-y-4 list-decimal bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg border-l-4 border-blue-400">')
    formatted = formatted.replace(/<li([^>]*)>/g, '<li$1 class="relative pl-8 text-gray-800 text-lg leading-relaxed py-2 before:content-[\'▶\'] before:absolute before:left-0 before:text-teal-600 before:font-bold before:text-xl">')

    // 引用のスタイリング - より目立つように
    formatted = formatted.replace(/<blockquote([^>]*)>/g, '<blockquote$1 class="my-10 pl-8 pr-6 py-6 border-l-8 border-gradient-to-b from-purple-400 to-pink-400 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 italic text-gray-800 text-xl leading-relaxed rounded-r-2xl shadow-lg relative">')

    // 強調テキストのスタイリング - よりインパクトのある表現
    formatted = formatted.replace(/<strong([^>]*)>/g, '<strong$1 class="font-bold text-gray-900 bg-gradient-to-r from-yellow-200 to-yellow-300 px-3 py-1 rounded-lg shadow-sm border border-yellow-400 text-lg">')
    formatted = formatted.replace(/<em([^>]*)>/g, '<em$1 class="italic text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded border-l-2 border-purple-400">')

    // 画像のスタイリング - より魅力的に（クリックでライトボックス表示）
    formatted = formatted.replace(/<img([^>]*?)>/g, '<img$1 class="my-12 mx-auto max-w-full h-auto rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border-4 border-white cursor-zoom-in" loading="lazy" data-lightbox="true">')

    // リンクのスタイリング - より目立つように
    formatted = formatted.replace(/<a([^>]*?)>/g, '<a$1 class="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md underline decoration-2 underline-offset-4 hover:decoration-blue-800 transition-all duration-200 font-semibold border border-blue-200 hover:border-blue-300">')

    // 改行を適切に処理 - より読みやすく
    if (!formatted.includes('<p>') && !formatted.includes('<h')) {
      formatted = formatted.replace(/\n\n/g, '</p><p class="mb-8 leading-loose text-gray-800 text-lg md:text-xl font-light tracking-wide">')
      formatted = formatted.replace(/\n/g, '<br class="mb-4">')
      formatted = '<p class="mb-8 leading-loose text-gray-800 text-lg md:text-xl font-light tracking-wide">' + formatted + '</p>'
    }

      return formatted
    } catch (error) {
      console.error('❌ コンテンツフォーマットエラー:', error)
      // エラーが発生した場合は元のコンテンツを返す
      return content
    }
  }

  function generateToc(content: string): TocItem[] {
    try {
      const tocItems: TocItem[] = []
      const headingRegex = /<h([234])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[234]>/gi
      let match

      while ((match = headingRegex.exec(content)) !== null) {
        const level = parseInt(match[1])
        const id = match[2]
        const text = match[3].replace(/<[^>]*>/g, '').trim()

        if (id && text) {
          tocItems.push({
            id,
            text,
            level
          })
        }
      }

      return tocItems
    } catch (error) {
      console.error('❌ 目次生成エラー:', error)
      return []
    }
  }

  useEffect(() => {
    if (article && article.content) {
      try {
        const formattedContent = formatContent(article.content)
        const tocItems = generateToc(formattedContent)
        setTocItems(tocItems)
        // setShowTocは削除 - 常に目次セクションを表示
      } catch (error) {
        console.error('❌ 記事処理エラー:', error)
        // エラーが発生した場合は目次なしで続行
        setTocItems([])
      }
    }
  }, [article])

  // YouTubeプレースホルダーを最適化コンポーネントに置き換え
  useEffect(() => {
    if (contentRef.current) {
      const placeholders = contentRef.current.querySelectorAll('.youtube-placeholder')
      placeholders.forEach((placeholder) => {
        const videoId = placeholder.getAttribute('data-video-id')
        if (videoId) {
          // ReactDOMを使わずに直接DOMで画像を作成
          const container = document.createElement('div')
          container.className = 'my-8 mx-auto max-w-4xl'

          const img = document.createElement('img')
          img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          img.alt = 'YouTube thumbnail'
          img.className = 'w-full h-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300'
          img.loading = 'lazy'

          const playButton = document.createElement('div')
          playButton.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full w-16 h-16 flex items-center justify-center hover:bg-red-700 transition-colors'
          playButton.innerHTML = '<svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M8 5v10l8-5-8-5z"/></svg>'

          const wrapper = document.createElement('div')
          wrapper.className = 'relative'
          wrapper.appendChild(img)
          wrapper.appendChild(playButton)

          container.appendChild(wrapper)

          // クリックでYouTube再生
          container.addEventListener('click', () => {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')
          })

          placeholder.replaceWith(container)
        }
      })
    }
  }, [article])

  // スクロール位置に応じて目次のアクティブ項目と読書進捗を更新
  useEffect(() => {
    if (!showToc || tocItems.length === 0) return

    const handleScroll = () => {
      // 読書進捗の計算
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const progress = Math.min((scrollTop / (documentHeight - windowHeight)) * 100, 100)
      setReadingProgress(progress)

      // アクティブなセクションの判定
      const headings = tocItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id)
      })).filter(item => item.element !== null)

      if (headings.length === 0) return

      // 各見出しの位置を取得
      const scrollPosition = scrollTop + 100 // オフセット調整

      let activeId = null
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i]
        if (heading.element) {
          const rect = heading.element.getBoundingClientRect()
          const absoluteTop = rect.top + scrollTop

          if (absoluteTop <= scrollPosition) {
            activeId = heading.id
            break
          }
        }
      }

      // 最初のセクションより上にいる場合は最初のセクションをアクティブに
      if (activeId === null && headings.length > 0) {
        activeId = headings[0].id
      }

      setActiveHeadingId(activeId)
    }

    // 初回実行
    handleScroll()

    // スクロールイベントリスナー
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [tocItems, showToc])

  // 画像クリックでライトボックス表示
  useEffect(() => {
    if (!contentRef.current) return

    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG' && target.dataset.lightbox === 'true') {
        const imgSrc = (target as HTMLImageElement).src
        setLightboxImage(imgSrc)
      }
    }

    contentRef.current.addEventListener('click', handleImageClick)

    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('click', handleImageClick)
      }
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

      // slugにHTMLタグが含まれている記事を除外
      const validArticles = (data || []).filter(article => {
        // slugがHTMLタグで始まっていないかチェック
        if (!article.slug || article.slug.startsWith('<')) {
          console.warn('Invalid slug detected:', article.slug)
          return false
        }
        return true
      })

      return validArticles
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

  // シェア機能
  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`${article.title} | 推し活コレクション`)
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank')
  }

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
  }

  const shareToLine = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(article.title)
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank')
  }

  const copyUrlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (err) {
      console.error('URLのコピーに失敗しました:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* 読書進捗バー */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dynamic Breadcrumb */}
          <nav className="flex items-center text-sm text-white/80 mb-6">
            <Link
              to="/"
              className="flex items-center hover:text-white transition-colors group"
            >
              <Home className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
              ホーム
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-white/60" />

            <Link
              to="/articles"
              className="flex items-center hover:text-white transition-colors group"
            >
              <BookOpen className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
              記事一覧
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-white/60" />

            {category && (
              <>
                <Link
                  to={`/articles?category=${category.slug}`}
                  className="flex items-center hover:text-white transition-colors group"
                >
                  <FolderOpen className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
                  {category.name}
                </Link>
                <ChevronRight className="w-4 h-4 mx-2 text-white/60" />
              </>
            )}

            <span className="text-white font-medium truncate max-w-xs">
              {article?.title || '記事詳細'}
            </span>
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
                <span>約{readingTime}分で読めます</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Eye className="w-4 h-4" />
                <span>{randomViews}回読まれています</span>
              </div>

              {category && (
                <Link
                  to={`/articles?category=${category.slug}`}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm transition-colors group"
                >
                  <Tag className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>{category.name}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Content Layout - 常に一貫したレイアウトを使用 */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Article Content - 左側、幅拡大 */}
          <div className="flex-1 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-8 md:px-12 md:py-12">
                {/* Content Body */}
                <div
                  ref={contentRef}
                  className="wordpress-content max-w-none"
                  style={{
                    fontFamily: '"Yu Gothic", "游ゴシック", YuGothic, "游ゴシック体", "Hiragino Sans", "ヒラギノ角ゴ ProN W3", "Hiragino Kaku Gothic ProN", sans-serif',
                    lineHeight: '1.9',
                    color: '#2d3748',
                    letterSpacing: '0.02em'
                  }}
                  dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
                />
              </div>
            </div>
          </div>

          {/* Table of Contents - 右側に移動、幅をコンパクトに */}
          <div className="lg:w-72 lg:order-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-8">
              {/* 目次セクション - 常に表示 */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <ListOrdered className="w-5 h-5 text-teal-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">目次</h3>
                </div>

                {tocItems.length > 0 ? (
                  <nav className="space-y-2">
                    {tocItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => scrollToHeading(item.id)}
                        className={`
                          flex items-start w-full text-left p-2 rounded-lg transition-all group
                          ${item.level === 2 ? 'font-medium' :
                            item.level === 3 ? 'ml-4' :
                            'ml-8 text-sm'}
                          ${activeHeadingId === item.id
                            ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-500'
                            : 'hover:bg-gray-50 text-gray-700 border-l-2 border-transparent hover:border-purple-300'}
                        `}
                      >
                        <ChevronRight className="w-4 h-4 text-teal-500 mr-2 mt-0.5 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                        <span className="leading-relaxed">{item.text}</span>
                      </button>
                    ))}
                  </nav>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">
                      この記事には見出しがありません
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      記事を読みやすくするため、<br />
                      見出しタグ（h2, h3）の追加を<br />
                      おすすめします
                    </p>
                  </div>
                )}
              </div>

              {/* シェア機能 - 常に表示 */}
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <Share2 className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">記事を共有</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={shareToTwitter}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button
                    onClick={shareToFacebook}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                  <button
                    onClick={shareToLine}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    LINE
                  </button>
                  <button
                    onClick={copyUrlToClipboard}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      copiedUrl 
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedUrl ? 'コピー済' : 'URLをコピー'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-16">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="relative">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-10 flex items-center">
                  <BookOpen className="w-8 h-8 text-purple-600 mr-3" />
                  おすすめの関連記事
                </h3>
                <div className="absolute -top-2 left-0 w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedArticles.map((relatedArticle, index) => (
                  <Link
                    key={relatedArticle.id}
                    to={`/articles/${relatedArticle.slug}`}
                    className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                  >
                    {/* カードの装飾的な要素 */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-full"></div>

                    {/* サムネイル画像 */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                      {relatedArticle.featured_image_url ? (
                        <img
                          src={relatedArticle.featured_image_url}
                          alt={relatedArticle.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-purple-300" />
                        </div>
                      )}

                      {/* オーバーレイグラデーション */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* インデックス番号バッジ */}
                      <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-purple-600 font-bold">{index + 1}</span>
                      </div>
                    </div>

                    {/* コンテンツ部分 */}
                    <div className="p-6">
                      <h4 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300">
                        {relatedArticle.title}
                      </h4>

                      {relatedArticle.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                          {relatedArticle.excerpt}
                        </p>
                      )}

                      {/* メタ情報 */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5 text-purple-400" />
                          {new Date(relatedArticle.published_at).toLocaleDateString('ja-JP')}
                        </div>

                        {/* 読むボタン風の矢印 */}
                        <div className="flex items-center text-purple-600 font-medium group-hover:translate-x-1 transition-transform duration-300">
                          読む
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>

                    {/* ホバー時のボーダーアニメーション */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-purple-300 transition-colors duration-300 pointer-events-none"></div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WordPress-like Custom Styles */}
        <style jsx>{`
          .wordpress-content {
            font-size: 18px;
            line-height: 1.8;
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
            font-size: 16px;
          }

          .wordpress-content blockquote::before {
            content: '"';
            font-size: 4rem;
            color: #a855f7;
            position: absolute;
            top: -10px;
            left: 10px;
            font-family: serif;
            opacity: 0.3;
          }
        `}</style>
      </div>

      {/* ライトボックス */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          {/* 閉じるボタン */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors z-[101]"
            aria-label="閉じる"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* 画像コンテナ */}
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={lightboxImage}
              alt="拡大表示"
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl animate-zoomIn"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 操作説明 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm">
            画像の外側をクリックで閉じる
          </div>
        </div>
      )}
    </div>
  )
}