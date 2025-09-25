import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string
}

export default function ArticlesDebug() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    console.log('🔍 記事取得開始...')
    setLoading(true)
    setError(null)

    try {
      const { data, error: supabaseError, count } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt', { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5)

      console.log('📊 Supabase応答:')
      console.log('  データ:', data)
      console.log('  エラー:', supabaseError)
      console.log('  件数:', count)

      if (supabaseError) {
        console.error('❌ Supabaseエラー:', supabaseError)
        setError(`Supabaseエラー: ${supabaseError.message}`)
      } else {
        console.log('✅ 記事取得成功:', data?.length, '件')
        setArticles(data || [])
      }
    } catch (err) {
      console.error('❌ 予期しないエラー:', err)
      setError(`予期しないエラー: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">デバッグ: 記事を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラー発生</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchArticles}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          記事デバッグページ ({articles.length}件)
        </h1>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">記事が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {article.title}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  ID: {article.id}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Slug: {article.slug}
                </p>
                {article.excerpt && (
                  <p className="text-gray-600">
                    {article.excerpt.substring(0, 100)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={fetchArticles}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    </div>
  )
}