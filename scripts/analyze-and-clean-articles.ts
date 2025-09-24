import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analyzeAndCleanArticles() {
  console.log('🔍 記事の分析と整理を開始...')

  try {
    // 全記事を取得
    const { data: allArticles, error } = await supabase
      .from('articles')
      .select('id, title, slug, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ エラー:', error)
      return
    }

    console.log(`📊 総記事数: ${allArticles?.length || 0}件`)

    // カテゴリ別に分類
    const bonsaiArticles: any[] = []
    const oshikatsuArticles: any[] = []
    const unknownArticles: any[] = []

    allArticles?.forEach(article => {
      const title = article.title.toLowerCase()
      const slug = article.slug.toLowerCase()

      if (title.includes('盆栽') || slug.includes('bonsai') ||
          title.includes('松') || title.includes('楓') ||
          title.includes('植物') || title.includes('園芸')) {
        bonsaiArticles.push(article)
      } else if (title.includes('推し') || title.includes('ライブ') ||
                 title.includes('遠征') || title.includes('timelesz') ||
                 title.includes('ジャニーズ') || slug.includes('oshikatsu')) {
        oshikatsuArticles.push(article)
      } else {
        unknownArticles.push(article)
      }
    })

    console.log('\n📝 記事分類結果:')
    console.log(`🌿 盆栽関連: ${bonsaiArticles.length}件`)
    console.log(`🎤 推し活関連: ${oshikatsuArticles.length}件`)
    console.log(`❓ 不明: ${unknownArticles.length}件`)

    // 盆栽記事のサンプル表示
    if (bonsaiArticles.length > 0) {
      console.log('\n🌿 盆栽記事（削除対象）のサンプル:')
      bonsaiArticles.slice(0, 5).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`)
        console.log(`   ID: ${article.id}`)
      })
    }

    // 推し活記事のサンプル表示
    if (oshikatsuArticles.length > 0) {
      console.log('\n🎤 推し活記事（残す）のサンプル:')
      oshikatsuArticles.slice(0, 5).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`)
      })
    }

    // 不明記事の詳細確認
    if (unknownArticles.length > 0) {
      console.log('\n❓ 分類不明の記事（要確認）:')
      unknownArticles.slice(0, 10).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`)
        console.log(`   Slug: ${article.slug}`)
      })
    }

    console.log('\n💡 削除提案:')
    console.log(`盆栽関連の ${bonsaiArticles.length} 件の記事を削除して、`)
    console.log(`推し活関連の ${oshikatsuArticles.length} 件の記事のみ残すことをお勧めします。`)

    // 削除用IDリストの作成
    if (bonsaiArticles.length > 0) {
      console.log('\n🗑️ 削除用IDリスト（次のステップで使用）:')
      const deleteIds = bonsaiArticles.map(a => a.id)
      console.log(JSON.stringify(deleteIds.slice(0, 10), null, 2))
      console.log(`... 他 ${Math.max(0, deleteIds.length - 10)} 件`)
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

analyzeAndCleanArticles()