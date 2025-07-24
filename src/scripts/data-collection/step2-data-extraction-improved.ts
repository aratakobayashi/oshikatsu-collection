// src/scripts/data-collection/step2-data-extraction-improved.ts

import dotenv from 'dotenv'

// 環境変数読み込み
dotenv.config({ path: '.env.local' })

// 型定義
interface SearchResult {
  title: string
  snippet: string
  link: string
  displayLink: string
}

interface Step1Output {
  episode_id: string
  search_results: SearchResult[]
  query_count: number
  api_quota_remaining: number
  processing_time: number
}

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

// **改善版 Step 2.1: アイテム情報抽出パターン**
export class ImprovedItemExtractor {
  
  // 有名ファッションブランド辞書（正確な抽出用）
  private fashionBrands = [
    // 日本ブランド
    'UNIQLO', 'ユニクロ', 'GU', 'ジーユー', 'MUJI', '無印良品',
    'COMME des GARCONS', 'コムデギャルソン', 'Issey Miyake', 'イッセイミヤケ',
    'Yohji Yamamoto', 'ヨウジヤマモト', 'Kenzo', 'ケンゾー',
    
    // 海外ブランド  
    'ZARA', 'ザラ', 'H&M', 'エイチアンドエム', 'Supreme', 'シュプリーム',
    'GUCCI', 'グッチ', 'CHANEL', 'シャネル', 'Louis Vuitton', 'ルイヴィトン',
    'PRADA', 'プラダ', 'Hermès', 'エルメス', 'Dior', 'ディオール',
    'Balenciaga', 'バレンシアガ', 'Nike', 'ナイキ', 'Adidas', 'アディダス',
    'Ralph Lauren', 'ラルフローレン', 'Tommy Hilfiger', 'トミーヒルフィガー'
  ]

  // アイテムカテゴリー辞書
  private itemCategories = [
    // トップス
    'Tシャツ', 'シャツ', 'ブラウス', 'セーター', 'ニット', 'カーディガン', 'ジャケット', 'コート',
    // ボトムス  
    'パンツ', 'ジーンズ', 'デニム', 'スカート', 'ショーツ',
    // 小物
    'バッグ', 'ハンドバッグ', 'トートバッグ', 'リュック', '財布',
    // アクセサリー
    'ネックレス', 'ピアス', 'イヤリング', 'ブレスレット', '指輪', 'リング', '時計',
    // シューズ
    '靴', 'スニーカー', 'ヒール', 'パンプス', 'ブーツ', 'サンダル'
  ]

  // 除外キーワード（関係ないものを除外）
  private excludeKeywords = [
    'DVD', 'Blu-ray', 'CD', 'アルバム', '映画', 'アニメ', '漫画', 'ゲーム',
    'チケット', 'グッズ', 'ポスター', 'フィギュア', '本', '雑誌'
  ]

  // 改善された抽出パターン
  private improvedItemPatterns = [
    // パターン1: 【ブランド名】アイテム名（価格）
    /【([^】]+)】([^（）]+)（[¥￥]([0-9,]+)円?）/g,
    
    // パターン2: ブランド名の〜（価格） 
    /([A-Za-z\u30A0-\u30FF\u4E00-\u9FAF]{2,15})[の]([^（）]{3,30})（[¥￥]([0-9,]+)円?）/g,
    
    // パターン3: 着用・愛用パターン（より厳密）
    /(着用|愛用|使用)([^。]*?)([A-Za-z\u30A0-\u30FF\u4E00-\u9FAF]{2,15})[の]?([^。（）]{3,20})（[¥￥]([0-9,]+)円?）?/g,
    
    // パターン4: ブランド名 + アイテムカテゴリ（価格なし）
    /([A-Za-z\u30A0-\u30FF\u4E00-\u9FAF]{2,15})[の]?(Tシャツ|シャツ|ジャケット|コート|バッグ|靴|ネックレス|時計)([^。]*)/g
  ]

