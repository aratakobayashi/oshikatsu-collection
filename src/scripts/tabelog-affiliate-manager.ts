#!/usr/bin/env npx tsx

/**
 * 食べログアフィリエイトリンク管理スクリプト
 * 
 * 使用方法:
 * npx tsx src/scripts/tabelog-affiliate-manager.ts --action <action> [options]
 * 
 * アクション:
 * - add: 新しいアフィリエイトリンクを追加
 * - update: 既存のアフィリエイトリンクを更新
 * - list: アフィリエイトリンクの一覧を表示
 * - analyze: クリック分析レポートを生成
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 環境変数を読み込み
dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TabelogAffiliateInfo {
  url: string
  restaurant_id?: string
  tracking_code?: string
  last_updated: string
}

class TabelogAffiliateManager {
  /**
   * 食べログアフィリエイトリンクを追加・更新
   */
  async addOrUpdateAffiliateLink(
    locationId: string,
    tabelogUrl: string,
    restaurantId?: string,
    trackingCode?: string
  ) {
    try {
      console.log(`\n📝 ロケーション ${locationId} にアフィリエイトリンクを設定中...`)

      // 既存のロケーション情報を取得
      const { data: location, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single()

      if (fetchError || !location) {
        console.error('❌ ロケーションが見つかりません:', fetchError)
        return
      }

      // アフィリエイト情報を構築
      const affiliateInfo = {
        ...(location.affiliate_info || {}),
        tabelog: {
          url: tabelogUrl,
          restaurant_id: restaurantId,
          tracking_code: trackingCode,
          last_updated: new Date().toISOString()
        } as TabelogAffiliateInfo
      }

      // データベースを更新
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          tabelog_url: tabelogUrl,
          affiliate_info: affiliateInfo
        })
        .eq('id', locationId)

      if (updateError) {
        console.error('❌ 更新エラー:', updateError)
        return
      }

      console.log('✅ アフィリエイトリンクを設定しました')
      console.log(`   場所: ${location.name}`)
      console.log(`   URL: ${tabelogUrl}`)
    } catch (error) {
      console.error('❌ エラー:', error)
    }
  }

  /**
   * 複数のロケーションに一括でアフィリエイトリンクを設定
   */
  async bulkAddAffiliateLinks(affiliateData: Array<{
    location_name: string
    tabelog_url: string
    restaurant_id?: string
    tracking_code?: string
  }>) {
    console.log(`\n🔄 ${affiliateData.length}件のアフィリエイトリンクを一括設定中...`)

    for (const data of affiliateData) {
      // 名前でロケーションを検索
      const { data: locations, error: searchError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('name', data.location_name)

      if (searchError || !locations || locations.length === 0) {
        console.log(`⚠️  "${data.location_name}" が見つかりません`)
        continue
      }

      // 同じ名前の全ロケーションに設定
      for (const location of locations) {
        await this.addOrUpdateAffiliateLink(
          location.id,
          data.tabelog_url,
          data.restaurant_id,
          data.tracking_code
        )
      }
    }

    console.log('\n✅ 一括設定が完了しました')
  }

  /**
   * アフィリエイトリンクが設定されているロケーションの一覧を表示
   */
  async listAffiliateLinks() {
    try {
      const { data: locations, error } = await supabase
        .from('locations')
        .select('id, name, tabelog_url, affiliate_info')
        .not('tabelog_url', 'is', null)
        .order('name')

      if (error) {
        console.error('❌ データ取得エラー:', error)
        return
      }

      console.log('\n📊 食べログアフィリエイトリンク一覧')
      console.log('=' .repeat(80))

      if (!locations || locations.length === 0) {
        console.log('アフィリエイトリンクが設定されているロケーションはありません')
        return
      }

      locations.forEach((location, index) => {
        console.log(`\n${index + 1}. ${location.name}`)
        console.log(`   ID: ${location.id}`)
        console.log(`   URL: ${location.tabelog_url}`)
        
        if (location.affiliate_info?.tabelog) {
          const info = location.affiliate_info.tabelog
          if (info.restaurant_id) {
            console.log(`   店舗ID: ${info.restaurant_id}`)
          }
          if (info.tracking_code) {
            console.log(`   トラッキングコード: ${info.tracking_code}`)
          }
          if (info.last_updated) {
            console.log(`   最終更新: ${new Date(info.last_updated).toLocaleString('ja-JP')}`)
          }
        }
      })

      console.log('\n')
      console.log('=' .repeat(80))
      console.log(`合計: ${locations.length}件`)
    } catch (error) {
      console.error('❌ エラー:', error)
    }
  }

  /**
   * クリック分析（将来的な実装用のプレースホルダー）
   */
  async analyzeClicks() {
    console.log('\n📈 クリック分析機能は今後実装予定です')
    console.log('現在は、LocationDetailコンポーネントでコンソールログにクリック情報を出力しています')
    console.log('将来的には、専用のトラッキングテーブルを作成して詳細な分析を行います')
  }
}

