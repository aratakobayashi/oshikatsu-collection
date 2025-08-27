/**
 * 松重豊の画像を手動で更新するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 高品質な松重豊の画像候補
const IMAGE_CANDIDATES = [
  // TMDBの画像（存在すれば高品質）
  'https://image.tmdb.org/t/p/w500/kGtGjRp9LdRCNYfDKPOELqRk3JB.jpg',
  
  // テレ東公式サイトから
  'https://www.tv-tokyo.co.jp/kodokuno_gourmet/cast/images/matsushige.jpg',
  
  // その他の候補
  'https://talent.thetv.jp/img/person/000/035/000035935.jpg',
  
  // Wikipediaから
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Yutaka_Matsushige.jpg/330px-Yutaka_Matsushige.jpg',
  
  // 現在の画像（フォールバック）
  'https://www.zazous.co.jp/wp-content/uploads/2021/07/matsushige_01.jpg'
]

async function testImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok && response.headers.get('content-type')?.startsWith('image/')
  } catch {
    return false
  }
}

async function updateMatsushigeImage() {
  console.log('📸 松重豊の画像を更新します...\n')

  // 各候補URLをテスト
  let bestImageUrl = ''
  
  for (const url of IMAGE_CANDIDATES) {
    console.log(`🔍 テスト中: ${url}`)
    const isValid = await testImageUrl(url)
    
    if (isValid) {
      console.log('✅ 有効な画像です')
      bestImageUrl = url
      break
    } else {
      console.log('❌ 無効または存在しません')
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  if (!bestImageUrl) {
    console.log('⚠️ 有効な画像が見つかりませんでした。現在の画像を維持します。')
    return
  }

  // データベース更新
  console.log(`\n🖼️ 最適な画像: ${bestImageUrl}`)
  
  const { error } = await supabase
    .from('celebrities')
    .update({ image_url: bestImageUrl })
    .eq('slug', 'matsushige-yutaka')

  if (error) {
    console.error('❌ 更新エラー:', error)
  } else {
    console.log('✅ 松重豊の画像を更新しました！')
    
    // 確認
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('slug', 'matsushige-yutaka')
      .single()
      
    if (data) {
      console.log(`\n👤 ${data.name}`)
      console.log(`📸 画像URL: ${data.image_url}`)
    }
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  updateMatsushigeImage().catch(console.error)
}

export { updateMatsushigeImage }