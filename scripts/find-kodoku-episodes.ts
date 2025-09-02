#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function findKodokuEpisodes() {
  console.log('🔍 孤独のグルメエピソード検索...\n')
  
  // 様々なパターンで検索
  const patterns = [
    '%孤独のグルメ%',
    '%Season%',
    '%第%話%',
    '%松重豊%'
  ]
  
  for (const pattern of patterns) {
    console.log(`🔎 パターン: "${pattern}"`)
    
    const { data: episodes, count } = await supabase
      .from('episodes')
      .select('id, title', { count: 'exact' })
      .like('title', pattern)
      .limit(5)
    
    console.log(`  件数: ${count}`)
    episodes?.forEach(ep => console.log(`  - ${ep.title}`))
    console.log()
  }
  
  // 全エピソード数確認
  const { count: totalCount } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 全エピソード数: ${totalCount}`)
  
  // タベログURLがあるエピソード数
  const { count: tabelogCount } = await supabase
    .from('episode_locations')
    .select('*', { count: 'exact', head: true })
    .not('locations.tabelog_url', 'is', null)
    .neq('locations.tabelog_url', '')
  
  console.log(`📊 タベログURL付きエピソード数: ${tabelogCount}`)
}

findKodokuEpisodes()