  // ブランド名の妥当性チェック
  private isValidBrand(brand: string): boolean {
    // 除外キーワードチェック
    if (this.excludeKeywords.some(keyword => brand.includes(keyword))) {
      return false
    }
    
    // 有名ブランドリストにあるか
    if (this.fashionBrands.some(famousBrand => 
      brand.includes(famousBrand) || famousBrand.includes(brand)
    )) {
      return true
    }
    
    // アルファベット含有（海外ブランドの可能性）
    if (/[A-Za-z]/.test(brand) && brand.length >= 2 && brand.length <= 20) {
      return true
    }
    
    // カタカナ含有（日本語ブランド名の可能性）
    if (/[\u30A0-\u30FF]/.test(brand) && brand.length >= 2 && brand.length <= 15) {
      return true
    }
    
    return false
  }

  // アイテム名の妥当性チェック
  private isValidItem(itemName: string): boolean {
    // 長すぎる・短すぎるアイテム名を除外
    if (itemName.length < 2 || itemName.length > 50) {
      return false
    }
    
    // 除外キーワードチェック
    if (this.excludeKeywords.some(keyword => itemName.includes(keyword))) {
      return false
    }
    
    // アイテムカテゴリーが含まれているかチェック
    if (this.itemCategories.some(category => itemName.includes(category))) {
      return true
    }
    
    // ファッション関連キーワードチェック
    const fashionKeywords = ['衣装', 'ファッション', 'コーデ', 'スタイル', '着こなし']
    if (fashionKeywords.some(keyword => itemName.includes(keyword))) {
      return true
    }
    
    return true // デフォルトは通す
  }

  // ブランド名の正規化（改善版）
  private normalizeBrand(brand: string): string {
    const brandMap: { [key: string]: string } = {
      'ユニクロ': 'UNIQLO',
      'ジーユー': 'GU', 
      'ザラ': 'ZARA',
      'エイチアンドエム': 'H&M',
      'グッチ': 'GUCCI',
      'シャネル': 'CHANEL',
      'ルイヴィトン': 'Louis Vuitton',
      'ルイ・ヴィトン': 'Louis Vuitton',
      'プラダ': 'PRADA',
      'エルメス': 'Hermès',
      'ディオール': 'Dior',
      'バレンシアガ': 'Balenciaga',
      'ナイキ': 'Nike',
      'アディダス': 'Adidas',
      'シュプリーム': 'Supreme'
    }
    
    // 前後の空白・記号を除去
    const cleaned = brand.trim().replace(/[【】[\]]/g, '')
    
    return brandMap[cleaned] || cleaned
  }

  // 価格の正規化（改善版）
  private normalizePrice(priceStr: string): number {
    if (!priceStr) return 0
    
    // カンマ区切りの数字を抽出
    const match = priceStr.match(/([0-9,]+)/)
    if (!match) return 0
    
    const price = parseInt(match[1].replace(/,/g, ''))
    
    // 妥当な価格範囲チェック（100円〜1,000,000円）
    if (price < 100 || price > 1000000) {
      return 0
    }
    
    return price
  }

  // 信頼度の計算（改善版）
  private calculateConfidence(
    sourceText: string, 
    hasPrice: boolean,
    brandConfidence: number,
    itemConfidence: number
  ): 'high' | 'medium' | 'low' {
    const highConfidenceKeywords = ['着用', '愛用', '使用', '購入', '同じ', '同じもの']
    const mediumConfidenceKeywords = ['衣装', 'ファッション', 'コーデ', 'ブランド']
    
    const text = sourceText.toLowerCase()
    let score = 0
    
    // キーワードベーススコア
    if (highConfidenceKeywords.some(keyword => text.includes(keyword))) {
      score += 3
    } else if (mediumConfidenceKeywords.some(keyword => text.includes(keyword))) {
      score += 2
    } else {
      score += 1
    }
    
    // 価格情報があるか
    if (hasPrice) score += 2
    
    // ブランド・アイテムの信頼度
    score += brandConfidence + itemConfidence
    
    if (score >= 6) return 'high'
    if (score >= 4) return 'medium'
    return 'low'
  }

