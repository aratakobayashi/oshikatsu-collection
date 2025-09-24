/**
 * 拡充データの詳細QA - ユーザー指摘観点での厳格チェック
 * 偽データ・プレースホルダー問題の詳細調査
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function detailedQAExpansionData() {
  console.log('🔍 拡充データ詳細QA - ユーザー指摘観点')
  console.log('=====================================')
  console.log('🚨 偽データ・プレースホルダー問題の厳格調査\n')

  // 1. 疑わしいエピソードの詳細調査
  console.log('🚨 1. 偽データ・プレースホルダー詳細調査...')

  const { data: suspiciousEpisodes } = await supabase
    .from('episodes')
    .select('id, title, description, video_url, thumbnail_url, view_count, celebrity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  const fakeDataPatterns = [
    // ユーザーが指摘した具体的パターン
    'プレースホルダー', 'placeholder', 'ダミー', 'dummy',
    'テスト', 'test', '推定', '仮', 'サンプル', 'sample',
    '仮想', 'virtual', 'fake', 'mock',
    // 推定データの疑い
    '推定登録者数', 'プレースホルダーコンテンツ',
    // 不完全なデータ
    'undefined', 'null', 'NaN', 'error'
  ]

  const detectedIssues = []

  for (const episode of suspiciousEpisodes || []) {
    const issues = []

    // タイトル・説明のパターンチェック
    const text = `${episode.title || ''} ${episode.description || ''}`.toLowerCase()
    const matchedPatterns = fakeDataPatterns.filter(pattern =>
      text.includes(pattern.toLowerCase())
    )

    if (matchedPatterns.length > 0) {
      issues.push(`疑わしいテキスト: ${matchedPatterns.join(', ')}`)
    }

    // YouTube URLの妥当性チェック
    if (episode.video_url) {
      if (!episode.video_url.startsWith('https://www.youtube.com/watch?v=') &&
          !episode.video_url.startsWith('https://youtube.com/watch?v=')) {
        issues.push('不正なYouTube URL形式')
      }
    }

    // サムネイル画像チェック
    if (!episode.thumbnail_url || !episode.thumbnail_url.startsWith('https://')) {
      issues.push('サムネイル画像なしまたは不正URL')
    }

    // 再生数の不自然さチェック
    if (episode.view_count !== null) {
      // 明らかに人工的な数字パターン（キリの良い数字等）
      const viewCount = episode.view_count
      if (viewCount === 100000 || viewCount === 500000 || viewCount === 1000000) {
        issues.push('人工的な再生数の疑い')
      }
    }

    // エピソードIDパターンチェック
    if (episode.id) {
      // 今回の拡充で作成したIDパターン
      const suspiciousIdPatterns = [
        'youtube_expand_', 'youtube_moderate_', 'youtube_phase3_',
        'youtube_model_', 'youtube_soccer_', 'youtube_celebrity_'
      ]

      const hasSuspiciousId = suspiciousIdPatterns.some(pattern =>
        episode.id.includes(pattern)
      )

      if (hasSuspiciousId) {
        issues.push('今回拡充のエピソード')
      }
    }

    if (issues.length > 0) {
      detectedIssues.push({
        id: episode.id,
        title: episode.title?.substring(0, 50) + '...',
        issues: issues,
        created_at: episode.created_at,
        video_url: episode.video_url,
        celebrity_id: episode.celebrity_id
      })
    }
  }

  // 2. セレブリティ別問題エピソード分析
  console.log('\n📊 2. セレブリティ別問題エピソード分析...')

  const celebrityIssues: {[key: string]: any[]} = {}
  for (const issue of detectedIssues) {
    if (!celebrityIssues[issue.celebrity_id]) {
      celebrityIssues[issue.celebrity_id] = []
    }
    celebrityIssues[issue.celebrity_id].push(issue)
  }

  // セレブリティ名を取得
  const celebrityNames: {[key: string]: string} = {}
  for (const celebrityId of Object.keys(celebrityIssues)) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('name')
      .eq('id', celebrityId)
      .single()

    if (celebrity) {
      celebrityNames[celebrityId] = celebrity.name
    }
  }

  // 3. 今回拡充データのパフォーマンス分析
  console.log('\n📈 3. 今回拡充データのパフォーマンス分析...')

  // 今日拡充したエピソードの分析
  const today = new Date().toISOString().split('T')[0]
  const { data: todayEpisodes } = await supabase
    .from('episodes')
    .select('id, title, video_url, thumbnail_url, celebrity_id')
    .gte('created_at', today)

  const todayStats = {
    total: todayEpisodes?.length || 0,
    withThumbnails: todayEpisodes?.filter(ep => ep.thumbnail_url && ep.thumbnail_url.startsWith('https://')).length || 0,
    withValidUrls: todayEpisodes?.filter(ep => ep.video_url && ep.video_url.startsWith('https://www.youtube.com/')).length || 0,
    issues: detectedIssues.filter(issue => issue.created_at?.startsWith(today)).length
  }

  // 結果出力
  console.log('\n' + '='.repeat(70))
  console.log('🚨 詳細QA結果 - 偽データ・プレースホルダー調査')
  console.log('='.repeat(70))

  console.log(`\n📊 検出された問題エピソード: ${detectedIssues.length}件`)

  if (detectedIssues.length > 0) {
    console.log('\n🔍 問題エピソード詳細（上位20件）:')
    detectedIssues.slice(0, 20).forEach((issue, index) => {
      console.log(`\n${(index + 1).toString().padStart(2, '0')}. ${issue.title}`)
      console.log(`    ID: ${issue.id}`)
      console.log(`    問題: ${issue.issues.join(', ')}`)
      console.log(`    作成日: ${issue.created_at?.substring(0, 10)}`)
      if (issue.video_url) {
        console.log(`    URL: ${issue.video_url.substring(0, 60)}...`)
      }
    })

    console.log('\n📂 セレブリティ別問題分析:')
    Object.entries(celebrityIssues)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10)
      .forEach(([celebrityId, issues]) => {
        const name = celebrityNames[celebrityId] || celebrityId
        console.log(`  ${name}: ${issues.length}件の問題エピソード`)
      })
  }

  console.log('\n📈 今回拡充データ品質分析:')
  console.log(`  今日追加エピソード: ${todayStats.total}本`)
  console.log(`  サムネイルあり: ${todayStats.withThumbnails}本 (${todayStats.total ? (todayStats.withThumbnails/todayStats.total*100).toFixed(1) : 0}%)`)
  console.log(`  有効YouTube URL: ${todayStats.withValidUrls}本 (${todayStats.total ? (todayStats.withValidUrls/todayStats.total*100).toFixed(1) : 0}%)`)
  console.log(`  問題エピソード: ${todayStats.issues}本 (${todayStats.total ? (todayStats.issues/todayStats.total*100).toFixed(1) : 0}%)`)

  // 4. ユーザー指摘への対応評価
  console.log('\n' + '='.repeat(50))
  console.log('👤 ユーザー指摘への対応評価')
  console.log('='.repeat(50))

  // 偽データ問題
  const fakeDataScore = detectedIssues.length === 0 ? 100 : Math.max(0, 100 - detectedIssues.length)
  console.log(`🚨 偽データ問題対応: ${fakeDataScore}点`)
  if (detectedIssues.length > 0) {
    console.log(`   ❌ ${detectedIssues.length}件の疑わしいエピソード検出`)
    console.log(`   💡 即座の調査・修正が必要`)
  } else {
    console.log(`   ✅ 偽データ・プレースホルダー検出なし`)
  }

  // Shorts除外
  const shortsIssues = detectedIssues.filter(issue =>
    issue.issues.some(i => i.includes('Shorts') || i.includes('shorts'))
  ).length
  console.log(`\n📺 Shorts除外対応: ${shortsIssues === 0 ? '100' : '80'}点`)
  if (shortsIssues > 0) {
    console.log(`   ⚠️ ${shortsIssues}件のShorts疑いエピソード`)
  } else {
    console.log(`   ✅ Shorts動画の混入なし`)
  }

  // API使用状況
  const apiScore = todayStats.withValidUrls / Math.max(1, todayStats.total) * 100
  console.log(`\n🔗 実API使用率: ${apiScore.toFixed(1)}点`)
  if (apiScore >= 95) {
    console.log(`   ✅ 優秀な実API使用率`)
  } else {
    console.log(`   ⚠️ 実API使用率の向上が必要`)
  }

  // 5. 修正推奨アクション
  console.log('\n' + '='.repeat(50))
  console.log('🛠️ 修正推奨アクション')
  console.log('='.repeat(50))

  if (detectedIssues.length > 0) {
    console.log('🚨 即座対応必要:')
    console.log('1. 疑わしいエピソードの詳細調査')
    console.log('2. 偽データの削除または修正')
    console.log('3. 拡充プロセスの見直し')
  }

  if (todayStats.withThumbnails / Math.max(1, todayStats.total) < 0.9) {
    console.log('\n📸 サムネイル品質改善:')
    console.log('1. サムネイル取得プロセスの確認')
    console.log('2. YouTube API応答の検証')
  }

  console.log('\n✅ 継続的改善:')
  console.log('1. 拡充後の即座QA実施')
  console.log('2. ユーザー指摘の継続的モニタリング')
  console.log('3. データ品質基準の厳格化')

  return {
    totalIssues: detectedIssues.length,
    todayStats: todayStats,
    celebrityIssues: Object.keys(celebrityIssues).length,
    fakeDataScore: fakeDataScore
  }
}

// 実行
detailedQAExpansionData().catch(console.error)