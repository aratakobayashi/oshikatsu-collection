/**
 * データ状況確認コンポーネント
 * 現在のモックデータベースの状況をリアルタイム表示
 */

import React, { useState, useEffect } from 'react'
import { Database, RefreshCw, Search, AlertCircle } from 'lucide-react'
import { mockDb } from '../lib/mock-database'

interface DataStats {
  celebrities: any[]
  episodes: any[]
  items: any[]
  locations: any[]
  works: any[]
  posts: any[]
}

export default function DataStatusCheck() {
  const [stats, setStats] = useState<DataStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTest, setSearchTest] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 自動更新（5秒ごと）
  useEffect(() => {
    checkDataStatus()
    const interval = setInterval(checkDataStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const checkDataStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 全データ取得
      const [
        celebrities,
        episodes, 
        items,
        locations,
        works,
        posts
      ] = await Promise.all([
        mockDb.celebrities.getAll(),
        mockDb.episodes.getAll(),
        mockDb.items.getAll(),
        mockDb.locations.getAll(),
        mockDb.works.getAll(),
        mockDb.posts.getAll()
      ])

      setStats({
        celebrities,
        episodes,
        items,
        locations,
        works,
        posts
      })

      // 検索テスト
      if (celebrities.length > 0) {
        const searchResults = await mockDb.celebrities.unifiedSearch('配信者テスト01')
        setSearchTest({
          query: '配信者テスト01',
          results: searchResults.length,
          firstResult: searchResults[0]?.name || null
        })
      }

    } catch (err: any) {
      console.error('データ状況チェックエラー:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 開発環境チェック
  const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development'
  const isLocalEnvironment = import.meta.env.VITE_SUPABASE_URL?.includes('localhost')

  if (!isDevelopment || !isLocalEnvironment) {
    return null // 開発環境以外では表示しない
  }

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium text-gray-800">モックデータ状況</h4>
        </div>
        <button
          onClick={checkDataStatus}
          disabled={loading}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>更新</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* データ統計 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">{stats.celebrities.length}</div>
              <div className="text-xs text-gray-500">チャンネル</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">{stats.episodes.length}</div>
              <div className="text-xs text-gray-500">エピソード</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-600">{stats.items.length}</div>
              <div className="text-xs text-gray-500">アイテム</div>
            </div>
          </div>

          {/* 検索テスト結果 */}
          {searchTest && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">検索テスト</span>
              </div>
              <div className="text-sm text-blue-700">
                <p>クエリ: "{searchTest.query}"</p>
                <p>結果: {searchTest.results}件</p>
                {searchTest.firstResult && (
                  <p>最初の結果: {searchTest.firstResult}</p>
                )}
              </div>
            </div>
          )}

          {/* チャンネル詳細 */}
          {stats.celebrities.length > 0 && (
            <div className="bg-white rounded-lg p-3">
              <h5 className="font-medium text-gray-800 mb-2">登録チャンネル:</h5>
              <div className="space-y-1">
                {stats.celebrities.slice(0, 3).map((celebrity: any) => (
                  <div key={celebrity.id} className="text-sm text-gray-600 flex justify-between">
                    <span>📺 {celebrity.name}</span>
                    <span className="text-xs text-gray-500">{celebrity.type}</span>
                  </div>
                ))}
                {stats.celebrities.length > 3 && (
                  <div className="text-sm text-gray-500">...他{stats.celebrities.length - 3}件</div>
                )}
              </div>
            </div>
          )}

          {/* データなしの場合 */}
          {stats.celebrities.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800 text-sm">
                  テストデータが作成されていません。上の「ユーザージャーニー用データ作成」ボタンをクリックしてください。
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}