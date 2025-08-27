/**
 * 松重豊のデータが正しく紐づいているか確認するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMatsushigeData() {
  console.log('🔍 松重豊のデータを確認します...\n')

  // 1. セレブリティを確認
  const { data: celebrity, error: celebError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'matsushige-yutaka')
    .single()

  if (celebError || !celebrity) {
    console.error('❌ 松重豊のセレブリティデータが見つかりません')
    return
  }

  console.log('✅ セレブリティ:')
  console.log(`   ID: ${celebrity.id}`)
  console.log(`   名前: ${celebrity.name}`)
  console.log(`   スラッグ: ${celebrity.slug}`)
  console.log()

  // 2. エピソードを確認
  const { data: episodes, error: episodeError } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)

  console.log('📺 エピソード:')
  if (!episodes || episodes.length === 0) {
    console.log('   ⚠️ エピソードが見つかりません')
  } else {
    console.log(`   件数: ${episodes.length}件`)
    episodes.slice(0, 3).forEach(ep => {
      console.log(`   - ${ep.title} (${ep.date})`)
    })
  }
  console.log()

  // 3. 孤独のグルメのロケーションを確認
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('*')
    .like('description', '%孤独のグルメ%')

  console.log('📍 孤独のグルメ関連ロケーション:')
  if (!locations || locations.length === 0) {
    console.log('   ⚠️ ロケーションが見つかりません')
  } else {
    console.log(`   件数: ${locations.length}件`)
    locations.forEach(loc => {
      console.log(`   - ${loc.name} (${loc.address || '住所不明'})`)
    })
  }
  console.log()

  // 4. episode_locationsテーブルの確認
  if (episodes && episodes.length > 0) {
    const { data: episodeLocations, error: elError } = await supabase
      .from('episode_locations')
      .select(`
        episode_id,
        location_id,
        episodes!inner(title),
        locations!inner(name)
      `)
      .in('episode_id', episodes.map(e => e.id))

    console.log('🔗 エピソード-ロケーションの紐付け:')
    if (!episodeLocations || episodeLocations.length === 0) {
      console.log('   ⚠️ 紐付けデータが見つかりません')
    } else {
      console.log(`   件数: ${episodeLocations.length}件`)
      episodeLocations.slice(0, 3).forEach(el => {
        console.log(`   - ${el.episodes.title} → ${el.locations.name}`)
      })
    }
  }

  // 5. 問題の診断
  console.log('\n📊 診断結果:')
  if (celebrity) {
    console.log('✅ セレブリティは正常に登録されています')
  }
  
  if (!episodes || episodes.length === 0) {
    console.log('❌ エピソードが登録されていません')
    console.log('   → add-kodoku-gourmet-episodes.tsのエピソード追加部分を修正する必要があります')
  }

  if (locations && locations.length > 0) {
    console.log('✅ ロケーションは正常に登録されています')
  }

  if (episodes && episodes.length > 0 && (!episodeLocations || episodeLocations.length === 0)) {
    console.log('⚠️ エピソードとロケーションの紐付けがありません')
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkMatsushigeData().catch(console.error)
}

export { checkMatsushigeData }