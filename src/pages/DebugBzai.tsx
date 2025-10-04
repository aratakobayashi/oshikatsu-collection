import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  published_at: string
}

function DebugBzai() {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    fetchBzaiArticle()
  }, [])

  async function fetchBzaiArticle() {
    try {
      setLoading(true)
      addLog('🔍 全記事を検索中...')

      // まず全記事をリストアップ
      const { data: allArticles, error: listError } = await supabase
        .from('articles')
        .select('id, title, slug, status')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20)

      if (listError) {
        addLog('❌ 記事一覧取得エラー: ' + listError.message)
      } else {
        addLog('📋 公開記事一覧:')
        allArticles?.forEach((article, index) => {
          addLog(`${index + 1}. ${article.title} (slug: ${article.slug})`)
        })
      }

      // B&ZAI関連記事を複数の条件で検索
      const searchTerms = ['bzai', 'BZAI', 'B&ZAI', 'バンザイ', 'ばんざい']
      let foundArticle = null

      for (const term of searchTerms) {
        addLog(`🔍 "${term}" で検索中...`)

        const { data: titleResults } = await supabase
          .from('articles')
          .select('id, title, slug, content, excerpt, published_at')
          .ilike('title', `%${term}%`)
          .eq('status', 'published')

        if (titleResults && titleResults.length > 0) {
          addLog(`✅ タイトル検索で ${titleResults.length} 件発見`)
          foundArticle = titleResults[0]
          break
        }

        const { data: slugResults } = await supabase
          .from('articles')
          .select('id, title, slug, content, excerpt, published_at')
          .ilike('slug', `%${term}%`)
          .eq('status', 'published')

        if (slugResults && slugResults.length > 0) {
          addLog(`✅ スラッグ検索で ${slugResults.length} 件発見`)
          foundArticle = slugResults[0]
          break
        }

        const { data: contentResults } = await supabase
          .from('articles')
          .select('id, title, slug, content, excerpt, published_at')
          .ilike('content', `%${term}%`)
          .eq('status', 'published')

        if (contentResults && contentResults.length > 0) {
          addLog(`✅ コンテンツ検索で ${contentResults.length} 件発見`)
          foundArticle = contentResults[0]
          break
        }
      }

      if (!foundArticle) {
        addLog('❌ B&ZAI関連記事が見つかりません')
        setError('B&ZAI関連記事が見つかりません')
        return
      }

      addLog('✅ B&ZAI記事を発見: ' + foundArticle.title)
      addLog('📊 コンテンツ長: ' + (foundArticle.content?.length || 0))
      setArticle(foundArticle)

      // YouTube URL検索
      const content = foundArticle.content || ''
      const youtubePatterns = [
        /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/g,
        /youtube/gi,
        /www\.youtube/gi
      ]

      addLog('🔍 YouTube URL検索開始')
      youtubePatterns.forEach((pattern, index) => {
        const matches = content.match(pattern)
        if (matches) {
          addLog(`✅ パターン${index + 1}で発見: ${matches.join(', ')}`)
        } else {
          addLog(`❌ パターン${index + 1}: なし`)
        }
      })

      // 🎬絵文字検索
      const movieEmoji = content.includes('🎬')
      addLog('🎬 映画絵文字の存在: ' + (movieEmoji ? 'あり' : 'なし'))

      if (movieEmoji) {
        const emojiIndex = content.indexOf('🎬')
        const surrounding = content.substring(emojiIndex - 100, emojiIndex + 300)
        addLog('🎬 絵文字周辺テキスト: ' + surrounding)
      }

    } catch (err) {
      addLog('❌ 予期しないエラー: ' + (err as Error).message)
      setError('記事の読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">B&ZAI記事を調査中...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">調査エラー</h2>
          <p className="text-gray-600 mb-6">{error || 'B&ZAI記事が見つかりませんでした'}</p>
          <button
            onClick={fetchBzaiArticle}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">B&ZAI記事データ調査</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 記事情報 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">記事情報</h2>
            <div className="space-y-2">
              <div><strong>タイトル:</strong> {article.title}</div>
              <div><strong>スラッグ:</strong> {article.slug}</div>
              <div><strong>ID:</strong> {article.id}</div>
              <div><strong>コンテンツ長:</strong> {article.content?.length || 0}文字</div>
              <div><strong>公開日:</strong> {new Date(article.published_at).toLocaleDateString('ja-JP')}</div>
            </div>
          </div>

          {/* コンテンツサンプル */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">コンテンツサンプル（最初の500文字）</h2>
            <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {article.content?.substring(0, 500) || 'コンテンツがありません'}
            </div>
          </div>
        </div>

        {/* 全コンテンツ */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">全コンテンツ</h2>
          <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {article.content || 'コンテンツがありません'}
          </div>
        </div>

        {/* デバッグログ */}
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">調査ログ</h2>
          <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
            {debugLog.map((log, index) => (
              <div key={index} className="text-sm text-gray-700 mb-1">
                {log}
              </div>
            ))}
          </div>
          <button
            onClick={() => setDebugLog([])}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            ログクリア
          </button>
        </div>
      </div>
    </div>
  )
}

export default DebugBzai