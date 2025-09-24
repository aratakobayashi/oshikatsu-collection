import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc5MTQwOSwiZXhwIjoyMDY3MzY3NDA5fQ.Tk25ml7Cj4y8CrSkUSC-Xogg_hYO_nvMnAJLrvdpD88'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateWordPressFeaturedImages() {
  console.log('🖼️ WordPressアイキャッチ画像でSupabaseを更新中...')

  try {
    // WordPress記事を全件取得（画像情報も含む）
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

    console.log(`\n📝 WordPress記事: ${allPosts.length}件`)

    let successCount = 0
    let skippedCount = 0

    for (const post of allPosts) {
      try {
        // アイキャッチ画像URL取得
        let featuredImageUrl = null

        if (post.featured_media && post.featured_media > 0) {
          if (post._embedded && post._embedded['wp:featuredmedia']) {
            const featuredMedia = post._embedded['wp:featuredmedia'][0]
            featuredImageUrl = featuredMedia.source_url
          }
        }

        if (!featuredImageUrl) {
          console.log(`  ⏭️ スキップ: ${post.title.rendered} (アイキャッチなし)`)
          skippedCount++
          continue
        }

        // Supabaseで対応する記事を検索（スラッグまたはタイトルで）
        const { data: existingArticles } = await supabase
          .from('articles')
          .select('id, title, slug, featured_image_url')
          .or(`slug.eq.${post.slug},title.eq.${post.title.rendered}`)

        if (existingArticles && existingArticles.length > 0) {
          const article = existingArticles[0]

          // アイキャッチ画像を更新
          const { error: updateError } = await supabase
            .from('articles')
            .update({ featured_image_url: featuredImageUrl })
            .eq('id', article.id)

          if (updateError) {
            console.error(`  ❌ 更新エラー: ${post.title.rendered}`, updateError)
          } else {
            successCount++
            console.log(`  ✅ 更新: ${post.title.rendered}`)
            console.log(`      画像: ${featuredImageUrl}`)
          }
        } else {
          console.log(`  ⚠️ 未発見: ${post.title.rendered}`)
        }

      } catch (error) {
        console.error(`  ❌ 処理エラー: ${post.title.rendered}`, error)
      }
    }

    console.log(`\n🎉 更新完了！`)
    console.log(`✅ 成功: ${successCount}件`)
    console.log(`⏭️ スキップ: ${skippedCount}件`)
    console.log('📍 確認URL: https://collection.oshikatsu-guide.com/articles')

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

updateWordPressFeaturedImages()