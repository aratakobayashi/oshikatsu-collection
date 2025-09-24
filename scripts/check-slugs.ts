import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSlugs() {
  console.log('🔍 記事のスラッグを確認中...')

  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, status')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    console.log(`\n📝 最新の記事 ${articles?.length}件:`)

    articles?.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`)
      console.log(`   Slug: ${article.slug}`)
      console.log(`   URL: /articles/${article.slug}`)
      console.log(`   Status: ${article.status}`)
      console.log('')
    })

    // スラッグの問題をチェック
    const slugIssues = articles?.filter(article =>
      !article.slug ||
      article.slug.includes(' ') ||
      article.slug.includes('\\') ||
      article.slug.includes('/')
    )

    if (slugIssues && slugIssues.length > 0) {
      console.log('⚠️  問題のあるスラッグ:')
      slugIssues.forEach(article => {
        console.log(`- ${article.title}: "${article.slug}"`)
      })
    } else {
      console.log('✅ すべてのスラッグは正常です')
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkSlugs()