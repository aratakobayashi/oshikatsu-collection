// src/scripts/data-collection/step3-amazon-api.ts

import dotenv from 'dotenv'

// 環境変数読み込み
dotenv.config({ path: '.env.local' })

// 型定義
interface ExtractedItem {
  brand: string
  name: string
  price: number
  color?: string
  confidence: 'high' | 'medium' | 'low'
  source_text: string
  source_url: string
}

interface ExtractedLocation {
  name: string
  category: 'filming_location' | 'restaurant' | 'cafe' | 'shop' | 'hotel' | 'other'
  confidence: 'high' | 'medium' | 'low'
  source_text: string
  source_url: string
}

interface Step2Output {
  episode_id: string
  extracted_items: ExtractedItem[]
  extracted_locations: ExtractedLocation[]
  extraction_stats: {
    items_found: number
    locations_found: number
    extraction_accuracy: number
    processing_time: number
  }
}

interface AmazonProduct {
  asin: string
  title: string
  price_amount?: number
  price_currency?: string
  image_url?: string
  product_url: string
  affiliate_url: string
  availability?: string
  rating?: number
  review_count?: number
}

interface AffiliateItem extends ExtractedItem {
  amazon_product?: AmazonProduct
  match_confidence: number
  affiliate_ready: boolean
  search_keywords: string[]
}

interface Step3Output {
  episode_id: string
  affiliate_items: AffiliateItem[]
  affiliate_locations: ExtractedLocation[] // そのまま引き継ぎ
  affiliate_stats: {
    items_processed: number
    amazon_matches_found: number
    affiliate_links_generated: number
    success_rate: number
    processing_time: number
  }
}

// **Step 3.1: Amazon Product API クライアント**
export class AmazonProductAPIClient {
  private accessKey: string
  private secretKey: string
  private associateTag: string

  constructor() {
    // 環境変数から取得（後で設定）
    this.accessKey = process.env.AMAZON_ACCESS_KEY || ''
    this.secretKey = process.env.AMAZON_SECRET_KEY || ''
    this.associateTag = process.env.AMAZON_ASSOCIATE_TAG || 'your-associate-id-20'
    
    console.log('🔑 Amazon API設定:')
    console.log(`Access Key: ${this.accessKey ? '✅ SET' : '❌ NOT SET'}`)
    console.log(`Secret Key: ${this.secretKey ? '✅ SET' : '❌ NOT SET'}`)
    console.log(`Associate Tag: ${this.associateTag}`)
  }

  // 商品検索（模擬実装 - 実際のAPI実装前のテスト用）
  public async searchItems(brand: string, itemName: string, priceRange?: { min: number, max: number }): Promise<AmazonProduct[]> {
    console.log(`🔍 Amazon検索: "${brand} ${itemName}"`)
    
    // 現在はAPI未設定なので模擬データを返す
    if (!this.accessKey || !this.secretKey) {
      console.log('⚠️  Amazon API未設定 - 模擬データで検索シミュレーション')
      
      // 模擬商品データ
      const mockProducts: AmazonProduct[] = [
        {
          asin: 'B08ABCD123',
          title: `${brand} ${itemName} - Amazon商品`,
          price_amount: priceRange ? (priceRange.min + priceRange.max) / 2 : 2500,
          price_currency: 'JPY',
          image_url: 'https://m.media-amazon.com/images/I/mockimage.jpg',
          product_url: `https://www.amazon.co.jp/dp/B08ABCD123`,
          affiliate_url: `https://www.amazon.co.jp/dp/B08ABCD123?tag=${this.associateTag}`,
          availability: 'In Stock',
          rating: 4.2,
          review_count: 156
        }
      ]
      
      // ブランド名でフィルタリング（簡易）
      const validBrands = ['UNIQLO', 'ZARA', 'GUCCI', 'Actually', 'Nike', 'Adidas']
      if (validBrands.some(validBrand => brand.includes(validBrand))) {
        console.log(`✅ 模擬商品発見: ${mockProducts[0].title}`)
        return mockProducts
      } else {
        console.log(`❌ 商品が見つかりませんでした: ${brand} ${itemName}`)
        return []
      }
    }

    // 実際のAPI実装はここに追加
    // TODO: 実際のAmazon Product API呼び出し
    console.log('🚧 実際のAmazon API呼び出しは未実装')
    return []
  }

  // アフィリエイトリンク生成
  public generateAffiliateLink(asin: string): string {
    return `https://www.amazon.co.jp/dp/${asin}?tag=${this.associateTag}`
  }
}

// **Step 3.2: 商品マッチング・アフィリエイト処理**
export class AffiliateProcessor {
  private amazonClient: AmazonProductAPIClient

  constructor() {
    this.amazonClient = new AmazonProductAPIClient()
  }

  // 検索キーワード生成
  private generateSearchKeywords(item: ExtractedItem): string[] {
    const keywords: string[] = []
    
    // 基本キーワード
    keywords.push(`${item.brand} ${item.name}`)
    
    // 色情報込み
    if (item.color) {
      keywords.push(`${item.brand} ${item.name} ${item.color}`)
    }
    
    // ブランド名のみ
    keywords.push(`${item.brand}`)
    
    // アイテム名のみ  
    keywords.push(`${item.name}`)
    
    return keywords.slice(0, 3) // 上位3つに限定
  }

