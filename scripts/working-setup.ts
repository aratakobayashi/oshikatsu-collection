import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function workingSetup() {
  console.log('🚀 記事システムセットアップ開始...')

  try {
    // 推し活関連カテゴリー（必須フィールドのみ）
    const categories = [
      { name: 'はじめての推し活', slug: 'beginner-oshi' },
      { name: '参戦準備・コーデ', slug: 'live-preparation' },
      { name: 'ライブ会場ガイド', slug: 'venue-guide' },
      { name: 'アイドル紹介', slug: 'idol-introduction' },
      { name: 'ライブレポート', slug: 'live-report' },
      { name: '推し活×節約・お得術', slug: 'saving-tips' }
    ]

    console.log('📂 カテゴリーを追加中...')
    const { data: insertedCategories, error: catError } = await supabase
      .from('article_categories')
      .insert(categories)
      .select()

    if (catError) {
      console.error('❌ カテゴリエラー:', catError)
      return
    }

    console.log(`✅ ${insertedCategories.length}個のカテゴリーを追加`)

    // サンプル記事を追加
    const firstCategory = insertedCategories[0]
    const sampleArticles = [
      {
        title: '推し活初心者必見！基本の「き」から始める推し活入門',
        slug: 'oshikatsu-beginner-guide',
        content: `推し活を始めたいけど、何から始めればいいか分からない...そんなあなたへ！

## 推し活って何？
推し活とは、好きなアイドル、タレント、キャラクターなどを応援する活動のことです。

## 推し活の始め方
1. まずは「推し」を見つけよう
2. 情報収集をしよう
3. 無理のない範囲で楽しもう

推し活は楽しむためのもの。お財布と相談しながら、自分のペースで楽しみましょう！`,
        excerpt: '推し活を始めたいけど何から始めればいいか分からない方へ。基本の「き」から丁寧に解説します。',
        category_id: firstCategory.id,
        status: 'published',
        published_at: '2024-01-15T09:00:00Z'
      }
    ]

    console.log('📝 サンプル記事を追加中...')
    const { data: insertedArticles, error: articleError } = await supabase
      .from('articles')
      .insert(sampleArticles)
      .select()

    if (articleError) {
      console.error('❌ 記事エラー:', articleError)
    } else {
      console.log(`✅ ${insertedArticles.length}個のサンプル記事を追加`)
      insertedArticles.forEach(article => {
        console.log(`  📄 ${article.title}`)
        console.log(`     URL: https://collection.oshikatsu-guide.com/articles/${article.slug}`)
      })
    }

    console.log('\n🎉 セットアップ完了！')
    console.log('📍 確認URL: https://collection.oshikatsu-guide.com/articles')

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

workingSetup()