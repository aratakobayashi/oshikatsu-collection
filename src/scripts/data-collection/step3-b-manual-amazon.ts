// src/scripts/data-collection/step3-b-manual-amazon.ts

import dotenv from 'dotenv'

// 環境変数読み込み
dotenv.config({ path: '.env.local' })

// 型定義（既存のものを再利用）
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

interface ManualAmazonMatch {
  asin: string
  title: string
  price: number
  image_url: string
  affiliate_url: string
  match_confidence: number
}

interface ManualAffiliateItem extends ExtractedItem {
  suggested_searches: string[]
  manual_match?: ManualAmazonMatch
  affiliate_ready: boolean
}

// **手動Amazon商品マッチングシステム**
export class ManualAmazonMatcher {
  private associateTag: string

  constructor() {
    this.associateTag = process.env.AMAZON_ASSOCIATE_TAG || 'your-associate-id-22'
    console.log(`🔑 Associate Tag: ${this.associateTag}`)
  }

  // 検索候補キーワード生成
  private generateSearchSuggestions(item: ExtractedItem): string[] {
    const suggestions: string[] = []
    
    // 基本検索
    suggestions.push(`${item.brand} ${item.name}`)
    
    // 色付き検索
    if (item.color) {
      suggestions.push(`${item.brand} ${item.name} ${item.color}`)
    }
    
    // カテゴリ別検索
    const categories = {
      'バッグ': ['トートバッグ', 'ハンドバッグ', 'ショルダーバッグ'],
      'シャツ': ['Tシャツ', 'ブラウス', 'カットソー'],
      'ジャケット': ['アウター', 'コート', 'ブレザー'],
      '靴': ['スニーカー', 'パンプス', 'ブーツ']
    }
    
    for (const [key, variations] of Object.entries(categories)) {
      if (item.name.includes(key)) {
        variations.forEach(variation => {
          suggestions.push(`${item.brand} ${variation}`)
        })
      }
    }
    
    // 価格帯検索
    if (item.price > 0) {
      const priceRange = this.getPriceRange(item.price)
      suggestions.push(`${item.brand} ${priceRange}`)
    }
    
    return suggestions.slice(0, 5) // 上位5つ
  }

  // 価格帯の表現を取得
  private getPriceRange(price: number): string {
    if (price < 2000) return '安い'
    if (price < 5000) return 'プチプラ'
    if (price < 15000) return 'お手頃'
    if (price < 50000) return 'ちょっと高め'
    return 'ハイブランド'
  }

