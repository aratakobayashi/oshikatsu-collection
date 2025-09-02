#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function findMatsushigeId() {
  console.log('🔍 松重豊のデータ検索...\n')
  
  // 様々なパターンで検索
  const patterns = ['松重', 'matsushige', 'Matsushige']
  
  for (const pattern of patterns) {
    const { data } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .or(`name.ilike.%${pattern}%,slug.ilike.%${pattern}%`)
    
    if (data && data.length > 0) {
      console.log(`✅ パターン "${pattern}" で見つかりました:`)
      data.forEach(celeb => {
        console.log(`  ID: ${celeb.id}`)
        console.log(`  名前: ${celeb.name}`)
        console.log(`  Slug: ${celeb.slug}`)
        console.log()
      })
    }
  }
  
  // 全celebritiesを確認
  const { data: allCelebs, count } = await supabase
    .from('celebrities')
    .select('id, name, slug', { count: 'exact' })
    .limit(10)
  
  console.log(`\n📊 celebrities テーブル: ${count}件`)
  console.log('サンプル:')
  allCelebs?.forEach(celeb => {
    console.log(`  - ${celeb.name} (${celeb.slug})`)
  })
}

findMatsushigeId()
