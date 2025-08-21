#!/usr/bin/env npx tsx

/**
 * バリューコマース食べログアフィリエイトリンク変換ツール
 * プログラムID: 2147651
 * 
 * 使用方法:
 * 1. 食べログの店舗URLを取得
 * 2. バリューコマースのリンク変換APIまたは手動でアフィリエイトリンクを生成
 * 3. このスクリプトでデータベースに一括登録
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 本番環境の設定を読み込み
dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AffiliateData {
  location_id: string
  location_name: string
  tabelog_original_url: string
  valuecommerce_affiliate_url: string
  restaurant_id?: string
  notes?: string
}

class ValueCommerceConverter {
  private programId = '2147651' // バリューコマースの食べログプログラムID
  
  /**
   * バリューコマースのアフィリエイトリンクを生成
   * 実際にはバリューコマースの管理画面またはAPIで生成する必要があります
   */
  generateAffiliateUrl(originalUrl: string, trackingId?: string): string {
    // バリューコマースのリンク形式例:
    // https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=XXXXX&pid=XXXXX&vc_url=<元のURL>
    
    // バリューコマースから取得したSID
    const sid = '3750604' // 推し活コレクションのサイトID
    const pid = this.programId
    
    const encodedUrl = encodeURIComponent(originalUrl)
    return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${sid}&pid=${pid}&vc_url=${encodedUrl}`
  }
  
  /**
   * 食べログURLから店舗IDを抽出
   */
  extractRestaurantId(tabelogUrl: string): string | null {
    const match = tabelogUrl.match(/tabelog\.com\/[^\/]+\/[^\/]+\/[^\/]+\/(\d+)/);
    return match ? match[1] : null;
  }
  
  /**
   * 店舗名と住所から食べログURLを推測（手動確認が必要）
   */
  suggestTabelogSearch(locationName: string, address: string): string {
    const query = encodeURIComponent(`${locationName} ${address}`)
    return `https://tabelog.com/rstLst/?sw=${query}&sa=&sk=&lid=hd_search1&vac_net=&usrph=1`
  }
  
  /**
   * アフィリエイトデータを一括登録
   */
  async bulkUpdateAffiliateLinks(affiliateData: AffiliateData[]) {
    console.log(`\n🔄 ${affiliateData.length}件のアフィリエイトリンクを登録中...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const data of affiliateData) {
      try {
        // 既存のロケーション情報を取得
        const { data: location, error: fetchError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', data.location_id)
          .single()
        
        if (fetchError || !location) {
          console.log(`⚠️  ロケーション ${data.location_name} が見つかりません (ID: ${data.location_id})`)
          errorCount++
          continue
        }
        
        // アフィリエイト情報を構築
        const affiliateInfo = {
          ...(location.affiliate_info || {}),
          tabelog: {
            url: data.valuecommerce_affiliate_url,
            original_url: data.tabelog_original_url,
            restaurant_id: data.restaurant_id,
            program_id: this.programId,
            provider: 'valuecommerce',
            last_updated: new Date().toISOString(),
            notes: data.notes
          }
        }
        
        // データベースを更新
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            tabelog_url: data.valuecommerce_affiliate_url,
            affiliate_info: affiliateInfo
          })
          .eq('id', data.location_id)
        
        if (updateError) {
          console.error(`❌ ${data.location_name} 更新エラー:`, updateError.message)
          errorCount++
          continue
        }
        
        console.log(`✅ ${data.location_name} - アフィリエイトリンクを設定`)
        successCount++
        
        // API制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ ${data.location_name} エラー:`, error)
        errorCount++
      }
    }
    
    console.log(`\n📊 処理結果:`)
    console.log(`  ✅ 成功: ${successCount}件`)
    console.log(`  ❌ エラー: ${errorCount}件`)
    console.log(`  📊 成功率: ${Math.round(successCount / (successCount + errorCount) * 100)}%`)
  }
  
  /**
   * CSVファイルからアフィリエイトデータを読み込み
   */
  async loadAffiliateDataFromCsv(csvPath: string): Promise<AffiliateData[]> {
    try {
      const fs = await import('fs')
      const csv = fs.readFileSync(csvPath, 'utf-8')
      const lines = csv.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      
      const data: AffiliateData[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        if (values.length >= 4) {
          data.push({
            location_id: values[0],
            location_name: values[1],
            tabelog_original_url: values[2],
            valuecommerce_affiliate_url: values[3],
            restaurant_id: values[4] || undefined,
            notes: values[5] || undefined
          })
        }
      }
      
      console.log(`📄 CSVから${data.length}件のデータを読み込みました`)
      return data
      
    } catch (error) {
      console.error('❌ CSVファイル読み込みエラー:', error)
      return []
    }
  }
  
  /**
   * サンプルアフィリエイトデータを生成（テスト用）
   */
  generateSampleData(): AffiliateData[] {
    return [
      {
        location_id: 'ff64c19e-e7d9-440a-88f7-0c97c358a8fb',
        location_name: '400℃ Pizza Tokyo 神楽坂店',
        tabelog_original_url: 'https://tabelog.com/tokyo/A1309/A130905/13123456/',
        valuecommerce_affiliate_url: this.generateAffiliateUrl('https://tabelog.com/tokyo/A1309/A130905/13123456/'),
        restaurant_id: '13123456',
        notes: '人気のピザ店'
      },
      {
        location_id: '0eba79ff-1e8f-4890-94ac-6cf77a6c55d1',
        location_name: 'dancyu食堂',
        tabelog_original_url: 'https://tabelog.com/tokyo/A1302/A130201/13987654/',
        valuecommerce_affiliate_url: this.generateAffiliateUrl('https://tabelog.com/tokyo/A1302/A130201/13987654/'),
        restaurant_id: '13987654',
        notes: 'グランスタ内レストラン'
      }
      // 実際の店舗情報に置き換えてください
    ]
  }
}

