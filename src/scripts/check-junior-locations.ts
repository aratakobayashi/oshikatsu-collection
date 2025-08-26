#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

async function main() {
  // 新しく作成されたジュニアCHANNEL関連の店舗を確認
  const { data } = await supabase
    .from('locations')
    .select('id, name, address, description, tabelog_url, created_at')
    .or('name.ilike.%福岡%,name.ilike.%市場%,name.ilike.%ケーキ%')
    .order('created_at', { ascending: false })
    .limit(10)
    
  console.log('🏪 ジュニアCHANNEL関連店舗 (最新作成順):')
  console.log('='.repeat(60))
  
  data?.forEach((loc, idx) => {
    console.log(`${idx + 1}. ${loc.name}`)
    console.log(`   ID: ${loc.id}`)
    console.log(`   住所: ${loc.address || '未設定'}`)
    console.log(`   食べログ: ${loc.tabelog_url ? '✅ 設定済み' : '❌ 未設定'}`)
    console.log(`   作成日: ${new Date(loc.created_at).toLocaleString('ja-JP')}`)
    console.log('')
  })

  console.log('\n📋 食べログリンク追加コマンド:')
  data?.filter(loc => !loc.tabelog_url).forEach(loc => {
    console.log(`npx tsx src/scripts/tabelog-affiliate-manager.ts --action add --location-id ${loc.id} --url [食べログURL]`)
  })
}

main().catch(console.error)