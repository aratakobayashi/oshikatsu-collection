/**
 * TMDBから取得した松重豊の正確な画像で更新
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function updateWithTMDBImage() {
  console.log('📸 TMDBから取得した松重豊の画像で更新します...\n')

  // TMDBから取得した実際の画像URL
  const tmdbImageUrl = 'https://media.themoviedb.org/t/p/w138_and_h175_face/4Oqr7tzPAECgSBah9JaoyRScDhV.jpg'
  
  // より高解像度版も試す
  const highResImageUrl = 'https://media.themoviedb.org/t/p/w500/4Oqr7tzPAECgSBah9JaoyRScDhV.jpg'

  console.log('🔍 画像URL候補:')
  console.log(`1. 高解像度: ${highResImageUrl}`)
  console.log(`2. 標準: ${tmdbImageUrl}`)

  // 高解像度版をテスト
  try {
    const response = await fetch(highResImageUrl, { method: 'HEAD' })
    const imageUrl = response.ok ? highResImageUrl : tmdbImageUrl
    
    console.log(`\n✅ 使用する画像: ${imageUrl}`)

    // データベース更新
    const { error } = await supabase
      .from('celebrities')
      .update({ 
        image_url: imageUrl,
        bio: '俳優。1963年1月19日生まれ、福岡県出身。テレビドラマ「孤独のグルメ」の主演・井之頭五郎役で広く知られる。2012年より11シーズンにわたって放送される人気シリーズとなっている。'
      })
      .eq('slug', 'matsushige-yutaka')

    if (error) {
      console.error('❌ 更新エラー:', error)
    } else {
      console.log('✅ 松重豊の情報を更新しました！')
      
      // 確認
      const { data } = await supabase
        .from('celebrities')
        .select('name, image_url, bio')
        .eq('slug', 'matsushige-yutaka')
        .single()
        
      if (data) {
        console.log(`\n👤 ${data.name}`)
        console.log(`📸 画像: ${data.image_url}`)
        console.log(`📝 プロフィール: ${data.bio}`)
      }
    }

  } catch (error) {
    console.error('❌ 画像テストエラー:', error)
  }

  // 追加情報の表示
  console.log('\n📺 TMDBから取得した孤独のグルメ情報:')
  console.log('- シーズン数: 11シーズン')
  console.log('- 最新シーズン: 「それぞれの孤独のグルメ」(12話)')
  console.log('- 初回放送: 2012年')
  console.log('- 放送局: テレビ東京')
  
  console.log('\n💡 今後の拡張案:')
  console.log('1. TMDB APIキーを取得して全エピソード自動追加')
  console.log('2. 各エピソードの高品質サムネイル画像取得')
  console.log('3. 正確な放送日とあらすじの自動設定')
  console.log('4. 他のキャスト情報も追加可能')
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  updateWithTMDBImage().catch(console.error)
}

export { updateWithTMDBImage }