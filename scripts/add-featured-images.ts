import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 推し活関連のフリー素材画像URL（例）
const sampleImages = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=800&h=450&fit=crop'
]

async function addFeaturedImages() {
  console.log('🖼️ アイキャッチ画像を追加中...')

  try {
    // 現在の記事を取得
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, featured_image_url')
      .eq('status', 'published')

    if (error) {
      throw error
    }

    console.log(`📄 ${articles?.length}件の記事を処理中...`)

    for (let i = 0; i < (articles?.length || 0); i++) {
      const article = articles[i]

      // 既にアイキャッチ画像がある場合はスキップ
      if (article.featured_image_url) {
        console.log(`  ⏭️ スキップ: ${article.title}（既に画像あり）`)
        continue
      }

      // ランダムな画像を選択
      const randomImage = sampleImages[i % sampleImages.length]

      const { error: updateError } = await supabase
        .from('articles')
        .update({ featured_image_url: randomImage })
        .eq('id', article.id)

      if (updateError) {
        console.error(`❌ ${article.title}:`, updateError)
      } else {
        console.log(`✅ ${article.title}`)
      }
    }

    console.log('\n🎉 アイキャッチ画像の追加完了！')
    console.log('📍 確認URL: https://collection.oshikatsu-guide.com/articles')

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

addFeaturedImages()