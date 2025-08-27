/**
 * 孤独のグルメ店舗のlocation IDを取得
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function getKodokuLocationIds(): Promise<void> {
  try {
    console.log('🔍 孤独のグルメ店舗のlocation ID確認中...')
    
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, tabelog_url')
      .in('name', ['天ぷら 中山', 'やきとり 庄助', '中華料理 味楽'])
      .like('description', '%Season%')
      .not('tabelog_url', 'is', null)

    if (error) {
      throw error
    }

    if (locations && locations.length > 0) {
      console.log('📊 食べログURL設定済み店舗:')
      console.log('='.repeat(60))
      
      locations.forEach(location => {
        console.log(`${location.name}:`)
        console.log(`  ID: ${location.id}`)
        console.log(`  食べログURL: ${location.tabelog_url}`)
        console.log('')
      })
    } else {
      console.log('⚠️ 対象店舗が見つかりませんでした')
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

getKodokuLocationIds()