#!/usr/bin/env node

/**
 * Season10エピソードに松重豊のcelebrity_idを設定（修正版）
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 松重豊のID（確認済み）
const MATSUSHIGE_ID = '39bb6fe4-97ed-439d-9bb6-868dd660ec66'

async function fixSeason10CelebrityLink() {
  console.log('🔗 Season10エピソードに松重豊を関連付け（修正版）...\n')
  console.log(`👤 松重豊 ID: ${MATSUSHIGE_ID}\n`)
  
  // Season10の全エピソードを更新
  const { data: updateData, error: updateError } = await supabase
    .from('episodes')
    .update({ 
      celebrity_id: MATSUSHIGE_ID,
      updated_at: new Date().toISOString()
    })
    .like('title', '%Season10%')
    .select()
  
  if (updateError) {
    console.error('❌ 更新エラー:', updateError)
    return
  }
  
  console.log(`✅ ${updateData?.length || 0}エピソードを松重豊に関連付けました\n`)
  
  // 更新結果を確認
  const { data: verifyData } = await supabase
    .from('episodes')
    .select('title, celebrity_id')
    .like('title', '%Season10%')
    .order('title')
  
  console.log('📝 更新確認:')
  verifyData?.forEach(ep => {
    const episodeNum = ep.title.match(/第(\d+)話/)?.[1] || '?'
    const status = ep.celebrity_id === MATSUSHIGE_ID ? '✅' : '❌'
    console.log(`${status} 第${episodeNum}話`)
  })
  
  // 全Season統計
  const { data: allSeasons } = await supabase
    .from('episodes')
    .select('title')
    .eq('celebrity_id', MATSUSHIGE_ID)
    .like('title', '%孤独のグルメ%')
  
  const seasonCounts: { [key: string]: number } = {}
  allSeasons?.forEach(ep => {
    const seasonMatch = ep.title.match(/Season(\d+)/)
    if (seasonMatch) {
      const season = `Season${seasonMatch[1]}`
      seasonCounts[season] = (seasonCounts[season] || 0) + 1
    }
  })
  
  console.log('\n📊 松重豊に関連付けられた全シーズン:')
  Object.keys(seasonCounts)
    .sort((a, b) => parseInt(a.replace('Season', '')) - parseInt(b.replace('Season', '')))
    .forEach(season => {
      console.log(`  ${season}: ${seasonCounts[season]}エピソード`)
    })
  
  const totalEpisodes = Object.values(seasonCounts).reduce((sum, count) => sum + count, 0)
  console.log(`  合計: ${totalEpisodes}エピソード`)
  
  console.log('\n🎉 関連付け完了！')
  console.log('📺 https://collection.oshikatsu-guide.com/celebrities/matsushige-yutaka')
  console.log('で Season10 が表示されるようになりました')
}

fixSeason10CelebrityLink()
