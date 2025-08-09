/**
 * Google Search API システム - よにのちゃんねる情報収集
 * 店舗情報・着用アイテム情報を検索・抽出
 */

import { config } from 'dotenv'

// 環境変数を読み込み
config({ path: '.env.production' })

interface GoogleSearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
}

interface ExtractedInfo {
  type: 'location' | 'item'
  name: string
  category: string
  description: string
  source_url: string
  confidence: number
  additional_info?: {
    address?: string
    brand?: string
    price?: string
    website?: string
  }
}

export class GoogleSearchSystem {
  private apiKey: string
  private searchEngineId: string
  private baseUrl = 'https://www.googleapis.com/customsearch/v1'
  
  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey
    this.searchEngineId = searchEngineId
  }

  // Google検索実行
  async search(query: string, maxResults: number = 10): Promise<GoogleSearchResult[]> {
    console.log(`🔍 Google検索: "${query}"`)
    
    try {
      const url = `${this.baseUrl}?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(query)}&num=${maxResults}&lr=lang_ja`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Google Search API Error: ${response.status} - ${JSON.stringify(error)}`)
      }
      
      const data = await response.json()
      
      if (!data.items) {
        console.log('🔍 検索結果なし')
        return []
      }
      
      console.log(`✅ ${data.items.length}件の検索結果を取得`)
      return data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink
      }))
      
    } catch (error: any) {
      console.error('❌ Google Search エラー:', error.message)
      throw error
    }
  }

  // 店舗・聖地情報検索
  async searchLocationInfo(): Promise<ExtractedInfo[]> {
    const locationQueries = [
      'よにのちゃんねる 行った カフェ',
      'よにのちゃんねる 訪問 レストラン',  
      'よにのちゃんねる お店 場所',
      'よにのちゃんねる ホテル 宿泊',
      'よにのちゃんねる 聖地巡礼 店舗',
      'よにのちゃんねる ロケ地',
      'よにのちゃんねる カフェ どこ',
      'よにのちゃんねる レストラン どこ'
    ]
    
    const allResults: ExtractedInfo[] = []
    
    for (const query of locationQueries) {
      try {
        console.log(`📍 検索中: ${query}`)
        const results = await this.search(query, 5)
        const extracted = this.extractLocationInfo(results, query)
        allResults.push(...extracted)
        
        // API制限対策: 1秒待機
        await this.delay(1000)
        
      } catch (error: any) {
        console.error(`❌ 検索エラー (${query}):`, error.message)
        continue
      }
    }
    
    return this.removeDuplicates(allResults)
  }

  // アイテム・ファッション情報検索
  async searchItemInfo(): Promise<ExtractedInfo[]> {
    const itemQueries = [
      'よにのちゃんねる 着用 服 ブランド',
      'よにのちゃんねる ファッション アイテム',
      'よにのちゃんねる 私服 どこの',
      'よにのちゃんねる バッグ ブランド',
      'よにのちゃんねる アクセサリー',
      'よにのちゃんねる コーデ 服',
      'よにのちゃんねる 愛用 ブランド',
      'よにのちゃんねる 持ってる アイテム'
    ]
    
    const allResults: ExtractedInfo[] = []
    
    for (const query of itemQueries) {
      try {
        console.log(`👗 検索中: ${query}`)
        const results = await this.search(query, 5)
        const extracted = this.extractItemInfo(results, query)
        allResults.push(...extracted)
        
        // API制限対策: 1秒待機
        await this.delay(1000)
        
      } catch (error: any) {
        console.error(`❌ 検索エラー (${query}):`, error.message)
        continue
      }
    }
    
    return this.removeDuplicates(allResults)
  }

  // 店舗情報抽出
  private extractLocationInfo(results: GoogleSearchResult[], originalQuery: string): ExtractedInfo[] {
    const extracted: ExtractedInfo[] = []
    
    for (const result of results) {
      const text = (result.title + ' ' + result.snippet).toLowerCase()
      
      // カフェ・レストラン名の抽出
      const patterns = [
        /カフェ[「『]([^」』]{2,15})[」』]/g,
        /cafe[「『]([^」』]{2,15})[」』]/g,
        /レストラン[「『]([^」』]{2,15})[」』]/g,
        /お店[「『]([^」』]{2,15})[」』]/g,
        /ホテル[「『]([^」』]{2,15})[」』]/g,
        /([ぁ-んァ-ヶー\w]{2,10})(カフェ|cafe)/gi,
        /([ぁ-んァ-ヶー\w]{2,10})(レストラン|restaurant)/gi
      ]
      
      for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(text)) !== null) {
          const name = match[1].trim()
          if (name.length >= 2) {
            
            // 住所情報抽出
            const addressMatch = result.snippet.match(/(東京|大阪|京都|神奈川|千葉|埼玉|渋谷|新宿|池袋|原宿|表参道|銀座|六本木|恵比寿|代官山|中目黒)[^\s]{0,20}/)
            
            extracted.push({
              type: 'location',
              name: name,
              category: this.categorizeLocation(text),
              description: result.snippet,
              source_url: result.link,
              confidence: this.calculateConfidence(result, originalQuery),
              additional_info: {
                address: addressMatch ? addressMatch[0] : undefined,
                website: result.link.includes('official') || result.link.includes('.com') ? result.link : undefined
              }
            })
          }
        }
      }
    }
    
    return extracted
  }

  // アイテム情報抽出
  private extractItemInfo(results: GoogleSearchResult[], originalQuery: string): ExtractedInfo[] {
    const extracted: ExtractedInfo[] = []
    
    // ブランド名リスト
    const brands = [
      'ZARA', 'UNIQLO', 'GU', 'Nike', 'adidas', 'H&M', 'GUCCI', 'PRADA', 'CHANEL',
      'ユニクロ', 'ジーユー', 'しまむら', 'WEGO', 'BEAMS', 'SHIPS', 'nano・universe',
      'URBAN RESEARCH', 'TOMORROWLAND', 'Theory', 'COS', 'ACNE', 'Celine', 'Dior'
    ]
    
    for (const result of results) {
      const text = (result.title + ' ' + result.snippet)
      
      // ブランド名検索
      for (const brand of brands) {
        if (text.toLowerCase().includes(brand.toLowerCase())) {
          
          // 価格情報抽出
          const priceMatch = text.match(/(\d{1,3},?\d{3}円|\d{1,5}円|¥\d{1,3},?\d{3})/g)
          
          // アイテムタイプ抽出
          const itemTypes = ['服', 'バッグ', '靴', 'アクセサリー', 'ワンピース', 'ジャケット', 'パンツ', 'スカート', 'ニット', 'コート']
          const itemType = itemTypes.find(type => text.includes(type)) || 'fashion'
          
          extracted.push({
            type: 'item',
            name: `${brand} ${itemType}`,
            category: this.categorizeItem(itemType),
            description: result.snippet,
            source_url: result.link,
            confidence: this.calculateConfidence(result, originalQuery),
            additional_info: {
              brand: brand,
              price: priceMatch ? priceMatch[0] : undefined
            }
          })
        }
      }
      
      // 汎用アイテム抽出
      const itemPatterns = [
        /([^。、\s]{2,15})(のバッグ|のアクセサリー|の服|のワンピース)/g,
        /着用[していた]?([^。、\s]{2,15})/g,
        /愛用[している]?([^。、\s]{2,15})/g
      ]
      
      for (const pattern of itemPatterns) {
        let match
        while ((match = pattern.exec(text)) !== null) {
          const name = match[1].trim()
          if (name.length >= 2) {
            extracted.push({
              type: 'item',
              name: name,
              category: 'fashion',
              description: result.snippet,
              source_url: result.link,
              confidence: this.calculateConfidence(result, originalQuery) * 0.8
            })
          }
        }
      }
    }
    
    return extracted
  }

  // 店舗カテゴリ分類
  private categorizeLocation(text: string): string {
    if (text.includes('カフェ') || text.includes('cafe') || text.includes('coffee')) return 'cafe'
    if (text.includes('レストラン') || text.includes('restaurant') || text.includes('食事')) return 'restaurant'
    if (text.includes('ホテル') || text.includes('hotel') || text.includes('宿泊')) return 'hotel'
    if (text.includes('ショップ') || text.includes('shop') || text.includes('店舗')) return 'shop'
    return 'location'
  }

  // アイテムカテゴリ分類
  private categorizeItem(itemType: string): string {
    if (['バッグ', 'bag'].some(type => itemType.includes(type))) return 'bag'
    if (['靴', 'shoes', 'スニーカー'].some(type => itemType.includes(type))) return 'shoes'
    if (['アクセサリー', 'accessory', 'ネックレス', 'ピアス'].some(type => itemType.includes(type))) return 'accessory'
    return 'fashion'
  }

  // 信頼度計算
  private calculateConfidence(result: GoogleSearchResult, originalQuery: string): number {
    let confidence = 0.5
    
    // よにのちゃんねる が明記されている
    if (result.title.includes('よにのちゃんねる') || result.snippet.includes('よにのちゃんねる')) {
      confidence += 0.3
    }
    
    // 公式・信頼できるサイト
    const trustedDomains = ['tabelog.co.jp', 'retty.me', 'gurunavi.com', 'rakuten.co.jp', 'amazon.co.jp']
    if (trustedDomains.some(domain => result.link.includes(domain))) {
      confidence += 0.2
    }
    
    // ファンサイト・まとめサイト
    if (result.link.includes('blog') || result.link.includes('fan')) {
      confidence += 0.1
    }
    
    return Math.min(confidence, 1.0)
  }

  // 重複削除
  private removeDuplicates(items: ExtractedInfo[]): ExtractedInfo[] {
    const seen = new Map()
    return items.filter(item => {
      const key = `${item.name}-${item.type}`
      if (seen.has(key)) {
        return false
      }
      seen.set(key, true)
      return true
    })
  }

  // 待機
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 実行関数
export async function searchYoniChannelInfo() {
  console.log('🔍 Google Search システム開始')
  
  const apiKey = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY
  const searchEngineId = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID
  
  if (!apiKey || !searchEngineId) {
    throw new Error('Google Custom Search API の設定が不完全です')
  }
  
  const searcher = new GoogleSearchSystem(apiKey, searchEngineId)
  
  try {
    // 1. 店舗情報検索
    console.log('\n📍 === 店舗・聖地情報検索 ===')
    const locationInfo = await searcher.searchLocationInfo()
    
    console.log(`📍 抽出結果: ${locationInfo.length}件の店舗情報`)
    
    // 2. アイテム情報検索  
    console.log('\n👗 === アイテム・ファッション情報検索 ===')
    const itemInfo = await searcher.searchItemInfo()
    
    console.log(`👗 抽出結果: ${itemInfo.length}件のアイテム情報`)
    
    // 3. 結果表示
    console.log('\n🏪 === 抽出された店舗情報 ===')
    locationInfo.slice(0, 10).forEach((info, i) => {
      console.log(`${i + 1}. ${info.name} (${info.category}) - 信頼度: ${info.confidence.toFixed(2)}`)
      console.log(`   "${info.description.substring(0, 80)}..."`)
      if (info.additional_info?.address) {
        console.log(`   📍 ${info.additional_info.address}`)
      }
      console.log(`   🔗 ${info.source_url}`)
      console.log('')
    })
    
    console.log('\n🛍️ === 抽出されたアイテム情報 ===')
    itemInfo.slice(0, 10).forEach((info, i) => {
      console.log(`${i + 1}. ${info.name} (${info.category}) - 信頼度: ${info.confidence.toFixed(2)}`)
      console.log(`   "${info.description.substring(0, 80)}..."`)
      if (info.additional_info?.brand) {
        console.log(`   🏷️ ブランド: ${info.additional_info.brand}`)
      }
      if (info.additional_info?.price) {
        console.log(`   💰 価格: ${info.additional_info.price}`)
      }
      console.log(`   🔗 ${info.source_url}`)
      console.log('')
    })
    
    return {
      locations: locationInfo,
      items: itemInfo,
      totalResults: locationInfo.length + itemInfo.length
    }
    
  } catch (error: any) {
    console.error('❌ 検索システムエラー:', error.message)
    throw error
  }
}

// コマンドライン実行 (ES Module対応)
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 直接実行時の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  searchYoniChannelInfo().catch(console.error)
}