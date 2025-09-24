import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  published_at: string
  featured_image_url?: string
}

export default function ArticlesSimple() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at, featured_image_url')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('記事取得エラー:', error)
        return
      }

      setArticles(data || [])
    } catch (error) {
      console.error('予期しないエラー:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              📄 推し活ガイド記事
            </h1>
            <p className="text-xl md:text-2xl mb-2">
              WordPress移行完了！
            </p>
            <p className="text-lg">
              oshikatsu-guide.com から {articles.length} 件の記事を移行しました
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm">
                <strong>✅ 移行成功:</strong> WordPressから {articles.length} 件の記事が正常に移行されました！
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article key={article.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              {/* Featured Image */}
              {article.featured_image_url && (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  <Link
                    to={`/articles/${article.slug}`}
                    className="hover:text-purple-600 transition-colors"
                  >
                    {article.title}
                  </Link>
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(article.published_at).toLocaleDateString('ja-JP')}
                  </span>
                  <Link
                    to={`/articles/${article.slug}`}
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm hover:underline transition-colors"
                  >
                    続きを読む
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}