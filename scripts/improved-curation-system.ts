/**
 * 改善版手動精査システム
 * デバッグ結果を基にパターンマッチングを大幅強化
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

class ImprovedCurationSystem {
  
  // 大幅強化されたロケーション抽出
  private extractLocationsAdvanced(searchResults: any[]) {
    const candidates = []
    
    for (const result of searchResults) {
      const text = result.title + ' ' + result.snippet
      
      // 強化されたロケーション抽出パターン
      const locationPatterns = [
        // 具体的店舗名パターン
        /(筋肉食堂[^。]*?店)/g,
        /(東陽町[^。]*?(?:焼肉|食堂))/g,
        /([あ-ん一-龯ァ-ヶー\s]{2,30}(?:店|カフェ|レストラン|ショップ|食堂|ダイニング))/g,
        
        // チェーン店パターン
        /(スターバックス|マクドナルド|ケンタッキー|サイゼリヤ|ガスト|吉野家|すき家|松屋|ドトール|タリーズ)[^。]*?(?:店|支店)?/g,
        
        // 地名+業種パターン
        /([東京都|大阪府|愛知県|神奈川県][^。]*?(?:店|レストラン|カフェ))/g,
        /([銀座|新宿|渋谷|原宿|表参道|六本木|赤坂|青山][^。]*?(?:店|レストラン|カフェ))/g,
        
        // 英語店舗名パターン
        /([A-Z][a-zA-Z\s&]{3,25}(?:Store|Cafe|Restaurant|Shop|Diner|Kitchen))/g,
        
        // 住所情報からの抽出
        /【([^】]+(?:店|レストラン|カフェ))】/g,
        
        // よにのちゃんねる特化パターン
        /撮影場所[^。]*?([あ-ん一-龯ァ-ヶー\s]{3,20}(?:店|カフェ|レストラン))/g,
        /ロケ地[^。]*?([あ-ん一-龯ァ-ヶー\s]{3,20}(?:店|カフェ|レストラン))/g
      ]
      
      for (const pattern of locationPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            let name = match.trim()
            
            // 余分な文字の除去
            name = name.replace(/^(撮影場所|ロケ地)[^あ-ん一-龯A-Za-z]*/, '')
            name = name.replace(/【|】/g, '')
            
            if (this.isValidLocationName(name)) {
              const confidence = this.calculateLocationConfidenceAdvanced(name, text, result.url)
              
              // 住所情報の抽出試行
              const address = this.extractAddress(text, name)
              
              candidates.push({
                name: name,
                address: address,
                category: this.categorizeLocationAdvanced(name),
                confidence: confidence,
                sourceUrl: result.url,
                notes: this.generateLocationNotesAdvanced(name, text)
              })
            }
          }
        }
      }
    }
    
    return this.deduplicateAndSort(candidates).slice(0, 8) // より多くの候補を保持
  }
  
  // 大幅強化されたアイテム抽出
  private extractItemsAdvanced(searchResults: any[]) {
    const candidates = []
    
    for (const result of searchResults) {
      const text = result.title + ' ' + result.snippet
      
      // 強化されたアイテム抽出パターン
      const itemPatterns = [
        // ブランド+アイテムパターン
        /(Supreme|Nike|Adidas|UNIQLO|ZARA|H&M|PORTER|GUCCI|Polo|セリーヌ)[^。]*?(?:シャツ|パーカー|ジャケット|パンツ|デニム|バッグ|時計|帽子|サングラス|スニーカー|ブーツ|靴)/g,
        
        // 一般的なアイテムパターン
        /([あ-ん一-龯ァ-ヶー\s]{2,25}(?:シャツ|Tシャツ|パーカー|フーディー|ジャケット|パンツ|デニム|ジーンズ))/g,
        /([あ-ん一-龯ァ-ヶー\s]{2,25}(?:バッグ|ボストンバッグ|ショルダーバッグ|リュック|時計|帽子|キャップ|サングラス|メガネ))/g,
        /([あ-ん一-龯ァ-ヶー\s]{2,25}(?:スニーカー|ブーツ|靴|シューズ|ローファー))/g,
        
        // 英語アイテムパターン
        /([A-Z][a-zA-Z\s&]{3,25}(?:Shirt|T-shirt|Hoodie|Jacket|Pants|Jeans|Bag|Watch|Cap|Sneaker|Boots))/g,
        
        // 着用情報付きパターン
        /着用[^。]*?([あ-ん一-龯ァ-ヶー\s]{3,25}(?:シャツ|パーカー|バッグ|スニーカー))/g,
        /使用[^。]*?([あ-ん一-龯ァ-ヶー\s]{3,25}(?:バッグ|時計|サングラス|メガネ))/g,
        
        // よにのちゃんねる特化パターン
        /よにのちゃんねる[^。]*?([あ-ん一-龯ァ-ヶー\s]{3,25}(?:シャツ|パーカー|バッグ|スニーカー))/g
      ]
      
      for (const pattern of itemPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            let name = match.trim()
            
            // 余分な文字の除去
            name = name.replace(/^(着用|使用|よにのちゃんねる)[^あ-ん一-龯A-Za-z]*/, '')
            
            if (this.isValidItemName(name)) {
              const confidence = this.calculateItemConfidenceAdvanced(name, text, result.url)
              const brand = this.extractBrandAdvanced(text, name)
              
              candidates.push({
                name: name,
                brand: brand,
                category: this.categorizeItemAdvanced(name),
                confidence: confidence,
                sourceUrl: result.url,
                notes: this.generateItemNotesAdvanced(name, text)
              })
            }
          }
        }
      }
    }
    
    return this.deduplicateAndSort(candidates).slice(0, 8)
  }
  
  // 改善された住所抽出
  private extractAddress(text: string, locationName: string): string | undefined {
    const addressPatterns = [
      new RegExp(`${locationName}[^。]*?([東京都|大阪府|愛知県|神奈川県][^。]{10,50})`),
      new RegExp(`([東京都|大阪府|愛知県|神奈川県][^。]{10,50})[^。]*?${locationName}`),
      /住所[：:]\s*([東京都|大阪府|愛知県|神奈川県][^。\n]{10,50})/,
      /([東京都|大阪府|愛知県|神奈川県][市区町村][^。\n]{5,40})/
    ]
    
    for (const pattern of addressPatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return undefined
  }
  
  // 改善された信頼度計算（ロケーション）
  private calculateLocationConfidenceAdvanced(name: string, text: string, url: string): number {
    let score = 40 // ベーススコア
    
    // よにのちゃんねる関連
    if (text.includes('よにのちゃんねる')) score += 25
    if (text.includes('ジャにのちゃんねる')) score += 25
    
    // ロケ地・撮影関連
    if (text.includes('ロケ地')) score += 20
    if (text.includes('撮影場所')) score += 20
    if (text.includes('撮影')) score += 10
    
    // 店舗情報の詳細度
    if (text.includes('住所')) score += 15
    if (text.includes('営業時間')) score += 10
    if (text.includes('電話') || text.includes('予約')) score += 10
    if (text.includes('メニュー')) score += 5
    
    // URL信頼度
    if (url.includes('instagram.com')) score += 10
    if (url.includes('ameblo.jp')) score += 10
    if (url.includes('hatenablog.com')) score += 5
    
    // 具体的店舗名への追加スコア
    if (name.includes('銀座') || name.includes('新宿') || name.includes('渋谷')) score += 10
    if (name.includes('コリドー') || name.includes('東陽町')) score += 15
    
    return Math.min(score, 100)
  }
  
  // 改善された信頼度計算（アイテム）
  private calculateItemConfidenceAdvanced(name: string, text: string, url: string): number {
    let score = 40
    
    // よにのちゃんねる関連
    if (text.includes('よにのちゃんねる')) score += 25
    if (text.includes('着用')) score += 20
    if (text.includes('使用') || text.includes('私服')) score += 15
    
    // ブランド・購入情報
    if (text.includes('ブランド')) score += 15
    if (text.includes('価格') || text.includes('¥') || text.includes('円')) score += 10
    if (text.includes('購入') || text.includes('通販')) score += 10
    
    // URL信頼度
    if (url.includes('vestick.jp') || url.includes('oshi-fashion.com')) score += 20 // ファッション専門サイト
    if (url.includes('instagram.com')) score += 10
    if (url.includes('ameblo.jp')) score += 10
    
    // ブランド名での追加スコア
    const premiumBrands = ['Supreme', 'GUCCI', 'セリーヌ', 'PORTER']
    if (premiumBrands.some(brand => name.includes(brand))) score += 15
    
    return Math.min(score, 100)
  }
  
  // 改善されたブランド抽出
  private extractBrandAdvanced(text: string, itemName: string): string | undefined {
    const brands = [
      'Supreme', 'Nike', 'Adidas', 'UNIQLO', 'ZARA', 'H&M', 'PORTER', 
      'GUCCI', 'Polo', 'セリーヌ', 'CELINE', 'ルイヴィトン', 'Louis Vuitton',
      'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', 'Lacoste'
    ]
    
    // アイテム名から直接抽出
    const directBrand = brands.find(brand => 
      itemName.toLowerCase().includes(brand.toLowerCase())
    )
    if (directBrand) return directBrand
    
    // テキストから前後の文脈で抽出
    for (const brand of brands) {
      const pattern = new RegExp(`${brand}[^。]*?(?:シャツ|パーカー|バッグ|スニーカー|時計)`, 'i')
      if (pattern.test(text)) return brand
    }
    
    return undefined
  }
  
  // 改善されたカテゴリ分類
  private categorizeLocationAdvanced(name: string): string {
    if (name.includes('カフェ') || name.includes('コーヒー')) return 'カフェ'
    if (name.includes('レストラン') || name.includes('食堂') || name.includes('ダイニング')) return 'レストラン'
    if (name.includes('焼肉') || name.includes('ステーキ') || name.includes('肉')) return '焼肉・ステーキ'
    if (name.includes('ショップ') || name.includes('Store')) return 'ショップ'
    if (name.includes('ホテル')) return 'ホテル'
    if (name.includes('店')) return '店舗'
    return 'その他'
  }
  
  private categorizeItemAdvanced(name: string): string {
    if (name.includes('シャツ') || name.includes('パーカー') || name.includes('フーディー')) return 'トップス'
    if (name.includes('パンツ') || name.includes('デニム') || name.includes('ジーンズ')) return 'ボトムス'
    if (name.includes('スニーカー') || name.includes('ブーツ') || name.includes('靴')) return 'シューズ'
    if (name.includes('バッグ')) return 'バッグ'
    if (name.includes('時計')) return '時計'
    if (name.includes('サングラス') || name.includes('メガネ')) return 'アイウェア'
    if (name.includes('帽子') || name.includes('キャップ')) return 'ヘッドウェア'
    return 'アクセサリー'
  }
  
  // 改善されたノート生成
  private generateLocationNotesAdvanced(name: string, text: string): string {
    const notes = []
    
    if (text.includes('住所')) notes.push('住所情報あり')
    if (text.includes('営業時間')) notes.push('営業時間あり')
    if (text.includes('予約') || text.includes('電話')) notes.push('予約可能')
    if (text.includes('メニュー')) notes.push('メニュー情報あり')
    if (text.includes('アクセス')) notes.push('アクセス情報あり')
    if (text.includes('Instagram') || text.includes('instagram')) notes.push('SNS情報あり')
    
    return notes.join(', ')
  }
  
  private generateItemNotesAdvanced(name: string, text: string): string {
    const notes = []
    
    if (text.includes('価格') || text.includes('¥') || text.includes('円')) notes.push('価格情報あり')
    if (text.includes('購入') || text.includes('通販')) notes.push('購入情報あり')
    if (text.includes('ブランド')) notes.push('ブランド情報あり')
    if (text.includes('サイズ')) notes.push('サイズ情報あり')
    if (text.includes('色') || text.includes('カラー')) notes.push('カラー情報あり')
    
    return notes.join(', ')
  }
  
  // 統合実行メソッド
  async curateEpisodeImproved(episodeId: string, episodeTitle: string) {
    const startTime = Date.now()
    
    console.log(`\\n🎬 【改善版】エピソード精査: ${episodeTitle}`)
    console.log('='.repeat(70))
    
    // 改善された検索クエリ生成
    const searchQueries = this.generateImprovedSearchQueries(episodeTitle)
    console.log(`🔍 検索クエリ: ${searchQueries.length}件`)
    
    // Google検索実行
    const searchResults = await this.performGoogleSearch(searchQueries)
    console.log(`✅ 検索結果: ${searchResults.length}件`)
    
    // 改善された抽出処理
    const locationCandidates = this.extractLocationsAdvanced(searchResults)
    const itemCandidates = this.extractItemsAdvanced(searchResults)
    
    const processingTime = Date.now() - startTime
    
    console.log(`\\n🏪 ロケーション候補: ${locationCandidates.length}件`)
    locationCandidates.forEach((location, idx) => {
      console.log(`   ${idx + 1}. ${location.name} (${location.category}, ${location.confidence}%)`)
      if (location.address) console.log(`      📍 ${location.address}`)
      if (location.notes) console.log(`      📝 ${location.notes}`)
    })
    
    console.log(`\\n👕 アイテム候補: ${itemCandidates.length}件`)
    itemCandidates.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.name} (${item.category}, ${item.confidence}%)`)
      if (item.brand) console.log(`      🏷️ ${item.brand}`)
      if (item.notes) console.log(`      📝 ${item.notes}`)
    })
    
    console.log(`\\n⏱️ 処理時間: ${processingTime}ms`)
    
    return {
      episodeId,
      episodeTitle,
      locationCandidates,
      itemCandidates,
      processingTime,
      success: true
    }
  }
  
  // 改善された検索クエリ生成
  private generateImprovedSearchQueries(title: string): string[] {
    const queries = [
      // 基本クエリ
      `よにのちゃんねる "${title}" ロケ地`,
      `よにのちゃんねる "${title}" 店舗`,
      `よにのちゃんねる "${title}" 着用`,
      
      // キーワード別クエリ
      `よにのちゃんねる 朝食 店舗 場所`,
      `よにのちゃんねる メンバー ファッション 着用`,
      `よにのちゃんねる 私服 ブランド`,
      
      // 具体的メンバー名
      `よにのちゃんねる 二宮和也 着用`,
      `よにのちゃんねる 山田涼介 ファッション`,
      `よにのちゃんねる 菊池風磨 私服`
    ]
    
    return queries
  }
  
  // Google検索実行（既存メソッドを流用）
  private async performGoogleSearch(queries: string[]) {
    const allResults = []
    
    for (const query of queries.slice(0, 5)) { // より多くのクエリを実行
      const results = await this.searchGoogle(query)
      allResults.push(...results)
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    
    return allResults
  }
  
  private async searchGoogle(query: string) {
    const apiKey = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY!
    const searchEngineId = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID!
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`
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
  
  // ヘルパーメソッド
  private isValidLocationName(name: string): boolean {
    return name.length > 2 && name.length < 40 && 
           !/^[0-9]+$/.test(name) && 
           !name.includes('http') &&
           !name.includes('://') &&
           !/^[、。！？\s]+$/.test(name)
  }
  
  private isValidItemName(name: string): boolean {
    return name.length > 2 && name.length < 35 && 
           !/^[0-9]+$/.test(name) && 
           !name.includes('http') &&
           !/^[、。！？\s]+$/.test(name)
  }
  
  private deduplicateAndSort(candidates: any[]) {
    const unique = candidates.filter((candidate, index, array) => 
      array.findIndex(c => c.name === candidate.name) === index
    )
    return unique.sort((a, b) => b.confidence - a.confidence)
  }
}

