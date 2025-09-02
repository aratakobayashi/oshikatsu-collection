#!/usr/bin/env node

/**
 * Season10エピソードと松重豊の関連付けを確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSeason10CelebrityLink() {
  console.log('🔍 Season10エピソードの松重豊関連付け確認...\n')
  
  // 松重豊のIDを取得
  const { data: celebrityData } = await supabase
    .from('celebrities')
    .select('id, name, slug')
    .eq('slug', 'matsushige-yutaka')
    .single()
  
  if (celebrityData) {
    console.log(`👤 松重豊 ID: ${celebrityData.id}\n`)
  } else {
    console.log('❌ 松重豊のデータが見つかりません')
    return
  }
  
  // Season10エピソードを確認
  const { data: season10Episodes } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .like('title', '%Season10%')
    .order('title')
  
  console.log(`📺 Season10エピソード数: ${season10Episodes?.length || 0}\n`)
  
  if (season10Episodes && season10Episodes.length > 0) {
    let linkedCount = 0
    let unlinkedCount = 0
    
    console.log('📝 celebrity_id関連付け状況:')
    season10Episodes.forEach(ep => {
      const episodeNum = ep.title.match(/第(\d+)話/)?.[1] || '?'
      const isLinked = ep.celebrity_id === celebrityData.id
      
      if (isLinked) {
        linkedCount++
        console.log(`✅ 第${episodeNum}話: 関連付け済み`)
      } else {
        unlinkedCount++
        console.log(`❌ 第${episodeNum}話: celebrity_id = ${ep.celebrity_id || 'NULL'}`)
      }
    })
    
    console.log(`\n📊 関連付け状況:`)
    console.log(`  ✅ 関連付け済み: ${linkedCount}`)
    console.log(`  ❌ 未関連付け: ${unlinkedCount}`)
    
    if (unlinkedCount > 0) {
      console.log('\n⚠️ celebrity_idが設定されていないため、松重豊のページに表示されません')
      console.log('🔧 修正が必要です')
    }
  }
}

checkSeason10CelebrityLink()
