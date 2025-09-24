import { createClient } from '@supabase/supabase-js'

// 本番環境のSupabase設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY環境変数が設定されていません')
  console.log('以下のコマンドで実行してください:')
  console.log('SUPABASE_SERVICE_KEY="your-service-key" npx tsx scripts/setup-oshikatsu-articles.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 推し活関連のカテゴリー（SQLマイグレーションと同じ）
const oshikatsuCategories = [
  { name: 'はじめての推し活', slug: 'beginner-oshi', description: '推し活を始める方向けのガイド', color: '#F59E0B', order_index: 1 },
  { name: '参戦準備・コーデ', slug: 'live-preparation', description: 'ライブ参戦の準備とコーディネート', color: '#EF4444', order_index: 2 },
  { name: 'ライブ会場ガイド', slug: 'venue-guide', description: 'ライブ会場の情報とガイド', color: '#10B981', order_index: 3 },
  { name: 'アイドル紹介', slug: 'idol-introduction', description: 'アイドルグループの紹介記事', color: '#8B5CF6', order_index: 4 },
  { name: 'ライブレポート', slug: 'live-report', description: 'ライブ参戦レポート', color: '#F97316', order_index: 5 },
  { name: '推し活×節約・お得術', slug: 'saving-tips', description: '推し活を賢く楽しむ節約術', color: '#06B6D4', order_index: 6 },
  { name: '男性の推し活', slug: 'male-oshi', description: '男性ファンの推し活情報', color: '#3B82F6', order_index: 7 },
  { name: '痛バ・グッズ・収納術', slug: 'goods-storage', description: 'グッズの収納と痛バの作り方', color: '#EC4899', order_index: 8 }
]

async function setupOshikatsuArticles() {
  console.log('🚀 推し活記事システムのセットアップを開始...')

  try {
    // 1. 既存のカテゴリーをクリア
    console.log('\n📂 カテゴリーを更新中...')
    const { error: deleteError } = await supabase
      .from('article_categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全削除（ダミー条件）

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('カテゴリー削除エラー:', deleteError)
    }

    // 2. 推し活カテゴリーを挿入
    const { data: insertedCategories, error: insertError } = await supabase
      .from('article_categories')
      .insert(oshikatsuCategories)
      .select()

    if (insertError) {
      throw insertError
    }

    console.log(`✅ ${insertedCategories?.length}個のカテゴリーを追加しました`)
    insertedCategories?.forEach(cat => {
      console.log(`  ${cat.color} ${cat.name} (${cat.slug})`)
    })

    // 3. サンプル記事を追加
    console.log('\n📝 サンプル記事を追加中...')

    // カテゴリーIDを取得
    const categoryMap = new Map(insertedCategories?.map(c => [c.slug, c.id]))

    const sampleArticles = [
      {
        title: '推し活初心者必見！基本の「き」から始める推し活入門',
        slug: 'oshikatsu-beginner-guide',
        content: `推し活を始めたいけど、何から始めればいいか分からない...そんなあなたへ！

## 推し活って何？

推し活とは、好きなアイドル、タレント、キャラクターなどを応援する活動のことです。ライブに参加したり、グッズを集めたり、SNSで応援したりと、様々な形があります。

## 推し活の始め方

### 1. まずは「推し」を見つけよう
- YouTubeやTikTokで気になるアーティストをチェック
- 友達のおすすめを聞いてみる
- ライブ配信を見てみる

### 2. 情報収集をしよう
- 公式SNSをフォロー
- ファンクラブへの入会を検討
- ファン同士の交流サイトをチェック

### 3. 無理のない範囲で楽しもう
推し活は楽しむためのもの。お財布と相談しながら、自分のペースで楽しみましょう！`,
        excerpt: '推し活を始めたいけど何から始めればいいか分からない方へ。基本の「き」から丁寧に解説します。',
        category_id: categoryMap.get('beginner-oshi'),
        tags: ['初心者', '入門', '基礎知識'],
        status: 'published',
        published_at: new Date('2024-01-15T09:00:00Z'),
        featured: true,
        seo_title: '推し活初心者必見！基本から始める推し活入門ガイド2024',
        meta_description: '推し活を始めたい初心者向けの完全ガイド。推しの見つけ方から楽しみ方まで丁寧に解説します。'
      },
      {
        title: 'ライブ参戦コーデ完全ガイド！季節別・会場別おすすめスタイル',
        slug: 'live-fashion-guide',
        content: `ライブ参戦のコーディネート、迷っていませんか？季節や会場に合わせた最適なスタイルをご紹介！

## 春夏のライブコーデ

### 屋外フェス
- 日焼け対策は必須！帽子とサングラス
- 動きやすいTシャツ＋ショートパンツ
- スニーカーは汚れてもOKなものを

### ホール・アリーナ
- 推しカラーを取り入れた爽やかコーデ
- 冷房対策の羽織りもの必須
- ペンライトが映えるアイテムを

## 秋冬のライブコーデ

### 屋外ライブ
- 防寒対策をしっかり
- カイロは必須アイテム
- 推しカラーのマフラーで応援

### ドーム・アリーナ
- 着脱しやすいレイヤードスタイル
- ロッカーに入るコンパクトなアウター
- 推しうちわが持ちやすいバッグ選び`,
        excerpt: 'ライブ参戦のコーディネートに迷ったらこれ！季節別・会場別のおすすめスタイルを詳しく解説。',
        category_id: categoryMap.get('live-preparation'),
        tags: ['ファッション', 'コーディネート', 'ライブ'],
        status: 'published',
        published_at: new Date('2024-02-20T10:00:00Z'),
        featured: false,
        seo_title: 'ライブ参戦コーデ2024｜季節別・会場別完全ガイド',
        meta_description: 'ライブ参戦のコーディネートを季節別・会場別に詳しく解説。推し活ファッションの参考に！'
      },
      {
        title: '【2024年版】推し活×節約術！賢くお得に推し活を楽しむ方法',
        slug: 'oshikatsu-saving-tips-2024',
        content: `推し活は楽しいけど、お金がかかる...そんな悩みを解決する節約術をご紹介！

## 交通費を節約

### 早割チケットの活用
- 新幹線は1ヶ月前予約で最大35%OFF
- 飛行機は75日前予約がお得
- 高速バスも早割でお得に

### ホテル予約のコツ
- 楽天トラベルのセールを狙う
- 直前割引もチェック
- カプセルホテルやゲストハウスも検討

## グッズ購入の工夫

### 優先順位をつける
- 本当に欲しいものだけを厳選
- トレーディンググッズは友達と協力
- 中古市場も上手に活用

### ポイント活用術
- 楽天ポイント、PayPayポイントを貯める
- クレジットカードのキャンペーンを活用
- メルカリの売上金で購入`,
        excerpt: '推し活を楽しみながらお金も節約！交通費、宿泊費、グッズ購入の賢い節約術を大公開。',
        category_id: categoryMap.get('saving-tips'),
        tags: ['節約', 'お得情報', 'ライフハック'],
        status: 'published',
        published_at: new Date('2024-03-10T08:00:00Z'),
        featured: true,
        seo_title: '推し活×節約術2024｜賢くお得に楽しむ完全ガイド',
        meta_description: '推し活の節約術を大公開！交通費、宿泊費、グッズ購入を賢く節約して、もっと推し活を楽しもう。'
      }
    ]

    const { data: insertedArticles, error: articlesError } = await supabase
      .from('articles')
      .insert(sampleArticles)
      .select()

    if (articlesError) {
      throw articlesError
    }

    console.log(`✅ ${insertedArticles?.length}個のサンプル記事を追加しました`)
    insertedArticles?.forEach(article => {
      console.log(`  📄 ${article.title}`)
      console.log(`     URL: /articles/${article.slug}`)
    })

    console.log('\n🎉 セットアップ完了！')
    console.log('次のステップ:')
    console.log('1. 記事一覧ページ（/articles）でDBから記事を取得するように修正')
    console.log('2. WordPress記事の移行スクリプト作成')
    console.log('3. 301リダイレクトの設定')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

setupOshikatsuArticles()