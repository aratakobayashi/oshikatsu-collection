/**
 * ユーザージャーニーテストコンポーネント
 * 開発環境で完全なフローをテストできる
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, CheckCircle, ExternalLink, ArrowRight } from 'lucide-react'
import { mockDb } from '../lib/mock-database'

interface TestStep {
  id: number
  title: string
  description: string
  action: string
  link?: string
  completed: boolean
}

export default function UserJourneyTest() {
  const [currentStep, setCurrentStep] = useState(0)
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  const testSteps: TestStep[] = [
    {
      id: 1,
      title: "チャンネル検索",
      description: "「配信者テスト01」をアイドル・推し検索で発見",
      action: "統一検索で「配信者テスト01」または「ゲーム実況」で検索",
      link: "/celebrities",
      completed: false
    },
    {
      id: 2, 
      title: "チャンネル詳細",
      description: "プロフィールとエピソード一覧を確認",
      action: "チャンネル詳細ページで基本情報とエピソード一覧をチェック",
      link: "/celebrities/test-streamer-01",
      completed: false
    },
    {
      id: 3,
      title: "エピソード選択", 
      description: "興味のある動画エピソードを選択",
      action: "機材紹介、グルメレビュー、ゲーム実況から選択",
      completed: false
    },
    {
      id: 4,
      title: "関連アイテム確認",
      description: "動画内で紹介されたアイテムをチェック",
      action: "ゲーミングヘッドセットやUSBマイクの詳細を確認",
      completed: false
    },
    {
      id: 5,
      title: "購買導線テスト",
      description: "アイテム詳細から購入リンクをテスト",
      action: "「商品を購入する」ボタンをクリック（新タブで開く）",
      completed: false
    },
    {
      id: 6,
      title: "店舗情報確認",
      description: "関連店舗・ロケ地の詳細情報を確認",
      action: "テストカフェやゲームストアの営業情報をチェック",
      completed: false
    }
  ]

  const runAutomaticTest = async () => {
    setIsRunning(true)
    setTestResults(null)

    try {
      console.log('🧪 ユーザージャーニー自動テスト開始...')
      
      // 1. チャンネル検索テスト
      console.log('1. チャンネル検索テスト')
      const searchResults = await mockDb.celebrities.unifiedSearch('配信者テスト01')
      console.log(`✅ 検索結果: ${searchResults.length}件`)
      
      if (searchResults.length === 0) {
        throw new Error('テストチャンネルが見つかりません。先にデータを作成してください。')
      }
      
      const channel = searchResults[0]
      console.log(`✅ 発見: ${channel.name}`)
      
      // 2. エピソード取得テスト
      console.log('2. エピソード取得テスト')
      const episodes = await mockDb.episodes.getByCelebrityId(channel.id)
      console.log(`✅ エピソード数: ${episodes.length}本`)
      
      // 3. 関連アイテム取得テスト
      console.log('3. 関連アイテム取得テスト') 
      const items = await mockDb.items.getByCelebrityId(channel.id)
      console.log(`✅ 関連アイテム: ${items.length}個`)
      
      // 4. 関連店舗取得テスト
      console.log('4. 関連店舗取得テスト')
      const locations = await mockDb.locations.getByCelebrityId(channel.id)
      console.log(`✅ 関連店舗: ${locations.length}箇所`)
      
      // 5. アフィリエイトリンクチェック
      console.log('5. 購買導線チェック')
      const itemsWithLinks = items.filter(item => item.affiliate_url && item.affiliate_url !== '#test-link-1')
      console.log(`✅ 購買リンク付きアイテム: ${itemsWithLinks.length}個`)
      
      const testResults = {
        channel,
        episodes,
        items,
        locations,
        purchaseLinks: itemsWithLinks.length,
        success: true
      }
      
      setTestResults(testResults)
      console.log('🎉 ユーザージャーニーテスト完了！', testResults)
      
    } catch (error: any) {
      console.error('❌ テストエラー:', error)
      setTestResults({
        success: false,
        error: error.message
      })
    } finally {
      setIsRunning(false)
    }
  }

  const completeStep = (stepIndex: number) => {
    setCurrentStep(stepIndex + 1)
  }

  // 開発環境チェック
  const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development'
  const isLocalEnvironment = import.meta.env.VITE_SUPABASE_URL?.includes('localhost')

  if (!isDevelopment || !isLocalEnvironment) {
    return null // 開発環境以外では表示しない
  }

  return (
    <div className="bg-blue-50 border border-blue-300 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Play className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">
          ユーザージャーニーテスト
        </h3>
      </div>

      <div className="bg-blue-100 rounded-lg p-4 mb-6">
        <p className="text-blue-700 text-sm mb-2">
          🔄 <strong>完全なユーザーフローテスト</strong>
        </p>
        <p className="text-blue-600 text-sm">
          「配信者テスト01」を中心とした購買導線まで含む完全なユーザージャーニーをテストします。
        </p>
      </div>

      {/* 自動テスト結果 */}
      {testResults && (
        <div className={`rounded-lg p-4 mb-6 ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h4 className={`font-medium mb-3 ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
            {testResults.success ? '✅ 自動テスト完了' : '❌ テストエラー'}
          </h4>
          {testResults.success ? (
            <div className={`text-sm space-y-1 ${testResults.success ? 'text-green-700' : 'text-red-700'}`}>
              <p>📺 チャンネル: {testResults.channel?.name} ({testResults.channel?.subscriber_count?.toLocaleString()}人登録)</p>
              <p>🎬 エピソード: {testResults.episodes?.length}本</p>
              <p>🛍️ アイテム: {testResults.items?.length}個</p>
              <p>🏪 店舗・ロケ地: {testResults.locations?.length}箇所</p>
              <p>🛒 購買リンク: {testResults.purchaseLinks}個</p>
            </div>
          ) : (
            <p className="text-red-700 text-sm">{testResults.error}</p>
          )}
        </div>
      )}

      {/* 手動テストステップ */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-blue-800">手動テストステップ:</h4>
        {testSteps.map((step, index) => (
          <div 
            key={step.id} 
            className={`border rounded-lg p-4 ${
              index < currentStep ? 'bg-green-50 border-green-200' :
              index === currentStep ? 'bg-yellow-50 border-yellow-200' : 
              'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className={`font-medium ${
                  index < currentStep ? 'text-green-800' : 
                  index === currentStep ? 'text-yellow-800' : 
                  'text-gray-800'
                }`}>
                  {step.id}. {step.title}
                </h5>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                <p className="text-sm text-gray-500 mt-2 italic">{step.action}</p>
                {step.link && (
                  <div className="mt-3">
                    <Link
                      to={step.link}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      テストページに移動
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : index === currentStep ? (
                  <button
                    onClick={() => completeStep(index)}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded"
                  >
                    完了
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 操作ボタン */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={runAutomaticTest}
          disabled={isRunning}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Play className="h-4 w-4" />
          <span>{isRunning ? 'テスト実行中...' : '自動テスト実行'}</span>
        </button>

        <button
          onClick={() => setCurrentStep(0)}
          className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <ArrowRight className="h-4 w-4" />
          <span>手動テストリセット</span>
        </button>
      </div>

      {/* 進捗表示 */}
      <div className="mt-6 bg-white rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">手動テスト進捗</span>
          <span className="text-sm text-gray-500">{currentStep}/{testSteps.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / testSteps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}