// メイン処理
async function main() {
  const converter = new ValueCommerceConverter()
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
バリューコマース食べログアフィリエイトリンク変換ツール

使用方法:
  npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action <action>

アクション:
  sample         サンプルデータでテスト実行
  csv <file>     CSVファイルからデータを読み込んで実行
  suggest <id>   指定されたロケーションIDの食べログ検索URLを提案
  generate <url> 食べログURLからアフィリエイトリンクを生成

CSVファイル形式:
  location_id,location_name,tabelog_original_url,valuecommerce_affiliate_url,restaurant_id,notes

例:
  npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action sample
  npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action csv affiliate-links.csv
  npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action suggest ff64c19e-e7d9-440a-88f7-0c97c358a8fb
  npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action generate 'https://tabelog.com/tokyo/A1309/A130905/13123456/'
    `)
    return
  }
  
  const action = args[1]
  
  switch (action) {
    case 'sample':
      const sampleData = converter.generateSampleData()
      console.log('\n🧪 サンプルデータでテスト実行します')
      console.log('⚠️  実際のバリューコマースSIDを設定してから実行してください')
      await converter.bulkUpdateAffiliateLinks(sampleData)
      break
      
    case 'csv':
      const csvFile = args[2]
      if (!csvFile) {
        console.error('❌ CSVファイルパスが必要です')
        return
      }
      const csvData = await converter.loadAffiliateDataFromCsv(csvFile)
      if (csvData.length > 0) {
        await converter.bulkUpdateAffiliateLinks(csvData)
      }
      break
      
    case 'suggest':
      const locationId = args[2]
      if (!locationId) {
        console.error('❌ ロケーションIDが必要です')
        return
      }
      
      const { data: location } = await supabase
        .from('locations')
        .select('name, address')
        .eq('id', locationId)
        .single()
      
      if (location) {
        const searchUrl = converter.suggestTabelogSearch(location.name, location.address || '')
        console.log(`\n🔍 ${location.name} の食べログ検索URL:`)
        console.log(searchUrl)
      }
      break
      
    case 'generate':
      const originalUrl = args[2]
      if (!originalUrl) {
        console.error('❌ 食べログURLが必要です')
        return
      }
      
      const affiliateUrl = converter.generateAffiliateUrl(originalUrl)
      const restaurantId = converter.extractRestaurantId(originalUrl)
      
      console.log(`\n🔗 アフィリエイトリンク生成結果:`)
      console.log(`元URL: ${originalUrl}`)
      console.log(`アフィリエイトURL: ${affiliateUrl}`)
      if (restaurantId) console.log(`店舗ID: ${restaurantId}`)
      break
      
    default:
      console.error(`❌ 不明なアクション: ${action}`)
  }
}

// エラーハンドリング
main().catch(console.error)