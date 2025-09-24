import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifySupabaseProject() {
  console.log('🔍 Supabaseプロジェクト詳細確認中...')
  console.log(`URL: ${supabaseUrl}`)
  console.log(`プロジェクトID: ${supabaseUrl.split('//')[1].split('.')[0]}`)

  try {
    // プロジェクト情報の確認
    const { data: tables, error } = await supabase
      .rpc('get_schema_tables')
      .select()

    if (error) {
      console.log('❌ スキーマ取得エラー（これは正常な場合があります）:', error.message)
    }

    // articlesテーブルの詳細確認
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, created_at, slug')
      .limit(5)
      .order('created_at', { ascending: false })

    if (articlesError) {
      console.error('❌ articlesテーブルアクセスエラー:', articlesError)
      return
    }

    console.log('\n📊 最新5件の記事:')
    articles?.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`)
      console.log(`   ID: ${article.id}`)
      console.log(`   Slug: ${article.slug}`)
      console.log(`   作成日: ${article.created_at}`)
      console.log('---')
    })

    // 記事総数
    const { count, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ カウントエラー:', countError)
    } else {
      console.log(`\n📈 総記事数: ${count}件`)
    }

    // WordPress関連記事の確認
    const { data: wpArticles, error: wpError } = await supabase
      .from('articles')
      .select('title, slug')
      .ilike('title', '%timelesz%')
      .limit(3)

    if (!wpError && wpArticles?.length) {
      console.log('\n🔄 WordPress移行記事例:')
      wpArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${article.slug})`)
      })
    }

  } catch (error) {
    console.error('❌ 接続エラー:', error)
  }
}

verifySupabaseProject()