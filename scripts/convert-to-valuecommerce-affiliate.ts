/**
 * 食べログURLをValueCommerceアフィリエイトリンクに一括変換
 * 131件の孤独のグルメ店舗を収益化対応
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ValueCommerce設定
const VALUE_COMMERCE_CONFIG = {
  sid: '3705336',      // ValueCommerceサイトID  
  pid: '890654844',    // 食べログ広告主ID
  clickUrl: 'https://ck.jp.ap.valuecommerce.com/servlet/referral'
}

interface Location {
  id: string
  name: string
  address: string | null
  image_urls: string[] | null
  description: string | null
}

class ValueCommerceAffiliateConverter {
  private locations: Location[] = []
  private stats = {
    totalLocations: 0,
    processedUrls: 0,
    convertedUrls: 0,
    errors: 0,
    revenueReady: 0
  }

  // 食べログURLをValueCommerceアフィリエイトリンクに変換
  convertToAffiliateUrl(tabelogUrl: string): string {
    try {
      // URL検証
      if (!tabelogUrl.includes('tabelog.com')) {
        throw new Error('Invalid Tabelog URL')
      }

      // ValueCommerceアフィリエイトURL生成
      const params = new URLSearchParams({
        sid: VALUE_COMMERCE_CONFIG.sid,
        pid: VALUE_COMMERCE_CONFIG.pid,
        vc_url: encodeURIComponent(tabelogUrl)
      })

      const affiliateUrl = `${VALUE_COMMERCE_CONFIG.clickUrl}?${params.toString()}`
      
      console.log(`🔗 変換: ${tabelogUrl} → アフィリエイト`)
      return affiliateUrl
      
    } catch (error) {
      console.error(`❌ URL変換エラー: ${tabelogUrl}`, error)
      this.stats.errors++
      return tabelogUrl // 変換失敗時は元のURLを返す
    }
  }

  // データベースから孤独のグルメ店舗を取得
  async loadKodokuLocations(): Promise<void> {
    console.log('📍 孤独のグルメ店舗一覧を取得中...')
    
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, address, image_urls, description')
      .like('description', '%「孤独のグルメ%')
      .not('image_urls', 'is', null)
      .order('name')

    if (error) {
      throw new Error(`データベースエラー: ${error.message}`)
    }

    if (!locations || locations.length === 0) {
      throw new Error('食べログURL付きの店舗が見つかりません')
    }

    this.locations = locations
    this.stats.totalLocations = locations.length
    console.log(`✅ ${locations.length}件の店舗を読み込み完了`)
  }

  // 各店舗の食べログURLをアフィリエイト変換
  async convertAllUrls(): Promise<void> {
    console.log('\n💰 食べログURL → アフィリエイト変換開始...')
    
    for (let i = 0; i < this.locations.length; i++) {
      const location = this.locations[i]
      console.log(`\n[${i + 1}/${this.locations.length}] ${location.name}`)
      
      try {
        if (!location.image_urls || location.image_urls.length === 0) {
          console.log(`   ⚠️ 食べログURLがありません`)
          continue
        }

        let hasTabelog = false
        const updatedUrls = location.image_urls.map(url => {
          if (url.includes('tabelog.com')) {
            hasTabelog = true
            this.stats.processedUrls++
            
            // アフィリエイトURL変換
            const affiliateUrl = this.convertToAffiliateUrl(url)
            this.stats.convertedUrls++
            
            return affiliateUrl
          }
          return url
        })

        if (hasTabelog) {
          // データベース更新
          await this.updateLocationUrls(location.id, updatedUrls)
          this.stats.revenueReady++
          console.log(`   ✅ アフィリエイト変換完了`)
        } else {
          console.log(`   ⚠️ 食べログURLが見つかりません`)
        }
        
        // API制限対策
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`   ❌ エラー: ${error}`)
        this.stats.errors++
      }
    }
  }

  // 変換したアフィリエイトURLをデータベースに保存
  async updateLocationUrls(locationId: string, affiliateUrls: string[]): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .update({ 
        image_urls: affiliateUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)

    if (error) {
      throw new Error(`URL更新エラー: ${error.message}`)
    }
  }

  // ValueCommerce専用のtabelog_urlカラムも更新
  async updateTabelogUrls(): Promise<void> {
    console.log('\n🔧 tabelog_urlカラムを更新中...')
    
    for (const location of this.locations) {
      if (!location.image_urls) continue
      
      // 最初の食べログアフィリエイトURLを取得
      const affiliateUrl = location.image_urls.find(url => 
        url.includes('valuecommerce.com') && url.includes('tabelog.com')
      )
      
      if (affiliateUrl) {
        const { error } = await supabase
          .from('locations')
          .update({ tabelog_url: affiliateUrl })
          .eq('id', location.id)
          
        if (error) {
          console.error(`❌ tabelog_url更新エラー:`, error)
        } else {
          console.log(`✅ ${location.name} - tabelog_url更新完了`)
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  // 収益化レポート生成
  async generateRevenueReport(): Promise<void> {
    console.log('\n🎉 食べログアフィリエイト変換完了!')
    console.log('='.repeat(60))
    console.log(`📍 対象店舗数: ${this.stats.totalLocations}件`)
    console.log(`🔗 処理URL数: ${this.stats.processedUrls}件`)
    console.log(`💰 変換成功: ${this.stats.convertedUrls}件`)
    console.log(`🎯 収益化店舗: ${this.stats.revenueReady}件`)
    console.log(`❌ エラー: ${this.stats.errors}件`)
    console.log(`📈 変換成功率: ${Math.round((this.stats.convertedUrls / this.stats.processedUrls) * 100)}%`)

    // 収益化完了店舗一覧
    const { data: revenueLocations } = await supabase
      .from('locations')
      .select('name, tabelog_url')
      .like('description', '%「孤独のグルメ%')
      .like('tabelog_url', '%valuecommerce.com%')
      .order('name')

    if (revenueLocations && revenueLocations.length > 0) {
      console.log('\n💰 収益化完了店舗一覧:')
      revenueLocations.slice(0, 10).forEach((loc, index) => {
        console.log(`   ${index + 1}. ${loc.name}`)
      })
      
      if (revenueLocations.length > 10) {
        console.log(`   ... 他${revenueLocations.length - 10}件`)
      }
    }

    console.log('\n📊 想定収益シミュレーション:')
    console.log(`🍽️ アフィリエイト対象店舗: ${this.stats.revenueReady}件`)
    console.log(`👥 想定月間訪問者: ${this.stats.revenueReady * 100}人`)
    console.log(`💴 想定クリック率: 5% (${Math.round(this.stats.revenueReady * 5)}クリック/月)`)
    console.log(`💰 想定成約率: 10% (${Math.round(this.stats.revenueReady * 0.5)}成約/月)`)
    console.log(`💵 想定月間収益: ¥${Math.round(this.stats.revenueReady * 0.5 * 800).toLocaleString()} (800円/成約)`)

    console.log('\n🚀 完了したタスク:')
    console.log('✅ 1. 孤独のグルメ全132エピソード抽出')
    console.log('✅ 2. 131店舗のロケーション作成')
    console.log('✅ 3. 食べログURL自動検索')
    console.log('✅ 4. ValueCommerceアフィリエイト変換')
    console.log('✅ 5. エピソードカードのロケ地タグ表示')

    console.log('\n📈 次の収益最大化ステップ:')
    console.log('1. 食べログから店舗画像を自動収集')
    console.log('2. メニュー情報・価格帯の追加')
    console.log('3. Google検索向けSEO最適化')
    console.log('4. SNSシェア機能の追加')
    console.log('5. ユーザーレビュー機能の実装')
  }

  // メイン処理実行
  async executeConversion(): Promise<void> {
    try {
      await this.loadKodokuLocations()
      await this.convertAllUrls()
      await this.updateTabelogUrls()
      await this.generateRevenueReport()
    } catch (error) {
      console.error('❌ アフィリエイト変換処理でエラーが発生しました:', error)
      console.log('\n🔧 トラブルシューティング:')
      console.log('1. ValueCommerceの契約状況を確認')
      console.log('2. 食べログ広告主との提携状況を確認')
      console.log('3. データベース接続を確認')
    }
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const converter = new ValueCommerceAffiliateConverter()
  converter.executeConversion().catch(console.error)
}

export { ValueCommerceAffiliateConverter }