  // Amazon検索URL生成
  public generateAmazonSearchUrls(item: ExtractedItem): { keyword: string, url: string }[] {
    const suggestions = this.generateSearchSuggestions(item)
    
    return suggestions.map(keyword => ({
      keyword,
      url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${this.associateTag}`
    }))
  }

  // 手動マッチング用のデータ準備
  public prepareManualMatching(item: ExtractedItem): ManualAffiliateItem {
    const suggestions = this.generateSearchSuggestions(item)
    const searchUrls = this.generateAmazonSearchUrls(item)
    
    console.log(`\n🛍️  手動マッチング準備: ${item.brand} - ${item.name}`)
    console.log(`💰 予想価格: ¥${item.price.toLocaleString()}`)
    console.log(`🎨 色: ${item.color || '指定なし'}`)
    console.log('\n🔍 Amazon検索候補:')
    
    searchUrls.forEach((search, index) => {
      console.log(`${index + 1}. ${search.keyword}`)
      console.log(`   🔗 ${search.url}`)
    })
    
    console.log('\n📝 手動作業手順:')
    console.log('1. 上記URLをブラウザで開く')
    console.log('2. 最適な商品を見つける')
    console.log('3. 商品ページのASIN (B0xxxxxxx) をコピー')
    console.log('4. 下記のフォーマットで記録:\n')
    
    const manualMatchTemplate = {
      original_item: `${item.brand} - ${item.name}`,
      asin: "B0XXXXXXXXX", // ここに実際のASINを入力
      title: "実際の商品タイトル",
      price: 0, // 実際の価格
      affiliate_url: `https://www.amazon.co.jp/dp/B0XXXXXXXXX?tag=${this.associateTag}`
    }
    
    console.log(JSON.stringify(manualMatchTemplate, null, 2))
    console.log('\n' + '='.repeat(80))
    
    return {
      ...item,
      suggested_searches: suggestions,
      affiliate_ready: false // 手動マッチング完了後にtrueに変更
    }
  }

  // 手動マッチング結果の適用
  public applyManualMatch(item: ManualAffiliateItem, manualMatch: ManualAmazonMatch): ManualAffiliateItem {
    return {
      ...item,
      manual_match: manualMatch,
      affiliate_ready: true
    }
  }

  // アフィリエイトリンク生成
  public generateAffiliateLink(asin: string): string {
    return `https://www.amazon.co.jp/dp/${asin}?tag=${this.associateTag}`
  }
}

// **メイン処理: 手動マッチング準備**
export const prepareManualAmazonMatching = async (): Promise<void> => {
  console.log('🛠️  手動Amazon マッチング準備開始...\n')
  
  try {
    // Step 2結果を読み込み
    const fs = await import('fs')
    const files = fs.readdirSync('./data/').filter(f => f.startsWith('step2-improved-results-'))
    
    if (files.length === 0) {
      throw new Error('Step 2の結果ファイルが見つかりません')
    }
    
    const latestFile = files.sort().reverse()[0]
    console.log(`📂 Step 2結果を読み込み: ./data/${latestFile}`)
    
    const data = fs.readFileSync(`./data/${latestFile}`, 'utf8')
    const step2Results: Step2Output[] = JSON.parse(data)
    
    const matcher = new ManualAmazonMatcher()
    const manualMatchingData: ManualAffiliateItem[] = []
    
    console.log(`🎯 処理対象: ${step2Results.length}件のエピソード`)
    
    // 全アイテムの手動マッチング準備
    for (const episode of step2Results) {
      console.log(`\n📺 Episode ID: ${episode.episode_id}`)
      console.log(`👕 アイテム数: ${episode.extracted_items.length}件`)
      
      for (const item of episode.extracted_items) {
        const manualItem = matcher.prepareManualMatching(item)
        manualMatchingData.push(manualItem)
      }
    }
    
    // 手動マッチング用ファイル保存
    const outputFile = `manual-amazon-matching-${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(`./data/${outputFile}`, JSON.stringify(manualMatchingData, null, 2))
    
    console.log(`\n💾 手動マッチング用ファイル保存: ./data/${outputFile}`)
    console.log(`\n🎯 次のステップ:`)
    console.log(`1. 生成された検索URLで実際の商品を探す`)
    console.log(`2. 見つけた商品のASINを記録`)
    console.log(`3. JSONファイルを更新`)
    console.log(`4. 最終的なアフィリエイトリンク生成`)
    
    // 収益ポテンシャル表示
    const totalItems = manualMatchingData.length
    const estimatedMatches = Math.round(totalItems * 0.7) // 70%マッチング想定
    const monthlyRevenue = estimatedMatches * 300 // 1件300円想定
    
    console.log(`\n💰 収益ポテンシャル:`)
    console.log(`📦 処理アイテム総数: ${totalItems}件`)
    console.log(`🎯 予想マッチング: ${estimatedMatches}件 (70%)`)
    console.log(`💵 予想月間収益: ¥${monthlyRevenue.toLocaleString()}`)
    
  } catch (error) {
    console.error('❌ エラーが発生:', error)
  }
}

// 実行例: 手動マッチング適用
export const applyManualMatches = async (): Promise<void> => {
  console.log('🔧 手動マッチング適用例...\n')
  
  // 実際の手動マッチング例
  const exampleMatches = [
    {
      original_item: "Actually - バッグ",
      asin: "B08REAL123", // 実際に見つけたASIN
      title: "Actually トートバッグ キャンバストート",
      price: 1980,
      affiliate_url: "https://www.amazon.co.jp/dp/B08REAL123?tag=your-real-id-22"
    }
  ]
  
  console.log('✅ 手動マッチング完了例:')
  exampleMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.original_item}`)
    console.log(`   📦 Amazon: ${match.title}`)
    console.log(`   💰 価格: ¥${match.price.toLocaleString()}`)
    console.log(`   🔗 ${match.affiliate_url}`)
  })
  
  console.log('\n💡 この方法なら API不要で即座に収益化可能！')
}

// Node.js環境での実行
const main = async () => {
  console.log('🚀 手動Amazon マッチング実行開始...\n')
  await prepareManualAmazonMatching()
  console.log('\n' + '='.repeat(50))
  await applyManualMatches()
}

if (typeof window === 'undefined') {
  main()
}