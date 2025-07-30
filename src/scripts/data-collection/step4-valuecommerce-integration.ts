// src/scripts/data-collection/step4-valuecommerce-integration.ts

import dotenv from 'dotenv'

// 環境変数読み込み
dotenv.config({ path: '.env.local' })

// 型定義
interface ExtractedLocation {
  name: string
  category: 'filming_location' | 'restaurant' | 'cafe' | 'shop' | 'hotel' | 'other'
  confidence: 'high' | 'medium' | 'low'
  source_text: string
  source_url: string
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

interface ExtractionStats {
  items_found: number
  locations_found: number
  extraction_accuracy: number
  processing_time: number
}

interface Step2Output {
  episode_id: string
  extracted_items: ExtractedItem[]
  extracted_locations: ExtractedLocation[]
  extraction_stats: ExtractionStats
}

interface AffiliateLink {
  service_name: string
  affiliate_url: string
  display_text: string
  commission_rate: string
  priority: number
}

interface EnhancedLocation extends ExtractedLocation {
  affiliate_links: AffiliateLink[]
  estimated_revenue: number
  search_keywords: string[]
  region: string
  affiliate_ready: boolean
}

interface Step4Output {
  episode_id: string
  enhanced_locations: EnhancedLocation[]
  affiliate_stats: {
    total_locations: number
    affiliate_ready_count: number
    total_affiliate_links: number
    estimated_monthly_revenue: number
    processing_time: number
  }
}

// **Step 4.1: バリューコマースアフィリエイトリンク生成**
export class ValueCommerceAffiliateGenerator {
  
  // バリューコマースの提携先サービス設定
  private affiliateServices = {
    gurunavi: {
      name: 'ぐるなび',
      base_url: 'https://r.gnavi.co.jp/plan/',
      search_url: 'https://r.gnavi.co.jp/area/',
      commission_rate: '3-5%',
      average_commission: 350
    },
    tabelog: {
      name: '食べログ',
      base_url: 'https://tabelog.com/',
      search_url: 'https://tabelog.com/rstLst/',
      commission_rate: '2-4%',
      average_commission: 250
    },
    jalan: {
      name: 'じゃらん',
      base_url: 'https://www.jalan.net/',
      search_url: 'https://www.jalan.net/uw/',
      commission_rate: '1-3%',
      average_commission: 800
    },
    rakuten_travel: {
      name: '楽天トラベル',
      base_url: 'https://travel.rakuten.co.jp/',
      search_url: 'https://travel.rakuten.co.jp/search/',
      commission_rate: '1-2%',
      average_commission: 600
    },
    hotpepper: {
      name: 'ホットペッパーグルメ',
      base_url: 'https://www.hotpepper.jp/',
      search_url: 'https://www.hotpepper.jp/gst/',
      commission_rate: '2-3%',
      average_commission: 200
    }
  }

  // 地域マッピング
  private regionMapping = {
    '東京': ['渋谷', '新宿', '原宿', '表参道', '銀座', '六本木', '恵比寿', '代官山', '自由が丘', '秋葉原', '池袋', '上野', '東京'],
    '大阪': ['梅田', '心斎橋', '難波', '天王寺', '大阪城', '通天閣', '道頓堀', '大阪'],
    '京都': ['清水寺', '金閣寺', '嵐山', '祇園', '京都駅', '四条', '河原町', '京都'],
    '神奈川': ['横浜', '鎌倉', '江ノ島', '箱根', '川崎', 'みなとみらい'],
    '愛知': ['名古屋', '栄', '大須', '熱田'],
    '福岡': ['博多', '天神', '中洲', '太宰府'],
    '北海道': ['札幌', '函館', '小樽', '旭川'],
    '沖縄': ['那覇', '石垣', '宮古島', '首里']
  }

  // 地域の特定
  private identifyRegion(locationName: string): string {
    for (const [region, keywords] of Object.entries(this.regionMapping)) {
      if (keywords.some(keyword => locationName.includes(keyword))) {
        return region
      }
    }
    return '全国'
  }

  // 検索キーワード生成
  private generateSearchKeywords(location: ExtractedLocation, region: string): string[] {
    const keywords: string[] = []
    
    // 基本キーワード
    keywords.push(location.name)
    
    // 地域 + カテゴリ
    if (region !== '全国') {
      keywords.push(`${region} ${location.category}`)
    }
    
    // カテゴリ別特定キーワード
    switch (location.category) {
      case 'restaurant':
        keywords.push(`${region} レストラン`, `${region} グルメ`, `${region} 食事`)
        break
      case 'cafe':
        keywords.push(`${region} カフェ`, `${region} coffee`, `${region} 喫茶店`)
        break
      case 'hotel':
        keywords.push(`${region} ホテル`, `${region} 宿泊`, `${region} 泊まる`)
        break
      case 'filming_location':
        keywords.push(`${region} 観光`, `${region} 旅行`, `${region} 聖地巡礼`)
        break
    }
    
    return keywords.slice(0, 5)
  }