  // メイン抽出処理（改善版）
  public extractItems(searchResults: SearchResult[]): ExtractedItem[] {
    const extractedItems: ExtractedItem[] = []
    const seenItems = new Set<string>() // 重複除去用

    console.log(`🔍 ${searchResults.length}件の検索結果からアイテム抽出開始...`)

    for (const result of searchResults) {
      const text = `${result.title} ${result.snippet}`
      
      for (const pattern of this.improvedItemPatterns) {
        let match
        pattern.lastIndex = 0 // RegExpをリセット
        
        while ((match = pattern.exec(text)) !== null) {
          let brand = ''
          let itemName = ''
          let priceStr = ''
          
          // パターンに応じて抽出
          if (match.length >= 4) {
            brand = match[1]?.trim() || ''
            itemName = match[2]?.trim() || ''
            priceStr = match[4] || match[3] || ''
          }
          
          // 妥当性チェック
          if (!this.isValidBrand(brand) || !this.isValidItem(itemName)) {
            continue
          }
          
          const normalizedBrand = this.normalizeBrand(brand)
          const normalizedItem = itemName.trim()
          const price = this.normalizePrice(priceStr)
          
          // 重複チェック
          const itemKey = `${normalizedBrand}-${normalizedItem}`.toLowerCase()
          if (seenItems.has(itemKey)) continue
          seenItems.add(itemKey)
          
          // 色情報の抽出（改善版）
          const colorPattern = /(黒|白|赤|青|緑|黄|グレー|ベージュ|ピンク|ブラウン|ネイビー|オレンジ|パープル|紫)[い色の]?/
          const colorMatch = text.match(colorPattern)
          const color = colorMatch ? colorMatch[1] : undefined
          
          // 信頼度計算
          const brandConfidence = this.fashionBrands.includes(normalizedBrand) ? 2 : 1
          const itemConfidence = this.itemCategories.some(cat => normalizedItem.includes(cat)) ? 2 : 1
          
          const extractedItem: ExtractedItem = {
            brand: normalizedBrand,
            name: normalizedItem,
            price: price,
            color: color,
            confidence: this.calculateConfidence(match[0], price > 0, brandConfidence, itemConfidence),
            source_text: match[0].trim(),
            source_url: result.link
          }
          
          extractedItems.push(extractedItem)
        }
      }
    }

    console.log(`✅ ${extractedItems.length}件のアイテムを抽出完了`)
    return extractedItems
  }
}

// **改善版 Step 2.2: ロケーション情報抽出パターン**
export class ImprovedLocationExtractor {
  
  // 日本の主要都市・地域
  private majorCities = [
    '東京', '大阪', '京都', '横浜', '名古屋', '神戸', '福岡', '札幌', '仙台', '広島',
    '千葉', '埼玉', '神奈川', '愛知', '兵庫', '北海道', '宮城'
  ]

  // 有名なロケ地・観光地
  private famousLocations = [
    '渋谷', '新宿', '原宿', '表参道', '銀座', '六本木', '恵比寿', '代官山', '自由が丘',
    '鎌倉', '江ノ島', '箱根', '軽井沢', '熱海', '伊豆', '富士山', '京都タワー', '清水寺',
    '大阪城', '通天閣', '道頓堀', '心斎橋', '神戸港', '姫路城', '倉敷', '尾道'
  ]

  // 改善されたロケーション抽出パターン
  private improvedLocationPatterns = [
    // パターン1: 撮影地・ロケ地（より具体的）
    /(撮影地|ロケ地)[は:]?\s*([^。！？\n]{5,40})/g,
    
    // パターン2: 〜で撮影・〜でロケ
    /([^。]{5,30})[で](撮影|ロケ|収録)[^。]*/g,
    
    // パターン3: レストラン・カフェ（店名込み）
    /([^。]{3,25})(レストラン|カフェ|cafe|restaurant)/gi,
    
    // パターン4: ホテル・宿泊施設
    /([^。]{3,25})(ホテル|hotel|リゾート|旅館|宿)/gi,
    
    // パターン5: 都市名 + 具体的な場所
    /(東京|大阪|京都|横浜|名古屋|神戸|福岡)[都府県市]?[の]?([^。]{5,30})/g,
    
    // パターン6: 住所パターン（改善版）
    /([東京都|大阪府|京都府|神奈川県|愛知県|兵庫県|福岡県][^。]{10,50}[区市町村][^。]{5,30})/g
  ]

