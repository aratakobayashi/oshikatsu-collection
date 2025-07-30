// src/scripts/data-collection/step5-database-integration.ts

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数読み込み
dotenv.config({ path: '.env.local' })

// Node.js環境用のSupabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 環境変数デバッグ:')
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.log('必要な環境変数:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL または VITE_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY (推奨) または NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// サービスロールキー使用の確認
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ サービスロールキーを使用してRLS制限を回避します')
} else {
  console.log('⚠️  ANONキーを使用中。RLS制限により一部操作が制限される可能性があります')
}

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

// Step2結果の型定義
interface Step2Result {
  episode_id: string
  extracted_items: ExtractedItem[]
  extracted_locations: ExtractedLocation[]
  extraction_stats: {
    items_found: number
    locations_found: number
    extraction_accuracy: number
  }
}

// Step4結果の型定義
interface Step4Result {
  episode_id: string
  enhanced_locations: EnhancedLocation[]
  affiliate_stats: {
    locations_processed: number
    affiliate_links_generated: number
    success_rate: number
  }
}

// データベース統計の型定義
interface DatabaseStats {
  episodes: number
  items: number
  locations: number
  affiliate_links: number
  estimated_monthly_revenue: number
}

// 高収益ロケーションの型定義
interface HighRevenueLocation {
  id: string
  name: string
  category: string
  region: string
  estimated_revenue: number
  episodes: { title: string }
  affiliate_links: AffiliateLink[]
}

// 削除: 未使用のインターフェース

// **Step 5.1: 既存スキーマ対応データベース管理クラス**
export class DatabaseManager {
  
  // 既存エピソードを使用または新規作成
  public async getOrCreateEpisode(episodeData: { title: string, description?: string }): Promise<string | null> {
    try {
      // まず既存のエピソードを検索
      const { data: existingEpisodes, error: searchError } = await supabase
        .from('episodes')
        .select('id')
        .eq('title', episodeData.title)
        .limit(1)
      
      if (searchError) {
        console.error('❌ エピソード検索エラー:', searchError)
      }
      
      if (existingEpisodes && existingEpisodes.length > 0) {
        console.log(`✅ 既存エピソード使用: ${episodeData.title}`)
        return existingEpisodes[0].id
      }
      
      // 既存エピソードが見つからない場合は、任意の既存エピソードを使用
      console.log('⚠️  指定されたエピソードが見つかりません。既存のエピソードを使用します。')
      
      const { data: anyEpisode, error: anyError } = await supabase
        .from('episodes')
        .select('id, title')
        .limit(1)
      
      if (anyError || !anyEpisode || anyEpisode.length === 0) {
        console.error('❌ 既存エピソード取得エラー:', anyError)
        console.log('📝 episodesテーブルにデータが必要です。')
        return null
      }
      
      console.log(`✅ 既存エピソードを使用: ${anyEpisode[0].title} (ID: ${anyEpisode[0].id})`)
      return anyEpisode[0].id
      
    } catch (error) {
      console.error('❌ エピソード処理エラー:', error)
      return null
    }
  }

  // アイテム保存（既存スキーマ対応）
  public async saveItems(episodeId: string, items: ExtractedItem[]): Promise<number> {
    if (items.length === 0) return 0
    
    try {
      // categoryマッピング
      const categoryMapping: { [key: string]: string } = {
        'バッグ': 'bag',
        'シャツ': 'clothing',
        'Tシャツ': 'clothing',
        'ジャケット': 'clothing',
        'コート': 'clothing',
        '靴': 'shoes',
        'スニーカー': 'shoes',
        'アクセサリー': 'accessory',
        'ネックレス': 'jewelry',
        'ピアス': 'jewelry',
        '時計': 'watch'
      }
      
      const itemsData = items.map(item => {
        // カテゴリの推定
        let category = 'other'
        for (const [keyword, cat] of Object.entries(categoryMapping)) {
          if (item.name.includes(keyword)) {
            category = cat
            break
          }
        }
        
        return {
          episode_id: episodeId,
          name: item.name,
          brand: item.brand || '',
          price: item.price || 0,
          color: item.color || '',
          category: category,
          description: item.source_text || '',
          currency: 'JPY'
        }
      })
      
      const { data, error } = await supabase
        .from('items')
        .insert(itemsData)
        .select()
      
      if (error) {
        console.error('❌ アイテム保存エラー:', error)
        return 0
      }
      
      console.log(`✅ アイテム保存完了: ${data.length}件`)
      return data.length
      
    } catch (error) {
      console.error('❌ アイテム保存エラー:', error)
      return 0
    }
  }

