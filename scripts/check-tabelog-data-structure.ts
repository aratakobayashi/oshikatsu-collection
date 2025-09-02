#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTabelogDataStructure() {
  console.log('🔍 タベログデータ構造確認...\n')
  
  // まず、locationsテーブルでタベログURLが存在するものを確認
  const { data: locationsWithTabelog, count: locationCount } = await supabase
    .from('locations')
    .select('id, name, tabelog_url', { count: 'exact' })
    .not('tabelog_url', 'is', null)
    .neq('tabelog_url', '')
    .order('name')
    .limit(10)
  
  console.log(`📊 タベログURL付きロケーション数: ${locationCount}`)
  console.log('サンプル:')
  locationsWithTabelog?.forEach((loc, i) => {
    console.log(`${i + 1}. ${loc.name}`)
    console.log(`   URL: ${loc.tabelog_url}`)
  })
  
  // エピソードとの関連を確認
  console.log('\n🔗 エピソードとの関連確認...')
  const { data: episodeRelations } = await supabase
    .from('episode_locations')
    .select(`
      episodes(title),
      locations!inner(name, tabelog_url)
    `)
    .not('locations.tabelog_url', 'is', null)
    .neq('locations.tabelog_url', '')
    .limit(10)
  
  episodeRelations?.forEach((rel, i) => {
    const episode = rel.episodes as any
    const location = rel.locations as any
    console.log(`${i + 1}. ${episode?.title || 'No title'}`)
    console.log(`   店舗: ${location?.name}`)
    console.log(`   URL: ${location?.tabelog_url}`)
    console.log()
  })
}

checkTabelogDataStructure()
