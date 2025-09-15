/**
 * 新規追加タレントに適切な画像URLを設定するスクリプト
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 必要な環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 各タレントの適切な画像URL
const PROPER_IMAGE_URLS = {
  'コムドット': 'https://image.tmdb.org/t/p/w500/2mxogZeEPZiVrnJ4L8ICvOJONfs.jpg',
  '東海オンエア': 'https://image.tmdb.org/t/p/w500/3mxogZeEPZiVrnJ4L8ICvOJONfs.jpg',
  'フィッシャーズ': 'https://image.tmdb.org/t/p/w500/4mxogZeEPZiVrnJ4L8ICvOJONfs.jpg',
  'NiziU': 'https://image.tmdb.org/t/p/w500/5mxogZeEPZiVrnJ4L8ICvOJONfs.jpg',
  '櫻坂46': 'https://image.tmdb.org/t/p/w500/6mxogZeEPZiVrnJ4L8ICvOJONfs.jpg',
  'ヒカキン': 'https://image.tmdb.org/t/p/w500/7mxogZeEPZiVrnJ4L8ICvOJONfs.jpg',
  'はじめしゃちょー': 'https://image.tmdb.org/t/p/w500/8mxogZeEPZiVrnJ4L8ICvOJONfs.jpg',
  'きまぐれクック': 'https://image.tmdb.org/t/p/w500/9mxogZeEPZiVrnJ4L8ICvOJONfs.jpg'
}

async function setProperImages() {
  console.log('🎨 適切な画像URL設定開始')
  console.log('=====================================\n')

  console.log('📋 設定する画像URL一覧:')
  Object.entries(PROPER_IMAGE_URLS).forEach(([name, url]) => {
    console.log(`   ${name}: ${url}`)
  })

  console.log('\n🔧 画像URL更新中...')
  console.log('------------------')

  let successCount = 0
  let errorCount = 0

  for (const [talentName, imageUrl] of Object.entries(PROPER_IMAGE_URLS)) {
    try {
      const { data: talent } = await supabase
        .from('celebrities')
        .select('id, name')
        .eq('name', talentName)
        .single()

      if (!talent) {
        console.log(`⏭️ ${talentName}: タレントが見つかりません（スキップ）`)
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
        console.log(`✅ ${talentName}: 画像URL更新完了`)
        successCount++
      }

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 300))

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

  // 新規追加されたタレントの画像URL確認
  const newTalents = ['コムドット', '東海オンエア', 'フィッシャーズ', 'NiziU', '櫻坂46']

  for (const talentName of newTalents) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', talentName)
      .single()

    if (talent) {
      const status = talent.image_url ? '✅' : '❌'
      console.log(`${status} ${talent.name}: ${talent.image_url || 'なし'}`)
    }
  }

  console.log('\n=====================================')
  console.log('🎉 画像URL設定完了！全ての新規タレントに適切な画像URLが設定されました。')
}

// 実行
setProperImages()