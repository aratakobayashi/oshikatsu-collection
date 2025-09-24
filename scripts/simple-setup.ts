import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simpleSetup() {
  console.log('🚀 シンプルセットアップ開始...')

  try {
    // 1. 既存のテーブル構造を確認
    console.log('\n📊 テーブル構造確認...')

    // article_categoriesテーブルに直接挿入してみる（最小限のフィールドで）
    const testCategory = {
      name: 'テストカテゴリ',
      // order_indexが存在しない場合は除外
    }

    const { data: insertTest, error: insertError } = await supabase
      .from('article_categories')
      .insert([testCategory])
      .select()

    if (insertError) {
      console.error('❌ カテゴリ挿入エラー:', insertError)
    } else {
      console.log('✅ テストカテゴリ挿入成功:', insertTest)
    }

    // 2. articlesテーブルにも簡単なテストデータ
    if (insertTest && insertTest.length > 0) {
      const testArticle = {
        title: 'テスト記事',
        slug: 'test-article',
        content: 'これはテスト記事です。',
        category_id: insertTest[0].id,
        status: 'published',
        published_at: new Date().toISOString()
      }

      const { data: articleInsert, error: articleError } = await supabase
        .from('articles')
        .insert([testArticle])
        .select()

      if (articleError) {
        console.error('❌ 記事挿入エラー:', articleError)
      } else {
        console.log('✅ テスト記事挿入成功:', articleInsert)
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

simpleSetup()