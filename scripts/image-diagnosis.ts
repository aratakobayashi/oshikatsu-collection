/**
 * 新規追加タレントの画像表示問題診断スクリプト
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

async function diagnoseImageIssue() {
  console.log('🔍 画像表示問題の診断開始')
  console.log('=====================================\n')

  // 既存データと新規データの比較
  console.log('1️⃣ 既存タレントの画像URL確認')
  console.log('--------------------------------')

  const existingTalents = ['よにの', 'ヒカキン', '中丸雄一']

  for (const name of existingTalents) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('name, image_url, created_at')
      .eq('name', name)
      .single()

    if (talent) {
      console.log(`✅ ${talent.name}:`)
      console.log(`   画像URL: ${talent.image_url}`)
      console.log(`   作成日: ${talent.created_at}`)

      // URL有効性チェック
      if (talent.image_url) {
        console.log(`   URL種類: ${getUrlType(talent.image_url)}`)
      }
      console.log('')
    }
  }

  console.log('2️⃣ 新規追加タレントの画像URL確認')
  console.log('----------------------------------')

  const newTalents = ['コムドット', '東海オンエア', 'フィッシャーズ', 'NiziU', '櫻坂46']

  for (const name of newTalents) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('name, image_url, created_at')
      .eq('name', name)
      .single()

    if (talent) {
      console.log(`📷 ${talent.name}:`)
      console.log(`   画像URL: ${talent.image_url}`)
      console.log(`   作成日: ${talent.created_at}`)

      // URL有効性チェック
      if (talent.image_url) {
        console.log(`   URL種類: ${getUrlType(talent.image_url)}`)
        console.log(`   アクセス可能性: ${await checkUrlAccessibility(talent.image_url)}`)
      } else {
        console.log('   ❌ 画像URLが設定されていません')
      }
      console.log('')
    }
  }

  console.log('3️⃣ 画像URL形式の統計分析')
  console.log('--------------------------')

  const { data: allTalents } = await supabase
    .from('celebrities')
    .select('name, image_url')
    .not('image_url', 'is', null)

  if (allTalents) {
    const urlPatterns = {
      'TMDb (image.tmdb.org)': 0,
      'YouTube (yt3.ggpht.com)': 0,
      'Twitter/X (pbs.twimg.com)': 0,
      'その他': 0,
      'null/undefined': 0
    }

    allTalents.forEach(talent => {
      if (!talent.image_url) {
        urlPatterns['null/undefined']++
      } else if (talent.image_url.includes('image.tmdb.org')) {
        urlPatterns['TMDb (image.tmdb.org)']++
      } else if (talent.image_url.includes('yt3.ggpht.com')) {
        urlPatterns['YouTube (yt3.ggpht.com)']++
      } else if (talent.image_url.includes('pbs.twimg.com')) {
        urlPatterns['Twitter/X (pbs.twimg.com)']++
      } else {
        urlPatterns['その他']++
      }
    })

    console.log('画像URL形式の分布:')
    Object.entries(urlPatterns).forEach(([pattern, count]) => {
      console.log(`   ${pattern}: ${count}件`)
    })
  }

  console.log('')
  console.log('4️⃣ 正常に表示される画像URLの例')
  console.log('--------------------------------')

  const { data: workingTalents } = await supabase
    .from('celebrities')
    .select('name, image_url')
    .not('image_url', 'is', null)
    .limit(3)

  if (workingTalents) {
    workingTalents.forEach(talent => {
      console.log(`✅ ${talent.name}: ${talent.image_url}`)
    })
  }
}

function getUrlType(url: string): string {
  if (!url) return 'なし'
  if (url.includes('image.tmdb.org')) return 'TMDb'
  if (url.includes('yt3.ggpht.com')) return 'YouTube'
  if (url.includes('pbs.twimg.com')) return 'Twitter/X'
  return 'その他'
}

async function checkUrlAccessibility(url: string): Promise<string> {
  try {
    // Node.js環境では実際のHTTPリクエストは避け、URL形式をチェック
    const urlObj = new URL(url)
    return `形式OK (${urlObj.hostname})`
  } catch {
    return 'URL形式エラー'
  }
}

// 実行
diagnoseImageIssue()