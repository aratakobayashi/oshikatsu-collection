/**
 * 孤独のグルメ店舗の食べログURL検索・自動追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface KodokuLocation {
  id: string
  name: string
  address: string
  description: string
  tabelog_url?: string
}

class KodokuTabelogSearcher {
  private stats = {
    totalLocations: 0,
    foundUrls: 0,
    updatedUrls: 0,
    errors: 0
  }

  // 食べログURL検索（Google検索API使用）
  async searchTabelogUrl(restaurantName: string, address: string): Promise<string | null> {
    try {
      // Google検索クエリを作成
      const searchQuery = `"${restaurantName}" ${address} site:tabelog.com`
      console.log(`   🔍 検索中: ${searchQuery}`)

      const googleApiKey = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY!
      const searchEngineId = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID!
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}`
      
      const response = await fetch(searchUrl)
      const data = await response.json()

      if (data.items && data.items.length > 0) {
        const tabelogUrl = data.items[0].link
        console.log(`   ✅ 発見: ${tabelogUrl}`)
        this.stats.foundUrls++
        return tabelogUrl
      }

      // 代替検索（店名のみ）
      const altSearchQuery = `"${restaurantName}" site:tabelog.com`
      const altSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(altSearchQuery)}`
      
      const altResponse = await fetch(altSearchUrl)
      const altData = await altResponse.json()

      if (altData.items && altData.items.length > 0) {
        const tabelogUrl = altData.items[0].link
        console.log(`   🔍 代替検索で発見: ${tabelogUrl}`)
        this.stats.foundUrls++
        return tabelogUrl
      }

      console.log(`   ⚠️ 未発見: ${restaurantName}`)
      return null

    } catch (error) {
      console.error(`   ❌ 検索エラー: ${restaurantName} - ${error}`)
      this.stats.errors++
      return null
    }
  }

  // 店舗情報を更新
  async updateLocationTabelogUrl(locationId: string, tabelogUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ 
          tabelog_url: tabelogUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)

      if (error) {
        throw error
      }

      this.stats.updatedUrls++
      console.log(`   ✅ 更新完了`)

    } catch (error) {
      console.error(`   ❌ 更新エラー: ${error}`)
      this.stats.errors++
    }
  }

  // 孤独のグルメ店舗一括処理
  async processAllKodokuLocations(): Promise<void> {
    try {
      console.log('🍽️ 孤独のグルメ店舗の食べログURL検索開始...')
      
      // 孤独のグルメ関連の店舗を取得（食べログURL未設定）
      const { data: locations, error } = await supabase
        .from('locations')
        .select('id, name, address, description, tabelog_url')
        .like('description', '%Season%Episode%')
        .is('tabelog_url', null)
        .order('name')

      if (error) {
        throw error
      }

      if (!locations || locations.length === 0) {
        console.log('✅ 全店舗で食べログURLが設定済みです')
        return
      }

      this.stats.totalLocations = locations.length
      console.log(`📍 対象店舗数: ${locations.length}件`)

      for (const [index, location] of locations.entries()) {
        console.log(`\n[${index + 1}/${locations.length}] ${location.name}`)
        console.log(`   📍 ${location.address}`)

        // 食べログURL検索
        const tabelogUrl = await this.searchTabelogUrl(location.name, location.address)
        
        if (tabelogUrl) {
          // URL更新
          await this.updateLocationTabelogUrl(location.id, tabelogUrl)
        }

        // API制限対策（1秒待機）
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error('❌ 処理エラー:', error)
      this.stats.errors++
    }
  }

  // 結果レポート
  async generateReport(): Promise<void> {
    console.log('\n🎉 孤独のグルメ食べログURL検索完了!')
    console.log('='.repeat(50))
    console.log(`📍 対象店舗: ${this.stats.totalLocations}件`)
    console.log(`✅ URL発見: ${this.stats.foundUrls}件`)
    console.log(`🔄 更新完了: ${this.stats.updatedUrls}件`)
    console.log(`❌ エラー: ${this.stats.errors}件`)

    const successRate = this.stats.totalLocations > 0 
      ? Math.round((this.stats.foundUrls / this.stats.totalLocations) * 100)
      : 0

    console.log(`📊 成功率: ${successRate}%`)

    // 現在の設定済み店舗数確認
    const { data: totalWithUrls } = await supabase
      .from('locations')
      .select('id', { count: 'exact' })
      .like('description', '%Season%Episode%')
      .not('tabelog_url', 'is', null)

    if (totalWithUrls) {
      console.log(`\n🏆 食べログURL設定済み: ${totalWithUrls.length || 0}件 / 72件`)
    }

    console.log('\n🚀 次のステップ:')
    console.log('1. 設定されたURLをValueCommerceアフィリエイトリンクに変換')
    console.log('2. 店舗画像の収集・追加')
    console.log('3. 残り未発見店舗の手動検索')
  }

  // メイン実行
  async execute(): Promise<void> {
    try {
      await this.processAllKodokuLocations()
      await this.generateReport()
    } catch (error) {
      console.error('❌ 実行エラー:', error)
    }
  }
}

// 手動で特定の店舗のURLを設定するヘルパー関数
export async function setTabelogUrlManually(locationId: string, tabelogUrl: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('locations')
      .update({ 
        tabelog_url: tabelogUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)

    if (error) throw error
    console.log(`✅ 手動設定完了: ${tabelogUrl}`)
  } catch (error) {
    console.error(`❌ 手動設定エラー: ${error}`)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const searcher = new KodokuTabelogSearcher()
  searcher.execute().catch(console.error)
}

export { KodokuTabelogSearcher }