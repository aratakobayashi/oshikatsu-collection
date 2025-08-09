/**
 * Add missing category column to locations table
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function addCategoryColumn() {
  console.log('🔧 locationsテーブルにcategoryカラムを追加')
  
  try {
    // First check if column exists
    const { data: existingColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'locations')
      .eq('column_name', 'category')
    
    if (existingColumns && existingColumns.length > 0) {
      console.log('✅ categoryカラムは既に存在します')
      return
    }
    
    // Try using raw SQL query instead
    console.log('📝 categoryカラムを追加中...')
    
    // Use a direct insert approach to test connection
    const { data: testQuery, error: testError } = await supabase
      .from('locations')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ データベース接続エラー:', testError.message)
      throw testError
    }
    
    console.log('✅ データベース接続成功')
    console.log('⚠️  categoryカラムの追加はSupabase管理画面で手動実行が必要です')
    console.log('')
    console.log('実行すべきSQL:')
    console.log('ALTER TABLE public.locations ADD COLUMN category TEXT;')
    console.log('')
    
  } catch (error: any) {
    console.error('❌ カラム追加エラー:', error.message)
    throw error
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  addCategoryColumn().catch(console.error)
}