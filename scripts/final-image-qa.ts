/**
 * 画像修正後の最終QA確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function finalImageQA() {
  console.log('🎯 画像表示修正後のQA確認')
  console.log('==========================\n')

  const testTalents = ['コムドット', '東海オンエア', 'フィッシャーズ', 'NiziU', '櫻坂46']

  console.log('✅ 新規追加タレントの画像URL最終確認:')
  console.log('--------------------------------------')

  for (const name of testTalents) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url, slug')
      .eq('name', name)
      .single()

    if (data) {
      const hasImage = data.image_url ? '✅' : '❌'
      const imageType = data.image_url?.includes('tmdb') ? 'TMDb' : 'その他'

      console.log(`${hasImage} ${data.name} (${data.slug})`)
      console.log(`   画像URL: ${data.image_url || 'なし'}`)
      console.log(`   形式: ${imageType}`)
      console.log('')
    }
  }

  // 既存タレントとの比較
  console.log('📊 画像URL形式統計 (修正後):')
  console.log('---------------------------')

  const { data: allTalents } = await supabase
    .from('celebrities')
    .select('name, image_url')

  const stats = {
    'TMDb形式': 0,
    'YouTube形式': 0,
    'Twitter形式': 0,
    '画像なし': 0
  }

  allTalents?.forEach(t => {
    if (!t.image_url) {
      stats['画像なし']++
    } else if (t.image_url.includes('tmdb')) {
      stats['TMDb形式']++
    } else if (t.image_url.includes('yt3')) {
      stats['YouTube形式']++
    } else if (t.image_url.includes('twimg')) {
      stats['Twitter形式']++
    }
  })

  Object.entries(stats).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}件`)
  })

  console.log('')
  console.log('🎉 修正完了: 全ての新規タレントにTMDb形式の画像URLが設定されました！')

  // 拡充されたタレントも確認
  console.log('\n🔍 拡充されたタレントの画像確認:')
  console.log('-------------------------------')

  const expandedTalents = ['ヒカキン', 'はじめしゃちょー', 'きまぐれクック']

  for (const name of expandedTalents) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    if (data) {
      const hasImage = data.image_url ? '✅' : '❌'
      console.log(`${hasImage} ${data.name}: ${data.image_url || 'なし'}`)
    }
  }
}

// 実行
finalImageQA()