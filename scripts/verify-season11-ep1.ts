/**
 * Season11 Episode1の具体的なデータを確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySeason11Ep1() {
  console.log('🔍 Season11 Episode1のデータ確認...\n')

  // Episode1を特定
  const { data: episode } = await supabase
    .from('episodes')
    .select('id, title, date')
    .ilike('title', '%Season11 第1話%')
    .single()

  if (!episode) {
    console.error('❌ Season11 Episode1が見つかりません')
    return
  }

  console.log(`📺 Episode: ${episode.title}`)
  console.log(`   ID: ${episode.id}`)
  console.log(`   Date: ${episode.date}`)

  // このエピソードのロケ地紐付けを確認
  const { data: locationLinks } = await supabase
    .from('episode_locations')
    .select(`
      episode_id,
      location:locations!inner (
        id,
        name,
        address
      )
    `)
    .eq('episode_id', episode.id)

  console.log(`\n🔗 ロケ地紐付け: ${locationLinks?.length || 0}件`)

  locationLinks?.forEach((link, index) => {
    console.log(`   ${index + 1}. ${link.location.name}`)
    console.log(`      住所: ${link.location.address}`)
    console.log(`      ID: ${link.location.id}`)
  })

  // フロントエンドと同じようにepisodeLinksDataを構築
  const episodeLinksData: { [key: string]: { locations: number, items: number } } = {}
  episodeLinksData[episode.id] = { locations: locationLinks?.length || 0, items: 0 }

  console.log(`\n📊 フロントエンドと同じデータ構造:`)
  console.log(`episodeLinksData['${episode.id}'] =`, episodeLinksData[episode.id])

  const hasLocation = episodeLinksData[episode.id].locations > 0
  console.log(`\n✅ ロケ地タグ表示条件: ${hasLocation ? '満たしている' : '満たしていない'}`)

  if (hasLocation) {
    console.log(`🏷️ 表示されるタグ: "📍 ロケ地あり"`)
  }
}

verifySeason11Ep1().catch(console.error)