import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc5MTQwOSwiZXhwIjoyMDY3MzY3NDA5fQ.Tk25ml7Cj4y8CrSkUSC-Xogg_hYO_nvMnAJLrvdpD88'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('=== データ確認 ===')

  // カテゴリー確認
  const { data: categories, count: catCount } = await supabase
    .from('article_categories')
    .select('*', { count: 'exact' })

  console.log(`📂 カテゴリー: ${catCount}件`)

  // 記事確認
  const { data: articles, count: artCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact' })

  console.log(`📝 記事: ${artCount}件`)

  if (articles && articles.length > 0) {
    articles.forEach(article => {
      console.log(`  - ${article.title} (${article.slug})`)
    })
  }

  // カテゴリーがあるのに記事がない場合、記事追加をテスト
  if (catCount > 0 && artCount === 0 && categories) {
    console.log('\n📝 記事を追加してみます...')

    const testArticle = {
      title: '推し活初心者ガイド',
      slug: 'oshikatsu-beginner',
      content: 'これは推し活を始める方向けのガイド記事です。',
      category_id: categories[0].id,
      status: 'published',
      published_at: new Date().toISOString()
    }

    const { data: newArticle, error } = await supabase
      .from('articles')
      .insert([testArticle])
      .select()

    if (error) {
      console.error('❌ 記事追加エラー:', error)
    } else {
      console.log('✅ 記事追加成功:', newArticle[0]?.title)
    }
  }
}

checkData()