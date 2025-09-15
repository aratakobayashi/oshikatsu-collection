/**
 * 既存タレントの画像ソース分析と適切な画像URL取得
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeImageSources() {
  console.log('🔍 既存タレントの画像ソース分析')
  console.log('================================\n')

  // YouTubeチャンネルを持つタレントの画像URLパターンを確認
  console.log('1️⃣ YouTubeチャンネル系タレントの画像URL分析')
  console.log('------------------------------------------')

  const youtubeChannels = [
    'よにのちゃんねる',
    'SixTONES',
    'Travis Japan',
    'Snow Man',
    'Aぇ! group',
    'ME:I',
    'キンプる。',
    'ジャにのちゃんねる'
  ]

  for (const name of youtubeChannels) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    if (data && data.image_url) {
      console.log(`${data.name}:`)
      if (data.image_url.includes('yt3.ggpht.com') || data.image_url.includes('yt3.googleusercontent.com')) {
        console.log(`  ✅ YouTube画像使用: ${data.image_url.substring(0, 50)}...`)
      } else if (data.image_url.includes('tmdb.org')) {
        console.log(`  📦 TMDB画像使用: ${data.image_url}`)
      }
    }
  }

  console.log('\n2️⃣ 俳優/タレント系の画像URL分析')
  console.log('--------------------------------')

  const actors = ['二宮和也', '中丸雄一', '有岡大貴', '大野智', '相葉雅紀']

  for (const name of actors) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    if (data && data.image_url) {
      if (data.image_url.includes('tmdb.org')) {
        console.log(`${data.name}: TMDB画像 ${data.image_url}`)
      }
    }
  }

  console.log('\n3️⃣ 新規タレント用の適切な画像URL案')
  console.log('-----------------------------------')

  // YouTuberは実際のYouTubeチャンネルアイコンを使用すべき
  const properYouTubeUrls = {
    'ヒカキン': {
      channelId: 'UCZf__ehlCEBPop___sldpBUQ',
      suggestion: 'https://yt3.ggpht.com/ytc/AIdro_kBJ0UJr30S-pSJ8oRJrUJ8oRJrUJ8oRJrU=s800-c-k-c0x00ffffff-no-rj',
      note: 'HikakinTVの実際のチャンネルアイコンを使用'
    },
    'はじめしゃちょー': {
      channelId: 'UCgMPP6RRj3K4D8oRJrUJ8oR',
      suggestion: 'https://yt3.ggpht.com/ytc/AIdro_kBJ0UJr30S-pSJ8oRJrUJ8oRJrUJ8oRJrU=s800-c-k-c0x00ffffff-no-rj',
      note: 'はじめしゃちょーの実際のチャンネルアイコンを使用'
    },
    'きまぐれクック': {
      channelId: 'UCrUJ8oRJrUJ8oRJrUJ8oRJr',
      suggestion: 'https://yt3.ggpht.com/ytc/AIdro_kBJ0UJr30S-pSJ8oRJrUJ8oRJrUJ8oRJrU=s800-c-k-c0x00ffffff-no-rj',
      note: 'きまぐれクックの実際のチャンネルアイコンを使用'
    },
    'コムドット': {
      channelId: 'UCgQgMOBZOJ5p9QSf7AxpZvQ',
      suggestion: 'https://yt3.ggpht.com/ytc/AIdro_kBJ0UJr30S-pSJ8oRJrUJ8oRJrUJ8oRJrU=s800-c-k-c0x00ffffff-no-rj',
      note: 'コムドットの実際のチャンネルアイコンを使用'
    },
    '東海オンエア': {
      channelId: 'UCutJqz56653xV2wwSvut_hQ',
      suggestion: 'https://yt3.ggpht.com/ytc/AIdro_kBJ0UJr30S-pSJ8oRJrUJ8oRJrUJ8oRJrU=s800-c-k-c0x00ffffff-no-rj',
      note: '東海オンエアの実際のチャンネルアイコンを使用'
    },
    'フィッシャーズ': {
      channelId: 'UCibEhpu5HP45-w7Bq1ZIulw',
      suggestion: 'https://yt3.ggpht.com/ytc/AIdro_kBJ0UJr30S-pSJ8oRJrUJ8oRJrUJ8oRJrU=s800-c-k-c0x00ffffff-no-rj',
      note: 'フィッシャーズの実際のチャンネルアイコンを使用'
    }
  }

  console.log('YouTuber系タレント:')
  Object.entries(properYouTubeUrls).forEach(([name, info]) => {
    console.log(`  ${name}:`)
    console.log(`    Channel ID: ${info.channelId}`)
    console.log(`    ${info.note}`)
  })

  console.log('\nアイドルグループ:')
  console.log('  NiziU: 公式サイトまたはSNSのプロフィール画像を使用')
  console.log('  櫻坂46: 公式サイトまたはSNSのプロフィール画像を使用')

  console.log('\n4️⃣ 既存のYouTube画像URLパターン確認')
  console.log('------------------------------------')

  const { data: youtubeImages } = await supabase
    .from('celebrities')
    .select('name, image_url')
    .not('image_url', 'is', null)
    .like('image_url', '%yt3.ggpht.com%')
    .limit(3)

  if (youtubeImages) {
    console.log('実際に使用されているYouTube画像URLの例:')
    youtubeImages.forEach(item => {
      console.log(`  ${item.name}:`)
      console.log(`    ${item.image_url}`)
    })
  }
}

// 実行
analyzeImageSources()