// セレブリティ追加サンプルスクリプト
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// 追加するセレブリティのサンプルデータ
const sampleCelebrities = [
  {
    // Snow Manメンバー
    name: "岩本照",
    slug: "iwamoto-hikaru",
    bio: "Snow Manのメンバー。ダンスパフォーマンスに定評があり、振付も担当。筋トレが趣味で、フィットネス関連の仕事も多い。",
    image_url: "https://example.com/iwamoto.jpg", // 実際のURLに置き換え必要
    group_name: "Snow Man",
    type: "individual",
    status: "active",
    agency: "SMILE-UP.",
    social_links: {
      instagram: "hikaru_iwamoto.official"
    }
  },
  {
    // 人気俳優
    name: "佐藤健",
    slug: "sato-takeru",
    bio: "俳優。「るろうに剣心」シリーズの主演や「恋はつづくよどこまでも」での演技で幅広い世代から支持を集める。",
    image_url: "https://image.tmdb.org/t/p/w500/xxxxx.jpg", // TMDb APIから取得
    type: "individual",
    status: "active",
    agency: "アミューズ",
    birth_date: "1989-03-21",
    social_links: {
      instagram: "takeru_satoh.official",
      twitter: "takeru_staff"
    }
  },
  {
    // YouTuber
    name: "コムドット",
    slug: "comdot",
    bio: "5人組YouTuberグループ。「地元ノリを全国へ」をスローガンに活動。若者を中心に絶大な人気を誇る。",
    image_url: "https://yt3.ggpht.com/xxxxx", // YouTube APIから取得
    type: "group",
    status: "active",
    subscriber_count: 4000000,
    video_count: 1500,
    social_links: {
      youtube: "@comdot",
      instagram: "com.youtuber",
      twitter: "comyoutuber2"
    }
  },
  {
    // K-POPアイドル
    name: "TWICE",
    slug: "twice",
    bio: "韓国の9人組ガールズグループ。日本でも高い人気を誇り、紅白歌合戦にも出場。",
    image_url: "https://example.com/twice.jpg",
    type: "group",
    status: "active",
    agency: "JYP Entertainment",
    fandom_name: "ONCE",
    debut_date: "2015-10-20",
    social_links: {
      instagram: "twicetagram",
      twitter: "JYPETWICE",
      youtube: "@twice"
    }
  },
  {
    // 女優
    name: "新垣結衣",
    slug: "aragaki-yui",
    bio: "女優・歌手。「逃げるは恥だが役に立つ」「コード・ブルー」などの作品で主演を務める。愛称は「ガッキー」。",
    image_url: "https://example.com/gakky.jpg",
    type: "individual",
    status: "active",
    agency: "レプロエンタテインメント",
    birth_date: "1988-06-11",
    debut_date: "2001-01-01"
  }
]

// データ追加関数
async function addCelebrities() {
  console.log('🚀 セレブリティ追加開始...\n')
  
  for (const celebrity of sampleCelebrities) {
    try {
      // 既存チェック
      const { data: existing } = await supabase
        .from('celebrities')
        .select('id')
        .eq('slug', celebrity.slug)
        .single()
      
      if (existing) {
        console.log(`⚠️ ${celebrity.name} は既に存在します`)
        continue
      }
      
      // 新規追加
      const { data, error } = await supabase
        .from('celebrities')
        .insert([celebrity])
        .select()
        .single()
      
      if (error) {
        console.error(`❌ ${celebrity.name} の追加に失敗:`, error)
      } else {
        console.log(`✅ ${celebrity.name} を追加しました`)
        console.log(`   URL: /celebrities/${celebrity.slug}`)
      }
      
    } catch (err) {
      console.error(`❌ エラー:`, err)
    }
  }
  
  console.log('\n✨ 処理完了')
}

// 実行
if (require.main === module) {
  addCelebrities()
}

export { sampleCelebrities, addCelebrities }