/**
 * 画像表示の実際のQAテスト
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function imageDisplayQA() {
  console.log('🧪 画像表示QAテスト')
  console.log('===================\n')

  // 新規追加タレントの現在の画像URL状態を確認
  const testTalents = ['コムドット', '東海オンエア', 'フィッシャーズ', 'NiziU', '櫻坂46', 'ヒカキン', 'はじめしゃちょー', 'きまぐれクック']

  console.log('1️⃣ 現在の画像URL設定確認')
  console.log('------------------------')

  for (const name of testTalents) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('name, image_url, slug')
      .eq('name', name)
      .single()

    if (talent) {
      console.log(`📷 ${talent.name} (/${talent.slug})`)
      console.log(`   画像URL: ${talent.image_url || 'なし'}`)

      if (talent.image_url) {
        // URL形式の診断
        if (talent.image_url.includes('yt3.ggpht.com')) {
          console.log('   ✅ YouTube形式の画像URL')
        } else if (talent.image_url.includes('tmdb.org')) {
          console.log('   📦 TMDB形式の画像URL')
        } else {
          console.log('   ⚠️ 不明な形式の画像URL')
        }

        // URLの有効性チェック（基本的な形式チェック）
        try {
          new URL(talent.image_url)
          console.log('   ✅ URL形式は正常')
        } catch {
          console.log('   ❌ URL形式が不正')
        }
      } else {
        console.log('   ❌ 画像URLが設定されていません')
      }
    } else {
      console.log(`❌ ${name}: タレントが見つかりません`)
    }
    console.log('')
  }

  // 既存の正常に動作しているタレントとの比較
  console.log('2️⃣ 既存タレントとの比較')
  console.log('----------------------')

  const workingTalents = ['よにのちゃんねる', 'SixTONES', 'Travis Japan']

  for (const name of workingTalents) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    if (talent && talent.image_url) {
      console.log(`✅ ${talent.name}（参考）:`)
      console.log(`   ${talent.image_url}`)
    }
  }

  // タレント詳細ページでの取得テスト
  console.log('\n3️⃣ タレント詳細ページでの画像取得テスト')
  console.log('--------------------------------------')

  const testSlugs = [
    { slug: 'comdot', name: 'コムドット' },
    { slug: 'tokai-onair', name: '東海オンエア' },
    { slug: 'fischers', name: 'フィッシャーズ' }
  ]

  for (const { slug, name } of testSlugs) {
    try {
      // 実際のフロントエンドと同じ方法でデータを取得
      const { data: profileData, error } = await supabase
        .from('celebrities')
        .select(`
          id, name, slug, bio, image_url,
          social_links, agency, fandom_name
        `)
        .eq('slug', slug)
        .single()

      if (error) {
        console.log(`❌ ${name}: データ取得エラー - ${error.message}`)
      } else {
        console.log(`✅ ${name}: プロフィールデータ取得成功`)
        console.log(`   画像URL: ${profileData.image_url ? '設定済み' : '未設定'}`)
        console.log(`   基本情報: ${profileData.bio ? '設定済み' : '未設定'}`)
        console.log(`   SNSリンク: ${profileData.social_links ? '設定済み' : '未設定'}`)

        if (profileData.image_url) {
          console.log(`   実際のURL: ${profileData.image_url.substring(0, 60)}...`)
        }
      }
    } catch (error: any) {
      console.log(`❌ ${name}: 予期しないエラー - ${error.message}`)
    }
    console.log('')
  }

  // 画像URL形式の統計
  console.log('4️⃣ 画像URL形式統計')
  console.log('------------------')

  const { data: allTalents } = await supabase
    .from('celebrities')
    .select('name, image_url')

  if (allTalents) {
    const stats = {
      'YouTube形式 (yt3.ggpht.com)': 0,
      'TMDB形式 (tmdb.org)': 0,
      'その他の形式': 0,
      '画像なし': 0
    }

    allTalents.forEach(talent => {
      if (!talent.image_url) {
        stats['画像なし']++
      } else if (talent.image_url.includes('yt3.ggpht.com')) {
        stats['YouTube形式 (yt3.ggpht.com)']++
      } else if (talent.image_url.includes('tmdb.org')) {
        stats['TMDB形式 (tmdb.org)']++
      } else {
        stats['その他の形式']++
      }
    })

    Object.entries(stats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}件`)
    })
  }

  // 問題の診断
  console.log('\n5️⃣ 問題診断')
  console.log('----------')

  const problemTalents = []

  for (const name of testTalents) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    if (talent) {
      if (!talent.image_url) {
        problemTalents.push(`${talent.name}: 画像URLなし`)
      } else if (!talent.image_url.includes('yt3.ggpht.com') && !talent.image_url.includes('tmdb.org')) {
        problemTalents.push(`${talent.name}: 不明な形式の画像URL`)
      }
    }
  }

  if (problemTalents.length === 0) {
    console.log('✅ 問題は見つかりませんでした')
  } else {
    console.log('⚠️ 発見された問題:')
    problemTalents.forEach(problem => {
      console.log(`   - ${problem}`)
    })
  }

  console.log('\n===================')
  console.log('🎯 QA結果まとめ')
  console.log('===================')

  const qaStatus = {
    '画像URL設定': testTalents.filter(async name => {
      const { data } = await supabase.from('celebrities').select('image_url').eq('name', name).single()
      return data?.image_url
    }).length > 0 ? '✅' : '❌',
    'URL形式': '既存タレントと同じ形式を使用',
    'データ整合性': problemTalents.length === 0 ? '✅' : '⚠️'
  }

  console.log('新規追加タレントの画像表示状況:')
  for (const name of ['コムドット', '東海オンエア', 'フィッシャーズ', 'NiziU', '櫻坂46']) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', name)
      .single()

    const status = data?.image_url ? '✅' : '❌'
    console.log(`${status} ${name}: ${data?.image_url ? 'URL設定済み' : 'URL未設定'}`)
  }

  console.log('\n💡 推奨アクション:')
  if (problemTalents.length > 0) {
    console.log('• 上記の問題を修正してください')
  }
  console.log('• ブラウザのキャッシュをクリアしてください')
  console.log('• 複数のブラウザで確認してください')
  console.log('• 画像が表示されない場合は、実際のYouTube URLの確認が必要です')
}

// 実行
imageDisplayQA()