/**
 * テーブル構造確認とデータベース整合性チェック
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseStructure(): Promise<void> {
  try {
    console.log('🔍 データベース構造確認...')
    
    // 1. locations テーブルの孤独のグルメデータ確認
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, episode_id')
      .like('description', '%Season%Episode%')
      .limit(5)

    console.log('\n📍 locations テーブル (孤独のグルメ店舗):')
    if (locations && locations.length > 0) {
      locations.forEach(loc => {
        console.log(`  - ${loc.name}`)
        console.log(`    ID: ${loc.id}`)
        console.log(`    episode_id: ${loc.episode_id || '未設定'}`)
      })
    } else {
      console.log('  データなし または エラー:', locError)
    }

    // 2. episode_locations テーブルの確認
    const { data: episodeLocations, error: epLocError } = await supabase
      .from('episode_locations')
      .select('episode_id, location_id')
      .limit(5)

    console.log('\n🔗 episode_locations テーブル:')
    if (episodeLocations && episodeLocations.length > 0) {
      console.log(`  紐付けレコード数: ${episodeLocations.length}件`)
      episodeLocations.forEach(link => {
        console.log(`  - エピソード: ${link.episode_id} → ロケーション: ${link.location_id}`)
      })
    } else {
      console.log('  データなし または エラー:', epLocError)
    }

    // 3. 孤独のグルメエピソード確認
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', celebrity.id)
        .limit(3)

      console.log('\n🎬 孤独のグルメエピソード:')
      if (episodes && episodes.length > 0) {
        episodes.forEach(ep => {
          console.log(`  - ${ep.title.substring(0, 50)}... (${ep.id})`)
        })
      }
    }

    // 4. データベース整合性の問題を特定
    console.log('\n🚨 問題の特定:')
    console.log('1. locations テーブルに孤独のグルメ店舗は存在する')
    console.log('2. episode_locations テーブルに紐付けレコードが不足している')
    console.log('3. フロントエンドは episode_locations テーブルを参照している')
    console.log('\n💡 解決策: locations の episode_id を使って episode_locations に紐付けを作成')

  } catch (error) {
    console.error('❌ 確認エラー:', error)
  }
}

checkDatabaseStructure()