  // アフィリエイトリンク生成
  private generateAffiliateLinks(location: ExtractedLocation, region: string): AffiliateLink[] {
    const links: AffiliateLink[] = []
    const keywords = this.generateSearchKeywords(location, region)
    
    // カテゴリに応じたサービス選択
    switch (location.category) {
      case 'restaurant':
        // ぐるなび
        links.push({
          service_name: this.affiliateServices.gurunavi.name,
          affiliate_url: this.createSearchURL('gurunavi', keywords[0], region),
          display_text: `${location.name}をぐるなびで予約`,
          commission_rate: this.affiliateServices.gurunavi.commission_rate,
          priority: 1
        })
        
        // 食べログ
        links.push({
          service_name: this.affiliateServices.tabelog.name,
          affiliate_url: this.createSearchURL('tabelog', keywords[0], region),
          display_text: `${location.name}を食べログで検索`,
          commission_rate: this.affiliateServices.tabelog.commission_rate,
          priority: 2
        })
        
        // ホットペッパーグルメ
        links.push({
          service_name: this.affiliateServices.hotpepper.name,
          affiliate_url: this.createSearchURL('hotpepper', keywords[0], region),
          display_text: `${location.name}をホットペッパーで予約`,
          commission_rate: this.affiliateServices.hotpepper.commission_rate,
          priority: 3
        })
        break
        
      case 'cafe':
        // 食べログ
        links.push({
          service_name: this.affiliateServices.tabelog.name,
          affiliate_url: this.createSearchURL('tabelog', keywords[0], region),
          display_text: `${location.name}を食べログで検索`,
          commission_rate: this.affiliateServices.tabelog.commission_rate,
          priority: 1
        })
        
        // ぐるなび
        links.push({
          service_name: this.affiliateServices.gurunavi.name,
          affiliate_url: this.createSearchURL('gurunavi', keywords[0], region),
          display_text: `${location.name}をぐるなびで検索`,
          commission_rate: this.affiliateServices.gurunavi.commission_rate,
          priority: 2
        })
        break
        
      case 'hotel':
        // じゃらん
        links.push({
          service_name: this.affiliateServices.jalan.name,
          affiliate_url: this.createSearchURL('jalan', keywords[0], region),
          display_text: `${location.name}をじゃらんで予約`,
          commission_rate: this.affiliateServices.jalan.commission_rate,
          priority: 1
        })
        
        // 楽天トラベル
        links.push({
          service_name: this.affiliateServices.rakuten_travel.name,
          affiliate_url: this.createSearchURL('rakuten_travel', keywords[0], region),
          display_text: `${location.name}を楽天トラベルで予約`,
          commission_rate: this.affiliateServices.rakuten_travel.commission_rate,
          priority: 2
        })
        break
        
      case 'filming_location':
        // 周辺宿泊施設検索
        links.push({
          service_name: this.affiliateServices.jalan.name,
          affiliate_url: this.createSearchURL('jalan', `${region} ホテル`, region),
          display_text: `${location.name}周辺のホテルをじゃらんで予約`,
          commission_rate: this.affiliateServices.jalan.commission_rate,
          priority: 1
        })
        
        links.push({
          service_name: this.affiliateServices.rakuten_travel.name,
          affiliate_url: this.createSearchURL('rakuten_travel', `${region} ホテル`, region),
          display_text: `${location.name}周辺のホテルを楽天トラベルで予約`,
          commission_rate: this.affiliateServices.rakuten_travel.commission_rate,
          priority: 2
        })
        break
        
      case 'shop':
        // 周辺グルメ検索
        links.push({
          service_name: this.affiliateServices.tabelog.name,
          affiliate_url: this.createSearchURL('tabelog', `${region} グルメ`, region),
          display_text: `${location.name}周辺のグルメを食べログで検索`,
          commission_rate: this.affiliateServices.tabelog.commission_rate,
          priority: 1
        })
        break
    }
    
    return links
  }

