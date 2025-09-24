import { createClient } from '@supabase/supabase-js'

// 本番環境のSupabase設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY環境変数が設定されていません')
  console.log('以下のコマンドで実行してください:')
  console.log('SUPABASE_SERVICE_KEY="your-service-key" npx tsx scripts/migrate-wordpress-articles.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// WordPress REST API設定
const WORDPRESS_API_URL = 'https://oshikatsu-guide.com/wp-json/wp/v2'

// カテゴリーマッピング（WordPress → Supabase）
const categoryMapping: { [key: string]: string } = {
  'はじめての推し活': 'beginner-oshi',
  '参戦準備・コーデ': 'live-preparation',
  'ライブ会場ガイド': 'venue-guide',
  'アイドル紹介': 'idol-introduction',
  'ライブレポート': 'live-report',
  '推し活×節約・お得術': 'saving-tips',
  '男性の推し活': 'male-oshi',
  '痛バ・グッズ・収納術': 'goods-storage'
}

interface WordPressPost {
  id: number
  date: string
  date_gmt: string
  modified: string
  slug: string
  status: string
  link: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  categories: number[]
  tags: number[]
  featured_media: number
  yoast_head_json?: {
    title?: string
    description?: string
    og_image?: { url: string }[]
  }
}

interface WordPressCategory {
  id: number
  name: string
  slug: string
}

interface WordPressMedia {
  id: number
  source_url: string
  media_details: {
    sizes: {
      full: { source_url: string }
    }
  }
}

async function fetchWordPressPosts(page = 1): Promise<WordPressPost[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_embed`)

    if (!response.ok) {
      if (response.status === 400) {
        return [] // No more pages
      }
      throw new Error(`WordPress API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('WordPress記事取得エラー:', error)
    return []
  }
}

async function fetchWordPressCategories(): Promise<Map<number, string>> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/categories?per_page=100`)
    const categories: WordPressCategory[] = await response.json()

    const categoryMap = new Map<number, string>()
    categories.forEach(cat => {
      categoryMap.set(cat.id, cat.name)
    })

    return categoryMap
  } catch (error) {
    console.error('カテゴリー取得エラー:', error)
    return new Map()
  }
}

async function fetchFeaturedImage(mediaId: number): Promise<string> {
  if (!mediaId) return ''

  try {
    const response = await fetch(`${WORDPRESS_API_URL}/media/${mediaId}`)
    const media: WordPressMedia = await response.json()
    return media.source_url || ''
  } catch (error) {
    console.error(`画像取得エラー (ID: ${mediaId}):`, error)
    return ''
  }
}

function cleanContent(html: string): string {
  // HTMLタグを除去してプレーンテキストに変換
  // 実際の実装では、よりリッチなコンテンツ変換が必要かもしれません
  return html
    .replace(/<[^>]*>/g, '') // HTMLタグを除去
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\n+/g, '\n\n') // 複数の改行を2つに
    .trim()
}

async function migrateWordPressArticles() {
  console.log('🚀 WordPress記事の移行を開始...')
  console.log(`📍 対象サイト: ${WORDPRESS_API_URL}\n`)

  try {
    // 1. Supabaseのカテゴリーを取得
    const { data: supabaseCategories } = await supabase
      .from('article_categories')
      .select('*')

    const categoryIdMap = new Map<string, string>()
    supabaseCategories?.forEach(cat => {
      categoryIdMap.set(cat.slug, cat.id)
    })

    // 2. WordPress記事を全ページ取得
    const wpCategoryMap = await fetchWordPressCategories()
    let allPosts: WordPressPost[] = []
    let page = 1

    while (true) {
      console.log(`📖 ページ${page}の記事を取得中...`)
      const posts = await fetchWordPressPosts(page)

      if (posts.length === 0) break

      allPosts = [...allPosts, ...posts]
      page++
    }

    console.log(`\n✅ 合計 ${allPosts.length} 件の記事を取得しました\n`)

    // 3. 各記事を変換してSupabaseに保存
    let successCount = 0
    let errorCount = 0

    for (const post of allPosts) {
      try {
        console.log(`📝 処理中: ${post.title.rendered}`)

        // カテゴリーを特定
        let categorySlug = 'beginner-oshi' // デフォルトカテゴリー
        if (post.categories.length > 0) {
          const wpCategoryName = wpCategoryMap.get(post.categories[0])
          if (wpCategoryName && categoryMapping[wpCategoryName]) {
            categorySlug = categoryMapping[wpCategoryName]
          }
        }

        const categoryId = categoryIdMap.get(categorySlug)
        if (!categoryId) {
          console.warn(`  ⚠️ カテゴリーが見つかりません: ${categorySlug}`)
          continue
        }

        // アイキャッチ画像を取得
        const featuredImage = post.featured_media
          ? await fetchFeaturedImage(post.featured_media)
          : ''

        // 記事データを準備
        const articleData = {
          title: post.title.rendered.replace(/&#8211;/g, '–').replace(/&#8217;/g, "'"),
          slug: post.slug,
          content: cleanContent(post.content.rendered),
          excerpt: cleanContent(post.excerpt.rendered),
          featured_image: featuredImage,
          category_id: categoryId,
          tags: [], // タグは後で追加可能
          status: 'published' as const,
          published_at: post.date_gmt,
          featured: false,
          seo_title: post.yoast_head_json?.title || post.title.rendered,
          meta_description: post.yoast_head_json?.description || cleanContent(post.excerpt.rendered).substring(0, 160),
          wordpress_id: post.id,
          wordpress_slug: post.slug,
          view_count: 0
        }

        // Supabaseに保存（upsert: 既存の場合は更新）
        const { error } = await supabase
          .from('articles')
          .upsert(articleData, {
            onConflict: 'slug'
          })

        if (error) {
          throw error
        }

        successCount++
        console.log(`  ✅ 保存完了: /articles/${post.slug}`)

      } catch (error) {
        errorCount++
        console.error(`  ❌ エラー: ${post.title.rendered}`, error)
      }
    }

    // 4. 結果サマリー
    console.log('\n' + '='.repeat(60))
    console.log('🎉 移行完了！')
    console.log('='.repeat(60))
    console.log(`✅ 成功: ${successCount} 件`)
    console.log(`❌ 失敗: ${errorCount} 件`)
    console.log('\n📋 次のステップ:')
    console.log('1. https://collection.oshikatsu-guide.com/articles で記事を確認')
    console.log('2. WordPressサイトに301リダイレクトを設定')
    console.log('3. Google Search Consoleでサイトマップを更新')

  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error)
    process.exit(1)
  }
}

// 実行
migrateWordPressArticles()