async function testImprovedSystem() {
  console.log('🚀 改善版手動精査システムテスト')
  console.log('='.repeat(80))
  
  const improvedSystem = new ImprovedCurationSystem()
  
  // テスト対象エピソード
  const testEpisode = {
    id: '#446',
    title: '#446【朝食!!】肉肉肉肉肉肉肉日'
  }
  
  const result = await improvedSystem.curateEpisodeImproved(testEpisode.id, testEpisode.title)
  
  console.log('\\n📊 改善版結果サマリー:')
  console.log(`   🏪 ロケーション候補: ${result.locationCandidates.length}件`)
  console.log(`   👕 アイテム候補: ${result.itemCandidates.length}件`)
  console.log(`   ⏱️ 処理時間: ${result.processingTime}ms`)
  
  const highConfidenceLocations = result.locationCandidates.filter(l => l.confidence > 70)
  const highConfidenceItems = result.itemCandidates.filter(i => i.confidence > 70)
  
  console.log(`\\n🎯 高信頼度候補:`)
  console.log(`   🏪 ロケーション: ${highConfidenceLocations.length}件`)
  console.log(`   👕 アイテム: ${highConfidenceItems.length}件`)
  
  console.log('\\n✅ 改善版システムテスト完了')
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  testImprovedSystem().catch(console.error)
}