// サンプルデータ（実際の食べログアフィリエイトリンクに置き換えてください）
const SAMPLE_AFFILIATE_DATA = [
  {
    location_name: 'トリュフベーカリー 広尾店',
    tabelog_url: 'https://tabelog.com/tokyo/A1307/A130703/13123456/?cid=your_affiliate_id',
    restaurant_id: '13123456',
    tracking_code: 'oshikatsu_truffle_hiroo'
  },
  {
    location_name: '日本料理 晴山',
    tabelog_url: 'https://tabelog.com/tokyo/A1306/A130602/13654321/?cid=your_affiliate_id',
    restaurant_id: '13654321',
    tracking_code: 'oshikatsu_seizan'
  },
  // 必要に応じて追加
]

// メイン処理
async function main() {
  const manager = new TabelogAffiliateManager()
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
食べログアフィリエイトリンク管理ツール

使用方法:
  npx tsx src/scripts/tabelog-affiliate-manager.ts --action <action>

アクション:
  add-sample     サンプルのアフィリエイトリンクを追加
  list           アフィリエイトリンクの一覧を表示
  analyze        クリック分析レポートを生成
  add-single     単一のアフィリエイトリンクを追加
                 例: --location-id <id> --url <url> [--restaurant-id <id>] [--tracking-code <code>]

例:
  npx tsx src/scripts/tabelog-affiliate-manager.ts --action list
  npx tsx src/scripts/tabelog-affiliate-manager.ts --action add-sample
    `)
    return
  }

  const actionIndex = args.indexOf('--action')
  if (actionIndex === -1) {
    console.error('❌ --action パラメータが必要です')
    return
  }

  const action = args[actionIndex + 1]

  switch (action) {
    case 'add-sample':
      await manager.bulkAddAffiliateLinks(SAMPLE_AFFILIATE_DATA)
      break
      
    case 'list':
      await manager.listAffiliateLinks()
      break
      
    case 'analyze':
      await manager.analyzeClicks()
      break
      
    case 'add-single':
      const locationIdIndex = args.indexOf('--location-id')
      const urlIndex = args.indexOf('--url')
      
      if (locationIdIndex === -1 || urlIndex === -1) {
        console.error('❌ --location-id と --url パラメータが必要です')
        return
      }
      
      const locationId = args[locationIdIndex + 1]
      const url = args[urlIndex + 1]
      const restaurantIdIndex = args.indexOf('--restaurant-id')
      const trackingCodeIndex = args.indexOf('--tracking-code')
      
      await manager.addOrUpdateAffiliateLink(
        locationId,
        url,
        restaurantIdIndex !== -1 ? args[restaurantIdIndex + 1] : undefined,
        trackingCodeIndex !== -1 ? args[trackingCodeIndex + 1] : undefined
      )
      break
      
    default:
      console.error(`❌ 不明なアクション: ${action}`)
  }
}

// エラーハンドリング
main().catch(console.error)