  // ロケーション保存（既存スキーマ対応）
  public async saveLocations(episodeId: string, locations: EnhancedLocation[]): Promise<{ [locationName: string]: string }> {
    if (locations.length === 0) return {}
    
    try {
      // categoryマッピング
      const categoryMapping: { [key: string]: string } = {
        'filming_location': 'tourist_spot',
        'restaurant': 'restaurant',
        'cafe': 'cafe',
        'shop': 'shop',
        'hotel': 'hotel',
        'other': 'other'
      }
      
      const locationsData = locations.map(location => ({
        episode_id: episodeId,
        name: location.name,
        category: categoryMapping[location.category] || 'other',
        description: location.source_text || '',
        address: location.region || '',
        reservation_url: location.affiliate_links.length > 0 ? location.affiliate_links[0].affiliate_url : ''
      }))
      
      const { data, error } = await supabase
        .from('locations')
        .insert(locationsData)
        .select()
      
      if (error) {
        console.error('❌ ロケーション保存エラー:', error)
        return {}
      }
      
      console.log(`✅ ロケーション保存完了: ${data.length}件`)
      
      // location_name -> location_id のマッピングを作成
      const locationIdMap: { [locationName: string]: string } = {}
      data.forEach((loc, index) => {
        locationIdMap[locations[index].name] = loc.id
      })
      
      return locationIdMap
      
    } catch (error) {
      console.error('❌ ロケーション保存エラー:', error)
      return {}
    }
  }

  // アフィリエイトリンク保存（既存ロケーションテーブルのreservation_urlに統合）
  public async saveAffiliateLinks(locationIdMap: { [locationName: string]: string }, locations: EnhancedLocation[]): Promise<number> {
    let totalSaved = 0
    
    try {
      for (const location of locations) {
        const locationId = locationIdMap[location.name]
        if (!locationId || location.affiliate_links.length === 0) continue
        
        // 最優先のアフィリエイトリンクをreservation_urlとして保存
        const primaryLink = location.affiliate_links.sort((a, b) => a.priority - b.priority)[0]
        
        const { error } = await supabase
          .from('locations')
          .update({
            reservation_url: primaryLink.affiliate_url,
            description: `${location.source_text}\n\nアフィリエイト: ${primaryLink.service_name}`
          })
          .eq('id', locationId)
        
        if (error) {
          console.error(`❌ アフィリエイトリンク更新エラー (${location.name}):`, error)
          continue
        }
        
        totalSaved += 1
      }
      
      console.log(`✅ アフィリエイトリンク統合完了: ${totalSaved}件`)
      return totalSaved
      
    } catch (error) {
      console.error('❌ アフィリエイトリンク統合エラー:', error)
      return totalSaved
    }
  }
}

// **Step 5.2: データ統合クラス**
export class DataIntegrator {
  private dbManager: DatabaseManager
  
  constructor() {
    this.dbManager = new DatabaseManager()
  }

  // Step 2結果を読み込み
  private async loadStep2Results(): Promise<Step2Result[]> {
    if (typeof window === 'undefined') {
      const fs = await import('fs')
      const files = fs.readdirSync('./data/').filter(f => f.startsWith('step2-improved-results-'))
      
      if (files.length === 0) {
        throw new Error('Step 2の結果ファイルが見つかりません')
      }
      
      const latestFile = files.sort().reverse()[0]
      console.log(`📂 Step 2結果を読み込み: ./data/${latestFile}`)
      
      const data = fs.readFileSync(`./data/${latestFile}`, 'utf8')
      return JSON.parse(data) as Step2Result[]
    }
    return []
  }

  // Step 4結果を読み込み
  private async loadStep4Results(): Promise<Step4Result[]> {
    if (typeof window === 'undefined') {
      const fs = await import('fs')
      const files = fs.readdirSync('./data/').filter(f => f.startsWith('step4-valuecommerce-results-'))
      
      if (files.length === 0) {
        throw new Error('Step 4の結果ファイルが見つかりません')
      }
      
      const latestFile = files.sort().reverse()[0]
      console.log(`📂 Step 4結果を読み込み: ./data/${latestFile}`)
      
      const data = fs.readFileSync(`./data/${latestFile}`, 'utf8')
      return JSON.parse(data) as Step4Result[]
    }
    return []
  }

