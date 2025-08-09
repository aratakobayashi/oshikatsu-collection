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

async function fixLocationsTable() {
  console.log('🔧 locationsテーブルにcategoryカラムを追加')
  
  try {
    // Add category column
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS category TEXT;
        UPDATE public.locations SET category = 'location' WHERE category IS NULL;
      `
    })
    
    if (error) {
      console.error('❌ SQL実行エラー:', error.message)
      throw error
    }
    
    console.log('✅ categoryカラムの追加完了')
    
    // Verify the schema
    const { data: columns, error: schemaError } = await supabase.rpc('get_table_columns', {
      table_name: 'locations'
    })
    
    if (!schemaError && columns) {
      console.log('📋 locationsテーブル構造確認:')
      console.log(columns)
    }
    
  } catch (error: any) {
    console.error('❌ スキーマ修正エラー:', error.message)
    throw error
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  fixLocationsTable().catch(console.error)
}