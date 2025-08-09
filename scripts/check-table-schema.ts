/**
 * テーブルスキーマ確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function checkTableSchema() {
  console.log('🔍 テーブルスキーマ確認')
  console.log('='.repeat(50))
  
  try {
    // 既存のlocationsレコードを1件確認
    console.log('\n🏪 現在のlocationsテーブル構造:')
    const { data: sampleLocation, error: locError } = await supabase
      .from('locations')
      .select('*')
      .limit(1)
      .single()
      
    if (locError) {
      console.log('❌ Location取得エラー:', locError.message)
    } else if (sampleLocation) {
      console.log('📊 Locationsテーブルのカラム:')
      Object.keys(sampleLocation).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleLocation[key]} (${sampleLocation[key] ? String(sampleLocation[key]).substring(0, 30) + '...' : 'null'})`)
      })
    }
    
    // 既存のitemsレコードを1件確認
    console.log('\n🛍️ 現在のitemsテーブル構造:')
    const { data: sampleItem, error: itemError } = await supabase
      .from('items')
      .select('*')
      .limit(1)
      .single()
      
    if (itemError) {
      console.log('❌ Item取得エラー:', itemError.message)
    } else if (sampleItem) {
      console.log('📊 Itemsテーブルのカラム:')
      Object.keys(sampleItem).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleItem[key]} (${sampleItem[key] ? String(sampleItem[key]).substring(0, 30) + '...' : 'null'})`)
      })
    }
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkTableSchema().catch(console.error)
}