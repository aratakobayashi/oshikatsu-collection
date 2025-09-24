import { createClient } from '@supabase/supabase-js'

// Supabase設定
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ptbowbqrykqwxuzivbdv.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Ym93YnFyeWtxd3h1eml2YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTQxMDMsImV4cCI6MjA3MjYzMDEwM30.vBU1isCrm5dirAqHMQxJY209B13gnyKx4TCFFX_xxek'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkTables() {
  console.log('🔍 記事システムのテーブル構造を確認中...')

  try {
    // categories テーブルをチェック
    console.log('\n📁 categories テーブルをチェック...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)

    if (categoriesError) {
      console.error('❌ categories テーブルエラー:', categoriesError.message)
    } else {
      console.log(`✅ categories テーブル: ${categories?.length || 0}件のデータ`)
      if (categories && categories.length > 0) {
        console.log('サンプル:', categories[0])
      }
    }

    // articles テーブルをチェック
    console.log('\n📝 articles テーブルをチェック...')
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .limit(5)

    if (articlesError) {
      console.error('❌ articles テーブルエラー:', articlesError.message)
    } else {
      console.log(`✅ articles テーブル: ${articles?.length || 0}件のデータ`)
      if (articles && articles.length > 0) {
        console.log('サンプル:', articles[0])
      }
    }

    // テーブル一覧を取得（メタクエリ）
    console.log('\n🗃️ 利用可能なテーブル一覧を確認...')
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_names')

    if (tablesError) {
      console.log('⚠️ テーブル一覧取得失敗（これは正常な場合があります）')
    } else {
      console.log('📋 テーブル一覧:', tables)
    }

  } catch (error) {
    console.error('🚨 チェックエラー:', error instanceof Error ? error.message : error)
  }
}

checkTables().catch(console.error)