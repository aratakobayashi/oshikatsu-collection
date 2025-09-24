import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analyzeProductionArticles() {
  console.log('🔍 本番環境の記事を分析中...')
  console.log(`Supabase URL: ${supabaseUrl}`)

  try {
    // 1. 全記事の詳細を取得
    console.log('\n📊 全記事の詳細:')
    const { data: allArticles, error: allError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ 全記事取得エラー:', allError)
      return
    }

    console.log(`総記事数: ${allArticles?.length || 0}`)

    if (allArticles && allArticles.length > 0) {
      allArticles.forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`)
        console.log(`   ID: ${article.id}`)
        console.log(`   Slug: ${article.slug}`)
        console.log(`   Status: ${article.status}`)
        console.log(`   Published: ${article.published_at}`)
        console.log(`   Created: ${article.created_at}`)
        console.log(`   Excerpt: ${article.excerpt?.substring(0, 100)}...`)
      })
    }

    // 2. 公開記事のみ
    console.log('\n\n📰 公開記事のみ:')
    const { data: publishedArticles, error: pubError } = await supabase
      .from('articles')
      .select('id, title, slug, status, published_at')
      .eq('status', 'published')

    if (pubError) {
      console.error('❌ 公開記事エラー:', pubError)
    } else {
      console.log(`公開記事数: ${publishedArticles?.length || 0}`)
      publishedArticles?.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${article.slug})`)
      })
    }

    // 3. ステータス別集計
    console.log('\n\n📈 ステータス別集計:')
    const statusCounts: Record<string, number> = {}
    allArticles?.forEach(article => {
      statusCounts[article.status] = (statusCounts[article.status] || 0) + 1
    })

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}件`)
    })

    // 4. WordPress移行記事の確認
    console.log('\n\n🔄 WordPress移行記事の確認:')
    const { data: wordpressArticles, error: wpError } = await supabase
      .from('articles')
      .select('id, title, slug, wordpress_id')
      .not('wordpress_id', 'is', null)

    if (wpError) {
      console.error('❌ WordPress記事エラー:', wpError)
    } else {
      console.log(`WordPress移行記事数: ${wordpressArticles?.length || 0}`)
      wordpressArticles?.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (WP ID: ${article.wordpress_id})`)
      })
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

analyzeProductionArticles()