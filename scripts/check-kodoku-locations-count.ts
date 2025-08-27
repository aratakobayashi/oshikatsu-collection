/**
 * 孤独のグルメ店舗の総数確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkKodokuLocations(): Promise<void> {
  try {
    console.log('🔍 孤独のグルメ店舗数確認中...')
    
    // 孤独のグルメ関連の店舗を検索
    const { data: locations, error } = await supabase
      .from('locations')
      .select('name, address, description')
      .like('description', '%Season%Episode%')
      .order('name')

    if (error) {
      throw error
    }

    console.log('📊 孤独のグルメ店舗一覧:')
    console.log('='.repeat(60))
    
    if (locations && locations.length > 0) {
      locations.forEach((location, index) => {
        const seasonMatch = location.description.match(/Season(\d+) Episode(\d+)/)
        const season = seasonMatch ? seasonMatch[1] : '?'
        const episode = seasonMatch ? seasonMatch[2] : '?'
        
        console.log(`${(index + 1).toString().padStart(2, '0')}. [S${season}E${episode}] ${location.name}`)
        console.log(`    📍 ${location.address}`)
        console.log('')
      })
      
      console.log('='.repeat(60))
      console.log(`🏆 総店舗数: ${locations.length}件`)
      
      // シーズン別カウント
      const seasonCounts: Record<string, number> = {}
      locations.forEach(location => {
        const seasonMatch = location.description.match(/Season(\d+)/)
        const season = seasonMatch ? `Season${seasonMatch[1]}` : 'Unknown'
        seasonCounts[season] = (seasonCounts[season] || 0) + 1
      })
      
      console.log('\n📈 シーズン別内訳:')
      Object.entries(seasonCounts).forEach(([season, count]) => {
        console.log(`   ${season}: ${count}件`)
      })
      
    } else {
      console.log('⚠️ 孤独のグルメ関連の店舗が見つかりませんでした')
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
checkKodokuLocations()