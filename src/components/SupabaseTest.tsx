import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Celebrity {
  id: string
  name: string
  type: string
  status: string
}

interface Episode {
  id: string
  title: string
  view_count: number
  celebrity_id: string
}

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    testConnection()
  }, [])

  async function testConnection() {
    try {
      console.log('🔍 Supabase接続テスト開始...')
      
      // 環境変数チェック
      console.log('📊 環境変数:')
      console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定済み' : '未設定')
      console.log('- 現在のURL:', window.location.href)

      // 接続テスト
      console.log('📡 celebritiesテーブル取得中...')
      const { data: celebData, error: celebError } = await supabase
        .from('celebrities')
        .select('*')
        .limit(10)

      if (celebError) {
        throw new Error(`Celebrities取得エラー: ${celebError.message}`)
      }

      console.log('✅ Celebrities取得成功:', celebData?.length, '件')
      setCelebrities(celebData || [])

      // エピソード取得
      console.log('📡 episodesテーブル取得中...')
      const { data: epData, error: epError } = await supabase
        .from('episodes')
        .select('*')
        .limit(10)

      if (epError) {
        throw new Error(`Episodes取得エラー: ${epError.message}`)
      }

      console.log('✅ Episodes取得成功:', epData?.length, '件')
      setEpisodes(epData || [])

      setConnectionStatus('success')
      
    } catch (err) {
      console.error('❌ 接続エラー:', err)
      setError(err instanceof Error ? err.message : '不明なエラー')
      setConnectionStatus('error')
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Supabase接続テスト</h1>
      
      {/* 環境情報 */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', marginBottom: '20px' }}>
        <h3>📊 環境情報</h3>
        <p><strong>URL:</strong> {window.location.href}</p>
        <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || '未設定'}</p>
        <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定済み (...' + import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-10) + ')' : '未設定'}</p>
      </div>

      {/* 接続状況 */}
      <div style={{ backgroundColor: connectionStatus === 'success' ? '#d4edda' : connectionStatus === 'error' ? '#f8d7da' : '#fff3cd', padding: '15px', marginBottom: '20px' }}>
        <h3>📡 接続状況</h3>
        {connectionStatus === 'loading' && <p>⏳ 接続中...</p>}
        {connectionStatus === 'success' && <p>✅ 接続成功！</p>}
        {connectionStatus === 'error' && (
          <>
            <p>❌ 接続失敗</p>
            <p style={{ color: 'red' }}>{error}</p>
          </>
        )}
      </div>

      {/* データ表示 */}
      {connectionStatus === 'success' && (
        <>
          {/* Celebrities */}
          <div style={{ marginBottom: '30px' }}>
            <h3>👤 Celebrities ({celebrities.length}件)</h3>
            {celebrities.length === 0 ? (
              <p>データがありません</p>
            ) : (
              <ul>
                {celebrities.map(celeb => (
                  <li key={celeb.id}>
                    <strong>{celeb.name}</strong> (type: {celeb.type}, status: {celeb.status})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Episodes */}
          <div>
            <h3>🎬 Episodes ({episodes.length}件)</h3>
            {episodes.length === 0 ? (
              <p>データがありません</p>
            ) : (
              <ul>
                {episodes.map(ep => (
                  <li key={ep.id}>
                    <strong>{ep.title}</strong> 
                    {ep.view_count && <span> ({(ep.view_count / 1000000).toFixed(1)}M views)</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* リフレッシュボタン */}
      <button 
        onClick={testConnection} 
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          marginTop: '20px'
        }}
      >
        🔄 再テスト
      </button>
    </div>
  )
}