  // ロケーションの妥当性チェック
  private isValidLocation(locationName: string): boolean {
    // 長すぎる・短すぎる場所名を除外
    if (locationName.length < 3 || locationName.length > 50) {
      return false
    }
    
    // 意味のない文字列を除外
    const invalidPatterns = [
      /^[0-9]+$/, // 数字のみ
      /^[a-zA-Z]{1,2}$/, // 短いアルファベット
      /（.*）/, // 括弧内の情報
      /[【】[\]]/, // 特殊記号
    ]
    
    if (invalidPatterns.some(pattern => pattern.test(locationName))) {
      return false
    }
    
    // 有名な場所名が含まれているかチェック
    if (this.famousLocations.some(famous => locationName.includes(famous))) {
      return true
    }
    
    // 都市名が含まれているかチェック  
    if (this.majorCities.some(city => locationName.includes(city))) {
      return true
    }
    
    return true // デフォルトは通す
  }

  // カテゴリの判定（改善版）
  private categorizeLocation(text: string): 'filming_location' | 'restaurant' | 'cafe' | 'shop' | 'hotel' | 'other' {
    const lowerText = text.toLowerCase()
    
    if (lowerText.match(/(レストラン|restaurant|dining)/)) {
      return 'restaurant'
    } else if (lowerText.match(/(カフェ|cafe|coffee|コーヒー)/)) {
      return 'cafe'
    } else if (lowerText.match(/(ホテル|hotel|リゾート|旅館|宿)/)) {
      return 'hotel'  
    } else if (lowerText.match(/(店|ショップ|shop|store)/)) {
      return 'shop' 
    } else if (lowerText.match(/(撮影|ロケ|収録)/)) {
      return 'filming_location'
    } else {
      return 'other'
    }
  }

  // 信頼度の計算（改善版）
  private calculateConfidence(sourceText: string, category: string): 'high' | 'medium' | 'low' {
    const highConfidenceKeywords = ['撮影地', 'ロケ地', '住所', '場所', '舞台']
    const mediumConfidenceKeywords = ['レストラン', 'カフェ', 'ホテル', '店舗']
    
    const text = sourceText.toLowerCase()
    let score = 0
    
    // キーワードベーススコア
    if (highConfidenceKeywords.some(keyword => text.includes(keyword))) {
      score += 3
    } else if (mediumConfidenceKeywords.some(keyword => text.includes(keyword))) {
      score += 2
    } else {
      score += 1
    }
    
    // カテゴリ別スコア
    if (category === 'filming_location') score += 2
    if (category === 'restaurant' || category === 'cafe' || category === 'hotel') score += 1
    
    if (score >= 4) return 'high'
    if (score >= 3) return 'medium'
    return 'low'
  }

  // メイン抽出処理（改善版）
  public extractLocations(searchResults: SearchResult[]): ExtractedLocation[] {
    const extractedLocations: ExtractedLocation[] = []
    const seenLocations = new Set<string>() // 重複除去用

    console.log(`🔍 ${searchResults.length}件の検索結果からロケーション抽出開始...`)

    for (const result of searchResults) {
      const text = `${result.title} ${result.snippet}`
      
      for (const pattern of this.improvedLocationPatterns) {
        let match
        pattern.lastIndex = 0 // RegExpをリセット
        
        while ((match = pattern.exec(text)) !== null) {
          let locationName = ''
          
          // パターンに応じて抽出
          if (match[2]) {
            locationName = match[2].trim()
          } else if (match[1]) {
            locationName = match[1].trim()
          }
          
          // 妥当性チェック
          if (!this.isValidLocation(locationName)) {
            continue
          }
          
          // 重複チェック
          const locationKey = locationName.toLowerCase()
          if (seenLocations.has(locationKey)) continue
          seenLocations.add(locationKey)
          
          const category = this.categorizeLocation(match[0])
          
          const extractedLocation: ExtractedLocation = {
            name: locationName,
            category: category,
            confidence: this.calculateConfidence(match[0], category), 
            source_text: match[0].trim(),
            source_url: result.link
          }
          
          extractedLocations.push(extractedLocation)
        }
      }
    }

    console.log(`✅ ${extractedLocations.length}件のロケーションを抽出完了`)
    return extractedLocations
  }
}

