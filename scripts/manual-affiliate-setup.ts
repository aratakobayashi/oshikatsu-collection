#!/usr/bin/env npx tsx

/**
 * 手動でアフィリエイトリンクを設定するヘルパースクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.production') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// バリューコマースの設定
const VALUECOMMERCE_SID = '3750604'
const VALUECOMMERCE_PID = '2147651' // 食べログプログラムID

function generateAffiliateUrl(originalUrl: string): string {
  const encodedUrl = encodeURIComponent(originalUrl)
  return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${VALUECOMMERCE_SID}&pid=${VALUECOMMERCE_PID}&vc_url=${encodedUrl}`
}

function extractRestaurantId(tabelogUrl: string): string | null {
  const match = tabelogUrl.match(/tabelog\.com\/[^\/]+\/[^\/]+\/[^\/]+\/(\d+)/);
  return match ? match[1] : null;
}

async function addAffiliateLink(locationId: string, tabelogUrl: string) {
  try {
    console.log(`\n🔄 アフィリエイトリンクを設定中...`)
    
    // 1. ロケーション情報を取得
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()
    
    if (fetchError || !location) {
      console.error('❌ ロケーションが見つかりません:', fetchError)
      return false
    }
    
    console.log(`📍 店舗: ${location.name}`)
    console.log(`📍 住所: ${location.address}`)
    
    // 2. アフィリエイトリンクを生成
    const affiliateUrl = generateAffiliateUrl(tabelogUrl)
    const restaurantId = extractRestaurantId(tabelogUrl)
    
    console.log(`🔗 元URL: ${tabelogUrl}`)
    console.log(`🔗 アフィリエイトURL: ${affiliateUrl}`)
    if (restaurantId) console.log(`🏪 店舗ID: ${restaurantId}`)
    
    // 3. アフィリエイト情報を構築
    const affiliateInfo = {
      ...(location.affiliate_info || {}),
      tabelog: {
        url: affiliateUrl,
        original_url: tabelogUrl,
        restaurant_id: restaurantId,
        program_id: VALUECOMMERCE_PID,
        provider: 'valuecommerce',
        last_updated: new Date().toISOString(),
        notes: '手動設定'
      }
    }
    
    // 4. データベースを更新
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        tabelog_url: affiliateUrl,
        affiliate_info: affiliateInfo
      })
      .eq('id', locationId)
    
    if (updateError) {
      console.error('❌ 更新エラー:', updateError.message)
      return false
    }
    
    console.log('✅ アフィリエイトリンクの設定が完了しました！')
    return true
    
  } catch (error) {
    console.error('❌ エラー:', error)
    return false
  }
}

async function showLocationInfo(locationId: string) {
  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single()
  
  if (location) {
    console.log(`\n📋 ロケーション情報:`)
    console.log(`   名前: ${location.name}`)
    console.log(`   住所: ${location.address}`)
    console.log(`   現在のURL: ${location.website_url || 'なし'}`)
    console.log(`   既存のアフィリエイトURL: ${location.tabelog_url || 'なし'}`)
    
    if (location.tabelog_url) {
      console.log(`\n⚠️  既にアフィリエイトリンクが設定済みです`)
      return false
    }
    return true
  }
  return false
}

// TOP5店舗の情報
const TOP5_LOCATIONS = [
  {
    id: '8c33acf4-818d-4914-b66d-3324aa1982ae',
    name: 'ル・パン・コティディアン',
    search_hint: 'ル・パン・コティディアン 東京ミッドタウン 食べログ'
  },
  {
    id: 'bdb0a2d5-36fc-4c87-a872-ba986ed227ba',
    name: 'かおたんラーメンえんとつ屋 南青山店',
    search_hint: 'かおたんラーメンえんとつ屋 南青山 食べログ'
  },
  {
    id: 'a12e6e16-9100-45fe-91a4-9d29ed384d5b',
    name: 'Blue Seal アメリカンビレッジ店',
    search_hint: 'Blue Seal 北谷 食べログ'
  },
  {
    id: '66f6832a-769e-443f-80dd-c67f165e8e27',
    name: 'Paul Bassett 新宿店',
    search_hint: 'Paul Bassett 新宿 食べログ'
  },
  {
    id: '4454e9ab-1357-4cc2-b5ef-95c54652642c',
    name: 'スターバックス コーヒー 渋谷スカイ店',
    search_hint: 'スターバックス 渋谷スカイ 食べログ'
  }
]

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
🔰 手動アフィリエイトリンク設定ツール

使用方法:
  npx tsx scripts/manual-affiliate-setup.ts --action <action>

アクション:
  show <店舗番号>     店舗情報を表示（1-5）
  add <店舗番号> <食べログURL>  アフィリエイトリンクを追加
  list              TOP5店舗の一覧を表示

例:
  # 1. 店舗情報を確認
  npx tsx scripts/manual-affiliate-setup.ts --action show 1
  
  # 2. 食べログURLでアフィリエイトリンクを設定
  npx tsx scripts/manual-affiliate-setup.ts --action add 1 'https://tabelog.com/tokyo/A1307/A130703/13123456/'
  
  # 3. TOP5店舗リストを表示
  npx tsx scripts/manual-affiliate-setup.ts --action list

🔍 食べログURL検索のコツ:
  Google検索で「店舗名 + 住所の主要部分 + 食べログ」で検索
    `)
    return
  }
  
  const action = args[1]
  
  switch (action) {
    case 'list':
      console.log('\n🏆 TOP5優先店舗リスト:')
      console.log('=' .repeat(60))
      TOP5_LOCATIONS.forEach((loc, index) => {
        console.log(`${index + 1}. ${loc.name}`)
        console.log(`   ID: ${loc.id}`)
        console.log(`   検索ヒント: "${loc.search_hint}"`)
        console.log('')
      })
      break
      
    case 'show':
      const showIndex = parseInt(args[2]) - 1
      if (showIndex < 0 || showIndex >= TOP5_LOCATIONS.length) {
        console.error('❌ 1-5の番号を指定してください')
        return
      }
      
      const showLocation = TOP5_LOCATIONS[showIndex]
      console.log(`\n🔍 ${showLocation.name} の情報:`)
      console.log(`Google検索: "${showLocation.search_hint}"`)
      
      await showLocationInfo(showLocation.id)
      break
      
    case 'add':
      const addIndex = parseInt(args[2]) - 1
      const tabelogUrl = args[3]
      
      if (addIndex < 0 || addIndex >= TOP5_LOCATIONS.length) {
        console.error('❌ 1-5の番号を指定してください')
        return
      }
      
      if (!tabelogUrl || !tabelogUrl.includes('tabelog.com')) {
        console.error('❌ 有効な食べログURLを指定してください')
        return
      }
      
      const addLocation = TOP5_LOCATIONS[addIndex]
      console.log(`\n🎯 ${addLocation.name} にアフィリエイトリンクを設定します`)
      
      const success = await addAffiliateLink(addLocation.id, tabelogUrl)
      if (success) {
        console.log('\n🎉 次のステップ:')
        console.log('1. 推し活コレクションサイトでこの店舗のページを確認')
        console.log('2. 「食べログで予約する」ボタンが表示されることを確認')
        console.log('3. ボタンをクリックして正しいページに飛ぶことを確認')
      }
      break
      
    default:
      console.error(`❌ 不明なアクション: ${action}`)
  }
}

main().catch(console.error)