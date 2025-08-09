/**
 * 現在のデータ品質分析
 * エピソード-ロケーション/アイテムの紐付け状況を詳細分析
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function analyzeDataQuality() {
  console.log('📊 データ品質分析')
  console.log('='.repeat(60))
  
  try {
    // 1. 基本統計
    console.log('📈 基本統計:')
    
    const { count: episodeCount } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      
    const { count: locationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      
    const { count: itemCount } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      
    const { count: episodeLocationCount } = await supabase
      .from('episode_locations')
      .select('*', { count: 'exact', head: true })
      
    const { count: episodeItemCount } = await supabase
      .from('episode_items')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   📺 エピソード総数: ${episodeCount}`)
    console.log(`   🏪 ロケーション総数: ${locationCount}`)
    console.log(`   👕 アイテム総数: ${itemCount}`)
    console.log(`   🔗 エピソード-ロケーション紐付け: ${episodeLocationCount}`)
    console.log(`   🔗 エピソード-アイテム紐付け: ${episodeItemCount}`)
    
    // 2. 紐付け率分析
    console.log('\n📊 紐付け率分析:')
    
    const locationLinkRate = episodeCount > 0 ? ((episodeLocationCount / episodeCount) * 100).toFixed(1) : '0'
    const itemLinkRate = episodeCount > 0 ? ((episodeItemCount / episodeCount) * 100).toFixed(1) : '0'
    
    console.log(`   🏪 ロケーション紐付け率: ${locationLinkRate}% (${episodeLocationCount}/${episodeCount})`)
    console.log(`   👕 アイテム紐付け率: ${itemLinkRate}% (${episodeItemCount}/${episodeCount})`)
    
    // 3. 未紐付けエピソード分析
    console.log('\n🔍 未紐付けエピソード分析:')
    
    // ロケーション未紐付けエピソード
    const { data: unlinkedLocationEpisodes } = await supabase
      .from('episodes')
      .select(`
        id, title, date,
        episode_locations!left(id)
      `)
      .is('episode_locations.id', null)
      .order('date', { ascending: false })
      .limit(5)
    
    console.log(`   🏪 ロケーション未紐付けエピソード: ${unlinkedLocationEpisodes?.length || 0} 件（最新5件）`)
    unlinkedLocationEpisodes?.forEach((episode, idx) => {
      const date = new Date(episode.date).toLocaleDateString('ja-JP')
      console.log(`      ${idx + 1}. ${episode.title} (${date})`)
    })
    
    // アイテム未紐付けエピソード
    const { data: unlinkedItemEpisodes } = await supabase
      .from('episodes')
      .select(`
        id, title, date,
        episode_items!left(id)
      `)
      .is('episode_items.id', null)
      .order('date', { ascending: false })
      .limit(5)
    
    console.log(`\n   👕 アイテム未紐付けエピソード: ${unlinkedItemEpisodes?.length || 0} 件（最新5件）`)
    unlinkedItemEpisodes?.forEach((episode, idx) => {
      const date = new Date(episode.date).toLocaleDateString('ja-JP')
      console.log(`      ${idx + 1}. ${episode.title} (${date})`)
    })
    
    // 4. 既存データの品質チェック
    console.log('\n🔍 既存データ品質チェック:')
    
    // ロケーション品質
    const { data: locationQuality } = await supabase
      .from('locations')
      .select('id, name, address, description, website_url')
      .limit(3)
    
    console.log(`   🏪 ロケーションデータサンプル:`)
    locationQuality?.forEach((location, idx) => {
      console.log(`      ${idx + 1}. ${location.name}`)
      console.log(`         住所: ${location.address || '未設定'}`)
      console.log(`         説明: ${location.description ? location.description.substring(0, 30) + '...' : '未設定'}`)
      console.log(`         ウェブサイト: ${location.website_url ? 'あり' : '未設定'}`)
    })
    
    // アイテム品質
    const { data: itemQuality } = await supabase
      .from('items')
      .select('id, name, brand, price, purchase_url, description')
      .limit(3)
    
    console.log(`\n   👕 アイテムデータサンプル:`)
    itemQuality?.forEach((item, idx) => {
      console.log(`      ${idx + 1}. ${item.name}`)
      console.log(`         ブランド: ${item.brand || '未設定'}`)
      console.log(`         価格: ${item.price ? `¥${item.price.toLocaleString()}` : '未設定'}`)
      console.log(`         購入URL: ${item.purchase_url ? 'あり' : '未設定'}`)
      console.log(`         説明: ${item.description ? item.description.substring(0, 30) + '...' : '未設定'}`)
    })
    
    // 5. 改善提案
    console.log('\n💡 データ品質向上の提案:')
    
    if (parseFloat(locationLinkRate) < 50) {
      console.log(`   🎯 優先度：高 - ロケーション紐付け率向上 (現在${locationLinkRate}%)`)
    }
    
    if (parseFloat(itemLinkRate) < 50) {
      console.log(`   🎯 優先度：高 - アイテム紐付け率向上 (現在${itemLinkRate}%)`)
    }
    
    console.log(`   📝 手動確認対象: 最新の未紐付けエピソード`)
    console.log(`   🤖 自動化可能: タイトル・説明文からのキーワード抽出`)
    console.log(`   🔍 精度向上: Google Search API活用`)
    
  } catch (error: any) {
    console.error('❌ 分析エラー:', error.message)
  }
}

// Run analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeDataQuality().catch(console.error)
}