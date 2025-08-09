/**
 * 検索結果デバッグ - なぜ候補が少ないかを詳細分析
 */

import { config } from 'dotenv'

config({ path: '.env' })

async function debugSearchResults() {
  console.log('🔍 検索結果デバッグ分析')
  console.log('='.repeat(60))
  
  const apiKey = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY!
  const searchEngineId = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID!
  
  // デバッグ用の詳細検索
  const testQueries = [
    'よにのちゃんねる "#446【朝食!!】肉肉肉肉肉肉肉日" ロケ地',
    'よにのちゃんねる 朝食 肉 店舗',
    'よにのちゃんねる メンバー 着用 ファッション',
    'よにのちゃんねる 山田涼介 着用 ブランド',
    'よにのちゃんねる 菊池風磨 ファッション'
  ]
  
  for (const query of testQueries) {
    console.log(`\\n🔍 検索クエリ: "${query}"`)
    console.log('-'.repeat(50))
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.error) {
        console.log('❌ エラー:', data.error.message)
        continue
      }
      
      if (!data.items || data.items.length === 0) {
        console.log('❌ 検索結果なし')
        continue
      }
      
      console.log(`✅ 検索結果: ${data.items.length}件`)
      
      data.items.forEach((item: any, idx: number) => {
        console.log(`\\n   ${idx + 1}. ${item.title}`)
        console.log(`      URL: ${item.link}`)
        console.log(`      概要: ${item.snippet.substring(0, 100)}...`)
        
        // ロケーション・アイテム候補を手動抽出
        const text = item.title + ' ' + item.snippet
        
        // ロケーション抽出試行
        const locationPatterns = [
          /([あ-ん一-龯ァ-ヶー\s]{2,20}(?:店|カフェ|レストラン|ショップ|食堂))/g,
          /(スターバックス|マクドナルド|ケンタッキー|サイゼリヤ|ガスト|吉野家|すき家|松屋)/g,
          /([A-Z][a-z\s&]+(?:Store|Cafe|Restaurant|Shop))/g
        ]
        
        const foundLocations = []
        for (const pattern of locationPatterns) {
          const matches = text.match(pattern)
          if (matches) foundLocations.push(...matches)
        }
        
        if (foundLocations.length > 0) {
          console.log(`      🏪 発見ロケーション: ${foundLocations.join(', ')}`)
        }
        
        // アイテム抽出試行
        const itemPatterns = [
          /([あ-ん一-龯ァ-ヶー\s]{2,20}(?:シャツ|パーカー|ジャケット|パンツ|デニム|バッグ|時計|帽子|サングラス|スニーカー))/g,
          /(Supreme|Nike|Adidas|UNIQLO|ZARA|H&M|PORTER|GUCCI)[^。]{0,30}/g
        ]
        
        const foundItems = []
        for (const pattern of itemPatterns) {
          const matches = text.match(pattern)
          if (matches) foundItems.push(...matches)
        }
        
        if (foundItems.length > 0) {
          console.log(`      👕 発見アイテム: ${foundItems.join(', ')}`)
        }
        
        // よにのちゃんねる関連度チェック
        const yoniKeywords = ['よにのちゃんねる', 'ジャにのちゃんねる', 'メンバー', 'ロケ地', '着用']
        const relevanceCount = yoniKeywords.filter(keyword => 
          text.toLowerCase().includes(keyword.toLowerCase())
        ).length
        
        console.log(`      📊 関連度: ${relevanceCount}/5 (${yoniKeywords.filter(k => text.toLowerCase().includes(k.toLowerCase())).join(', ')})`)
      })
      
    } catch (error: any) {
      console.log('❌ 検索エラー:', error.message)
    }
    
    // API制限対策
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\\n💡 改善提案:')
  console.log('1. 検索クエリの多様化 - より具体的なキーワード組み合わせ')
  console.log('2. 抽出パターンの強化 - より広範囲のパターンマッチング')
  console.log('3. 関連度スコアリングの調整 - より柔軟な候補選定')
  console.log('4. 追加の情報源 - Twitter、Instagram、ファンサイト等の活用')
}

// Run debug
if (import.meta.url === `file://${process.argv[1]}`) {
  debugSearchResults().catch(console.error)
}