/**
 * 本番環境での手動精査システム実行
 * 実際のよにのチャンネルエピソード5件を処理
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// 開発環境で開発した手動精査システムクラスをインポート
class ProductionCurationSystem {
  
  // エピソード分析
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
  
  // Google検索実行
  async performGoogleSearch(queries: string[]) {
    const allResults = []
    
    for (const query of queries.slice(0, 3)) {
      const results = await this.searchGoogle(query)
      allResults.push(...results)
      await new Promise(resolve => setTimeout(resolve, 1000)) // API制限対策
    }
    
    return allResults
  }
  
  // 統合キュレーションプロセス
  async curateEpisode(episodeId: string, episodeTitle: string) {
    const startTime = Date.now()
    
    console.log(`\\n🎬 【本番】エピソード精査: ${episodeTitle}`)
    console.log('='.repeat(70))
    
    // Step 1: エピソード分析
    const analysis = this.analyzeEpisode(episodeTitle)
    console.log(`📊 分析結果: 信頼度 ${analysis.confidence}%, キーワード [${analysis.keywords.join(', ')}]`)
    
    // Step 2: Google検索実行
    console.log(`🔍 Google検索実行中...`)
    const searchResults = await this.performGoogleSearch(analysis.searchQueries)
    console.log(`✅ 検索完了: ${searchResults.length}件の結果`)
    
    // Step 3: ロケーション候補抽出
    const locationCandidates = this.extractAndEvaluateLocations(searchResults, analysis.suggestedLocations)
    console.log(`🏪 ロケーション候補: ${locationCandidates.length}件`)
    
    locationCandidates.forEach((location, idx) => {
      console.log(`   ${idx + 1}. ${location.name} (信頼度: ${location.confidence}%)`)
      if (location.address) console.log(`      📍 ${location.address}`)
      if (location.notes) console.log(`      📝 ${location.notes}`)
    })
    
    // Step 4: アイテム候補抽出
    const itemCandidates = this.extractAndEvaluateItems(searchResults, analysis.suggestedItems)
    console.log(`\\n👕 アイテム候補: ${itemCandidates.length}件`)
    
    itemCandidates.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.name} (信頼度: ${item.confidence}%)`)
      if (item.brand) console.log(`      🏷️ ブランド: ${item.brand}`)
      if (item.notes) console.log(`      📝 ${item.notes}`)
    })
    
    // Step 5: 推奨アクション
    const processingTime = Date.now() - startTime
    console.log(`\\n⏱️ 処理時間: ${processingTime}ms`)
    
    console.log(`\\n🎯 推奨次のアクション:`)
    if (locationCandidates.length > 0) {
      console.log(`   ✅ 管理画面でロケーション紐付け実行可能`)
      console.log(`   📋 高信頼度候補: ${locationCandidates.filter(l => l.confidence > 70).length}件`)
    }
    if (itemCandidates.length > 0) {
      console.log(`   ✅ 管理画面でアイテム紐付け実行可能`)
      console.log(`   📋 高信頼度候補: ${itemCandidates.filter(i => i.confidence > 70).length}件`)
    }
    
    return {
      episodeId,
      episodeTitle,
      analysis,
      locationCandidates,
      itemCandidates,
      processingTime,
      success: true
    }
  }
  
  // ロケーション候補抽出・評価
  private extractAndEvaluateLocations(searchResults: any[], suggestedTypes: string[]) {
    const candidates = []
    
    for (const result of searchResults) {
      const text = result.title + ' ' + result.snippet
      
      // 店舗名抽出パターン
      const locationPatterns = [
        /([あ-ん一-龯ァ-ヶー\s]{3,20}(?:店|カフェ|レストラン|ショップ|食堂))/g,
        /(スターバックス|マクドナルド|ケンタッキー|サイゼリヤ|ガスト|吉野家|すき家|松屋)[^あ-ん一-龯]*/g,
        /([A-Z][a-z\s&]+(?:Store|Cafe|Restaurant|Shop|Diner))/g
      ]
      
      for (const pattern of locationPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            const name = match.trim()
            if (this.isValidLocationName(name)) {
              // 住所情報抽出試行
              const addressMatch = text.match(new RegExp(name + '[^。]*?([東京都|大阪府|愛知県][^。]{5,30})'))
              
              candidates.push({
                name: name,
                address: addressMatch ? addressMatch[1] : undefined,
                category: this.categorizeLocation(name),
                confidence: this.calculateLocationConfidence(name, text, suggestedTypes),
                sourceUrl: result.url,
                notes: this.generateLocationNotes(name, text)
              })
            }
          }
        }
      }
    }
    
    return this.deduplicateAndSort(candidates).slice(0, 5)
  }
  
  // アイテム候補抽出・評価
  private extractAndEvaluateItems(searchResults: any[], suggestedTypes: string[]) {
    const candidates = []
    
    for (const result of searchResults) {
      const text = result.title + ' ' + result.snippet
      
      // アイテム名抽出パターン
      const itemPatterns = [
        /([あ-ん一-龯ァ-ヶー\s]{3,25}(?:シャツ|Tシャツ|パーカー|ジャケット|パンツ|デニム|ジーンズ))/g,
        /([あ-ん一-龯ァ-ヶー\s]{3,25}(?:バッグ|時計|帽子|サングラス|スニーカー|ブーツ|靴))/g,
        /(Supreme|Nike|Adidas|UNIQLO|ZARA|H&M|PORTER)[^。]{0,30}(?:シャツ|パーカー|バッグ|スニーカー)/g
      ]
      
      for (const pattern of itemPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            const name = match.trim()
            if (this.isValidItemName(name)) {
              const brand = this.extractBrand(text, name)
              
              candidates.push({
                name: name,
                brand: brand,
                category: this.categorizeItem(name),
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
  
  // ヘルパーメソッド
  private extractKeywords(title: string): string[] {
    const patterns = {
      food: ['朝食', '昼食', '夕食', '肉', 'カフェ', 'ランチ', '食事', 'グルメ', '焼肉', 'ステーキ'],
      activity: ['ドライブ', '旅行', 'お出かけ', 'デート', '散歩', '買い物', 'ショッピング'],
      theme: ['青春', '恋愛', '友情', '仕事', '日常', '特別', '思い出']
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
    const mapping = {
      '朝食': ['カフェ', 'ホテル朝食', 'パンケーキ店', 'モーニング'],
      '肉': ['焼肉店', 'ステーキハウス', 'ハンバーガー店', 'BBQ'],
      'ドライブ': ['ドライブイン', 'サービスエリア', '道の駅', '観光地'],
      'カフェ': ['スターバックス', 'ドトール', 'タリーズ', 'おしゃれカフェ']
    }
    
    return keywords.flatMap(k => mapping[k] || [])
  }
  
  private suggestItems(keywords: string[]): string[] {
    const mapping = {
      '朝食': ['マグカップ', 'トートバッグ', 'カジュアルウェア'],
      '肉': ['カジュアルシャツ', 'デニム', 'スニーカー'],
      'ドライブ': ['サングラス', 'キャップ', 'リュック', 'スニーカー'],
      '青春': ['制服風アイテム', 'スクールバッグ', 'カーディガン']
    }
    
    return keywords.flatMap(k => mapping[k] || [])
  }
  
  private generateSearchQueries(title: string, keywords: string[]): string[] {
    const queries = [
      `よにのちゃんねる "${title}" ロケ地`,
      `よにのちゃんねる "${title}" 店舗`,
      `よにのちゃんねる "${title}" 着用 アイテム`
    ]
    
    // キーワード別クエリ追加
    for (const keyword of keywords.slice(0, 2)) {
      queries.push(`よにのちゃんねる ${keyword} 店舗`)
      queries.push(`よにのちゃんねる メンバー ${keyword}`)
    }
    
    return queries
  }
  
  private calculateConfidence(keywords: string[], locations: string[], items: string[]): number {
    let score = 0
    score += Math.min(keywords.length * 20, 60)
    score += Math.min(locations.length * 10, 30)
    score += Math.min(items.length * 10, 30)
    
    // 特定キーワードにボーナス
    const specificKeywords = ['朝食', '肉', 'カフェ', 'ドライブ']
    const specificCount = keywords.filter(k => specificKeywords.includes(k)).length
    score += specificCount * 15
    
    return Math.min(score, 100)
  }
  
  private async searchGoogle(query: string) {
    const apiKey = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY!
    const searchEngineId = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID!
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=3`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.error) return []
      
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
    return name.length > 2 && name.length < 30 && !/^[0-9]+$/.test(name) && !name.includes('http')
  }
  
  private isValidItemName(name: string): boolean {
    return name.length > 2 && name.length < 30 && !/^[0-9]+$/.test(name) && !name.includes('http')
  }
  
  private categorizeLocation(name: string): string {
    if (name.includes('カフェ') || name.includes('Cafe')) return 'カフェ'
    if (name.includes('レストラン') || name.includes('食堂')) return 'レストラン'
    if (name.includes('ショップ') || name.includes('Shop')) return 'ショップ'
    if (name.includes('店')) return '店舗'
    return 'その他'
  }
  
  private categorizeItem(name: string): string {
    if (name.includes('シャツ') || name.includes('パーカー')) return 'トップス'
    if (name.includes('パンツ') || name.includes('デニム')) return 'ボトムス'
    if (name.includes('スニーカー') || name.includes('靴')) return 'シューズ'
    if (name.includes('バッグ')) return 'バッグ'
    if (name.includes('時計')) return 'アクセサリー'
    return 'その他'
  }
  
  private calculateLocationConfidence(name: string, text: string, suggestedTypes: string[]): number {
    let score = 50
    if (text.includes('よにのちゃんねる')) score += 30
    if (text.includes('ロケ地') || text.includes('撮影')) score += 20
    if (text.includes('店舗') || text.includes('住所')) score += 15
    if (suggestedTypes.some(type => name.includes(type))) score += 15
    return Math.min(score, 100)
  }
  
  private calculateItemConfidence(name: string, text: string, suggestedTypes: string[]): number {
    let score = 50
    if (text.includes('よにのちゃんねる')) score += 30
    if (text.includes('着用') || text.includes('使用')) score += 20
    if (text.includes('ブランド') || text.includes('購入')) score += 15
    if (suggestedTypes.some(type => name.includes(type))) score += 15
    return Math.min(score, 100)
  }
  
  private extractBrand(text: string, itemName: string): string | undefined {
    const brands = ['Supreme', 'Nike', 'Adidas', 'UNIQLO', 'ZARA', 'H&M', 'PORTER', 'GUCCI', 'Polo']
    return brands.find(brand => text.toLowerCase().includes(brand.toLowerCase()))
  }
  
  private generateLocationNotes(name: string, text: string): string {
    const notes = []
    if (text.includes('住所')) notes.push('住所情報あり')
    if (text.includes('営業時間')) notes.push('営業時間情報あり')
    if (text.includes('予約') || text.includes('電話')) notes.push('予約情報あり')
    if (text.includes('メニュー')) notes.push('メニュー情報あり')
    return notes.join(', ')
  }
  
  private generateItemNotes(name: string, text: string): string {
    const notes = []
    if (text.includes('価格') || text.includes('¥') || text.includes('円')) notes.push('価格情報あり')
    if (text.includes('購入') || text.includes('通販') || text.includes('オンライン')) notes.push('購入情報あり')
    if (text.includes('ブランド') || text.includes('メーカー')) notes.push('ブランド情報あり')
    return notes.join(', ')
  }
  
  private deduplicateAndSort(candidates: any[]) {
    const unique = candidates.filter((candidate, index, array) => 
      array.findIndex(c => c.name === candidate.name) === index
    )
    return unique.sort((a, b) => b.confidence - a.confidence)
  }
}

async function executeProductionCuration() {
  console.log('🚀 本番環境手動精査システム実行')
  console.log('='.repeat(80))
  console.log(`🌍 環境: ${process.env.VITE_ENVIRONMENT}`)
  console.log(`🔗 Supabase: ${process.env.VITE_SUPABASE_URL}`)
  
  try {
    // 本番環境の最新エピソード5件を取得
    console.log('\\n📺 本番環境エピソード取得中...')
    
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('id, title, date')
      .order('date', { ascending: false })
      .limit(5)
    
    if (error) {
      console.log('❌ エピソード取得エラー:', error.message)
      return
    }
    
    console.log(`✅ 取得完了: ${episodes.length}件のエピソード`)
    episodes.forEach((episode, idx) => {
      const date = new Date(episode.date).toLocaleDateString('ja-JP')
      console.log(`   ${idx + 1}. ${episode.title} (${date})`)
    })
    
    // 手動精査システム実行
    const curationSystem = new ProductionCurationSystem()
    const results = []
    
    for (const episode of episodes) {
      const result = await curationSystem.curateEpisode(episode.id, episode.title)
      results.push(result)
      
      // API制限対策で少し待機
      console.log('⏳ 次のエピソード処理まで少し待機...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 総合結果サマリー
    console.log('\\n📊 総合結果サマリー')
    console.log('='.repeat(80))
    
    const totalLocations = results.reduce((sum, r) => sum + r.locationCandidates.length, 0)
    const totalItems = results.reduce((sum, r) => sum + r.itemCandidates.length, 0)
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
    const highConfidenceLocations = results.reduce((sum, r) => 
      sum + r.locationCandidates.filter(l => l.confidence > 70).length, 0)
    const highConfidenceItems = results.reduce((sum, r) => 
      sum + r.itemCandidates.filter(i => i.confidence > 70).length, 0)
    
    console.log(`📈 処理完了: ${results.length}エピソード`)
    console.log(`🏪 ロケーション候補: ${totalLocations}件 (高信頼度: ${highConfidenceLocations}件)`)
    console.log(`👕 アイテム候補: ${totalItems}件 (高信頼度: ${highConfidenceItems}件)`)
    console.log(`⏱️ 平均処理時間: ${Math.round(avgProcessingTime)}ms`)
    
    // 高信頼度候補の詳細表示
    console.log('\\n🎯 高信頼度候補一覧（管理画面で紐付け推奨）')
    console.log('-'.repeat(60))
    
    for (const result of results) {
      const highLocations = result.locationCandidates.filter(l => l.confidence > 70)
      const highItems = result.itemCandidates.filter(i => i.confidence > 70)
      
      if (highLocations.length > 0 || highItems.length > 0) {
        console.log(`\\n🎬 ${result.episodeTitle}`)
        
        if (highLocations.length > 0) {
          console.log(`   🏪 ロケーション候補:`)
          highLocations.forEach((location, idx) => {
            console.log(`      ${idx + 1}. ${location.name} (${location.confidence}%)`)
            if (location.address) console.log(`         📍 ${location.address}`)
          })
        }
        
        if (highItems.length > 0) {
          console.log(`   👕 アイテム候補:`)
          highItems.forEach((item, idx) => {
            console.log(`      ${idx + 1}. ${item.name} (${item.confidence}%)`)
            if (item.brand) console.log(`         🏷️ ${item.brand}`)
          })
        }
      }
    }
    
    console.log('\\n✅ 本番環境での手動精査システム実行完了！')
    console.log('🎯 次のステップ: 管理画面での紐付け実行')
    console.log('💡 高信頼度候補から優先的に紐付けを行ってください')
    
  } catch (error: any) {
    console.error('❌ 実行エラー:', error.message)
  }
}

// Run production curation
if (import.meta.url === `file://${process.argv[1]}`) {
  executeProductionCuration().catch(console.error)
}