import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testArticleLinks() {
  console.log('🔗 記事リンクのテスト開始...')

  try {
    // 最初の記事を取得
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, content')
      .eq('status', 'published')
      .limit(3)

    if (error) {
      throw error
    }

    if (!articles || articles.length === 0) {
      console.log('❌ 記事が見つかりません')
      return
    }

    console.log(`\n📝 テスト用記事 ${articles.length}件:`)

    for (const article of articles) {
      console.log(`\n--- ${article.title} ---`)
      console.log(`Slug: ${article.slug}`)
      console.log(`記事一覧のリンク: /articles/${article.slug}`)

      // 記事詳細でも同じ記事が取得できるかテスト
      const { data: detailArticle, error: detailError } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', article.slug)
        .eq('status', 'published')
        .single()

      if (detailError || !detailArticle) {
        console.log(`❌ 詳細ページでの取得失敗: ${detailError?.message}`)
      } else {
        console.log(`✅ 詳細ページでの取得成功: ${detailArticle.title}`)
      }

      // 内容の長さをチェック
      if (article.content && article.content.length > 100) {
        console.log(`📄 コンテンツ: ${article.content.substring(0, 100)}...`)
      } else {
        console.log(`📄 コンテンツ: ${article.content || '内容なし'}`)
      }
    }

    console.log('\n🔍 ローカルでのテスト方法:')
    console.log('1. http://localhost:3000/articles にアクセス')
    console.log('2. "続きを読む" ボタンをクリック')
    console.log(`3. 期待URL: http://localhost:3000/articles/${articles[0].slug}`)

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

testArticleLinks()