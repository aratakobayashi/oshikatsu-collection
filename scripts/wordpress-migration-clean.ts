import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface WordPressPost {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  slug: string
  date: string
  status: string
  featured_media: number
  categories: number[]
  tags: number[]
  link: string
}

interface Article {
  title: string
  slug: string
  content: string
  excerpt: string
  published_at: string
  status: string
  featured_image_url: string
  category_id: string
  created_at: string
  updated_at: string
}

function cleanHtmlContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

function generateUniqueSlug(title: string, wordpressId: number): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)

  return `${baseSlug}-${wordpressId}`
}

async function convertWordPressPost(post: WordPressPost): Promise<Article> {
  return {
    title: post.title.rendered,
    slug: generateUniqueSlug(post.title.rendered, post.id),
    content: post.content.rendered,
    excerpt: cleanHtmlContent(post.excerpt.rendered),
    published_at: post.date,
    status: post.status === 'publish' ? 'published' : 'draft',
    featured_image_url: '',
    category_id: 'a1111111-1111-1111-1111-111111111111', // デフォルトカテゴリ
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

async function fetchWordPressArticles(): Promise<WordPressPost[]> {
  console.log('🔍 WordPress記事を取得中...')

  try {
    const response = await fetch('https://oshikatsu-guide.com/wp-json/wp/v2/posts?per_page=100&status=publish')

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`)
    }

    const posts: WordPressPost[] = await response.json()
    console.log(`✅ ${posts.length}件の記事を取得しました`)

    return posts
  } catch (error) {
    console.error('❌ WordPress記事取得エラー:', error)
    throw error
  }
}

async function saveArticleToDatabase(article: Article): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()

    if (error) {
      console.error('❌ データベース保存エラー:', error)
      return false
    }

    console.log(`✅ 記事保存成功: ${article.title}`)
    return true
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    return false
  }
}

async function main() {
  try {
    console.log('🚀 WordPress記事移行を開始します...')
    console.log(`移行先: ${supabaseUrl}`)

    // 1. 現在のarticlesテーブル状態確認
    const { count: currentCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 現在のarticles数: ${currentCount || 0}件`)

    // 2. WordPress記事を取得
    const wordpressPosts = await fetchWordPressArticles()

    // 3. 各記事を変換・保存
    let successCount = 0
    let failCount = 0

    for (const post of wordpressPosts) {
      console.log(`\n📝 処理中: ${post.title.rendered}`)

      try {
        const article = await convertWordPressPost(post)
        const saved = await saveArticleToDatabase(article)

        if (saved) {
          successCount++
        } else {
          failCount++
        }

        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`❌ 記事処理エラー: ${post.title.rendered}`, error)
        failCount++
      }
    }

    console.log('\n🎉 移行完了!')
    console.log(`✅ 成功: ${successCount}件`)
    console.log(`❌ 失敗: ${failCount}件`)
    console.log(`📊 合計: ${wordpressPosts.length}件`)

    // 4. 最終確認
    const { count: finalCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📈 移行後のarticles数: ${finalCount || 0}件`)

  } catch (error) {
    console.error('❌ 移行プロセスでエラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプト実行
main()