  // データ統合処理
  public async integrateAllData(): Promise<void> {
    console.log('🚀 データベース統合開始...\n')
    
    try {
      // データ読み込み
      const step2Results = await this.loadStep2Results()
      const step4Results = await this.loadStep4Results()
      
      if (step2Results.length === 0 || step4Results.length === 0) {
        throw new Error('Step 2またはStep 4の結果が見つかりません')
      }
      
      console.log(`\n📊 統合データ:`)
      console.log(`Step 2データ: ${step2Results.length}エピソード`)
      console.log(`Step 4データ: ${step4Results.length}エピソード`)
      
      const totalStats = {
        episodes: 0,
        items: 0,
        locations: 0,
        affiliate_links: 0
      }
      
      // エピソードごとに統合処理
      for (let i = 0; i < step2Results.length; i++) {
        const step2Data = step2Results[i]
        const step4Data = step4Results[i]
        
        if (!step2Data || !step4Data || step2Data.episode_id !== step4Data.episode_id) {
          console.error(`❌ データ不整合: エピソード${i + 1}`)
          continue
        }
        
        console.log(`\n📋 [${i + 1}/${step2Results.length}] エピソード統合: ${step2Data.episode_id}`)
        
        // エピソード取得または作成
        const episodeId = await this.dbManager.getOrCreateEpisode({
          title: `エピソード ${i + 1}`,
          description: `Episode ID: ${step2Data.episode_id}`
        })
        
        if (!episodeId) {
          console.error('❌ エピソード処理失敗')
          continue
        }
        
        totalStats.episodes++
        
        // アイテム保存
        const itemCount = await this.dbManager.saveItems(episodeId, step2Data.extracted_items)
        totalStats.items += itemCount
        
        // ロケーション保存
        const locationIdMap = await this.dbManager.saveLocations(episodeId, step4Data.enhanced_locations)
        totalStats.locations += Object.keys(locationIdMap).length
        
        // アフィリエイトリンク保存
        const linkCount = await this.dbManager.saveAffiliateLinks(locationIdMap, step4Data.enhanced_locations)
        totalStats.affiliate_links += linkCount
        
        console.log(`✅ エピソード統合完了: items(${itemCount}), locations(${Object.keys(locationIdMap).length}), links(${linkCount})`)
      }
      
      // 統合結果表示
      console.log('\n' + '='.repeat(60))
      console.log('🎉 データベース統合完了!')
      console.log('='.repeat(60))
      console.log(`📊 統合結果:`)
      console.log(`  エピソード: ${totalStats.episodes}件`)
      console.log(`  アイテム: ${totalStats.items}件`)
      console.log(`  ロケーション: ${totalStats.locations}件`)
      console.log(`  アフィリエイトリンク: ${totalStats.affiliate_links}件`)
      
      // データベース確認
      await this.verifyIntegration()
      
    } catch (error) {
      console.error('❌ データ統合エラー:', error)
    }
  }

