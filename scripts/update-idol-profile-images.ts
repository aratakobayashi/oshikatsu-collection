/**
 * 平手友梨奈と齋藤飛鳥のプロフィール画像をTMDBから取得して更新
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// TMDB APIで取得済みのプロフィール画像URL
const PROFILE_IMAGES = {
  '平手友梨奈': 'https://image.tmdb.org/t/p/w500/wR3iI8ocqPWEZGY3Cea5E7m57KK.jpg',
  '齋藤飛鳥': 'https://image.tmdb.org/t/p/w500/2sOZRKPNqKAazTsFzzqJtna7Fnz.jpg'
}

async function updateIdolProfileImages() {
  console.log('📸 アイドルのプロフィール画像更新')
  console.log('====================================\n')

  // 1. 現在の画像状態を確認
  console.log('📋 現在の画像状態:')
  for (const [name, imageUrl] of Object.entries(PROFILE_IMAGES)) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name, image_url')
      .eq('name', name)
      .single()

    if (celebrity) {
      console.log(`\n👤 ${celebrity.name}:`)
      console.log(`  現在: ${celebrity.image_url || 'なし'}`)

      const needsUpdate = !celebrity.image_url ||
                         celebrity.image_url.includes('placeholder') ||
                         celebrity.image_url === ''

      if (needsUpdate) {
        console.log(`  ❌ 更新が必要`)
      } else {
        console.log(`  ✅ 既に設定済み`)
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🔄 プロフィール画像更新開始')
  console.log('='.repeat(50) + '\n')

  // 2. プロフィール画像を更新
  let updatedCount = 0

  for (const [name, imageUrl] of Object.entries(PROFILE_IMAGES)) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name, image_url')
      .eq('name', name)
      .single()

    if (!celebrity) {
      console.log(`❌ ${name} が見つかりません`)
      continue
    }

    const needsUpdate = !celebrity.image_url ||
                       celebrity.image_url.includes('placeholder') ||
                       celebrity.image_url === ''

    if (needsUpdate) {
      console.log(`🔄 ${name} の画像を更新中...`)
      console.log(`   新画像: ${imageUrl}`)

      const { error } = await supabase
        .from('celebrities')
        .update({
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', celebrity.id)

      if (error) {
        console.log(`   ❌ 更新エラー: ${error.message}`)
      } else {
        console.log(`   ✅ 更新完了`)
        updatedCount++
      }
    } else {
      console.log(`⏭️ ${name} は既に画像設定済みのためスキップ`)
    }

    console.log('')
  }

  console.log('='.repeat(50))
  console.log('🎉 プロフィール画像更新完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果: ${updatedCount}人のプロフィール画像を更新`)

  // 3. 更新後の確認
  console.log('\n📸 更新後の確認:')
  for (const name of Object.keys(PROFILE_IMAGES)) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name, image_url')
      .eq('name', name)
      .single()

    if (celebrity && celebrity.image_url) {
      const isTMDB = celebrity.image_url.includes('tmdb.org')
      console.log(`${isTMDB ? '✅' : '❌'} ${celebrity.name}`)
      if (isTMDB) {
        console.log(`   ${celebrity.image_url}`)
      }
    }
  }

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで画像を確認')
  console.log('• 各タレントのプロフィールページで画像を確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
}

// 実行
updateIdolProfileImages().catch(console.error)