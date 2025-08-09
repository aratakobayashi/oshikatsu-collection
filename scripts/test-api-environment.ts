/**
 * API開発環境テスト
 * 本番データを触らず、安全にAPIテストを実行
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function testAPIEnvironment() {
  console.log('🧪 API開発環境テスト')
  console.log('='.repeat(50))
  
  // 現在の環境確認
  console.log('🌍 環境:', process.env.VITE_ENVIRONMENT)
  console.log('🔗 Supabase URL:', process.env.VITE_SUPABASE_URL)
  
  try {
    // 安全な読み取りテスト（データ変更なし）
    console.log('\n📊 データ読み取りテスト:')
    
    const { data: celebrities, error } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .limit(3)
      
    if (error) {
      console.log('❌ エラー:', error.message)
      return
    }
    
    console.log('✅ セレブリティデータ取得成功:')
    celebrities?.forEach((celebrity, idx) => {
      console.log(`   ${idx + 1}. ${celebrity.name} (${celebrity.slug})`)
    })
    
    // エピソード数確認
    const { count: episodeCount } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      
    console.log(`\n📺 エピソード総数: ${episodeCount}`)
    
    // ロケーション数確認
    const { count: locationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      
    console.log(`🏪 ロケーション総数: ${locationCount}`)
    
    // アイテム数確認
    const { count: itemCount } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      
    console.log(`👕 アイテム総数: ${itemCount}`)
    
    console.log('\n✅ API環境テスト完了！')
    console.log('🚀 これでAPIテストを安全に実行できます')
    
  } catch (error: any) {
    console.error('❌ テスト失敗:', error.message)
  }
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPIEnvironment().catch(console.error)
}