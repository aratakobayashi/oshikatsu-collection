// もえのあずき追加スクリプト
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// YouTube API設定（必要に応じて）
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

// もえのあずきの詳細データ
const moenoazukiData = {
  // 基本情報
  name: "もえのあずき",
  slug: "moenoazuki",
  
  // プロフィール
  bio: "大食いアイドル。爆食女王3連覇の実力者。元アイドルグループ「エラバレシ」メンバー。同志社大学経済学部卒。2019年からYouTubeで大食い動画を配信し、チャンネル登録者約84万人。温泉ソムリエや野菜ソムリエなど多数の資格を保有。",
  
  // 画像URL（YouTube/インスタから取得）
  image_url: "https://yt3.googleusercontent.com/ytc/AIdro_l-wCXpz6EQw5VdJ1iVBOTu_VcEGdqQ3mzBJ2-H8g=s176-c-k-c0x00ffffff-no-rj",
  
  // 所属情報
  agency: "アミュレート",
  group_name: "元エラバレシ",
  
  // 基本データ
  birth_date: "1988-02-01",
  type: "individual", // individual/group/youtube_channel
  status: "active",
  
  // SNSリンク
  social_links: {
    youtube: "UCvekqH0Q09FqAs8ot0d8KZg",
    instagram: "moeazukitty",
    twitter: "moeazukitty",
    ameblo: "moeazukitty" // アメブロも活発
  },
  
  // YouTube統計（2024年現在）
  subscriber_count: 838000,
  video_count: 500, // 概算
  view_count: 120000000, // 1.2億回再生突破
  
  // ファン層情報
  fandom_name: "もえあず推し"
}

// 関連する人気グルメ動画（サンプル）
const popularVideos = [
  {
    title: "【大食い】お寿司200貫に挑戦！",
    url: "https://www.youtube.com/watch?v=...",
    restaurants: [
      {
        name: "スシロー",
        category: "寿司",
        address: "東京都渋谷区",
        // 食べログURL追加予定
      }
    ]
  },
  {
    title: "【爆食】ラーメン二郎で全マシマシ完食",
    url: "https://www.youtube.com/watch?v=...",
    restaurants: [
      {
        name: "ラーメン二郎 三田本店",
        category: "ラーメン",
        address: "東京都港区三田",
        tabelog_url: "https://tabelog.com/tokyo/A1314/A131401/13006051/"
      }
    ]
  },
  {
    title: "【大食い】焼肉食べ放題で限界に挑戦",
    url: "https://www.youtube.com/watch?v=...",
    restaurants: [
      {
        name: "牛角",
        category: "焼肉",
        address: "東京都新宿区",
        // チェーン店なので複数店舗
      }
    ]
  }
]

// データ追加関数
async function addMoenoazuki() {
  console.log('🌟 もえのあずき追加開始...\n')
  
  try {
    // 1. 既存チェック
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', moenoazukiData.slug)
      .single()
    
    if (existing) {
      console.log('⚠️ もえのあずきは既に登録されています')
      console.log('   既存ID:', existing.id)
      return existing.id
    }
    
    // 2. 新規追加（UUIDを生成）
    const celebrityWithId = {
      ...moenoazukiData,
      id: randomUUID() // UUID生成
    }
    
    const { data: celebrity, error } = await supabase
      .from('celebrities')
      .insert([celebrityWithId])
      .select()
      .single()
    
    if (error) {
      console.error('❌ 追加エラー:', error)
      return null
    }
    
    console.log('✅ もえのあずきを追加しました！')
    console.log('   ID:', celebrity.id)
    console.log('   URL: /celebrities/' + moenoazukiData.slug)
    console.log('   YouTube登録者数: ' + moenoazukiData.subscriber_count.toLocaleString())
    
    return celebrity.id
    
  } catch (err) {
    console.error('❌ 予期しないエラー:', err)
    return null
  }
}

// YouTube APIから最新動画を取得（オプション）
async function fetchLatestVideos(channelId: string) {
  if (!YOUTUBE_API_KEY) {
    console.log('⚠️ YouTube APIキーが設定されていません')
    return []
  }
  
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?` +
      `key=${YOUTUBE_API_KEY}&` +
      `channelId=${channelId}&` +
      `part=snippet&` +
      `order=date&` +
      `type=video&` +
      `maxResults=10`
    
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('\n📺 最新動画を取得:')
    data.items?.forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item.snippet.title}`)
      console.log(`     公開日: ${item.snippet.publishedAt}`)
      
      // 動画説明から店舗情報を抽出する処理
      const description = item.snippet.description
      // ここで店舗名、住所などを正規表現で抽出
    })
    
    return data.items || []
  } catch (error) {
    console.error('YouTube API エラー:', error)
    return []
  }
}

// エピソードとして動画を追加
async function addVideoAsEpisode(celebrityId: string, video: any) {
  const episodeData = {
    title: video.title,
    date: new Date().toISOString().split('T')[0],
    url: video.url,
    thumbnail_url: `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`,
    celebrities: { 
      id: celebrityId,
      name: moenoazukiData.name,
      slug: moenoazukiData.slug
    },
    status: 'published',
    view_count: 0,
    duration: '00:10:00' // 仮の値
  }
  
  const { data, error } = await supabase
    .from('episodes')
    .insert([episodeData])
    .select()
    .single()
  
  if (!error) {
    console.log(`  ✅ エピソード追加: ${video.title}`)
    return data.id
  } else {
    console.error(`  ❌ エピソード追加失敗:`, error)
    return null
  }
}

// メイン実行
async function main() {
  console.log('🍜 === もえのあずき & 関連グルメ情報追加 ===\n')
  
  // Step 1: もえのあずきをセレブリティとして追加
  const celebrityId = await addMoenoazuki()
  
  if (!celebrityId) {
    console.log('セレブリティ追加に失敗したため処理を中止します')
    return
  }
  
  // Step 2: YouTube最新動画を取得（オプション）
  if (moenoazukiData.social_links.youtube) {
    console.log('\n📺 YouTube動画情報を取得中...')
    const videos = await fetchLatestVideos(moenoazukiData.social_links.youtube)
    console.log(`  取得動画数: ${videos.length}`)
  }
  
  // Step 3: サンプル動画からエピソードを作成
  console.log('\n🎬 サンプルエピソードを追加中...')
  for (const video of popularVideos.slice(0, 3)) {
    // ここでエピソードと店舗情報を関連付ける処理
    console.log(`  処理中: ${video.title}`)
    
    // 店舗情報があれば locations テーブルにも追加
    for (const restaurant of video.restaurants) {
      console.log(`    → ${restaurant.name} (${restaurant.category})`)
      // ロケーション追加処理
    }
  }
  
  console.log('\n✨ 処理完了！')
  console.log('次のステップ:')
  console.log('1. YouTube APIを使って最新動画から店舗情報を抽出')
  console.log('2. 食べログURLの自動取得')
  console.log('3. エピソード×ロケーションの関連付け')
}

// ES Module対応の実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { moenoazukiData, addMoenoazuki }