/**
 * 不正確な孤独のグルメロケーションデータを削除
 * 具体的な店名が特定できていないデータは削除する
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupIncorrectData() {
  console.log('🗑️ 不正確な孤独のグルメデータを削除中...')

  try {
    // 1. 孤独のグルメ関連ロケーションを取得
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, description')
      .like('description', '%「孤独のグルメ%')

    if (locError) throw locError

    console.log(`📍 削除対象ロケーション: ${locations?.length || 0}件`)

    if (locations && locations.length > 0) {
      const locationIds = locations.map(loc => loc.id)

      // 2. episode_locationsの関連データを削除
      const { error: linkError } = await supabase
        .from('episode_locations')
        .delete()
        .in('location_id', locationIds)

      if (linkError) throw linkError
      console.log('✅ episode_locations関連データを削除')

      // 3. ロケーションデータを削除
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .in('id', locationIds)

      if (deleteError) throw deleteError
      console.log(`✅ ${locations.length}件のロケーションを削除完了`)
    }

    console.log('\n✅ クリーンアップ完了！')
    console.log('理由: 具体的な店名が特定できていないため')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupIncorrectData().catch(console.error)
}

export { cleanupIncorrectData }