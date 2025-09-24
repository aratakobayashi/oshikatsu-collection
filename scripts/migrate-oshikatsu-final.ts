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
    console.log('📝 記事タイトル例:')
    posts.slice(0, 3).forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.title.rendered}`)
    })

    // 2. 既存記事をチェック（重複回避）
    console.log('\n🔍 既存記事をチェック中...')
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('slug, title')

    const existingSlugs = new Set(
      existingArticles?.map(article => article.slug) || []
    )

    console.log(`📁 既存記事: ${existingArticles?.length || 0}件`)

    // 3. 記事を1件ずつ移行（最大10件のテスト移行）
    console.log('\n📝 記事移行を開始（テスト移行：最大10件）...')
    let successCount = 0
    let failCount = 0
    let skipCount = 0

    const testPosts = posts.slice(0, 10) // テスト用に最初の10件のみ

    for (const [index, post] of testPosts.entries()) {
      console.log(`\n[${index + 1}/${testPosts.length}] "${post.title.rendered}" を移行中...`)

      try {
        const articleData = await convertWordPressPost(post)

        // 重複チェック
        if (existingSlugs.has(articleData.slug)) {
          console.log(`⏭️ スキップ: 既に存在するスラッグ（${articleData.slug}）`)
          skipCount++
          continue
        }

        // 記事をデータベースに挿入
        const { error: insertError } = await supabase
          .from('articles')
          .insert(articleData)

        if (insertError) {
          console.error(`❌ 挿入エラー: ${insertError.message}`)
          failCount++
        } else {
          console.log(`✅ 移行成功 - スラッグ: ${articleData.slug}`)
          successCount++
        }

        // APIレート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`❌ 変換エラー: ${error instanceof Error ? error.message : error}`)
        failCount++
      }
    }

    // 4. 結果レポート
    console.log('\n📊 移行完了レポート（テスト移行）:')
    console.log(`✅ 成功: ${successCount}件`)
    console.log(`⏭️ スキップ: ${skipCount}件（既存）`)
    console.log(`❌ 失敗: ${failCount}件`)
    console.log(`📈 処理率: ${Math.round(((successCount + skipCount) / testPosts.length) * 100)}%`)

    if (successCount > 0) {
      console.log('\n🎉 テスト移行が成功しました！')
      console.log('👀 確認: http://localhost:3000/articles')
      console.log('\n💡 全記事を移行する場合は、スクリプト内の testPosts.slice(0, 10) を posts に変更してください')
    }

  } catch (error) {
    console.error('🚨 移行エラー:', error instanceof Error ? error.message : error)
  }
}

async function convertWordPressPost(post: WordPressPost) {
  // アイキャッチ画像を取得
  let featured_image_url = ''
  let featured_image_alt = post.title.rendered

  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    featured_image_url = post._embedded['wp:featuredmedia'][0].source_url
  }

  // HTMLタグを除去するヘルパー関数
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

  // スラッグを生成（WordPress IDを含めて重複回避）
  const generateSlug = (title: string, id: number) => {
    const baseSlug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) // 長すぎるスラッグを制限
    return `oshikatsu-${baseSlug}-${id}`
  }

  // 読了時間を計算（800文字/分として）
  const calculateReadingTime = (content: string): number => {
    const textLength = stripHtml(content).length
    return Math.max(1, Math.ceil(textLength / 800))
  }

  // 既存のテーブル構造に完全に合わせる
  return {
    title: post.title.rendered,
    slug: generateSlug(post.title.rendered, post.id),
    content: post.content.rendered,
    excerpt: stripHtml(post.excerpt.rendered).substring(0, 300) || `${post.title.rendered}の記事です。`,
    featured_image_url,
    featured_image_alt,
    category_id: 'a1111111-1111-1111-1111-111111111111', // 既存のデフォルト値
    tag_ids: [], // 空配列
    related_product_ids: [], // 空配列
    seo_title: post.title.rendered,
    seo_description: stripHtml(post.excerpt.rendered).substring(0, 160) || post.title.rendered.substring(0, 160),
    reading_time: calculateReadingTime(post.content.rendered),
    published_at: post.date,
    status: post.status === 'publish' ? 'published' : 'draft',
    categories: ['oshikatsu', 'wordpress-import'] // 移行元がわかるようにタグ付け
  }
}

// スクリプト実行
migratePosts().catch(console.error)