  // 商品マッチング信頼度計算
  private calculateMatchConfidence(item: ExtractedItem, amazonProduct: AmazonProduct): number {
    let confidence = 0
    
    // ブランド名マッチング
    if (amazonProduct.title.toLowerCase().includes(item.brand.toLowerCase())) {
      confidence += 0.4
    }
    
    // アイテム名マッチング
    const itemWords = item.name.toLowerCase().split(/\s+/)
    const titleWords = amazonProduct.title.toLowerCase().split(/\s+/)
    const matchingWords = itemWords.filter(word => titleWords.some(titleWord => titleWord.includes(word)))
    confidence += (matchingWords.length / itemWords.length) * 0.3
    
    // 価格マッチング（±30%の範囲）
    if (item.price > 0 && amazonProduct.price_amount) {
      const priceRatio = Math.abs(item.price - amazonProduct.price_amount) / item.price
      if (priceRatio <= 0.3) {
        confidence += 0.3
      } else if (priceRatio <= 0.5) {
        confidence += 0.15
      }
    }
    
    return Math.min(confidence, 1.0)
  }

  // 単一アイテムの処理
  public async processItem(item: ExtractedItem): Promise<AffiliateItem> {
    console.log(`\n🛍️  処理開始: ${item.brand} - ${item.name}`)
    
    const searchKeywords = this.generateSearchKeywords(item)
    console.log(`🔑 検索キーワード: ${searchKeywords.join(', ')}`)
    
    let bestMatch: AmazonProduct | undefined
    let bestMatchConfidence = 0
    
    // 各キーワードで検索
    for (const keyword of searchKeywords) {
      const [brand, itemName] = keyword.split(' ', 2)
      
      const priceRange = item.price > 0 ? {
        min: Math.floor(item.price * 0.7),
        max: Math.ceil(item.price * 1.3)
      } : undefined
      
      const products = await this.amazonClient.searchItems(brand, itemName || '', priceRange)
      
      // 最適な商品を選択
      for (const product of products) {
        const matchConfidence = this.calculateMatchConfidence(item, product)
        
        if (matchConfidence > bestMatchConfidence) {
          bestMatch = product
          bestMatchConfidence = matchConfidence
        }
      }
      
      // 十分な信頼度があれば検索終了
      if (bestMatchConfidence >= 0.8) {
        break
      }
      
      // API制限対策: 短い待機
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    const affiliateItem: AffiliateItem = {
      ...item,
      amazon_product: bestMatch,
      match_confidence: bestMatchConfidence,
      affiliate_ready: bestMatch !== undefined && bestMatchConfidence >= 0.5,
      search_keywords: searchKeywords
    }
    
    if (bestMatch) {
      console.log(`✅ 商品発見: ${bestMatch.title} (信頼度: ${Math.round(bestMatchConfidence * 100)}%)`)
      console.log(`💰 価格: ¥${bestMatch.price_amount?.toLocaleString()}`)
      console.log(`🔗 アフィリエイトURL: ${bestMatch.affiliate_url}`)
    } else {
      console.log(`❌ 適切な商品が見つかりませんでした`)
    }
    
    return affiliateItem
  }
}

// **Step 3.3: メイン処理関数**
export const processStep3 = async (step2Results: Step2Output[]): Promise<Step3Output[]> => {
  console.log(`🚀 Step 3: Amazon API連携開始 - ${step2Results.length}件のエピソードを処理`)
  
  const affiliateProcessor = new AffiliateProcessor()
  const step3Results: Step3Output[] = []
  
  for (const [index, step2Result] of step2Results.entries()) {
    const startTime = Date.now()
    
    console.log(`\n📋 [${index + 1}/${step2Results.length}] Episode ID: ${step2Result.episode_id}`)
    console.log(`👕 処理対象アイテム数: ${step2Result.extracted_items.length}件`)
    
    const affiliateItems: AffiliateItem[] = []
    let amazonMatches = 0
    let affiliateLinks = 0
    
    // 各アイテムをAmazon検索
    for (const item of step2Result.extracted_items) {
      const affiliateItem = await affiliateProcessor.processItem(item)
      affiliateItems.push(affiliateItem)
      
      if (affiliateItem.amazon_product) {
        amazonMatches++
      }
      
      if (affiliateItem.affiliate_ready) {
        affiliateLinks++
      }
    }
    
    const processingTime = Date.now() - startTime
    const successRate = step2Result.extracted_items.length > 0 
      ? affiliateLinks / step2Result.extracted_items.length 
      : 0
    
    const step3Result: Step3Output = {
      episode_id: step2Result.episode_id,
      affiliate_items: affiliateItems,
      affiliate_locations: step2Result.extracted_locations, // ロケーションはそのまま引き継ぎ
      affiliate_stats: {
        items_processed: step2Result.extracted_items.length,
        amazon_matches_found: amazonMatches,
        affiliate_links_generated: affiliateLinks,
        success_rate: successRate,
        processing_time: processingTime
      }
    }
    
    step3Results.push(step3Result)
    
    console.log(`📊 処理結果:`)
    console.log(`  └─ Amazon商品発見: ${amazonMatches}/${step2Result.extracted_items.length}件`)
    console.log(`  └─ アフィリエイトリンク生成: ${affiliateLinks}件`)
    console.log(`  └─ 成功率: ${Math.round(successRate * 100)}%`)
    console.log(`  └─ 処理時間: ${processingTime}ms`)
  }
  
  console.log(`\n🎉 Step 3完了! 合計${step3Results.length}件のエピソードを処理しました`)
  
  return step3Results
}

// **Step 3.4: 結果保存**
export const saveStep3Results = async (results: Step3Output[]): Promise<void> => {
  const fileName = `step3-amazon-results-${new Date().toISOString().split('T')[0]}.json`
  const jsonData = JSON.stringify(results, null, 2)
  
  if (typeof window === 'undefined') {
    const fs = await import('fs')
    fs.writeFileSync(`./data/${fileName}`, jsonData)
    console.log(`💾 Step 3結果保存: ./data/${fileName}`)
  }
}

// **Step 3.5: Step2結果の読み込み**
export const loadStep2Results = async (): Promise<Step2Output[]> => {
  if (typeof window === 'undefined') {
    const fs = await import('fs')
    const files = fs.readdirSync('./data/').filter(f => f.startsWith('step2-improved-results-'))
    
    if (files.length === 0) {
      throw new Error('Step 2の結果ファイルが見つかりません。先にStep 2を実行してください。')
    }
    
    const latestFile = files.sort().reverse()[0]
    console.log(`📂 Step 2結果を読み込み: ./data/${latestFile}`)
    
    const data = fs.readFileSync(`./data/${latestFile}`, 'utf8')
    return JSON.parse(data)
  }
  
  return []
}

// **Step 3.6: テスト関数**
export const testStep3 = async (): Promise<void> => {
  console.log('🧪 Step 3 テスト開始...')
  
  try {
    // Step 2の結果を読み込み
    const step2Results = await loadStep2Results()
    
    if (step2Results.length === 0) {
      console.log('❌ Step 2の結果が見つかりません')
      return
    }
    
    // Step 3処理実行
    const step3Results = await processStep3(step2Results)
    
    // 結果保存
    await saveStep3Results(step3Results)
    
    // サマリー表示
    const totalItemsProcessed = step3Results.reduce((sum, r) => sum + r.affiliate_stats.items_processed, 0)
    const totalAmazonMatches = step3Results.reduce((sum, r) => sum + r.affiliate_stats.amazon_matches_found, 0)
    const totalAffiliateLinks = step3Results.reduce((sum, r) => sum + r.affiliate_stats.affiliate_links_generated, 0)
    const avgSuccessRate = step3Results.reduce((sum, r) => sum + r.affiliate_stats.success_rate, 0) / step3Results.length
    
    // 収益化可能アイテム
    const readyItems = step3Results.flatMap(r => r.affiliate_items.filter(i => i.affiliate_ready))
    const totalLocations = step3Results.reduce((sum, r) => sum + r.affiliate_locations.length, 0)
    
    console.log('\n📊 Step 3 結果サマリー:')
    console.log(`🎯 処理エピソード数: ${step3Results.length}件`)
    console.log(`👕 処理アイテム総数: ${totalItemsProcessed}件`)
    console.log(`🛒 Amazon商品発見: ${totalAmazonMatches}件`)
    console.log(`🔗 アフィリエイトリンク生成: ${totalAffiliateLinks}件`)
    console.log(`📈 平均成功率: ${Math.round(avgSuccessRate * 100)}%`)
    
    // 収益化可能アイテム例
    if (readyItems.length > 0) {
      console.log('\n💰 収益化可能アイテム例:')
      readyItems.slice(0, 3).forEach((item, index) => {
        const product = item.amazon_product!
        console.log(`${index + 1}. ${item.brand} - ${item.name}`)
        console.log(`   Amazon: ${product.title}`)
        console.log(`   価格: ¥${product.price_amount?.toLocaleString()}`)
        console.log(`   信頼度: ${Math.round(item.match_confidence * 100)}%`)
        console.log(`   🔗 ${product.affiliate_url}`)
      })
    }
    
    // 収益予測
    const monthlyRevenue = readyItems.length * 200 + totalLocations * 150 // 仮の計算
    console.log('\n💵 収益予測:')
    console.log(`🛍️  収益化可能アイテム: ${readyItems.length}件`)
    console.log(`📍 ロケーション総数: ${totalLocations}件`)
    console.log(`💰 予想月間収益: ¥${monthlyRevenue.toLocaleString()}`)
    
  } catch (error) {
    console.error('❌ Step 3でエラーが発生:', error)
  }
}

// **Node.js環境での実行**
const main = async () => {
  console.log('🚀 Step 3 実行開始...\n')
  await testStep3()
}

// Node.js環境での実行
if (typeof window === 'undefined') {
  main()
}