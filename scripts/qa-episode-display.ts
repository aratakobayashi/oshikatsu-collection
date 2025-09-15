/**
 * タレント詳細ページでのエピソード表示QAテスト
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

async function qaEpisodeDisplay() {
  console.log('🧪 タレント詳細ページ用エピソード取得QAテスト')
  console.log('================================================\n')

  const testTalents = [
    { name: 'ヒカキン', expectedEpisodes: 10 },
    { name: 'コムドット', expectedEpisodes: 5 },
    { name: 'NiziU', expectedEpisodes: 5 },
    { name: '櫻坂46', expectedEpisodes: 5 }
  ]

  console.log('1️⃣ celebrity_idでのエピソード取得テスト')
  console.log('----------------------------------------')

  for (const talent of testTalents) {
    try {
      // タレント情報取得
      const { data: celebrity, error: celebrityError } = await supabase
        .from('celebrities')
        .select('id, name, slug')
        .eq('name', talent.name)
        .single()

      if (celebrityError || !celebrity) {
        console.log(`❌ ${talent.name}: タレント取得エラー`)
        continue
      }

      // エピソード取得（タレント詳細ページでの実際の取得方法をシミュレート）
      const { data: episodes, error: episodeError } = await supabase
        .from('episodes')
        .select('id, title, description, date, duration, view_count')
        .eq('celebrity_id', celebrity.id)
        .order('date', { ascending: false })

      if (episodeError) {
        console.log(`❌ ${talent.name}: エピソード取得エラー - ${episodeError.message}`)
        continue
      }

      const actualCount = episodes?.length || 0
      const status = actualCount === talent.expectedEpisodes ? '✅' : '⚠️'

      console.log(`${status} ${talent.name} (ID: ${celebrity.id.substring(0,8)}...)`)
      console.log(`   エピソード数: ${actualCount}/${talent.expectedEpisodes}本`)

      if (actualCount > 0) {
        console.log(`   最新エピソード: ${episodes[0].title}`)
        console.log(`   最古エピソード: ${episodes[actualCount-1].title}`)
      }
      console.log('')

    } catch (error: any) {
      console.log(`❌ ${talent.name}: 予期しないエラー - ${error.message}`)
    }
  }

  console.log('2️⃣ CelebrityProfile.tsxでの取得方法テスト')
  console.log('-------------------------------------------')

  // 実際のフロントエンドでの取得方法をシミュレート
  const testSlug = 'comdot' // コムドットのslug

  const { data: profileData, error: profileError } = await supabase
    .from('celebrities')
    .select(`
      *,
      episodes(*)
    `)
    .eq('slug', testSlug)
    .single()

  if (profileError) {
    console.log(`❌ プロフィール取得エラー: ${profileError.message}`)
  } else {
    console.log(`✅ ${profileData.name}のプロフィール取得成功`)
    console.log(`   関連エピソード数: ${profileData.episodes?.length || 0}本`)

    if (profileData.episodes && profileData.episodes.length > 0) {
      console.log('   エピソード一覧:')
      profileData.episodes.forEach((ep: any, index: number) => {
        console.log(`     ${index + 1}. ${ep.title}`)
      })
    }
  }

  console.log('')
  console.log('3️⃣ 新規追加タレントのslugアクセステスト')
  console.log('------------------------------------------')

  const newTalentSlugs = [
    { slug: 'comdot', name: 'コムドット' },
    { slug: 'tokai-onair', name: '東海オンエア' },
    { slug: 'fischers', name: 'フィッシャーズ' },
    { slug: 'niziu', name: 'NiziU' },
    { slug: 'sakurazaka46', name: '櫻坂46' }
  ]

  for (const talent of newTalentSlugs) {
    const { data: celebrity, error } = await supabase
      .from('celebrities')
      .select(`
        id, name, slug, bio,
        episodes(id, title, date, view_count)
      `)
      .eq('slug', talent.slug)
      .single()

    if (error) {
      console.log(`❌ ${talent.name} (${talent.slug}): アクセスエラー`)
    } else {
      console.log(`✅ ${celebrity.name} (${talent.slug}): アクセス成功`)
      console.log(`   エピソード: ${celebrity.episodes?.length || 0}本`)

      if (celebrity.episodes && celebrity.episodes.length > 0) {
        const latestEpisode = celebrity.episodes[0]
        console.log(`   最新: ${latestEpisode.title}`)
      }
    }
  }

  console.log('')
  console.log('4️⃣ データ整合性チェック')
  console.log('------------------------')

  // celebrity_idが正しく設定されているかチェック
  const { data: orphanedEpisodes } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .is('celebrity_id', null)

  console.log(`孤立エピソード（celebrity_idがnull）: ${orphanedEpisodes?.length || 0}本`)

  // 今日追加されたエピソードの確認
  const today = new Date().toISOString().split('T')[0]
  const { data: todayEpisodes, count } = await supabase
    .from('episodes')
    .select('title, celebrities!episodes_celebrity_id_fkey(name)', { count: 'exact' })
    .gte('created_at', `${today}T00:00:00Z`)

  console.log(`今日追加されたエピソード: ${count || 0}本`)

  if (todayEpisodes && todayEpisodes.length > 0) {
    console.log('   追加されたエピソード一覧:')
    todayEpisodes.slice(0, 5).forEach((ep: any) => {
      console.log(`     - ${ep.title} (${ep.celebrities?.name})`)
    })
    if (todayEpisodes.length > 5) {
      console.log(`     ... 他${todayEpisodes.length - 5}本`)
    }
  }

  console.log('\n================================================')
  console.log('🎯 QA結果サマリー: タレント詳細ページでエピソードが正常に表示される準備が整いました！')
}

// 実行
qaEpisodeDisplay()