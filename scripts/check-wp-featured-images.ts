async function checkWordPressFeaturedImages() {
  console.log('🖼️ WordPressアイキャッチ画像を確認中...')

  try {
    // WordPressから記事を取得（_embedパラメータでメディア情報も取得）
    const response = await fetch('https://oshikatsu-guide.com/wp-json/wp/v2/posts?per_page=5&_embed')

    if (!response.ok) {
      throw new Error('WordPress API エラー')
    }

    const posts = await response.json()

    console.log(`📝 確認中の記事: ${posts.length}件\n`)

    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.rendered}`)
      console.log(`   Slug: ${post.slug}`)

      // フィーチャードメディア確認
      if (post.featured_media && post.featured_media > 0) {
        console.log(`   Featured Media ID: ${post.featured_media}`)

        // _embeddedデータからフィーチャード画像を取得
        if (post._embedded && post._embedded['wp:featuredmedia']) {
          const featuredMedia = post._embedded['wp:featuredmedia'][0]
          console.log(`   ✅ 画像URL: ${featuredMedia.source_url}`)
          console.log(`   画像タイトル: ${featuredMedia.title.rendered}`)
        } else {
          console.log(`   ⚠️  _embedded データなし`)
        }
      } else {
        console.log(`   ❌ フィーチャード画像なし`)
      }
      console.log('')
    })

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkWordPressFeaturedImages()