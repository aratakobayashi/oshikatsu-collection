import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function minimalMigrate() {
  console.log('🚀 最小限移行テスト...')

  try {
    // 現在のテーブル構造を確認
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('*')
      .limit(1)

    if (existingArticle && existingArticle[0]) {
      console.log('📊 現在のテーブルフィールド:')
      console.log(Object.keys(existingArticle[0]))
    }

    // カテゴリーID取得
    const { data: categories } = await supabase
      .from('article_categories')
      .select('*')
      .limit(1)

    if (!categories || categories.length === 0) {
      console.error('❌ カテゴリーが見つかりません')
      return
    }

    const categoryId = categories[0].id

    // WordPressから記事を1件取得してテスト
    const response = await fetch('https://oshikatsu-guide.com/wp-json/wp/v2/posts?per_page=1')
    const [post] = await response.json()

    console.log('📝 テスト記事:', post.title.rendered)

    // 最小限のフィールドで記事追加
    const minimalArticle = {
      title: post.title.rendered,
      slug: 'wp-test-' + Date.now(), // 重複回避
      content: post.content.rendered.replace(/<[^>]*>/g, '').trim(),
      category_id: categoryId,
      status: 'published',
      published_at: post.date_gmt
    }

    const { data: result, error } = await supabase
      .from('articles')
      .insert([minimalArticle])
      .select()

    if (error) {
      console.error('❌ 挿入エラー:', error)
    } else {
      console.log('✅ 成功！記事ID:', result[0]?.id)
      console.log('📍 確認URL: https://collection.oshikatsu-guide.com/articles/' + result[0]?.slug)
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

minimalMigrate()