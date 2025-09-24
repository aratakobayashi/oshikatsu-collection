import { createClient } from '@supabase/supabase-js'

// Supabase設定
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ptbowbqrykqwxuzivbdv.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Ym93YnFyeWtxd3h1eml2YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTQxMDMsImV4cCI6MjA3MjYzMDEwM30.vBU1isCrm5dirAqHMQxJY209B13gnyKx4TCFFX_xxek'

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

async function migratePosts() {
  console.log('🚀 oshikatsu-guide.com からの記事移行を開始...')

  try {
    // 1. WordPress REST APIから記事を取得
    console.log('📡 WordPress REST APIから記事データを取得中...')

    const postsResponse = await fetch('https://oshikatsu-guide.com/wp-json/wp/v2/posts?per_page=100&_embed=true')

    if (!postsResponse.ok) {
      throw new Error('WordPress REST APIからデータを取得できませんでした')
    }

    const posts: WordPressPost[] = await postsResponse.json()

    console.log(`📊 取得結果: ${posts.length}件の記事`)

    // 2. 既存記事をチェック（重複回避）
    console.log('🔍 既存記事をチェック中...')
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('wordpress_id, slug, title')

    const existingWordPressIds = new Set(
      existingArticles?.map(article => article.wordpress_id).filter(Boolean) || []
    )

    console.log(`📁 既存記事: ${existingArticles?.length || 0}件`)

    // 3. 記事を1件ずつ移行
    console.log('\n📝 記事移行を開始...')
    let successCount = 0
    let failCount = 0
    let skipCount = 0

    for (const [index, post] of posts.entries()) {
      console.log(`\n[${index + 1}/${posts.length}] "${post.title.rendered}" を移行中...`)

      // 重複チェック
      if (existingWordPressIds.has(post.id)) {
        console.log(`⏭️ スキップ: 既に移行済み（WordPress ID: ${post.id}）`)
        skipCount++
        continue
      }

      try {
        const articleData = await convertWordPressPost(post)

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
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (error) {
        console.error(`❌ 変換エラー: ${error instanceof Error ? error.message : error}`)
        failCount++
      }
    }

    // 4. 結果レポート
    console.log('\n📊 移行完了レポート:')
    console.log(`✅ 成功: ${successCount}件`)
    console.log(`⏭️ スキップ: ${skipCount}件（既存）`)
    console.log(`❌ 失敗: ${failCount}件`)
    console.log(`📈 処理率: ${Math.round(((successCount + skipCount) / posts.length) * 100)}%`)

    if (successCount > 0) {
      console.log('\n🎉 新しい記事の移行が完了しました！')
      console.log('👀 確認: http://localhost:3000/articles')
    }

  } catch (error) {
    console.error('🚨 移行エラー:', error instanceof Error ? error.message : error)
  }
}

async function convertWordPressPost(post: WordPressPost) {
  // アイキャッチ画像を取得
  let featured_image_url = ''
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    featured_image_url = post._embedded['wp:featuredmedia'][0].source_url
  }

  // タグを取得
  const tags = post._embedded?.['wp:term']?.[1]?.map((tag: any) => tag.name) || []

  // HTMLタグを除去するヘルパー関数
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

  // スラッグを生成（重複回避のためWordPress IDを付加）
  const generateSlug = (title: string, id: number) => {
    const baseSlug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${baseSlug}-wp${id}`
  }

  // カテゴリIDはデフォルト値を使用（既存のarticlesテーブル構造に合わせる）
  const defaultCategoryId = 'a1111111-1111-1111-1111-111111111111'

  return {
    title: post.title.rendered,
    slug: generateSlug(post.title.rendered, post.id),
    content: post.content.rendered,
    excerpt: stripHtml(post.excerpt.rendered),
    featured_image_url,
    featured_image_alt: post.title.rendered,
    category_id: defaultCategoryId, // 既存の構造に合わせる
    tag_ids: [], // 空配列（既存構造に合わせる）
    related_product_ids: [], // 空配列（既存構造に合わせる）
    seo_title: post.title.rendered,
    seo_description: stripHtml(post.excerpt.rendered).substring(0, 160) || post.title.rendered.substring(0, 160),
    reading_time: Math.max(1, Math.ceil(post.content.rendered.length / 800)), // 読了時間を推定
    published_at: post.date,
    status: post.status === 'publish' ? 'published' : 'draft',
    wordpress_id: post.id, // WordPress IDを保存
    categories: ['oshikatsu'] // 既存構造に合わせる
  }
}

// スクリプト実行
migratePosts().catch(console.error)