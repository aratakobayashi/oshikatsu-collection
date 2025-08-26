#!/usr/bin/env npx tsx

/**
 * 重複ロケーション統合スクリプト
 * エピソード紐付きレコードにTabelogURLを移行
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 統合対象の明確なマッピング
const mergeTargets = [
  {
    name: 'えんとつ屋',
    from_id: 'e3ef104d-eda0-4692-8be3-b8c28ff7bf6c', // Tabelog持ち
    to_id: 'bdb0a2d5-36fc-4c87-a872-ba986ed227ba',   // エピソード持ち
  },
  {
    name: '挽肉と米',
    from_id: '87be31f1-3343-4f0f-a76c-46d34c0e7f15', // Tabelog持ち
    to_id: '77a18670-4ad6-4299-9779-2ed8a5ba4c15',   // エピソード持ち
  }
]

async function mergeDuplicateLocations() {
  console.log('🔧 重複ロケーション統合開始')
  console.log('📊 エピソード紐付きレコードにTabelogURL移行')
  console.log('=' .repeat(60))
  
  let successCount = 0
  let errorCount = 0
  
  for (const target of mergeTargets) {
    console.log(`\n🔄 ${target.name}の統合`)
    
    // FROM（Tabelog持ち）レコード取得
    const { data: fromRecord } = await supabase
      .from('locations')
      .select('*')
      .eq('id', target.from_id)
      .single()
    
    // TO（エピソード持ち）レコード取得
    const { data: toRecord } = await supabase
      .from('locations')
      .select('*')
      .eq('id', target.to_id)
      .single()
    
    if (!fromRecord || !toRecord) {
      console.log('❌ レコードが見つかりません')
      errorCount++
      continue
    }
    
    console.log(`📍 FROM: ${fromRecord.name}`)
    console.log(`   ID: ${fromRecord.id}`)
    console.log(`   Tabelog: ${fromRecord.tabelog_url}`)
    console.log(`   エピソード: ${fromRecord.episode_id || 'なし'}`)
    
    console.log(`📍 TO: ${toRecord.name}`)
    console.log(`   ID: ${toRecord.id}`)
    console.log(`   Tabelog: ${toRecord.tabelog_url || 'なし'}`)
    console.log(`   エピソード: ${toRecord.episode_id}`)
    
    // TabelogURLとアフィリエイト情報を移行
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        tabelog_url: fromRecord.tabelog_url,
        affiliate_info: fromRecord.affiliate_info,
        address: fromRecord.address || toRecord.address, // 住所も最新のものを使用
      })
      .eq('id', target.to_id)
    
    if (updateError) {
      console.error('❌ 更新エラー:', updateError.message)
      errorCount++
      continue
    }
    
    console.log('✅ TabelogURL移行成功')
    
    // 重複元レコードのTabelog URLをクリア（または削除）
    const { error: clearError } = await supabase
      .from('locations')
      .update({
        tabelog_url: null,
        affiliate_info: {
          merged_to: target.to_id,
          merged_at: new Date().toISOString(),
          original_url: fromRecord.tabelog_url
        }
      })
      .eq('id', target.from_id)
    
    if (clearError) {
      console.error('⚠️ クリアエラー:', clearError.message)
    } else {
      console.log('✅ 重複元レコードクリア完了')
      successCount++
    }
  }
  
  // 更科堀井の特殊ケース（両方エピソード持ち）
  console.log('\n🔄 更科堀井の確認（両方エピソード持ち）')
  const { data: sarashinaRecords } = await supabase
    .from('locations')
    .select('*')
    .ilike('name', '%更科堀井%')
  
  console.log('📍 更科堀井レコード:')
  sarashinaRecords?.forEach(rec => {
    console.log(`  ID: ${rec.id}`)
    console.log(`  名前: ${rec.name}`)
    console.log(`  Tabelog: ${rec.tabelog_url ? '✅' : '❌'}`)
    console.log(`  エピソード: ${rec.episode_id ? '✅' : '❌'}`)
    console.log('  ---')
  })
  
  // 結果レポート
  console.log('\n' + '=' .repeat(60))
  console.log('📊 統合結果レポート')
  console.log('=' .repeat(60))
  console.log(`✅ 統合成功: ${successCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  
  // 最終確認
  const { data: finalCheck } = await supabase
    .from('locations')
    .select('id, name, tabelog_url, episode_id')
    .not('tabelog_url', 'is', null)
  
  console.log(`\n📊 統合後のアフィリエイト設定済み: ${finalCheck?.length || 0}件`)
  
  const withEpisode = finalCheck?.filter(loc => loc.episode_id)
  console.log(`✅ エピソード紐付きあり: ${withEpisode?.length || 0}件`)
  
  return {
    success_count: successCount,
    error_count: errorCount,
    total_affiliates: finalCheck?.length || 0,
    with_episode: withEpisode?.length || 0
  }
}

mergeDuplicateLocations()