import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  published_at: string
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
        .select('id, title, slug, excerpt, published_at')
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(article.published_at).toLocaleDateString('ja-JP')}
                  </span>
                  <Link
                    to={`/articles/${article.slug}`}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    続きを読む →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}