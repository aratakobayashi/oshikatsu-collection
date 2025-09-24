import { createClient } from '@supabase/supabase-js'

// Supabase設定
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awaarykghpylggygkiyp.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface WordPressPost {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  slug: string
  status: string
  date: string
  categories: number[]
  tags: number[]
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>
    'wp:term'?: Array<Array<{ name: string }>>
  }
}

interface WordPressCategory {
  id: number
  name: string
  slug: string
  count: number
}

async function migratePosts() {
  console.log('🚀 oshikatsu-guide.com からの記事移行を開始...')

  try {
    // 1. WordPress REST APIから記事とカテゴリを取得
    console.log('📡 WordPress REST APIから記事データを取得中...')

    const postsResponse = await fetch('https://oshikatsu-guide.com/wp-json/wp/v2/posts?per_page=100&_embed=true')
    const categoriesResponse = await fetch('https://oshikatsu-guide.com/wp-json/wp/v2/categories?per_page=100')

    if (!postsResponse.ok || !categoriesResponse.ok) {
      throw new Error('WordPress REST APIからデータを取得できませんでした')
    }

    const posts: WordPressPost[] = await postsResponse.json()
    const wpCategories: WordPressCategory[] = await categoriesResponse.json()

    console.log(`📊 取得結果: ${posts.length}件の記事, ${wpCategories.length}件のカテゴリ`)

    // 2. ローカルカテゴリを取得
    console.log('🔍 ローカルカテゴリを取得中...')
    const { data: localCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')

    if (categoriesError) {
      throw new Error(`カテゴリ取得エラー: ${categoriesError.message}`)
    }

    console.log(`📁 ローカルカテゴリ: ${localCategories?.length}件`)

    // 3. カテゴリマッピングを作成
    const categoryMapping = createCategoryMapping(wpCategories, localCategories || [])
    console.log('🗺️ カテゴリマッピング:')
    wpCategories.forEach(wpCat => {
      const localCat = localCategories?.find(c => c.id === categoryMapping[wpCat.id])
      console.log(`  "${wpCat.name}" → "${localCat?.name || 'Unknown'}"`)
    })

    // 4. 記事を1件ずつ移行
    console.log('\n📝 記事移行を開始...')
    let successCount = 0
    let failCount = 0

    for (const [index, post] of posts.entries()) {
      console.log(`\n[${index + 1}/${posts.length}] "${post.title.rendered}" を移行中...`)

      try {
        const articleData = await convertWordPressPost(post, categoryMapping, localCategories?.[0]?.id)

        // 記事をデータベースに挿入
        const { error: insertError } = await supabase
          .from('articles')
          .insert(articleData)

        if (insertError) {
          console.error(`❌ 挿入エラー: ${insertError.message}`)
          failCount++
        } else {
          console.log(`✅ 移行成功`)
          successCount++
        }

        // APIレート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`❌ 変換エラー: ${error instanceof Error ? error.message : error}`)
        failCount++
      }
    }

    // 5. 結果レポート
    console.log('\n📊 移行完了レポート:')
    console.log(`✅ 成功: ${successCount}件`)
    console.log(`❌ 失敗: ${failCount}件`)
    console.log(`📈 成功率: ${Math.round((successCount / posts.length) * 100)}%`)

    if (successCount > 0) {
      console.log('\n🎉 記事の移行が完了しました！')
      console.log('👀 確認: http://localhost:3000/articles')
    }

  } catch (error) {
    console.error('🚨 移行エラー:', error instanceof Error ? error.message : error)
  }
}

function createCategoryMapping(wpCategories: WordPressCategory[], localCategories: any[]) {
  const mapping: Record<number, string> = {}

  // カテゴリ名のマッピングルール
  const mappingRules = {
    'はじめての推し活': 'はじめての推し活',
    'ライブ・コンサートレポート': 'ライブレポート',
    'ライブ会場ガイド': 'ライブ会場ガイド',
    '参戦準備・コーデ': '参戦準備・コーデ',
    '推しプロフィール': 'アイドル紹介',
    '推し活×節約・お得術': '推し活×節約・お得術',
    '男性の推し活': '男性の推し活',
    '痛バ・グッズ・収納術': '痛バ・グッズ・収納術'
  }

  wpCategories.forEach(wpCat => {
    const mappedName = mappingRules[wpCat.name as keyof typeof mappingRules]
    const localCat = localCategories.find(local => local.name === mappedName)

    mapping[wpCat.id] = localCat?.id || localCategories[0]?.id
  })

  return mapping
}

async function convertWordPressPost(post: WordPressPost, categoryMapping: Record<number, string>, defaultCategoryId: string) {
  // アイキャッチ画像を取得
  let featured_image = ''
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    featured_image = post._embedded['wp:featuredmedia'][0].source_url
  }

  // カテゴリを取得
  const category_id = post.categories?.[0]
    ? categoryMapping[post.categories[0]]
    : defaultCategoryId

  // タグを取得
  const tags = post._embedded?.['wp:term']?.[1]?.map((tag: any) => tag.name) || []

  // HTMLタグを除去するヘルパー関数
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

  // スラッグを生成
  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  return {
    title: post.title.rendered,
    slug: generateSlug(post.title.rendered),
    content: post.content.rendered,
    excerpt: stripHtml(post.excerpt.rendered),
    featured_image,
    category_id,
    tags,
    status: post.status === 'publish' ? 'published' : 'draft',
    published_at: post.date,
    wordpress_id: post.id,
    wordpress_slug: post.slug,
    seo_title: post.title.rendered,
    meta_description: stripHtml(post.excerpt.rendered).substring(0, 160) || post.title.rendered.substring(0, 160)
  }
}

// スクリプト実行
migratePosts().catch(console.error)