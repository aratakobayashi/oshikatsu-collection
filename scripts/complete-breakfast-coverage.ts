/**
 * 朝ごはんロケーション100%カバーを達成するため最後の2件を追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// ステージング環境変数読み込み
dotenv.config({ path: '.env.staging' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 最後の2件
const finalLocations = [
  {
    name: 'ヒルトン東京 マーブルラウンジ',
    slug: 'hilton-tokyo-marble-lounge-fixed',
    address: '東京都新宿区西新宿6-6-2 ヒルトン東京1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問したホテルの朝食ビュッフェ'
  },
  {
    name: '海老名サービスエリア（下り）',
    slug: 'ebina-sa-down-line',
    address: '神奈川県海老名市大谷南5-1-1',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問したサービスエリア'
  }
]

async function completeBreakfastCoverage() {
  console.log('🎯 朝ごはんロケーション100%カバー達成...\n')
  
  for (const location of finalLocations) {
    try {
      // 類似名チェック（既存のヒルトンや海老名SAがあるかもしれない）
      const { data: similar } = await supabase
        .from('locations')
        .select('id, name')
        .or(`name.ilike.%ヒルトン%,name.ilike.%海老名%`)
      
      console.log(`📍 ${location.name} を追加中...`)
      if (similar && similar.length > 0) {
        console.log('   類似する既存ロケーション:')
        similar.forEach(s => console.log(`     - ${s.name}`))
      }
      
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: location.name,
          slug: location.slug,
          address: location.address,
          description: location.description
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') { // 重複エラー
          console.log(`   ⚠️ 既存または重複: ${location.name}`)
        } else {
          console.error(`   ❌ エラー: ${error.message}`)
        }
      } else {
        console.log(`   ✅ 追加成功: ${location.name}`)
      }
      
    } catch (err) {
      console.error(`❌ 予期しないエラー: ${location.name}`, err)
    }
  }
  
  // 最終確認
  const { count } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 朝ごはんロケーション追加完了')
  console.log('='.repeat(50))
  console.log(`📊 総ロケーション数: ${count}件`)
  console.log('🎯 目標: 競合サイト100%カバー達成')
  
  return count
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  completeBreakfastCoverage().catch(console.error)
}