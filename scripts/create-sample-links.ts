/**
 * よにのちゃんねるのエピソード・店舗・アイテムのサンプルリンクデータ作成
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleLinks() {
  console.log('🔗 よにのちゃんねるサンプルリンクデータ作成')
  console.log('='.repeat(60))
  
  try {
    // 1. よにのちゃんねるのデータ取得
    const { data: celebrity, error: celebError } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'よにのちゃんねる')
      .single()
    
    if (celebError || !celebrity) {
      console.error('❌ よにのちゃんねる取得エラー:', celebError?.message)
      return
    }
    
    console.log(`✅ よにのちゃんねる取得成功: ${celebrity.name} (${celebrity.id})`)
    
    // 2. エピソード取得
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', celebrity.id)
      .limit(10)
    
    if (epError) {
      console.error('❌ エピソード取得エラー:', epError.message)
      return
    }
    
    console.log(`✅ エピソード取得: ${episodes?.length || 0}件`)
    episodes?.forEach((ep, idx) => {
      console.log(`  ${idx + 1}. ${ep.title}`)
    })
    
    // 3. 店舗データ取得
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name')
      .limit(8)
    
    if (locError) {
      console.error('❌ 店舗取得エラー:', locError.message)
      return
    }
    
    console.log(`\\n✅ 店舗データ取得: ${locations?.length || 0}件`)
    
    // 4. アイテムデータ取得
    const { data: items, error: itemError } = await supabase
      .from('items')
      .select('id, name')
      .limit(9)
    
    if (itemError) {
      console.error('❌ アイテム取得エラー:', itemError.message)
      return
    }
    
    console.log(`✅ アイテムデータ取得: ${items?.length || 0}件`)
    
    // 5. episode_locations リンク作成
    if (episodes && episodes.length > 0 && locations && locations.length > 0) {
      console.log('\\n🔗 Episode-Location リンク作成中...')
      
      const episodeLocationLinks = []
      
      // 各エピソードに1-3個の店舗をランダムに関連付け
      for (const episode of episodes) {
        const numLocations = Math.floor(Math.random() * 3) + 1 // 1-3個
        const shuffledLocations = [...locations].sort(() => 0.5 - Math.random())
        
        for (let i = 0; i < Math.min(numLocations, shuffledLocations.length); i++) {
          episodeLocationLinks.push({
            episode_id: episode.id,
            location_id: shuffledLocations[i].id
          })
        }
      }
      
      console.log(`📝 作成予定リンク数: ${episodeLocationLinks.length}件`)
      
      // デバッグ: 作成予定データの最初の数件を表示
      console.log('🔍 作成予定データサンプル:')
      episodeLocationLinks.slice(0, 3).forEach((link, idx) => {
        console.log(`  ${idx + 1}. Episode: ${link.episode_id} → Location: ${link.location_id}`)
      })
      
      const { data: locLinkData, error: locLinkError } = await supabase
        .from('episode_locations')
        .insert(episodeLocationLinks)
        .select()
      
      if (locLinkError) {
        console.error('❌ Episode-Location リンク作成エラー:', locLinkError.message)
      } else {
        console.log(`✅ Episode-Location リンク作成成功: ${locLinkData?.length || 0}件`)
      }
    }
    
    // 6. episode_items リンク作成
    if (episodes && episodes.length > 0 && items && items.length > 0) {
      console.log('\\n🔗 Episode-Item リンク作成中...')
      
      const episodeItemLinks = []
      
      // 各エピソードに1-4個のアイテムをランダムに関連付け
      for (const episode of episodes) {
        const numItems = Math.floor(Math.random() * 4) + 1 // 1-4個
        const shuffledItems = [...items].sort(() => 0.5 - Math.random())
        
        for (let i = 0; i < Math.min(numItems, shuffledItems.length); i++) {
          episodeItemLinks.push({
            episode_id: episode.id,
            item_id: shuffledItems[i].id
          })
        }
      }
      
      console.log(`📝 作成予定リンク数: ${episodeItemLinks.length}件`)
      
      const { data: itemLinkData, error: itemLinkError } = await supabase
        .from('episode_items')
        .insert(episodeItemLinks)
        .select()
      
      if (itemLinkError) {
        console.error('❌ Episode-Item リンク作成エラー:', itemLinkError.message)
      } else {
        console.log(`✅ Episode-Item リンク作成成功: ${itemLinkData?.length || 0}件`)
      }
    }
    
    // 7. 結果確認
    console.log('\\n📊 作成結果確認:')
    console.log('-'.repeat(40))
    
    const { count: locCount } = await supabase
      .from('episode_locations')
      .select('*', { count: 'exact', head: true })
    
    const { count: itemCount } = await supabase
      .from('episode_items')
      .select('*', { count: 'exact', head: true })
    
    console.log(`🏪 Episode-Location リンク総数: ${locCount || 0}件`)
    console.log(`🛍️ Episode-Item リンク総数: ${itemCount || 0}件`)
    
    // 8. よにのちゃんねるページテスト案内
    console.log('\\n🧪 テスト方法:')
    console.log('-'.repeat(40))
    console.log('1. 開発サーバーを起動: npm run dev')
    console.log('2. ブラウザでアクセス:')
    console.log('   http://localhost:5173/celebrities/よにのちゃんねる')
    console.log('3. 確認項目:')
    console.log('   ✅ エピソード一覧表示')
    console.log('   ✅ 聖地巡礼マップに店舗情報表示')
    console.log('   ✅ ファッション検索にアイテム情報表示')
    console.log('   ✅ 各エピソードの詳細情報')
    
  } catch (error: any) {
    console.error('❌ サンプルリンク作成エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleLinks().catch(console.error)
}