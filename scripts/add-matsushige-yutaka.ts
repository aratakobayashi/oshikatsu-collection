/**
 * 松重豊（孤独のグルメ）のデータ追加スクリプト
 * data-creation-requirements.mdに従って実装
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

// 環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// セレブリティ情報（実際のDBスキーマに合わせて調整）
const MATSUSHIGE_YUTAKA = {
  id: randomUUID(),
  name: '松重豊',
  slug: 'matsushige-yutaka',
  type: 'individual' as const,
  image_url: 'https://www.zazous.co.jp/wp-content/uploads/2021/07/matsushige_01.jpg',
  bio: '俳優。1963年1月19日生まれ、福岡県出身。テレビドラマ「孤独のグルメ」の主演・井之頭五郎役で広く知られる。',
  status: 'active' as const
}

async function addMatsushigeYutaka() {
  console.log('🎬 松重豊のデータを追加します...')

  try {
    // 1. 既存チェック
    const { data: existingCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', MATSUSHIGE_YUTAKA.slug)
      .single()

    if (existingCelebrity) {
      console.log('✅ 松重豊は既に登録されています:', existingCelebrity.id)
      return existingCelebrity.id
    }

    // 2. 新規追加
    const { data: newCelebrity, error } = await supabase
      .from('celebrities')
      .insert([MATSUSHIGE_YUTAKA])
      .select('id')
      .single()

    if (error) {
      throw error
    }

    console.log('✅ 松重豊を追加しました:', newCelebrity.id)
    return newCelebrity.id

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  addMatsushigeYutaka()
    .then(celebrityId => {
      console.log('\n🎯 次のステップ:')
      console.log('1. 孤独のグルメのエピソードを追加')
      console.log('2. 各エピソードの飲食店をロケーションとして追加')
      console.log('3. 食べログURLを収集してアフィリエイトリンクを設定')
      console.log('\nセレブリティID:', celebrityId)
    })
    .catch(console.error)
}

export { addMatsushigeYutaka }