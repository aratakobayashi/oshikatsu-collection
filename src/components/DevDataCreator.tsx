/**
 * 開発環境用データ作成コンポーネント
 * ブラウザから簡単にテストデータを作成・管理できる
 */

import React, { useState, useEffect } from 'react'
import { Play, Database, Trash2, Eye, RefreshCw, CheckCircle } from 'lucide-react'
import { mockDb } from '../lib/mock-database'
import {
  mainTestChannel,
  testEpisodes,
  testItems,
  testLocations,
  testWorks,
  testPosts
} from '../../scripts/complete-user-journey-data'

interface Stats {
  celebrities: number
  episodes: number
  items: number
  locations: number
  works: number
  posts: number
  total: number
}

export default function DevDataCreator() {
  const [isCreating, setIsCreating] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [createdData, setCreatedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 統計情報を取得
  const fetchStats = async () => {
    try {
      const currentStats = await mockDb.getStats()
      setStats(currentStats)
    } catch (err: any) {
      console.error('統計取得エラー:', err)
      setError(`統計取得エラー: ${err.message}`)
    }
  }

  // コンポーネント初期化時に統計を取得
  useEffect(() => {
    fetchStats()
  }, [])

  // 完全なユーザージャーニー用データを作成
  const createCompleteUserJourney = async () => {
    setIsCreating(true)
    setError(null)

    try {
      // 既存データをクリア
      await mockDb.clearAll()
      
      // 1. メインチャンネル作成
      const channel = await mockDb.celebrities.create(mainTestChannel)
      
      // 2. エピソード作成
      const episodes = []
      for (const episodeData of testEpisodes) {
        const episode = await mockDb.episodes.create(episodeData)
        episodes.push(episode)
      }
      
      // 3. アイテム作成
      const items = []
      for (const itemData of testItems) {
        const item = await mockDb.items.create(itemData)
        items.push(item)
      }
      
      // 4. ロケーション作成
      const locations = []
      for (const locationData of testLocations) {
        const location = await mockDb.locations.create(locationData)
        locations.push(location)
      }
      
      // 5. 作品作成
      const works = []
      for (const workData of testWorks) {
        const work = await mockDb.works.create(workData)
        works.push(work)
      }
      
      // 6. 投稿作成
      const posts = []
      for (const postData of testPosts) {
        const post = await mockDb.posts.create(postData)
        posts.push(post)
      }

      const result = {
        channel,
        episodes,
        items,
        locations,
        works,
        posts
      }

      setCreatedData(result)
      await fetchStats() // 統計を更新
      console.log('✅ テストデータ作成完了:', result)
      
    } catch (err: any) {
      console.error('❌ テストデータ作成エラー:', err)
      setError(`データ作成エラー: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // 全データクリア
  const clearAllData = async () => {
    setIsClearing(true)
    setError(null)

    try {
      await mockDb.clearAll()
      setCreatedData(null)
      await fetchStats()
      console.log('✅ 全データクリア完了')
    } catch (err: any) {
      console.error('❌ データクリアエラー:', err)
      setError(`データクリアエラー: ${err.message}`)
    } finally {
      setIsClearing(false)
    }
  }

  // 開発環境チェック
  const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development'
  const isLocalEnvironment = import.meta.env.VITE_SUPABASE_URL?.includes('localhost')

  if (!isDevelopment || !isLocalEnvironment) {
    return null // 開発環境以外では表示しない
  }

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6 mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <Database className="h-6 w-6 text-yellow-600" />
        <h3 className="text-lg font-semibold text-yellow-800">
          開発用データ作成ツール
        </h3>
      </div>

      <div className="bg-yellow-100 rounded-lg p-4 mb-6">
        <p className="text-yellow-700 text-sm mb-2">
          🚧 <strong>開発環境限定機能</strong>
        </p>
        <p className="text-yellow-600 text-sm">
          「配信者テスト01」を中心とした完全なユーザージャーニー用テストデータを作成できます。
          実在しない架空のデータなので安全に開発できます。
        </p>
      </div>

      {/* 統計情報 */}
      {stats && (
        <div className="bg-white rounded-lg p-4 mb-6 border">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            現在のデータ状況
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">チャンネル:</span>
              <span className="ml-2 font-medium">{stats.celebrities}件</span>
            </div>
            <div>
              <span className="text-gray-500">エピソード:</span>
              <span className="ml-2 font-medium">{stats.episodes}件</span>
            </div>
            <div>
              <span className="text-gray-500">アイテム:</span>
              <span className="ml-2 font-medium">{stats.items}件</span>
            </div>
            <div>
              <span className="text-gray-500">店舗・ロケ地:</span>
              <span className="ml-2 font-medium">{stats.locations}件</span>
            </div>
            <div>
              <span className="text-gray-500">作品:</span>
              <span className="ml-2 font-medium">{stats.works}件</span>
            </div>
            <div>
              <span className="text-gray-500">投稿:</span>
              <span className="ml-2 font-medium">{stats.posts}件</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <span className="text-gray-700 font-medium">
              総データ数: {stats.total}件
            </span>
          </div>
        </div>
      )}

      {/* 作成されたデータの概要 */}
      {createdData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-green-800 mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            作成完了したデータ
          </h4>
          <div className="text-sm text-green-700 space-y-1">
            <p>📺 {createdData.channel?.name} ({createdData.channel?.subscriber_count?.toLocaleString()}人登録)</p>
            <p>🎬 {createdData.episodes?.length}本のエピソード</p>
            <p>🛍️ {createdData.items?.length}個のアイテム</p>
            <p>🏪 {createdData.locations?.length}箇所の店舗・ロケ地</p>
            <p>🎮 {createdData.works?.length}作品</p>
            <p>💬 {createdData.posts?.length}件のユーザー投稿</p>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">❌ {error}</p>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={createCompleteUserJourney}
          disabled={isCreating}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isCreating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>{isCreating ? '作成中...' : 'ユーザージャーニー用データ作成'}</span>
        </button>

        <button
          onClick={clearAllData}
          disabled={isClearing}
          className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isClearing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span>{isClearing ? 'クリア中...' : '全データクリア'}</span>
        </button>

        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>統計更新</span>
        </button>
      </div>

      {/* ユーザージャーニー説明 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">🔄 ユーザージャーニーフロー</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>🔍 統一検索で「配信者テスト01」または「ゲーム実況」で検索</li>
          <li>👤 チャンネル詳細ページでプロフィールとエピソード一覧を確認</li>
          <li>📺 「機材紹介」「グルメレビュー」「ゲーム実況」から動画を選択</li>
          <li>🛍️ 動画内で紹介されたアイテム（ヘッドセット、マイクなど）をチェック</li>
          <li>🏪 訪問した店舗（テストカフェ、ゲームストア）の詳細を確認</li>
          <li>🛒 Amazonアフィリエイトリンクから購入導線をテスト</li>
        </ol>
      </div>
    </div>
  )
}