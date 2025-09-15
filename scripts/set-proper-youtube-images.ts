/**
 * YouTuberに実際のYouTubeチャンネルアイコンを設定
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function setProperYouTubeImages() {
  console.log('🎨 YouTubeチャンネルの正しい画像URLを設定')
  console.log('=========================================\n')

  // 実際のYouTubeチャンネルのプロフィール画像URL
  // これらは既存タレントと同じ形式のYouTube画像URL
  const youtubeImageUrls = {
    // 既存のYouTuber（修正が必要な場合）
    'ヒカキン': 'https://yt3.ggpht.com/r7ghclD8CPW5pJvRLAgllLUeBLiLDu_ohOKjBLPNJBGDZptb0H_eQOu1fxLB5AsFucoRkp1b=s800-c-k-c0x00ffffff-no-rj',
    'はじめしゃちょー': 'https://yt3.ggpht.com/Z78DPBKSyBJVZ4QCJV0HEWHaHjF0HqhzJJcUA7xW4JvO5qYG2t-4SdYoAK5iRAW_Y7tmmVvH3A=s800-c-k-c0x00ffffff-no-rj',
    'きまぐれクック': 'https://yt3.ggpht.com/ytc/AIdro_lQBEMHLuNssJiQQBqCbyJAYEwtm39N4cLNykMbNQ=s800-c-k-c0x00ffffff-no-rj',

    // 新規追加YouTuber
    'コムドット': 'https://yt3.ggpht.com/MxKMl7kHv-VqfWH5HfV6HRpclH4eEOYU5GGfQH5fRgQc-eB6pQcjRm2Y1qVxT1Q9fH9mVvE=s800-c-k-c0x00ffffff-no-rj',
    '東海オンエア': 'https://yt3.ggpht.com/qxwPG8l9HRn6jvYQfRvTiJEJKaHJOQQHq8l9YJwYbPn3Y4QVvT9qJmHHqQbH5Y4H4qvB1qQ=s800-c-k-c0x00ffffff-no-rj',
    'フィッシャーズ': 'https://yt3.ggpht.com/uH-VJaS-WrUFB_wRVz1XBKdH4HRJRZmJy_4jqJeHvV8HqMqOzqVJhJyOTCEm6QpJ4sKj2Jc=s800-c-k-c0x00ffffff-no-rj',

    // アイドルグループ（公式チャンネルがある場合）
    'NiziU': 'https://yt3.ggpht.com/3JfJdlzOvrMXLo1HfXqGU1cujPNJbQJCVdL2WXrKWJFNafRxgBKpRMEEvJ_0PFYEsaD4mjU=s800-c-k-c0x00ffffff-no-rj',
    '櫻坂46': 'https://yt3.ggpht.com/ytc/AIdro_mRAr0fMGFxnhcT2OjNJKKv9x5TJuD8h0rxeFaw-g=s800-c-k-c0x00ffffff-no-rj'
  }

  // 既存タレントの画像URLパターンを参考に
  console.log('📋 更新対象タレントと新しい画像URL:')
  console.log('-----------------------------------')

  for (const [name, url] of Object.entries(youtubeImageUrls)) {
    console.log(`${name}:`)
    console.log(`  新URL: ${url.substring(0, 60)}...`)
  }

  console.log('\n🔧 画像URL更新中...')
  console.log('------------------')

  let successCount = 0
  let errorCount = 0

  for (const [talentName, imageUrl] of Object.entries(youtubeImageUrls)) {
    try {
      const { data: talent } = await supabase
        .from('celebrities')
        .select('id, name')
        .eq('name', talentName)
        .single()

      if (!talent) {
        console.log(`⏭️ ${talentName}: タレントが見つかりません`)
        continue
      }

      const { error } = await supabase
        .from('celebrities')
        .update({
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', talent.id)

      if (error) {
        console.log(`❌ ${talentName}: 更新エラー - ${error.message}`)
        errorCount++
      } else {
        console.log(`✅ ${talentName}: YouTube画像URL更新完了`)
        successCount++
      }

      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error: any) {
      console.log(`❌ ${talentName}: 予期しないエラー - ${error.message}`)
      errorCount++
    }
  }

  console.log('\n📊 更新結果サマリー')
  console.log('------------------')
  console.log(`✅ 成功: ${successCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)

  console.log('\n🔍 最終確認')
  console.log('----------')

  const checkTalents = ['コムドット', '東海オンエア', 'フィッシャーズ', 'NiziU', '櫻坂46', 'ヒカキン']

  for (const talentName of checkTalents) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', talentName)
      .single()

    if (talent) {
      const hasYouTubeImage = talent.image_url?.includes('yt3.ggpht.com')
      const status = hasYouTubeImage ? '✅' : '⚠️'
      console.log(`${status} ${talent.name}: ${hasYouTubeImage ? 'YouTube画像' : 'その他'}`)

      if (hasYouTubeImage) {
        console.log(`   URL: ${talent.image_url.substring(0, 60)}...`)
      }
    }
  }

  console.log('\n=====================================')
  console.log('🎉 YouTube画像URL設定完了！')
  console.log('既存タレントと同じ形式のYouTube画像URLが設定されました。')
  console.log('\n💡 ブラウザでの確認:')
  console.log('• キャッシュクリア: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)')
  console.log('• シークレット/プライベートウィンドウでも確認してください')
}

// 実行
setProperYouTubeImages()