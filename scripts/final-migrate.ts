import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function finalMigrate() {
  console.log('🚀 WordPress記事の完全移行開始...')

  try {
    // カテゴリーID取得
    const { data: categories } = await supabase
      .from('article_categories')
      .select('*')

    const categoryIdMap = new Map<string, string>()
    categories?.forEach(cat => {
      categoryIdMap.set(cat.slug, cat.id)
    })

    // カテゴリーマッピング（WordPress → Supabase）
    const categoryMapping: { [key: string]: string } = {
      'はじめての推し活': 'beginner-oshi',
      '参戦準備・コーデ': 'live-preparation',
      'ライブ会場ガイド': 'venue-guide',
      'アイドル紹介': 'idol-introduction',
      'ライブレポート': 'live-report',
      '推し活×節約・お得術': 'saving-tips'
    }

    // 全記事を取得
    let allPosts = []
    let page = 1

    while (true) {
      console.log(`📖 ページ${page}の記事を取得中...`)
      const response = await fetch(`https://oshikatsu-guide.com/wp-json/wp/v2/posts?page=${page}&per_page=100&_embed`)

      if (!response.ok) break

      const posts = await response.json()
      if (posts.length === 0) break

      allPosts = [...allPosts, ...posts]
      page++
    }

    console.log(`\\n📝 ${allPosts.length}件の記事を移行中...`)

    let successCount = 0

    for (const post of allPosts) {
      try {
        // デフォルトカテゴリー
        let categorySlug = 'beginner-oshi'

        // カテゴリー情報があれば取得
        if (post._embedded?.['wp:term']?.[0]?.[0]?.name) {
          const wpCategoryName = post._embedded['wp:term'][0][0].name
          if (categoryMapping[wpCategoryName]) {
            categorySlug = categoryMapping[wpCategoryName]
          }
        }

        const categoryId = categoryIdMap.get(categorySlug) || categoryIdMap.get('beginner-oshi')

        // HTMLを除去してプレーンテキストに
        const cleanContent = post.content.rendered
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim()

        const cleanExcerpt = post.excerpt.rendered
          .replace(/<[^>]*>/g, '')
          .trim()

        const articleData = {
          title: post.title.rendered.replace(/&#8211;/g, '–').replace(/&#8217;/g, "'"),
          slug: post.slug,
          content: cleanContent,
          excerpt: cleanExcerpt,
          category_id: categoryId,
          status: 'published' as const,
          published_at: post.date_gmt,
          seo_title: post.title.rendered,
          seo_description: cleanExcerpt.substring(0, 160)
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

    console.log(`\\n🎉 移行完了！${successCount}/${allPosts.length}件成功`)
    console.log('📍 確認URL: https://collection.oshikatsu-guide.com/articles')

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

finalMigrate()