// **Step 2.3: 改善版メイン処理関数**
export const processImprovedStep2 = async (step1Results: Step1Output[]): Promise<Step2Output[]> => {
  console.log(`🚀 改善版Step 2: 情報抽出開始 - ${step1Results.length}件のエピソードを処理`)
  
  const itemExtractor = new ImprovedItemExtractor()
  const locationExtractor = new ImprovedLocationExtractor()
  const step2Results: Step2Output[] = []
  
  for (const [index, step1Result] of step1Results.entries()) {
    const startTime = Date.now()
    
    console.log(`\n📋 [${index + 1}/${step1Results.length}] Episode ID: ${step1Result.episode_id}`)
    console.log(`📊 検索結果数: ${step1Result.search_results.length}件`)
    
    // アイテム情報抽出（改善版）
    const extractedItems = itemExtractor.extractItems(step1Result.search_results)
    console.log(`👕 抽出アイテム: ${extractedItems.length}件`)
    
    // ロケーション情報抽出（改善版）
    const extractedLocations = locationExtractor.extractLocations(step1Result.search_results)
    console.log(`📍 抽出ロケーション: ${extractedLocations.length}件`)
    
    const processingTime = Date.now() - startTime
    
    // 抽出精度の計算（現実的な指標）
    const totalSearchResults = step1Result.search_results.length
    const totalExtracted = extractedItems.length + extractedLocations.length
    const extractionAccuracy = Math.min(totalExtracted / (totalSearchResults * 0.5), 1.0) // 50%が理想的
    
    // 品質フィルタリング（high/mediumのみ残す）
    const highQualityItems = extractedItems.filter(item => 
      item.confidence === 'high' || (item.confidence === 'medium' && item.price > 0)
    )
    const highQualityLocations = extractedLocations.filter(loc => 
      loc.confidence === 'high' || loc.confidence === 'medium'
    )
    
    console.log(`⭐ 高品質アイテム: ${highQualityItems.length}件 (価格情報ありのhigh/medium)`)
    console.log(`⭐ 高品質ロケーション: ${highQualityLocations.length}件 (high/medium)`)
    
    const step2Result: Step2Output = {
      episode_id: step1Result.episode_id,
      extracted_items: highQualityItems, // 高品質のみ
      extracted_locations: highQualityLocations, // 高品質のみ
      extraction_stats: {
        items_found: highQualityItems.length,
        locations_found: highQualityLocations.length,
        extraction_accuracy: extractionAccuracy,
        processing_time: processingTime
      }
    }
    
    step2Results.push(step2Result)
    
    console.log(`⏱️  処理時間: ${processingTime}ms`)
    console.log(`📊 抽出精度: ${Math.round(extractionAccuracy * 100)}%`)
  }
  
  console.log(`\n🎉 改善版Step 2完了! 合計${step2Results.length}件のエピソードを処理しました`)
  
  return step2Results
}

// **Step 2.4: 結果保存**
export const saveImprovedStep2Results = async (results: Step2Output[]): Promise<void> => {
  const fileName = `step2-improved-results-${new Date().toISOString().split('T')[0]}.json`
  const jsonData = JSON.stringify(results, null, 2)
  
  if (typeof window === 'undefined') {
    const fs = await import('fs')
    fs.writeFileSync(`./data/${fileName}`, jsonData)
    console.log(`💾 改善版Step 2結果保存: ./data/${fileName}`)
  }
}

// **Step 2.5: Step1結果の読み込み**
export const loadStep1Results = async (): Promise<Step1Output[]> => {
  if (typeof window === 'undefined') {
    const fs = await import('fs')
    const files = fs.readdirSync('./data/').filter(f => f.startsWith('step1-results-'))
    
    if (files.length === 0) {
      throw new Error('Step 1の結果ファイルが見つかりません。先にStep 1を実行してください。')
    }
    
    const latestFile = files.sort().reverse()[0]
    console.log(`📂 Step 1結果を読み込み: ./data/${latestFile}`)
    
    const data = fs.readFileSync(`./data/${latestFile}`, 'utf8')
    return JSON.parse(data)
  }
  
  return []
}

