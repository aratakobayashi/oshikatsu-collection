#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEpisodeTitles() {
  console.log('📋 エピソードタイトル構造確認...\n')
  
  const { data: episodes } = await supabase
    .from('episodes')
    .select('title')
    .not('episode_locations.location.tabelog_url', 'is', null)
    .neq('episode_locations.location.tabelog_url', '')
    .order('title')
    .limit(20)
  
  episodes?.forEach((ep, i) => {
    console.log(`${i + 1}. ${ep.title}`)
  })
  
  console.log('\n📊 タベログURLが存在するエピソード総数:')
  const { count } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .not('episode_locations.location.tabelog_url', 'is', null)
    .neq('episode_locations.location.tabelog_url', '')
  
  console.log(`総数: ${count}エピソード`)
}

checkEpisodeTitles()
