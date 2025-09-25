import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, Eye, Tag, ArrowLeft, Share2, Clock, User, ChevronRight, Twitter, Facebook, MessageCircle, Bookmark, Hash } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { createClient } from '@supabase/supabase-js'
import { Helmet } from 'react-helmet-async'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image_url?: string
  published_at: string
  status: string
  created_at: string
  reading_time?: number
  category_id?: string
  tag_ids?: string[]
  view_count?: number
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

interface TOCItem {
  id: string
  text: string
  level: number
}

export default function ArticleDetailImproved() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [tags, setTags] = useState<TagType[]>([])
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [toc, setToc] = useState<TOCItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    if (slug) {
      fetchArticle(slug)
    }
  }, [slug])

  useEffect(() => {
    // スクロール監視で現在のセクションをハイライト
    const handleScroll = () => {
      const headings = document.querySelectorAll('.article-heading')
      let current = ''

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top < 150) {
          current = heading.id
        }
      })

      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  async function fetchArticle(articleSlug: string) {
    try {
      setLoading(true)

      // 記事を取得（複数のslugパターンで試行）
      let { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', articleSlug)
        .eq('status', 'published')
        .single()

      if (error && /[^\x00-\x7F]/.test(articleSlug)) {
        const encodedSlug = encodeURIComponent(articleSlug)
        const result = await supabase
          .from('articles')
          .select('*')
          .eq('slug', encodedSlug)
          .eq('status', 'published')
          .single()
        data = result.data
        error = result.error
      }

      if (error && articleSlug.includes('%')) {
        const decodedSlug = decodeURIComponent(articleSlug)
        const result = await supabase
          .from('articles')
          .select('*')
          .eq('slug', decodedSlug)
          .eq('status', 'published')
          .single()
        data = result.data
        error = result.error
      }

      if (error || !data) {
        setError('記事が見つかりませんでした')
        return
      }

      setArticle(data)

      // ビューカウントを増やす
      await supabase
        .from('articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id)

      // カテゴリを取得
      if (data.category_id) {
        const { data: categoryData } = await supabase
          .from('article_categories')
          .select('*')
          .eq('id', data.category_id)
          .single()
        setCategory(categoryData)
      }

      // タグを取得
      if (data.tag_ids && data.tag_ids.length > 0) {
        const { data: tagsData } = await supabase
          .from('tags')
          .select('*')
          .in('id', data.tag_ids)
        setTags(tagsData || [])
      }

      // 関連記事を取得
      await fetchRelatedArticles(data)

      // 目次を生成
      generateTOC(data.content)

    } catch (error) {
      console.error('Error fetching article:', error)
      setError('記事の読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  async function fetchRelatedArticles(currentArticle: Article) {
    try {
      let query = supabase
        .from('articles')
        .select('id, title, slug, excerpt, featured_image_url, published_at')
        .eq('status', 'published')
        .neq('id', currentArticle.id)
        .limit(3)

      // 同じカテゴリの記事を優先
      if (currentArticle.category_id) {
        query = query.eq('category_id', currentArticle.category_id)
      }

      const { data } = await query

      // 3件未満の場合は最新記事で補完
      if (data && data.length < 3) {
        const { data: additionalData } = await supabase
          .from('articles')
          .select('id, title, slug, excerpt, featured_image_url, published_at')
          .eq('status', 'published')
          .neq('id', currentArticle.id)
          .order('published_at', { ascending: false })
          .limit(3 - data.length)

        setRelatedArticles([...data, ...(additionalData || [])])
      } else {
        setRelatedArticles(data || [])
      }
    } catch (error) {
      console.error('関連記事の取得エラー:', error)
    }
  }

  function generateTOC(content: string) {
    if (!content) return

    const tocItems: TOCItem[] = []
    const sections = content.split('\n\n').filter(section => section.trim())

    sections.forEach((section, index) => {
      const trimmedSection = section.trim()

      // 見出しを検出
      if (trimmedSection.startsWith('【') && trimmedSection.includes('】')) {
        tocItems.push({
          id: `heading-${index}`,
          text: trimmedSection.replace(/【|】/g, ''),
          level: 1
        })
      } else if (
        trimmedSection.length > 20 &&
        (trimmedSection.includes('｜') ||
         trimmedSection.endsWith('？') ||
         trimmedSection.endsWith('！') ||
         /^[0-9]+\./.test(trimmedSection) ||
         trimmedSection.startsWith('■') ||
         trimmedSection.startsWith('◆'))
      ) {
        tocItems.push({
          id: `heading-${index}`,
          text: trimmedSection.replace(/^[■◆]/, '').trim(),
          level: 2
        })
      }
    })

    setToc(tocItems)
  }

  function formatContent(content: string) {
    if (!content) return null

    const sections = content.split('\n\n').filter(section => section.trim())

    return sections.map((section, sectionIndex) => {
      const trimmedSection = section.trim()

      // 見出し（【】付き）
      if (trimmedSection.startsWith('【') && trimmedSection.includes('】')) {
        return (
          <h2
            key={sectionIndex}
            id={`heading-${sectionIndex}`}
            className="article-heading text-2xl font-bold text-purple-900 mb-6 mt-10 pb-3 border-b-2 border-purple-200"
          >
            {trimmedSection}
          </h2>
        )
      }

      // サブ見出し
      if (trimmedSection.length > 20 && (
        trimmedSection.includes('｜') ||
        trimmedSection.endsWith('？') ||
        trimmedSection.endsWith('！') ||
        /^[0-9]+\./.test(trimmedSection) ||
        trimmedSection.startsWith('■') ||
        trimmedSection.startsWith('◆')
      )) {
        return (
          <h3
            key={sectionIndex}
            id={`heading-${sectionIndex}`}
            className="article-heading text-xl font-semibold text-purple-800 mb-4 mt-8"
          >
            {trimmedSection}
          </h3>
        )
      }

      // リストアイテム
      if (/^[🔸🔹💫💖📷🎥💬✔️▼◎・]/.test(trimmedSection) || /^[0-9]+\./.test(trimmedSection)) {
        return (
          <div key={sectionIndex} className="bg-purple-50 rounded-lg p-4 mb-4 border-l-4 border-purple-200">
            <p className="text-gray-700 leading-relaxed font-medium">{trimmedSection}</p>
          </div>
        )
      }

      // 特別なコールアウト
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

      // 通常の段落
      const paragraphs = trimmedSection.split('\n').filter(p => p.trim())
      return paragraphs.map((paragraph, paragraphIndex) => {
        const trimmedParagraph = paragraph.trim()
        if (!trimmedParagraph) return null

        // 引用
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

  function getCategoryConfig(categorySlug: string) {
    const configs: { [key: string]: { icon: string; color: string } } = {
      'beginner-oshi': { icon: '🌟', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      'live-preparation': { icon: '👗', color: 'bg-pink-100 text-pink-800 border-pink-300' },
      'venue-guide': { icon: '🏢', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      'idol-introduction': { icon: '💖', color: 'bg-red-100 text-red-800 border-red-300' },
      'live-report': { icon: '📝', color: 'bg-green-100 text-green-800 border-green-300' },
      'saving-tips': { icon: '💰', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    }
    return configs[categorySlug] || { icon: '📄', color: 'bg-gray-100 text-gray-800 border-gray-300' }
  }

  async function handleShare(platform: string) {
    if (!article) return

    const url = window.location.href
    const text = `${article.title} | 推し活ガイド`

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'line':
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('URLをコピーしました')
        break
    }
  }

  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">記事が見つかりません</h1>
            <p className="text-gray-600 mb-8">お探しの記事は削除されたか、URLが間違っている可能性があります。</p>
            <Link to="/articles">
              <Button variant="outline" className="inline-flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                記事一覧に戻る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.featured_image_url || "https://collection.oshikatsu-guide.com/og-default.jpg",
    "datePublished": article.published_at,
    "dateModified": article.published_at,
    "author": {
      "@type": "Organization",
      "name": "推し活ガイド編集部"
    },
    "publisher": {
      "@type": "Organization",
      "name": "推し活ガイド",
      "logo": {
        "@type": "ImageObject",
        "url": "https://collection.oshikatsu-guide.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    }
  }

  return (
    <>
      <Helmet>
        <title>{article.title} | 推し活ガイド</title>
        <meta name="description" content={article.excerpt} />

        {/* OGP Tags */}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={article.featured_image_url || "https://collection.oshikatsu-guide.com/og-default.jpg"} />
        <meta property="og:site_name" content="推し活ガイド" />
        <meta property="article:published_time" content={article.published_at} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta name="twitter:image" content={article.featured_image_url || "https://collection.oshikatsu-guide.com/og-default.jpg"} />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center space-x-2 text-sm">
              <Link to="/" className="text-gray-500 hover:text-gray-700">
                ホーム
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link to="/articles" className="text-gray-500 hover:text-gray-700">
                記事一覧
              </Link>
              {category && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <Link
                    to={`/articles?category=${category.slug}`}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {category.name}
                  </Link>
                </>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium truncate max-w-xs">
                {article.title}
              </span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main Content */}
            <article className="lg:col-span-2">
              {/* Article Header */}
              <header className="mb-8">
                {article.featured_image_url && (
                  <div className="mb-8">
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                )}

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  {article.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <time dateTime={article.published_at}>
                      {new Date(article.published_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    約{article.reading_time || Math.ceil(article.content.length / 400)}分
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {article.view_count || 0}回閲覧
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2"
                  >
                    <Twitter className="w-4 h-4" />
                    ツイート
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2"
                  >
                    <Facebook className="w-4 h-4" />
                    シェア
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('line')}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    LINE
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    URLコピー
                  </Button>
                </div>
              </header>

              {/* Table of Contents */}
              {toc.length > 0 && (
                <Card className="mb-8 bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                      <Bookmark className="w-5 h-5 mr-2" />
                      目次
                    </h2>
                    <nav>
                      <ul className="space-y-2">
                        {toc.map((item) => (
                          <li
                            key={item.id}
                            className={`${item.level === 2 ? 'ml-4' : ''}`}
                          >
                            <button
                              onClick={() => scrollToSection(item.id)}
                              className={`
                                text-left w-full py-1 px-2 rounded transition-all hover:bg-purple-100
                                ${activeSection === item.id ? 'bg-purple-100 text-purple-900 font-semibold' : 'text-purple-700'}
                              `}
                            >
                              {item.level === 2 && <span className="mr-2">└</span>}
                              {item.text}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </CardContent>
                </Card>
              )}

              {/* Article Content */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-8 md:p-12">
                  <div className="prose prose-lg max-w-none">
                    {formatContent(article.content)}
                  </div>
                </div>
              </div>

              {/* Category & Tags */}
              <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                {category && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">カテゴリー</h3>
                    <Link
                      to={`/articles?category=${category.slug}`}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryConfig(category.slug).color}`}
                    >
                      {getCategoryConfig(category.slug).icon} {category.name}
                    </Link>
                  </div>
                )}

                {tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">タグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Link
                          key={tag.id}
                          to={`/articles?tags=${tag.slug}`}
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                        >
                          <Hash className="w-3 h-3 mr-1" />
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Author */}
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    推
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">推し活ガイド編集部</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      推し活をもっと楽しく、もっとお得に。最新の推し活情報をお届けします。
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1 mt-8 lg:mt-0">
              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">関連記事</h2>
                    <div className="space-y-4">
                      {relatedArticles.map((relatedArticle) => (
                        <Link
                          key={relatedArticle.id}
                          to={`/articles/${relatedArticle.slug}`}
                          className="block group"
                        >
                          <div className="flex gap-3">
                            {relatedArticle.featured_image_url && (
                              <div className="flex-shrink-0 w-20 h-20">
                                <img
                                  src={relatedArticle.featured_image_url}
                                  alt={relatedArticle.title}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                {relatedArticle.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(relatedArticle.published_at).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}