import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkCorrectArticles() {
  console.log('🔍 正しい推し活プロジェクトの記事を確認中...')
  console.log(`URL: ${supabaseUrl}`)

  try {
    // 全記事数を確認
    const { data: allArticles, count: totalCount, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact' })

    if (error) {
      console.error('❌ エラー:', error)
      return
    }

    console.log(`📊 データベース内の全記事: ${totalCount}件`)

    if (allArticles && allArticles.length > 0) {
      console.log('\n📝 記事一覧（最初の10件）:')
      allArticles.slice(0, 10).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`)
        console.log(`   Slug: ${article.slug}`)
        console.log(`   Status: ${article.status}`)
        console.log(`   作成日: ${article.created_at}`)
        console.log('')
      })

      // published記事のみ確認
      const publishedArticles = allArticles.filter(a => a.status === 'published')
      console.log(`📢 公開中の記事: ${publishedArticles.length}件`)

      // 推し活関連記事を検索
      const oshikatsuKeywords = ['推し', 'ライブ', 'アイドル', 'コンサート', 'チケット', 'oshi', 'live', 'idol']
      const oshikatsuArticles = allArticles.filter(article =>
        oshikatsuKeywords.some(keyword =>
          article.title?.toLowerCase().includes(keyword.toLowerCase()) ||
          article.slug?.toLowerCase().includes(keyword.toLowerCase())
        )
      )

      console.log(`🎯 推し活関連記事: ${oshikatsuArticles.length}件`)

      if (oshikatsuArticles.length > 0) {
        console.log('\n推し活関連記事:')
        oshikatsuArticles.slice(0, 5).forEach((article, index) => {
          console.log(`${index + 1}. ${article.title} (${article.status})`)
        })
      }
    } else {
      console.log('❌ 記事が見つかりませんでした')
    }

  } catch (error) {
    console.error('❌ 接続エラー:', error)
  }
}

checkCorrectArticles()