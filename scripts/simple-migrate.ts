import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// WordPress REST API設定
const WORDPRESS_API_URL = 'https://oshikatsu-guide.com/wp-json/wp/v2'

// カテゴリーマッピング
const categoryMapping: { [key: string]: string } = {
  'はじめての推し活': 'beginner-oshi',
  '参戦準備・コーデ': 'live-preparation',
  'ライブ会場ガイド': 'venue-guide',
  'アイドル紹介': 'idol-introduction',
  'ライブレポート': 'live-report',
  '推し活×節約・お得術': 'saving-tips'
}

async function simpleMigrate() {
  console.log('🚀 シンプル移行開始...')

  try {
    // Supabaseカテゴリーを取得
    const { data: supabaseCategories } = await supabase
      .from('article_categories')
      .select('*')

    const categoryIdMap = new Map<string, string>()
    supabaseCategories?.forEach(cat => {
      categoryIdMap.set(cat.slug, cat.id)
    })

    // WordPressから記事を取得（最初の10件のみテスト）
    console.log('📖 WordPress記事を取得中...')
    const response = await fetch(`${WORDPRESS_API_URL}/posts?per_page=10`)
    const posts = await response.json()

    console.log(`📝 ${posts.length}件の記事を処理中...`)

    let successCount = 0

    for (const post of posts) {
      try {
        // デフォルトカテゴリーを使用
        const categoryId = categoryIdMap.get('beginner-oshi')

        // 必須フィールドのみで記事データを作成
        const articleData = {
          title: post.title.rendered.replace(/&#8211;/g, '–').replace(/&#8217;/g, "'"),
          slug: post.slug,
          content: post.content.rendered.replace(/<[^>]*>/g, '').trim(),
          excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').trim(),
          category_id: categoryId,
          status: 'published' as const,
          published_at: post.date_gmt,
          wordpress_id: post.id
        }

        const { error } = await supabase
          .from('articles')
          .upsert(articleData, { onConflict: 'slug' })

        if (error) {
          throw error
        }

        successCount++
        console.log(`  ✅ ${post.title.rendered}`)

      } catch (error) {
        console.error(`  ❌ ${post.title.rendered}:`, error)
      }
    }

    console.log(`\n🎉 移行完了！${successCount}件成功`)

  } catch (error) {
    console.error('❌ 移行エラー:', error)
  }
}

simpleMigrate()