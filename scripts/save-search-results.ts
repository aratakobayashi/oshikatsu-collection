/**
 * Google Search結果をSupabaseに保存
 * 店舗情報 → locations テーブル
 * アイテム情報 → items テーブル
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { searchYoniChannelInfo } from './google-search-system'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// よにのチャンネルID
const YONI_CHANNEL_ID = 'UC2alHD2WkakOiTxCxF-uMAg'

// スラッグ生成
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

// 店舗データをSupabaseに保存
async function saveLocationData(locationInfo: any[]) {
  console.log('🏪 店舗データを保存中...')
  
  let savedCount = 0
  let skippedCount = 0
  
  for (const location of locationInfo) {
    try {
      const slug = createSlug(location.name)
      
      // 既存チェック
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (existing) {
        console.log(`⏭️  スキップ: ${location.name} (既に存在)`)
        skippedCount++
        continue
      }
      
      // 新規保存 (categoryカラムを一時的に除外)
      const { error } = await supabase
        .from('locations')
        .insert({
          name: location.name,
          slug: slug,
          description: location.description,
          address: location.additional_info?.address || null,
          website_url: location.additional_info?.website || location.source_url,
          tags: ['よにのちゃんねる', '聖地巡礼', location.category],
          celebrity_id: YONI_CHANNEL_ID
        })
      
      if (error) {
        console.error(`❌ 保存エラー (${location.name}):`, error.message)
        continue
      }
      
      console.log(`✅ 保存完了: ${location.name} (${location.category})`)
      savedCount++
      
    } catch (error: any) {
      console.error(`❌ エラー (${location.name}):`, error.message)
    }
  }
  
  return { saved: savedCount, skipped: skippedCount }
}

// アイテムデータをSupabaseに保存
async function saveItemData(itemInfo: any[]) {
  console.log('🛍️ アイテムデータを保存中...')
  
  let savedCount = 0
  let skippedCount = 0
  
  for (const item of itemInfo) {
    try {
      const slug = createSlug(item.name)
      
      // 既存チェック
      const { data: existing } = await supabase
        .from('items')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (existing) {
        console.log(`⏭️  スキップ: ${item.name} (既に存在)`)
        skippedCount++
        continue
      }
      
      // 価格抽出
      let price = null
      if (item.additional_info?.price) {
        const priceStr = item.additional_info.price.replace(/[,¥円]/g, '')
        price = parseFloat(priceStr) || null
      }
      
      // 新規保存
      const { error } = await supabase
        .from('items')
        .insert({
          name: item.name,
          slug: slug,
          description: item.description,
          brand: item.additional_info?.brand || null,
          price: price,
          purchase_url: item.source_url,
          category: item.category,
          tags: ['よにのちゃんねる', item.additional_info?.brand || 'ファッション'].filter(Boolean),
          celebrity_id: YONI_CHANNEL_ID
        })
      
      if (error) {
        console.error(`❌ 保存エラー (${item.name}):`, error.message)
        continue
      }
      
      console.log(`✅ 保存完了: ${item.name} (${item.additional_info?.brand || 'ブランド不明'})`)
      savedCount++
      
    } catch (error: any) {
      console.error(`❌ エラー (${item.name}):`, error.message)
    }
  }
  
  return { saved: savedCount, skipped: skippedCount }
}

// メイン実行関数
async function main() {
  console.log('🚀 Google Search結果をSupabaseに保存開始')
  
  try {
    // 1. Google Search実行
    console.log('\n🔍 === Google Search実行 ===')
    const searchResults = await searchYoniChannelInfo()
    
    console.log(`📊 収集結果: 店舗 ${searchResults.locations.length}件, アイテム ${searchResults.items.length}件`)
    
    // 2. Supabase接続テスト
    console.log('\n📡 === Supabase接続テスト ===')
    const { error: connectionError } = await supabase.from('celebrities').select('count').limit(1)
    if (connectionError) {
      throw new Error(`Supabase接続エラー: ${connectionError.message}`)
    }
    console.log('✅ Supabase接続成功')
    
    // 3. よにのチャンネル存在確認
    const { data: channel } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('id', YONI_CHANNEL_ID)
      .single()
    
    if (!channel) {
      throw new Error('よにのチャンネル情報が見つかりません')
    }
    console.log(`✅ チャンネル確認: ${channel.name}`)
    
    // 4. 店舗データ保存
    console.log('\n🏪 === 店舗データ保存 ===')
    const locationResults = await saveLocationData(searchResults.locations)
    console.log(`📍 店舗保存結果: 新規 ${locationResults.saved}件, スキップ ${locationResults.skipped}件`)
    
    // 5. アイテムデータ保存
    console.log('\n🛍️ === アイテムデータ保存 ===')
    const itemResults = await saveItemData(searchResults.items)
    console.log(`🛍️ アイテム保存結果: 新規 ${itemResults.saved}件, スキップ ${itemResults.skipped}件`)
    
    // 6. 最終結果
    console.log('\n🎉 === 保存完了！ ===')
    console.log(`✅ 総保存数: ${locationResults.saved + itemResults.saved}件`)
    console.log(`⏭️  総スキップ: ${locationResults.skipped + itemResults.skipped}件`)
    console.log(`📊 処理総数: ${searchResults.locations.length + searchResults.items.length}件`)
    
    console.log('\n📱 次のステップ:')
    console.log('  1. アプリでよにのチャンネルの店舗・アイテム情報を確認')
    console.log('  2. エピソードとの紐付けを手動で調整')
    console.log('  3. 購入リンク・予約リンクの精査')
    
  } catch (error: any) {
    console.error('❌ 保存システムエラー:', error.message)
    throw error
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}