// **Step 2.6: テスト関数（改善版）**
export const testImprovedStep2 = async (): Promise<void> => {
  console.log('🧪 改善版Step 2 テスト開始...')
  
  try {
    // Step 1の結果を読み込み
    const step1Results = await loadStep1Results()
    
    if (step1Results.length === 0) {
      console.log('❌ Step 1の結果が見つかりません')
      return
    }
    
    // 改善版Step 2処理実行
    const step2Results = await processImprovedStep2(step1Results)
    
    // 結果保存
    await saveImprovedStep2Results(step2Results)
    
    // サマリー表示
    const totalItems = step2Results.reduce((sum, r) => sum + r.extracted_items.length, 0)
    const totalLocations = step2Results.reduce((sum, r) => sum + r.extracted_locations.length, 0)
    const avgAccuracy = step2Results.reduce((sum, r) => sum + r.extraction_stats.extraction_accuracy, 0) / step2Results.length
    
    // 品質別の統計
    const highQualityItems = step2Results.flatMap(r => r.extracted_items.filter(i => i.confidence === 'high'))
    const mediumQualityItems = step2Results.flatMap(r => r.extracted_items.filter(i => i.confidence === 'medium'))
    const itemsWithPrice = step2Results.flatMap(r => r.extracted_items.filter(i => i.price > 0))
    
    console.log('\n📊 改善版Step 2 結果サマリー:')
    console.log(`🎯 処理エピソード数: ${step2Results.length}件`)
    console.log(`👕 高品質アイテム総数: ${totalItems}件`)
    console.log(`  └─ High信頼度: ${highQualityItems.length}件`)
    console.log(`  └─ Medium信頼度: ${mediumQualityItems.length}件`)
    console.log(`  └─ 価格情報あり: ${itemsWithPrice.length}件`)
    console.log(`📍 高品質ロケーション総数: ${totalLocations}件`)
    console.log(`📈 平均抽出精度: ${Math.round(avgAccuracy * 100)}%`)
    
    // サンプル結果表示（高品質のみ）
    if (highQualityItems.length > 0) {
      console.log('\n👕 高品質アイテム例:')
      highQualityItems.slice(0, 5).forEach((item, index) => {
        const priceText = item.price > 0 ? `¥${item.price.toLocaleString()}` : '価格不明'
        const colorText = item.color ? ` (${item.color})` : ''
        console.log(`${index + 1}. ${item.brand} - ${item.name}${colorText} ${priceText} [${item.confidence}]`)
        console.log(`   出典: ${item.source_text.substring(0, 60)}...`)
      })
    }
    
    const highQualityLocations = step2Results.flatMap(r => r.extracted_locations.filter(l => l.confidence === 'high'))
    if (highQualityLocations.length > 0) {
      console.log('\n📍 高品質ロケーション例:')
      highQualityLocations.slice(0, 5).forEach((location, index) => {
        console.log(`${index + 1}. ${location.name} [${location.category}] [${location.confidence}]`)
        console.log(`   出典: ${location.source_text.substring(0, 60)}...`)
      })
    }
    
    // 収益ポテンシャル計算
    const amazonReadyItems = itemsWithPrice.length
    const reservationReadyLocations = step2Results.flatMap(r => 
      r.extracted_locations.filter(l => 
        l.category === 'restaurant' || l.category === 'cafe' || l.category === 'hotel'
      )
    ).length
    
    console.log('\n💰 収益ポテンシャル:')
    console.log(`🛒 Amazon対応可能アイテム: ${amazonReadyItems}件`)
    console.log(`🍽️  予約対応可能ロケーション: ${reservationReadyLocations}件`)
    console.log(`💵 予想月間収益: ¥${Math.round((amazonReadyItems * 50 + reservationReadyLocations * 150)).toLocaleString()}`)
    
  } catch (error) {
    console.error('❌ 改善版Step 2でエラーが発生:', error)
  }
}

// **Node.js環境での実行**
const main = async () => {
  console.log('🚀 改善版Step 2 実行開始...\n')
  await testImprovedStep2()
}

// Node.js環境での実行
if (typeof window === 'undefined') {
  main()
}