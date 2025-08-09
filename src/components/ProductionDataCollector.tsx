/**
 * 本番環境データ収集コンポーネント
 * よにのチャンネルの実データ収集と管理
 */

import React, { useState, useEffect } from 'react'
import { Play, Database, CheckCircle, AlertTriangle, RefreshCw, Download, Eye, Settings } from 'lucide-react'
import { collectYoniChannelData } from '../../scripts/youtube-data-collector'
import { supabase } from '../lib/supabase'

interface CollectionStats {
  channels: number
  episodes: number
  totalViews: number
  lastUpdated: string | null
}

interface CollectionStatus {
  status: 'idle' | 'collecting' | 'success' | 'error'
  message: string
  progress: number
}

export default function ProductionDataCollector() {
  const [stats, setStats] = useState<CollectionStats | null>(null)
  const [status, setStatus] = useState<CollectionStatus>({
    status: 'idle',
    message: '',
    progress: 0
  })
  const [showApiConfig, setShowApiConfig] = useState(false)
  
  // 本番環境でのみ表示
  const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production'
  const hasYouTubeApiKey = !!import.meta.env.VITE_YOUTUBE_API_KEY
  
  if (!isProduction) {
    return null // 本番環境以外では表示しない
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // チャンネル数
      const { count: channelCount } = await supabase
        .from('celebrities')
        .select('*', { count: 'exact' })
        .eq('type', 'youtube_channel')

      // エピソード数
      const { count: episodeCount } = await supabase
        .from('episodes')
        .select('*', { count: 'exact' })

      // 総視聴回数
      const { data: episodes } = await supabase
        .from('episodes')
        .select('view_count')

      const totalViews = episodes?.reduce((sum, ep) => sum + (ep.view_count || 0), 0) || 0

      // 最終更新日
      const { data: lastEpisode } = await supabase
        .from('episodes')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setStats({
        channels: channelCount || 0,
        episodes: episodeCount || 0,
        totalViews,
        lastUpdated: lastEpisode?.created_at || null
      })
    } catch (error: any) {
      console.error('統計取得エラー:', error)
    }
  }

  const startDataCollection = async () => {
    if (!hasYouTubeApiKey) {
      setStatus({
        status: 'error',
        message: 'YouTube API キーが設定されていません',
        progress: 0
      })
      return
    }

    setStatus({
      status: 'collecting',
      message: 'よにのチャンネルデータ収集を開始...',
      progress: 10
    })

    try {
      // よにのチャンネルデータ収集
      const result = await collectYoniChannelData()
      
      setStatus({
        status: 'collecting',
        message: 'データをSupabaseに保存中...',
        progress: 70
      })

      // チャンネル情報保存
      await supabase.from('celebrities').upsert({
        id: result.channel.id,
        name: result.channel.name,
        slug: result.channel.slug,
        bio: result.channel.description,
        image_url: result.channel.thumbnail,
        subscriber_count: result.channel.subscriber_count,
        video_count: result.channel.video_count,
        view_count: result.channel.view_count,
        published_at: result.channel.published_at,
        type: result.channel.type,
        status: result.channel.status
      })

      // 動画データ保存（バッチ処理）
      const episodeData = result.videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        date: video.published_at,
        duration: video.duration,
        thumbnail_url: video.thumbnail,
        video_url: video.video_url,
        view_count: video.view_count,
        like_count: video.like_count,
        comment_count: video.comment_count,
        celebrity_id: video.celebrity_id
      }))

      await supabase.from('episodes').upsert(episodeData)

      setStatus({
        status: 'success',
        message: `データ収集完了！チャンネル: 1件、動画: ${result.videos.length}件`,
        progress: 100
      })

      // 統計を更新
      await fetchStats()
      
    } catch (error: any) {
      console.error('データ収集エラー:', error)
      setStatus({
        status: 'error',
        message: `データ収集エラー: ${error.message}`,
        progress: 0
      })
    }
  }

  const resetStatus = () => {
    setStatus({
      status: 'idle',
      message: '',
      progress: 0
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-300 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">
            本番データ収集システム
          </h3>
        </div>
        <button
          onClick={() => setShowApiConfig(!showApiConfig)}
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-blue-100 rounded-lg p-4 mb-6">
        <p className="text-blue-700 text-sm mb-2">
          🔗 <strong>よにのチャンネル</strong> 本番データ収集
        </p>
        <p className="text-blue-600 text-sm">
          YouTube Data APIを使用してよにのチャンネルの実データを収集し、Supabaseに保存します。
        </p>
      </div>

      {/* API設定状態 */}
      {showApiConfig && (
        <div className="bg-white rounded-lg p-4 mb-6 border">
          <h4 className="font-medium text-gray-900 mb-3">API設定状況</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-gray-500 w-32">YouTube API:</span>
              {hasYouTubeApiKey ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  設定済み
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  未設定
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 w-32">Supabase:</span>
              <span className="text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                接続済み
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 w-32">環境:</span>
              <span className="text-blue-600">Production</span>
            </div>
          </div>
        </div>
      )}

      {/* 現在の統計 */}
      {stats && (
        <div className="bg-white rounded-lg p-4 mb-6 border">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            現在のデータ状況
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">チャンネル:</span>
              <span className="ml-2 font-medium">{stats.channels}件</span>
            </div>
            <div>
              <span className="text-gray-500">動画:</span>
              <span className="ml-2 font-medium">{stats.episodes}本</span>
            </div>
            <div>
              <span className="text-gray-500">総視聴回数:</span>
              <span className="ml-2 font-medium">{stats.totalViews.toLocaleString()}回</span>
            </div>
            <div>
              <span className="text-gray-500">最終更新:</span>
              <span className="ml-2 font-medium">
                {stats.lastUpdated 
                  ? new Date(stats.lastUpdated).toLocaleDateString()
                  : '未更新'
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ステータス表示 */}
      {status.status !== 'idle' && (
        <div className={`rounded-lg p-4 mb-6 ${
          status.status === 'success' ? 'bg-green-50 border border-green-200' :
          status.status === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-medium ${
              status.status === 'success' ? 'text-green-800' :
              status.status === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {status.message}
            </p>
            {status.status !== 'collecting' && (
              <button
                onClick={resetStatus}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>
          
          {status.status === 'collecting' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={startDataCollection}
          disabled={status.status === 'collecting' || !hasYouTubeApiKey}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {status.status === 'collecting' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>
            {status.status === 'collecting' ? '収集中...' : 'データ収集開始'}
          </span>
        </button>

        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>統計更新</span>
        </button>
      </div>

      {/* 注意事項 */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">⚠️ 注意事項</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• YouTube API使用量制限: 1日10,000リクエスト</li>
          <li>• 大量データ収集時は複数回に分けて実行</li>
          <li>• エラー発生時は時間を空けて再実行</li>
          <li>• 本番環境でのみ使用可能</li>
        </ul>
      </div>

      {/* 次のステップガイド */}
      {status.status === 'success' && (
        <div className="mt-6 bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-3">🎉 データ収集完了！</h4>
          <p className="text-green-700 text-sm mb-3">
            よにのチャンネルのデータが正常に収集されました。次のステップを確認してください。
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-green-700">
              1. 統一検索で「よにのチャンネル」を検索してみてください
            </p>
            <p className="text-green-700">
              2. チャンネル詳細ページで動画一覧を確認してください
            </p>
            <p className="text-green-700">
              3. 各動画の詳細ページが正常に表示されることを確認してください
            </p>
          </div>
        </div>
      )}
    </div>
  )
}