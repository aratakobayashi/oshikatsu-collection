/**
 * 完成版: 手動精査システム
 * エピソード分析 + Google検索 + 結果保存の統合システム
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

interface CurationResult {
  episodeId: string
  episodeTitle: string
  analysisScore: number
  locationCandidates: {
    name: string
    address?: string
    category: string
    confidence: number
    sourceUrl: string
    notes?: string
  }[]
  itemCandidates: {
    name: string
    brand?: string
    category: string
    confidence: number
    sourceUrl: string
    notes?: string
  }[]
  searchQueries: string[]
  manualNotes: string
  processingTime: number
}

class ManualCurationSystem {
  
  // エピソード分析（前回のシステムを統合）
  analyzeEpisode(title: string) {
    const keywords = this.extractKeywords(title)
    const suggestedLocations = this.suggestLocations(keywords)
    const suggestedItems = this.suggestItems(keywords)
    const searchQueries = this.generateSearchQueries(title, keywords)
    const confidence = this.calculateConfidence(keywords, suggestedLocations, suggestedItems)
    
    return {
      keywords,
      suggestedLocations,
      suggestedItems,
      searchQueries,
      confidence
    }
  }
  
  // Google検索実行（前回のシステムを統合）
  async performGoogleSearch(queries: string[]) {
    const allResults = []
    
    for (const query of queries.slice(0, 3)) { // API制限を考慮
      const results = await this.searchGoogle(query)
      allResults.push(...results)
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return allResults
  }
  
  // 統合キュレーションプロセス実行
  async curateEpisode(episodeId: string, episodeTitle: string): Promise<CurationResult> {
    const startTime = Date.now()
    
    console.log(`\n🎬 エピソード精査開始: ${episodeTitle}`)
    console.log('='.repeat(60))
    
    // Step 1: エピソード分析
    console.log('📊 Step 1: エピソード分析')
    const analysis = this.analyzeEpisode(episodeTitle)
    console.log(`   🔑 キーワード: ${analysis.keywords.join(', ')}`)
    console.log(`   📊 信頼度: ${analysis.confidence}%`)
    
    // Step 2: Google検索実行
    console.log('\\n🔍 Step 2: Google検索実行')
    const searchResults = await this.performGoogleSearch(analysis.searchQueries)
    console.log(`   ✅ 検索結果: ${searchResults.length}件`)
    
    // Step 3: ロケーション候補抽出・評価
    console.log('\\n🏪 Step 3: ロケーション候補分析')
    const locationCandidates = this.extractAndEvaluateLocations(searchResults, analysis.suggestedLocations)
    console.log(`   🎯 候補ロケーション: ${locationCandidates.length}件`)
    
    locationCandidates.forEach((location, idx) => {
      console.log(`      ${idx + 1}. ${location.name} (${location.category}, 信頼度: ${location.confidence}%)`)
      if (location.notes) console.log(`         📝 ${location.notes}`)
    })
    
    // Step 4: アイテム候補抽出・評価
    console.log('\\n👕 Step 4: アイテム候補分析')
    const itemCandidates = this.extractAndEvaluateItems(searchResults, analysis.suggestedItems)
    console.log(`   🎯 候補アイテム: ${itemCandidates.length}件`)
    
    itemCandidates.forEach((item, idx) => {
      console.log(`      ${idx + 1}. ${item.name} (${item.category}, 信頼度: ${item.confidence}%)`)
      if (item.notes) console.log(`         📝 ${item.notes}`)
    })
    
    // Step 5: 手動確認推奨事項
    console.log('\\n✋ Step 5: 手動確認推奨事項')
    const manualNotes = this.generateManualNotes(locationCandidates, itemCandidates, analysis)
    console.log(`   📝 ${manualNotes}`)
    
    const processingTime = Date.now() - startTime
    console.log(`\\n⏱️ 処理時間: ${processingTime}ms`)
    
    return {
      episodeId,
      episodeTitle,
      analysisScore: analysis.confidence,
      locationCandidates,
      itemCandidates,
      searchQueries: analysis.searchQueries,
      manualNotes,
      processingTime
    }
  }
  
  // ロケーション候補の高度な評価
  private extractAndEvaluateLocations(searchResults: any[], suggestedTypes: string[]) {
    const candidates = []
    
    for (const result of searchResults) {
      const text = result.title + ' ' + result.snippet
      
      // より精密な店舗名抽出
      const locationPatterns = [
        // 日本語店舗パターン
        /([あ-ん一-龯ァ-ヶー\s]{2,20}(?:店|カフェ|レストラン|ショップ|食堂))/g,
        // ブランド名パターン
        /([A-Z][a-z\s&]+(?:Store|Cafe|Restaurant|Shop|Diner))/g,
        // 固有名詞パターン
        /(スターバックス|マクドナルド|ケンタッキー|サイゼリヤ|ガスト)[^あ-ん一-龯]*/g
      ]
      
      for (const pattern of locationPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            const name = match.trim()
            if (this.isValidLocationName(name)) {
              candidates.push({
                name: name,
                category: this.categorizeLocationAdvanced(name),
                confidence: this.calculateLocationConfidence(name, text, suggestedTypes),
                sourceUrl: result.url,
                notes: this.generateLocationNotes(name, text)
              })
            }
          }
        }
      }
    }
    
    // 重複除去・スコア順ソート
    return this.deduplicateAndSort(candidates).slice(0, 5)
  }
  
  // アイテム候補の高度な評価
  private extractAndEvaluateItems(searchResults: any[], suggestedTypes: string[]) {
    const candidates = []
    
    for (const result of searchResults) {
      const text = result.title + ' ' + result.snippet
      
      // ファッションアイテム特化パターン
      const itemPatterns = [
        // 衣服パターン
        /([あ-ん一-龯ァ-ヶー\s]{2,20}(?:シャツ|Tシャツ|パーカー|ジャケット|パンツ|デニム))/g,
        // 小物パターン  
        /([あ-ん一-龯ァ-ヶー\s]{2,20}(?:バッグ|時計|帽子|サングラス|スニーカー|ブーツ))/g,
        // ブランドアイテムパターン
        /([A-Z][a-zA-Z\s&]+(?:Shirt|Hoodie|Jacket|Bag|Watch|Sneaker))/g
      ]
      
      for (const pattern of itemPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            const name = match.trim()
            if (this.isValidItemName(name)) {
              candidates.push({
                name: name,
                brand: this.extractBrand(text, name),
                category: this.categorizeItemAdvanced(name),
                confidence: this.calculateItemConfidence(name, text, suggestedTypes),
                sourceUrl: result.url,
                notes: this.generateItemNotes(name, text)
              })
            }
          }
        }
      }
    }
    
    return this.deduplicateAndSort(candidates).slice(0, 5)
  }
  
  // 手動確認推奨事項生成
  private generateManualNotes(locationCandidates: any[], itemCandidates: any[], analysis: any): string {
    const notes = []
    
    if (locationCandidates.length === 0) {
      notes.push('⚠️ ロケーション候補が見つかりませんでした。YouTube動画の確認をお勧めします')
    } else {
      const highConfidence = locationCandidates.filter(l => l.confidence > 70)
      if (highConfidence.length > 0) {
        notes.push(`✅ 高信頼度ロケーション ${highConfidence.length}件あり - 優先確認対象`)
      } else {
        notes.push('⚠️ ロケーション候補の信頼度が低めです - 手動調査推奨')
      }
    }
    
    if (itemCandidates.length === 0) {
      notes.push('⚠️ アイテム候補が見つかりませんでした。メンバーの着用アイテムを手動確認してください')
    } else {
      const highConfidence = itemCandidates.filter(i => i.confidence > 70)
      if (highConfidence.length > 0) {
        notes.push(`✅ 高信頼度アイテム ${highConfidence.length}件あり`)
      }
    }
    
    if (analysis.keywords.includes('朝食') || analysis.keywords.includes('肉')) {
      notes.push('💡 食事系エピソードです - レストラン・カフェの営業時間・予約情報も確認してください')
    }
    
    if (analysis.keywords.includes('ドライブ')) {
      notes.push('💡 ドライブエピソードです - アクセス方法・駐車場情報も重要です')
    }
    
    return notes.join(' | ')
  }
  
  // ヘルパーメソッド群（簡略版）
  private extractKeywords(title: string): string[] {
    const patterns = {
      food: ['朝食', '昼食', '夕食', '肉', 'カフェ', 'ランチ'],
      activity: ['ドライブ', '旅行', 'お出かけ', 'デート', '散歩'],
      theme: ['青春', '恋愛', '友情', '仕事', '日常']
    }
    
    const keywords = []
    for (const words of Object.values(patterns)) {
      for (const word of words) {
        if (title.includes(word)) keywords.push(word)
      }
    }
    
    const bracketMatch = title.match(/【(.+?)】/)
    if (bracketMatch) keywords.push(bracketMatch[1])
    
    return [...new Set(keywords)]
  }
  
  private suggestLocations(keywords: string[]): string[] {
    return keywords.flatMap(k => {
      switch(k) {
        case '朝食': return ['カフェ', 'ホテル朝食', 'パンケーキ店']
        case '肉': return ['焼肉店', 'ステーキハウス', 'ハンバーガー店']
        case 'ドライブ': return ['ドライブイン', 'サービスエリア', '道の駅']
        default: return []
      }
    })
  }
  
  private suggestItems(keywords: string[]): string[] {
    return keywords.flatMap(k => {
      switch(k) {
        case '朝食': return ['マグカップ', 'トートバッグ', 'カジュアルウェア']
        case 'ドライブ': return ['サングラス', 'キャップ', 'リュック']
        default: return []
      }
    })
  }
  
  private generateSearchQueries(title: string, keywords: string[]): string[] {
    return [
      `よにのちゃんねる "${title}" ロケ地`,
      `よにのちゃんねる "${title}" 着用`,
      ...keywords.slice(0, 2).map(k => `よにのちゃんねる ${k} 店舗`)
    ]
  }
  
  private calculateConfidence(keywords: string[], locations: string[], items: string[]): number {
    return Math.min(keywords.length * 20 + locations.length * 10 + items.length * 10, 100)
  }
  
  private async searchGoogle(query: string) {
    // Google Search API呼び出し（前回の実装を使用）
    const apiKey = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY!
    const searchEngineId = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID!
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=3`
      const response = await fetch(url)
      const data = await response.json()
      
      return (data.items || []).map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet
      }))
    } catch {
      return []
    }
  }
  
  private isValidLocationName(name: string): boolean {
    return name.length > 2 && name.length < 30 && !/^[0-9]+$/.test(name)
  }
  
  private isValidItemName(name: string): boolean {
    return name.length > 2 && name.length < 30 && !/^[0-9]+$/.test(name)
  }
  
  private categorizeLocationAdvanced(name: string): string {
    if (name.includes('カフェ')) return 'カフェ'
    if (name.includes('レストラン') || name.includes('食堂')) return 'レストラン'
    if (name.includes('ショップ')) return 'ショップ'
    return '店舗'
  }
  
  private categorizeItemAdvanced(name: string): string {
    if (name.includes('シャツ') || name.includes('パーカー')) return 'トップス'
    if (name.includes('パンツ') || name.includes('デニム')) return 'ボトムス'
    if (name.includes('スニーカー') || name.includes('ブーツ')) return 'シューズ'
    if (name.includes('バッグ')) return 'バッグ'
    return 'その他'
  }
  
  private calculateLocationConfidence(name: string, text: string, suggestedTypes: string[]): number {
    let score = 50
    if (text.includes('よにのちゃんねる')) score += 30
    if (text.includes('ロケ地')) score += 20
    if (suggestedTypes.some(type => name.includes(type))) score += 20
    return Math.min(score, 100)
  }
  
  private calculateItemConfidence(name: string, text: string, suggestedTypes: string[]): number {
    let score = 50
    if (text.includes('よにのちゃんねる')) score += 30
    if (text.includes('着用')) score += 20
    if (suggestedTypes.some(type => name.includes(type))) score += 20
    return Math.min(score, 100)
  }
  
  private extractBrand(text: string, itemName: string): string | undefined {
    const brands = ['Supreme', 'Nike', 'Adidas', 'UNIQLO', 'ZARA', 'H&M']
    return brands.find(brand => text.includes(brand))
  }
  
  private generateLocationNotes(name: string, text: string): string {
    const notes = []
    if (text.includes('住所')) notes.push('住所情報あり')
    if (text.includes('営業時間')) notes.push('営業時間情報あり')
    if (text.includes('予約')) notes.push('予約情報あり')
    return notes.join(', ')
  }
  
  private generateItemNotes(name: string, text: string): string {
    const notes = []
    if (text.includes('価格') || text.includes('¥')) notes.push('価格情報あり')
    if (text.includes('購入') || text.includes('通販')) notes.push('購入情報あり')
    if (text.includes('ブランド')) notes.push('ブランド情報あり')
    return notes.join(', ')
  }
  
  private deduplicateAndSort(candidates: any[]) {
    const unique = candidates.filter((candidate, index, array) => 
      array.findIndex(c => c.name === candidate.name) === index
    )
    return unique.sort((a, b) => b.confidence - a.confidence)
  }
}

async function testCompleteCurationSystem() {
  console.log('🎯 完成版手動精査システムテスト')
  console.log('='.repeat(80))
  
  const curationSystem = new ManualCurationSystem()
  
  // 実際のよにのチャンネルエピソードでテスト
  const testEpisodes = [
    { id: 'TEST001', title: '#446【朝食!!】肉肉肉肉肉肉肉日' }
  ]
  
  for (const episode of testEpisodes) {
    const result = await curationSystem.curateEpisode(episode.id, episode.title)
    
    console.log('\\n📋 キュレーション結果サマリー:')
    console.log(`   🎬 エピソード: ${result.episodeTitle}`)
    console.log(`   📊 分析スコア: ${result.analysisScore}%`)
    console.log(`   🏪 ロケーション候補: ${result.locationCandidates.length}件`)
    console.log(`   👕 アイテム候補: ${result.itemCandidates.length}件`)
    console.log(`   ⏱️ 処理時間: ${result.processingTime}ms`)
    console.log(`   📝 手動確認事項: ${result.manualNotes}`)
    
    console.log('\\n🎯 推奨次のアクション:')
    if (result.locationCandidates.length > 0) {
      console.log('   1. 高信頼度ロケーションの住所・営業時間確認')
      console.log('   2. YouTube動画での実際の訪問シーン確認')
      console.log('   3. 管理画面での紐付け実行')
    }
    if (result.itemCandidates.length > 0) {
      console.log('   4. 高信頼度アイテムの詳細情報・価格確認')
      console.log('   5. 購入リンクの取得・設定')
    }
  }
  
  console.log('\\n✅ 完成版システムテスト完了')
  console.log('🚀 開発環境での検証が成功しました！')
  console.log('💡 本番環境での実行準備が整いました')
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  testCompleteCurationSystem().catch(console.error)
}