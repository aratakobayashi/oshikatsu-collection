import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkPublishedArticles() {
  console.log('🔍 公開記事をチェック中...')

  try {
    // 全記事を確認
    const { data: allArticles, error: allError } = await supabase
      .from('articles')
      .select('id, title, slug, status, published_at, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ 全記事取得エラー:', allError)
      return
    }

    console.log(`📊 データベース内の全記事数: ${allArticles?.length || 0}`)

    if (allArticles && allArticles.length > 0) {
      console.log('\n📝 記事一覧:')
      allArticles.forEach((article, index) => {
        console.log(`${index + 1}. [${article.status}] ${article.title}`)
        console.log(`   Slug: ${article.slug}`)
        console.log(`   Published: ${article.published_at}`)
        console.log(`   Created: ${article.created_at}`)
        console.log('---')
      })
    }

    // 公開記事のみ確認
    const { data: publishedArticles, error: publishedError } = await supabase
      .from('articles')
      .select('id, title, slug, status')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (publishedError) {
      console.error('❌ 公開記事取得エラー:', publishedError)
      return
    }

    console.log(`\n✅ 公開ステータスの記事数: ${publishedArticles?.length || 0}`)

    if (publishedArticles && publishedArticles.length > 0) {
      console.log('\n📰 公開記事一覧:')
      publishedArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${article.slug})`)
      })
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

checkPublishedArticles()