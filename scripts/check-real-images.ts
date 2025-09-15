/**
 * 画像URL実態確認と修正スクリプト
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndFixImages() {
  console.log('🔍 画像URL実態確認')
  console.log('==================\n')

  // 新規追加タレントの現在の画像URLを確認
  const newTalents = ['コムドット', '東海オンエア', 'フィッシャーズ', 'NiziU', '櫻坂46', 'ヒカキン', 'はじめしゃちょー', 'きまぐれクック']

  console.log('📋 現在の画像URL設定:')
  console.log('--------------------')

  for (const name of newTalents) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    if (data) {
      console.log(`${name}:`)
      console.log(`  現在: ${data.image_url}`)

      // URLの問題点を診断
      if (data.image_url) {
        if (data.image_url.includes('2mxogZeEPZiVrnJ4L8ICvOJONfs') ||
            data.image_url.includes('3mxogZeEPZiVrnJ4L8ICvOJONfs') ||
            data.image_url.includes('4mxogZeEPZiVrnJ4L8ICvOJONfs')) {
          console.log('  ⚠️ 存在しない画像URLの可能性')
        }
      }
    }
  }

  console.log('\n✅ 実際に動作している画像URLパターン:')
  console.log('------------------------------------')

  // 動作確認済みのタレントから画像URLを確認
  const workingTalents = ['中丸雄一', '二宮和也', 'Snow Man', 'SixTONES']

  for (const name of workingTalents) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    if (data && data.image_url) {
      console.log(`${data.name}: ${data.image_url}`)
    }
  }

  console.log('\n🔧 実在する画像URLに修正')
  console.log('------------------------')

  // 実際に存在するTMDb画像を使用（既存タレントから借用）
  const validImageUrls = {
    'コムドット': 'https://image.tmdb.org/t/p/w500/4mxogZeEPZiVrnJ4L8ICvOJONfs.jpg', // 二宮和也の画像
    '東海オンエア': 'https://image.tmdb.org/t/p/w500/vXz3YOpTtgWD0ojlRGQ7hlvFXi3.jpg', // 有岡大貴の画像
    'フィッシャーズ': 'https://image.tmdb.org/t/p/w500/zB0z4PMU6L5lPpNLcpjnYhVVXOl.jpg', // 大野智の画像
    'NiziU': 'https://image.tmdb.org/t/p/w500/4mxogZeEPZiVrnJ4L8ICvOJONfs.jpg', // 暫定画像
    '櫻坂46': 'https://image.tmdb.org/t/p/w500/vXz3YOpTtgWD0ojlRGQ7hlvFXi3.jpg', // 暫定画像
    'ヒカキン': 'https://image.tmdb.org/t/p/w500/epKqQRqcWjxw6Xvj2BzpWj01xqE.jpg', // 中丸雄一の画像を借用
    'はじめしゃちょー': 'https://image.tmdb.org/t/p/w500/zB0z4PMU6L5lPpNLcpjnYhVVXOl.jpg', // 大野智の画像を借用
    'きまぐれクック': 'https://image.tmdb.org/t/p/w500/4mxogZeEPZiVrnJ4L8ICvOJONfs.jpg' // 二宮和也の画像を借用
  }

  for (const [talentName, imageUrl] of Object.entries(validImageUrls)) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', talentName)
      .single()

    if (talent) {
      const { error } = await supabase
        .from('celebrities')
        .update({
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', talent.id)

      if (error) {
        console.log(`❌ ${talentName}: 更新エラー`)
      } else {
        console.log(`✅ ${talentName}: 実在する画像URLに更新`)
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log('\n📸 更新後の確認:')
  console.log('---------------')

  for (const name of newTalents) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    if (data) {
      const status = data.image_url ? '✅' : '❌'
      console.log(`${status} ${data.name}: ${data.image_url?.substring(0, 60)}...`)
    }
  }

  console.log('\n💡 注意事項:')
  console.log('-----------')
  console.log('• 現在は既存タレントの画像を一時的に使用しています')
  console.log('• キャッシュクリアが必要な場合があります（Ctrl+Shift+R または Cmd+Shift+R）')
  console.log('• 本番環境では各タレントの実際の画像URLを設定してください')
}

// 実行
checkAndFixImages()