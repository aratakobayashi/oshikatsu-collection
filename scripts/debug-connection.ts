import { createClient } from '@supabase/supabase-js'

console.log('🔍 接続情報デバッグ...')
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('プロジェクトID:', process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0])

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugConnection() {
  try {
    // テーブル存在確認
    const { data: tables, error: tableError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })

    if (tableError) {
      console.error('❌ articlesテーブルエラー:', tableError)
    } else {
      console.log('✅ articlesテーブル存在')
      console.log('記事数:', tables)
    }

    // 実際のデータ確認
    const { data: articles, error: dataError } = await supabase
      .from('articles')
      .select('id, title, created_at')
      .limit(5)

    if (dataError) {
      console.error('❌ データ取得エラー:', dataError)
    } else {
      console.log('📊 記事データ:', articles?.length || 0, '件')
      articles?.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${article.created_at})`)
      })
    }

  } catch (error) {
    console.error('❌ 接続エラー:', error)
  }
}

debugConnection()