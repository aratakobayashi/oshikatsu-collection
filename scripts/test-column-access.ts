/**
 * テーブルのカラムアクセステスト
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testColumnAccess() {
  console.log('🔍 カラムアクセステスト')
  console.log('='.repeat(60))
  
  // locationsテーブルのカラムテスト
  console.log('🏪 locationsテーブルのカラムテスト:')
  
  const locationColumns = [
    'id', 'name', 'address', 'website', 'reservation_url', 
    'category', 'phone', 'description', 'episode_id', 'celebrity_id',
    'work_id', 'created_at', 'updated_at'
  ]
  
  for (const column of locationColumns) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(column)
        .limit(1)
      
      if (error) {
        console.log(`❌ ${column}: ${error.message}`)
      } else {
        console.log(`✅ ${column}: アクセス可能`)
      }
    } catch (error: any) {
      console.log(`❌ ${column}: ${error.message}`)
    }
  }
  
  console.log('\n' + '-'.repeat(40))
  
  // itemsテーブルのカラムテスト
  console.log('🛍️ itemsテーブルのカラムテスト:')
  
  const itemColumns = [
    'id', 'name', 'brand', 'affiliate_url', 'purchase_url',
    'price', 'category', 'description', 'episode_id', 'celebrity_id',
    'work_id', 'created_at', 'updated_at'
  ]
  
  for (const column of itemColumns) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(column)
        .limit(1)
      
      if (error) {
        console.log(`❌ ${column}: ${error.message}`)
      } else {
        console.log(`✅ ${column}: アクセス可能`)
      }
    } catch (error: any) {
      console.log(`❌ ${column}: ${error.message}`)
    }
  }
  
  console.log('\n' + '-'.repeat(40))
  
  // 実際のデータサンプル確認
  console.log('📊 実際のデータサンプル:')
  
  try {
    const { data: locationSample } = await supabase
      .from('locations')
      .select('id, name, website, reservation_url')
      .not('website', 'is', null)
      .limit(1)
    
    if (locationSample && locationSample.length > 0) {
      console.log('  Locationサンプル:')
      console.log('    ID:', locationSample[0].id)
      console.log('    Name:', locationSample[0].name)
      console.log('    Website:', locationSample[0].website || '未設定')
      console.log('    Reservation URL:', locationSample[0].reservation_url || '未設定')
    }
  } catch (error: any) {
    console.log('❌ locationサンプル取得エラー:', error.message)
  }
  
  try {
    const { data: itemSample } = await supabase
      .from('items')
      .select('id, name, affiliate_url')
      .not('affiliate_url', 'is', null)
      .limit(1)
    
    if (itemSample && itemSample.length > 0) {
      console.log('  Itemサンプル:')
      console.log('    ID:', itemSample[0].id)
      console.log('    Name:', itemSample[0].name)
      console.log('    Affiliate URL:', itemSample[0].affiliate_url || '未設定')
    }
  } catch (error: any) {
    console.log('❌ itemサンプル取得エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testColumnAccess().catch(console.error)
}