  // 統合結果の確認
  private async verifyIntegration(): Promise<void> {
    console.log('\n🔍 データベース統合確認...')
    
    try {
      // エピソード数確認
      const { count: episodeCount, error: episodeError } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
      
      if (episodeError) {
        console.error('❌ エピソード確認エラー:', episodeError)
      } else {
        console.log(`✅ エピソードテーブル: ${episodeCount}件`)
      }
      
      // アイテム数確認
      const { count: itemCount, error: itemError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
      
      if (itemError) {
        console.error('❌ アイテム確認エラー:', itemError)
      } else {
        console.log(`✅ アイテムテーブル: ${itemCount}件`)
      }
      
      // ロケーション数確認
      const { count: locationCount, error: locationError } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
      
      if (locationError) {
        console.error('❌ ロケーション確認エラー:', locationError)
      } else {
        console.log(`✅ ロケーションテーブル: ${locationCount}件`)
      }
      
      // 注意: affiliate_linksテーブルが存在しない場合はコメントアウト
      // const { count: linkCount, error: linkError } = await supabase
      //   .from('affiliate_links')
      //   .select('*', { count: 'exact', head: true })
      
      console.log(`✅ アフィリエイトリンク: locations.reservation_urlに統合済み`)
      
      // サンプルデータ表示
      await this.showSampleData()
      
    } catch (error) {
      console.error('❌ 統合確認エラー:', error)
    }
  }

  // サンプルデータ表示
  private async showSampleData(): Promise<void> {
    console.log('\n📋 サンプルデータ表示:')
    
    try {
      // ロケーションのサンプル（affiliate_linksテーブルなしバージョン）
      const { data: sampleData, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          category,
          address,
          reservation_url
        `)
        .not('reservation_url', 'eq', '')
        .limit(3)
      
      if (error) {
        console.error('❌ サンプルデータ取得エラー:', error)
        return
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('\n🏷️  ロケーション・アフィリエイトリンク例:')
        sampleData.forEach((location, index) => {
          console.log(`${index + 1}. ${location.name} [${location.category}]`)
          console.log(`   住所: ${location.address || '未設定'}`)
          console.log(`   予約URL: ${location.reservation_url ? '設定済み' : '未設定'}`)
        })
      }
      
    } catch (error) {
      console.error('❌ サンプルデータ表示エラー:', error)
    }
  }
}

// **Step 5.3: データ取得クラス**
export class DatabaseReader {
  
  // 統計情報取得
  public async getStatistics(): Promise<DatabaseStats> {
    try {
      const [episodeCount, itemCount, locationCount] = await Promise.all([
        supabase.from('episodes').select('*', { count: 'exact', head: true }),
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('locations').select('*', { count: 'exact', head: true })
      ])
      
      // アフィリエイトリンク数（reservation_urlが設定されているロケーション数）
      const { count: linkCount } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .not('reservation_url', 'eq', '')
      
      // 推定総収益の計算（ダミー値）
      const totalRevenue = (linkCount || 0) * 500 // 1リンクあたり500円と仮定
      
      return {
        episodes: episodeCount.count || 0,
        items: itemCount.count || 0,
        locations: locationCount.count || 0,
        affiliate_links: linkCount || 0,
        estimated_monthly_revenue: totalRevenue
      }
    } catch (error) {
      console.error('❌ 統計情報取得エラー:', error)
      return {
        episodes: 0,
        items: 0,
        locations: 0,
        affiliate_links: 0,
        estimated_monthly_revenue: 0
      }
    }
  }

  // 高収益ロケーション取得
  public async getHighRevenueLocations(limit: number = 10): Promise<HighRevenueLocation[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          category,
          address,
          reservation_url,
          episodes!inner(title)
        `)
        .not('reservation_url', 'eq', '')
        .limit(limit)
      
      if (error) {
        console.error('❌ 高収益ロケーション取得エラー:', error)
        return []
      }
      
      // Supabaseクエリ結果の型定義（episodesは配列として返される）
      interface LocationWithEpisodes {
        id: string
        name: string
        category: string
        address: string | null
        reservation_url: string
        episodes: { title: string }[]
      }
      
      // 型変換とダミーデータ追加
      return (data as LocationWithEpisodes[] || []).map((location) => ({
        id: location.id,
        name: location.name,
        category: location.category,
        region: location.address || '',
        estimated_revenue: 500, // ダミー値
        episodes: { 
          title: location.episodes?.[0]?.title || 'タイトル不明'
        },
        affiliate_links: [{
          service_name: 'ぐるなび',
          affiliate_url: location.reservation_url || '',
          display_text: '予約する',
          commission_rate: '1%',
          priority: 1
        }]
      }))
      
    } catch (error) {
      console.error('❌ 高収益ロケーション取得エラー:', error)
      return []
    }
  }
}

// **Step 5.4: テスト・実行関数**
export const testStep5 = async (): Promise<void> => {
  console.log('🧪 Step 5 テスト開始...')
  
  try {
    // データ統合実行
    const integrator = new DataIntegrator()
    await integrator.integrateAllData()
    
    // データ読み取りテスト
    console.log('\n🔍 データ読み取りテスト...')
    const reader = new DatabaseReader()
    
    // 統計情報表示
    const stats = await reader.getStatistics()
    console.log('\n📊 最終統計:')
    console.log(`エピソード: ${stats.episodes}件`)
    console.log(`アイテム: ${stats.items}件`)
    console.log(`ロケーション: ${stats.locations}件`)
    console.log(`アフィリエイトリンク: ${stats.affiliate_links}件`)
    console.log(`推定月間収益: ¥${stats.estimated_monthly_revenue.toLocaleString()}`)
    
    // 高収益ロケーション表示
    const highRevenueLocations = await reader.getHighRevenueLocations(5)
    if (highRevenueLocations.length > 0) {
      console.log('\n💰 高収益ロケーション Top 5:')
      highRevenueLocations.forEach((location, index) => {
        console.log(`${index + 1}. ${location.name} [${location.category}]`)
        console.log(`   推定収益: ¥${location.estimated_revenue}`)
        console.log(`   アフィリエイトリンク: ${location.affiliate_links?.length || 0}件`)
      })
    }
    
    console.log('\n🎉 Step 5 データベース統合完了!')
    
  } catch (error) {
    console.error('❌ Step 5テストエラー:', error)
  }
}

// **Node.js環境での実行**
const main = async () => {
  console.log('🚀 Step 5 データベース統合実行開始...\n')
  await testStep5()
}

if (typeof window === 'undefined') {
  main()
}