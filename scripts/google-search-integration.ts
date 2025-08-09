/**
 * Google Search API連携システム
 * エピソード分析結果を使って実際に検索を実行
 */

import { config } from 'dotenv'

config({ path: '.env' })

interface SearchResult {
  title: string
  url: string
  snippet: string
  relevanceScore: number
}

interface LocationCandidate {
  name: string
  address?: string
  type: string
  confidence: number
  source: string
}

interface ItemCandidate {
  name: string
  brand?: string
  type: string
  confidence: number
  source: string
}

class GoogleSearchIntegration {
  private apiKey: string
  private searchEngineId: string
  
  constructor() {
    this.apiKey = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY!
    this.searchEngineId = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID!
  }
  
  // Google Custom Search API実行
  async performSearch(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(query)}&num=${maxResults}`
      
      console.log(`   🔍 検索実行: "${query}"`)
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.error) {
        console.log(`   ❌ 検索エラー: ${data.error.message}`)
        return []
      }
      
      const results: SearchResult[] = (data.items || []).map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        relevanceScore: this.calculateRelevanceScore(item.title, item.snippet, query)
      }))
      
      console.log(`   ✅ 検索結果: ${results.length}件`)
      return results
      
    } catch (error: any) {
      console.log(`   ❌ 検索API エラー: ${error.message}`)
      return []
    }
  }
  
  // 関連度スコア計算
  private calculateRelevanceScore(title: string, snippet: string, query: string): number {
    let score = 0
    const text = (title + ' ' + snippet).toLowerCase()
    const queryWords = query.toLowerCase().split(' ')
    
    // クエリの単語がどれだけマッチするか
    for (const word of queryWords) {
      if (text.includes(word)) {
        score += 10
      }
    }
    
    // よにのチャンネル関連キーワードにボーナス
    const yoniKeywords = ['よにのちゃんねる', 'メンバー', 'ロケ地', '着用', '使用']
    for (const keyword of yoniKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 20
      }
    }
    
    // 店舗・商品関連キーワードにボーナス
    const businessKeywords = ['店舗', '店', 'レストラン', 'カフェ', 'ショップ', '購入', 'ブランド']
    for (const keyword of businessKeywords) {
      if (text.includes(keyword)) {
        score += 15
      }
    }
    
    return Math.min(score, 100)
  }
  
  // 検索結果からロケーション候補抽出
  extractLocationCandidates(searchResults: SearchResult[], searchQuery: string): LocationCandidate[] {
    const candidates: LocationCandidate[] = []
    
    for (const result of searchResults) {
      if (result.relevanceScore < 30) continue // 低関連度はスキップ
      
      const text = result.title + ' ' + result.snippet
      
      // 店舗名抽出（簡易版）
      const storePatterns = [
        /([あ-ん一-龯ァ-ヶー\s]+(?:店|カフェ|レストラン|ショップ))/g,
        /([A-Za-z\s&]+(?:Store|Cafe|Restaurant|Shop))/g
      ]
      
      for (const pattern of storePatterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            const name = match.trim()
            if (name.length > 2 && name.length < 50) {
              candidates.push({
                name: name,
                type: this.categorizeLocation(name),
                confidence: result.relevanceScore,
                source: result.url
              })
            }
          }
        }
      }
    }
    
    // 重複除去・スコア順ソート
    const uniqueCandidates = candidates.filter((candidate, index, array) => 
      array.findIndex(c => c.name === candidate.name) === index
    )
    
    return uniqueCandidates.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }
  
  // 検索結果からアイテム候補抽出
  extractItemCandidates(searchResults: SearchResult[], searchQuery: string): ItemCandidate[] {
    const candidates: ItemCandidate[] = []
    
    for (const result of searchResults) {
      if (result.relevanceScore < 30) continue
      
      const text = result.title + ' ' + result.snippet
      
      // アイテム名抽出（簡易版）
      const itemPatterns = [
        /([あ-ん一-龯ァ-ヶー\s]+(?:シャツ|パンツ|スニーカー|バッグ|時計|アクセサリー))/g,
        /([A-Za-z\s&]+(?:T-shirt|Shirt|Pants|Sneaker|Bag|Watch|Accessory))/g
      ]
      
      for (const pattern of itemPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            const name = match.trim()
            if (name.length > 2 && name.length < 50) {
              candidates.push({
                name: name,
                type: this.categorizeItem(name),
                confidence: result.relevanceScore,
                source: result.url
              })
            }
          }
        }
      }
    }
    
    const uniqueCandidates = candidates.filter((candidate, index, array) => 
      array.findIndex(c => c.name === candidate.name) === index
    )
    
    return uniqueCandidates.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }
  
  // ロケーションカテゴリ分類
  private categorizeLocation(name: string): string {
    if (name.includes('カフェ') || name.includes('Cafe')) return 'カフェ'
    if (name.includes('レストラン') || name.includes('Restaurant')) return 'レストラン'
    if (name.includes('ショップ') || name.includes('Shop')) return 'ショップ'
    if (name.includes('店')) return '店舗'
    return 'その他'
  }
  
  // アイテムカテゴリ分類
  private categorizeItem(name: string): string {
    if (name.includes('シャツ') || name.includes('Shirt')) return 'トップス'
    if (name.includes('パンツ') || name.includes('Pants')) return 'ボトムス'
    if (name.includes('スニーカー') || name.includes('Sneaker')) return 'シューズ'
    if (name.includes('バッグ') || name.includes('Bag')) return 'バッグ'
    if (name.includes('時計') || name.includes('Watch')) return 'アクセサリー'
    return 'その他'
  }
}

async function testGoogleSearchIntegration() {
  console.log('🌐 Google Search API連携テスト')
  console.log('='.repeat(50))
  
  try {
    const searchSystem = new GoogleSearchIntegration()
    
    // テスト検索クエリ
    const testQueries = [
      'よにのちゃんねる 朝食 肉 レストラン',
      'よにのちゃんねる ドライブ ロケ地',
      'よにのちゃんねる メンバー 着用 アイテム'
    ]
    
    for (const query of testQueries) {
      console.log(`\n🔍 検索テスト: "${query}"`)
      console.log('-'.repeat(40))
      
      const searchResults = await searchSystem.performSearch(query, 3)
      
      if (searchResults.length > 0) {
        console.log('   📊 検索結果詳細:')
        searchResults.forEach((result, idx) => {
          console.log(`      ${idx + 1}. ${result.title}`)
          console.log(`         関連度: ${result.relevanceScore}%`)
          console.log(`         概要: ${result.snippet.substring(0, 100)}...`)
        })
        
        // ロケーション候補抽出
        const locationCandidates = searchSystem.extractLocationCandidates(searchResults, query)
        if (locationCandidates.length > 0) {
          console.log('   🏪 抽出されたロケーション候補:')
          locationCandidates.forEach((candidate, idx) => {
            console.log(`      ${idx + 1}. ${candidate.name} (${candidate.type}, 信頼度: ${candidate.confidence}%)`)
          })
        }
        
        // アイテム候補抽出
        const itemCandidates = searchSystem.extractItemCandidates(searchResults, query)
        if (itemCandidates.length > 0) {
          console.log('   👕 抽出されたアイテム候補:')
          itemCandidates.forEach((candidate, idx) => {
            console.log(`      ${idx + 1}. ${candidate.name} (${candidate.type}, 信頼度: ${candidate.confidence}%)`)
          })
        }
        
      } else {
        console.log('   ❌ 検索結果なし')
      }
      
      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('\n✅ Google Search API連携テスト完了')
    console.log('🎯 次のステップ: 手動確認フローの構築')
    
  } catch (error: any) {
    console.error('❌ テストエラー:', error.message)
  }
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  testGoogleSearchIntegration().catch(console.error)
}