  // 検索URL作成（実際のアフィリエイトリンク形式）
  private createSearchURL(service: string, keyword: string, region: string): string {
    const encodedKeyword = encodeURIComponent(keyword)
    const encodedRegion = encodeURIComponent(region)
    
    // 注意: 実際のバリューコマースのアフィリエイトリンクは
    // https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=XXXXX&pid=XXXXX&vc_url=元のURL
    // の形式になります。ここでは模擬的なURLを生成しています。
    
    const vcSid = process.env.VALUECOMMERCE_SID || 'YOUR_SID'
    const vcPid = process.env.VALUECOMMERCE_PID || 'YOUR_PID'
    
    let originalUrl = ''
    
    switch (service) {
      case 'gurunavi':
        originalUrl = `https://r.gnavi.co.jp/area/?kw=${encodedKeyword}`
        break
      case 'tabelog':
        originalUrl = `https://tabelog.com/rstLst/?kw=${encodedKeyword}`
        break
      case 'jalan':
        originalUrl = `https://www.jalan.net/uw/?kw=${encodedKeyword}&pref=${encodedRegion}`
        break
      case 'rakuten_travel':
        originalUrl = `https://travel.rakuten.co.jp/search/?kw=${encodedKeyword}`
        break
      case 'hotpepper':
        originalUrl = `https://www.hotpepper.jp/gst/?kw=${encodedKeyword}`
        break
      default:
        originalUrl = `https://example.com/search?q=${encodedKeyword}`
    }
    
    // バリューコマースアフィリエイトリンク形式
    return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${vcSid}&pid=${vcPid}&vc_url=${encodeURIComponent(originalUrl)}`
  }

  // 推定収益計算
  private calculateEstimatedRevenue(location: ExtractedLocation): number {
    const baseRevenue = {
      'restaurant': 350,
      'cafe': 200,
      'hotel': 800,
      'shop': 150,
      'filming_location': 300,
      'other': 100
    }
    
    let revenue = baseRevenue[location.category] || 100
    
    // 信頼度による調整
    switch (location.confidence) {
      case 'high':
        revenue *= 1.5
        break
      case 'medium':
        revenue *= 1.0
        break
      case 'low':
        revenue *= 0.7
        break
    }
    
    return Math.round(revenue)
  }

  // 単一ロケーションの処理
  public processLocation(location: ExtractedLocation): EnhancedLocation {
    const region = this.identifyRegion(location.name)
    const keywords = this.generateSearchKeywords(location, region)
    const affiliateLinks = this.generateAffiliateLinks(location, region)
    const estimatedRevenue = this.calculateEstimatedRevenue(location)
    
    const enhanced: EnhancedLocation = {
      ...location,
      affiliate_links: affiliateLinks,
      estimated_revenue: estimatedRevenue,
      search_keywords: keywords,
      region: region,
      affiliate_ready: affiliateLinks.length > 0
    }
    
    console.log(`\n📍 処理完了: ${location.name}`)
    console.log(`🏷️  カテゴリ: ${location.category}`)
    console.log(`🌏 地域: ${region}`)
    console.log(`💰 推定月間収益: ¥${estimatedRevenue}`)
    console.log(`🔗 アフィリエイトリンク: ${affiliateLinks.length}件`)
    affiliateLinks.forEach((link, i) => {
      console.log(`  ${i + 1}. ${link.service_name}: ${link.display_text}`)
    })
    
    return enhanced
  }
}

// **Step 4.2: メイン処理関数**
export const processStep4 = async (step2Results: Step2Output[]): Promise<Step4Output[]> => {
  console.log(`🚀 Step 4: バリューコマース連携開始 - ${step2Results.length}件のエピソードを処理`)
  
  const generator = new ValueCommerceAffiliateGenerator()
  const step4Results: Step4Output[] = []
  
  for (const [index, step2Result] of step2Results.entries()) {
    const startTime = Date.now()
    
    console.log(`\n📋 [${index + 1}/${step2Results.length}] Episode ID: ${step2Result.episode_id}`)
    console.log(`📍 処理対象ロケーション数: ${step2Result.extracted_locations.length}件`)
    
    const enhancedLocations: EnhancedLocation[] = []
    let totalAffiliateLinks = 0
    let affiliateReadyCount = 0
    let totalEstimatedRevenue = 0
    
    // 各ロケーションを処理
    for (const location of step2Result.extracted_locations) {
      const enhanced = generator.processLocation(location)
      enhancedLocations.push(enhanced)
      
      totalAffiliateLinks += enhanced.affiliate_links.length
      if (enhanced.affiliate_ready) {
        affiliateReadyCount++
      }
      totalEstimatedRevenue += enhanced.estimated_revenue
    }
    
    const processingTime = Date.now() - startTime
    
    const step4Result: Step4Output = {
      episode_id: step2Result.episode_id,
      enhanced_locations: enhancedLocations,
      affiliate_stats: {
        total_locations: step2Result.extracted_locations.length,
        affiliate_ready_count: affiliateReadyCount,
        total_affiliate_links: totalAffiliateLinks,
        estimated_monthly_revenue: totalEstimatedRevenue,
        processing_time: processingTime
      }
    }
    
    step4Results.push(step4Result)
    
    console.log(`\n📊 Episode処理結果:`)
    console.log(`  └─ アフィリエイト対応: ${affiliateReadyCount}/${step2Result.extracted_locations.length}件`)
    console.log(`  └─ 生成リンク数: ${totalAffiliateLinks}件`)
    console.log(`  └─ 推定月間収益: ¥${totalEstimatedRevenue.toLocaleString()}`)
    console.log(`  └─ 処理時間: ${processingTime}ms`)
  }
  
  console.log(`\n🎉 Step 4完了! 合計${step4Results.length}件のエピソードを処理しました`)
  
  return step4Results
}

// **Step 4.3: 結果保存**
export const saveStep4Results = async (results: Step4Output[]): Promise<void> => {
  const fileName = `step4-valuecommerce-results-${new Date().toISOString().split('T')[0]}.json`
  const jsonData = JSON.stringify(results, null, 2)
  
  if (typeof window === 'undefined') {
    const fs = await import('fs')
    fs.writeFileSync(`./data/${fileName}`, jsonData)
    console.log(`💾 Step 4結果保存: ./data/${fileName}`)
  }
}

// **Step 4.4: Step2結果の読み込み**
export const loadStep2Results = async (): Promise<Step2Output[]> => {
  if (typeof window === 'undefined') {
    const fs = await import('fs')
    const files = fs.readdirSync('./data/').filter(f => f.startsWith('step2-improved-results-'))
    
    if (files.length === 0) {
      throw new Error('Step 2の結果ファイルが見つかりません')
    }
    
    const latestFile = files.sort().reverse()[0]
    console.log(`📂 Step 2結果を読み込み: ./data/${latestFile}`)
    
    const data = fs.readFileSync(`./data/${latestFile}`, 'utf8')
    return JSON.parse(data)
  }
  
  return []
}

// **Step 4.5: テスト関数**
export const testStep4 = async (): Promise<void> => {
  console.log('🧪 Step 4 テスト開始...')
  
  try {
    // Step 2の結果を読み込み
    const step2Results = await loadStep2Results()
    
    if (step2Results.length === 0) {
      console.log('❌ Step 2の結果が見つかりません')
      return
    }
    
    // Step 4処理実行
    const step4Results = await processStep4(step2Results)
    
    // 結果保存
    await saveStep4Results(step4Results)
    
    // サマリー表示
    const totalLocations = step4Results.reduce((sum, r) => sum + r.affiliate_stats.total_locations, 0)
    const totalAffiliateReady = step4Results.reduce((sum, r) => sum + r.affiliate_stats.affiliate_ready_count, 0)
    const totalAffiliateLinks = step4Results.reduce((sum, r) => sum + r.affiliate_stats.total_affiliate_links, 0)
    const totalEstimatedRevenue = step4Results.reduce((sum, r) => sum + r.affiliate_stats.estimated_monthly_revenue, 0)
    
    console.log('\n📊 Step 4 結果サマリー:')
    console.log(`🎯 処理エピソード数: ${step4Results.length}件`)
    console.log(`📍 総ロケーション数: ${totalLocations}件`)
    console.log(`🔗 アフィリエイト対応: ${totalAffiliateReady}件 (${Math.round(totalAffiliateReady/totalLocations*100)}%)`)
    console.log(`💎 生成リンク総数: ${totalAffiliateLinks}件`)
    console.log(`💰 推定月間収益: ¥${totalEstimatedRevenue.toLocaleString()}`)
    
    // 高収益ロケーション例
    const highRevenueLocations = step4Results.flatMap(r => r.enhanced_locations)
      .filter(l => l.estimated_revenue >= 400)
      .sort((a, b) => b.estimated_revenue - a.estimated_revenue)
    
    if (highRevenueLocations.length > 0) {
      console.log('\n💰 高収益期待ロケーション例:')
      highRevenueLocations.slice(0, 5).forEach((location, index) => {
        console.log(`${index + 1}. ${location.name} [${location.region}]`)
        console.log(`   💰 推定月間収益: ¥${location.estimated_revenue}`)
        console.log(`   🔗 アフィリエイトリンク: ${location.affiliate_links.length}件`)
        console.log(`   🏷️  ${location.affiliate_links.map(l => l.service_name).join(', ')}`)
      })
    }
    
    // 地域別統計
    const regionStats: { [key: string]: number } = {}
    step4Results.flatMap(r => r.enhanced_locations).forEach(location => {
      regionStats[location.region] = (regionStats[location.region] || 0) + 1
    })
    
    console.log('\n🌏 地域別分布:')
    Object.entries(regionStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([region, count]) => {
        console.log(`${region}: ${count}件`)
      })
    
  } catch (error) {
    console.error('❌ Step 4でエラーが発生:', error)
  }
}

// **Node.js環境での実行**
const main = async () => {
  console.log('🚀 Step 4 実行開始...\n')
  await testStep4()
}

if (typeof window === 'undefined') {
  main()
}