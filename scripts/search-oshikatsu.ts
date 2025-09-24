import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function searchOshikatsu() {
  console.log('🔍 推し活関連の記事を検索中...')

  try {
    // 全ての記事を確認
    const { data: allArticles, error } = await supabase
      .from('articles')
      .select('id, title, slug, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    console.log(`📊 データベース内の全記事: ${allArticles?.length}件`)

    // 推し活関連の記事を検索
    const oshikatsuArticles = allArticles?.filter(article =>
      article.title.includes('推し') ||
      article.title.includes('ライブ') ||
      article.title.includes('アイドル') ||
      article.title.includes('コンサート') ||
      article.title.includes('チケット') ||
      article.slug.includes('oshi') ||
      article.slug.includes('live') ||
      article.slug.includes('idol')
    )

    console.log(`\n🎯 推し活関連の記事: ${oshikatsuArticles?.length}件`)

    if (oshikatsuArticles && oshikatsuArticles.length > 0) {
      oshikatsuArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`)
        console.log(`   Slug: ${article.slug}`)
        console.log(`   Status: ${article.status}`)
        console.log('')
      })
    } else {
      console.log('❌ 推し活関連の記事が見つかりませんでした！')
    }

    // 盆栽記事の数も確認
    const bonsaiArticles = allArticles?.filter(article =>
      article.title.includes('盆栽') ||
      article.slug.includes('bonsai')
    )

    console.log(`\n🌳 盆栽関連の記事: ${bonsaiArticles?.length}件`)

    console.log(`\n📅 記事作成日時の範囲:`)
    if (allArticles && allArticles.length > 0) {
      console.log(`最新: ${allArticles[0].created_at}`)
      console.log(`最古: ${allArticles[allArticles.length - 1].created_at}`)
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

searchOshikatsu()