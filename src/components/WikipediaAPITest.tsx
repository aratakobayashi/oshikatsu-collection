import React, { useState } from 'react'
import { Search, Download, User, Calendar, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

// Wikipedia APIのレスポンス型定義
interface WikipediaPageData {
  extract?: string
}

interface WikipediaDetailResponse {
  query?: {
    pages?: Record<string, WikipediaPageData>
  }
}

interface WikipediaResult {
  name: string
  description: string
  wikipedia_url?: string
  thumbnail?: string
  image_url?: string
  page_id: number
  last_modified?: string
  full_extract?: string | null
  data_source: string
  fetched_at: string
  success: boolean
}

// Wikipedia APIテスト用のコンポーネント
const WikipediaAPITest: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [result, setResult] = useState<WikipediaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // テスト用のアイドル名リスト
  const testIdols = [
    '二宮和也',
    '白石麻衣', 
    '指原莉乃',
    '平野紫耀',
    '齋藤飛鳥',
    '櫻井翔',
    '山本彩',
    '森田ひかる'
  ]

  // Wikipedia APIからデータ取得
  const fetchWikipediaData = async (name: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔍 Searching for: ${name}`)
      
      // Wikipedia Summary API
      const summaryResponse = await fetch(
        `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
      )
      
      if (!summaryResponse.ok) {
        throw new Error(`Wikipedia API error: ${summaryResponse.status}`)
      }
      
      const summaryData = await summaryResponse.json()
      console.log('📄 Summary data:', summaryData)
      
      // 追加情報を取得（infobox等）
      let detailData: WikipediaDetailResponse | null = null
      try {
        const detailResponse = await fetch(
          `https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&titles=${encodeURIComponent(name)}`
        )
        detailData = await detailResponse.json()
        console.log('📊 Detail data:', detailData)
      } catch (detailError) {
        console.warn('Detail fetch failed:', detailError)
      }
      
      // データを整理
      const processedData: WikipediaResult = {
        // 基本情報
        name: summaryData.title,
        description: summaryData.extract,
        wikipedia_url: summaryData.content_urls?.desktop?.page,
        
        // 画像
        thumbnail: summaryData.thumbnail?.source,
        image_url: summaryData.originalimage?.source,
        
        // メタデータ
        page_id: summaryData.pageid,
        last_modified: summaryData.timestamp,
        
        // 追加情報（もし取得できれば）
        full_extract: detailData && detailData.query?.pages 
          ? Object.values(detailData.query.pages)[0]?.extract || null 
          : null,
        
        // データソース情報
        data_source: 'wikipedia_api',
        fetched_at: new Date().toISOString(),
        
        // 成功フラグ
        success: true
      }
      
      setResult(processedData)
      console.log('✅ Processed data:', processedData)
      
    } catch (err) {
      console.error('❌ Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  // 複数のアイドルを一括テスト
  const testMultipleIdols = async () => {
    console.log('🚀 Starting bulk test...')
    
    for (const idol of testIdols) {
      console.log(`\n--- Testing: ${idol} ---`)
      await fetchWikipediaData(idol)
      
      // APIに負荷をかけないよう少し待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('✅ Bulk test completed!')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📚 Wikipedia API テスト
        </h1>
        <p className="text-gray-600">
          アイドルの基本情報をWikipedia APIから取得するテストです
        </p>
      </div>

      {/* 検索セクション */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2 text-blue-500" />
          個別検索テスト
        </h2>
        
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="アイドル名を入力（例: 二宮和也）"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyPress={(e) => e.key === 'Enter' && fetchWikipediaData(searchQuery)}
          />
          <button
            onClick={() => fetchWikipediaData(searchQuery)}
            disabled={!searchQuery.trim() || loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            ) : (
              <Search className="h-5 w-5 mr-2" />
            )}
            検索
          </button>
        </div>

        {/* クイック検索ボタン */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">クイック検索:</p>
          <div className="flex flex-wrap gap-2">
            {testIdols.slice(0, 4).map((idol) => (
              <button
                key={idol}
                onClick={() => fetchWikipediaData(idol)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
              >
                {idol}
              </button>
            ))}
          </div>
        </div>

        {/* 一括テストボタン */}
        <button
          onClick={testMultipleIdols}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center"
        >
          <Download className="h-5 w-5 mr-2" />
          一括テスト（8名）
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-3" />
          <div>
            <h3 className="font-medium text-red-800">エラーが発生しました</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
            <h2 className="text-xl font-semibold flex items-center">
              <CheckCircle className="h-6 w-6 mr-2" />
              取得結果: {result.name}
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 画像 */}
              <div className="lg:col-span-1">
                {result.thumbnail ? (
                  <img
                    src={result.thumbnail}
                    alt={result.name}
                    className="w-full max-w-sm mx-auto rounded-xl shadow-md"
                  />
                ) : (
                  <div className="w-full max-w-sm mx-auto h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* 情報 */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">基本情報</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-start space-x-2">
                      <User className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <span className="text-sm text-gray-500">名前:</span>
                        <p className="font-medium">{result.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <span className="text-sm text-gray-500">更新日:</span>
                        <p className="font-medium">
                          {result.last_modified ? new Date(result.last_modified).toLocaleDateString('ja-JP') : '不明'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <ExternalLink className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <span className="text-sm text-gray-500">Wikipedia:</span>
                        <a 
                          href={result.wikipedia_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline block"
                        >
                          ページを開く
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 説明文 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">説明</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {result.description || '説明がありません'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RAWデータ */}
            <details className="mt-6">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                RAWデータを表示 (開発用)
              </summary>
              <pre className="mt-4 bg-gray-900 text-green-400 p-4 rounded-xl text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* API情報 */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 API情報</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>エンドポイント:</strong> https://ja.wikipedia.org/api/rest_v1/page/summary/</p>
          <p><strong>レート制限:</strong> なし（適度な利用）</p>
          <p><strong>ライセンス:</strong> CC BY-SA</p>
          <p><strong>利用可能データ:</strong> タイトル、説明、画像、URL、更新日時</p>
        </div>
      </div>
    </div>
  )
}

export default WikipediaAPITest