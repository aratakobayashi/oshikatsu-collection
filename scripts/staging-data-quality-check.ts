/**
 * ステージング環境のデータ品質チェックスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// ステージング環境変数読み込み
dotenv.config({ path: '.env.staging' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface QualityReport {
  totalRecords: number
  duplicates: number
  missingRequiredFields: number
  invalidData: number
  orphanedRelations: number
}

async function checkEpisodesQuality() {
  console.log('\n📺 エピソードデータの品質チェック...')
  
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('*')
    .order('date', { ascending: false })
  
  if (error || !episodes) {
    console.error('❌ エピソードデータ取得エラー:', error)
    return
  }
  
  const report: QualityReport = {
    totalRecords: episodes.length,
    duplicates: 0,
    missingRequiredFields: 0,
    invalidData: 0,
    orphanedRelations: 0
  }
  
  // タイトル重複チェック
  const titleMap = new Map<string, number>()
  episodes.forEach(ep => {
    const count = titleMap.get(ep.title) || 0
    titleMap.set(ep.title, count + 1)
  })
  
  titleMap.forEach((count, title) => {
    if (count > 1) {
      report.duplicates += count - 1
      console.log(`   ⚠️ 重複タイトル: "${title}" (${count}件)`)
    }
  })
  
  // 必須フィールドチェック
  episodes.forEach(ep => {
    if (!ep.title || !ep.video_url) {
      report.missingRequiredFields++
      console.log(`   ⚠️ 必須フィールド不足: ID ${ep.id}`)
    }
    
    // URLの妥当性チェック
    if (ep.video_url && !ep.video_url.includes('youtube.com') && !ep.video_url.includes('youtu.be')) {
      report.invalidData++
      console.log(`   ⚠️ 無効なURL: ${ep.video_url}`)
    }
  })
  
  console.log(`\n   📊 エピソード品質サマリー:`)
  console.log(`      総レコード数: ${report.totalRecords}`)
  console.log(`      重複: ${report.duplicates}`)
  console.log(`      必須フィールド不足: ${report.missingRequiredFields}`)
  console.log(`      無効データ: ${report.invalidData}`)
  console.log(`      品質スコア: ${Math.round((1 - (report.duplicates + report.missingRequiredFields + report.invalidData) / report.totalRecords) * 100)}%`)
  
  return report
}

async function checkLocationsQuality() {
  console.log('\n📍 ロケーションデータの品質チェック...')
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
  
  if (error || !locations) {
    console.error('❌ ロケーションデータ取得エラー:', error)
    return
  }
  
  const report: QualityReport = {
    totalRecords: locations.length,
    duplicates: 0,
    missingRequiredFields: 0,
    invalidData: 0,
    orphanedRelations: 0
  }
  
  // 名前重複チェック
  const nameMap = new Map<string, number>()
  locations.forEach(loc => {
    const count = nameMap.get(loc.name) || 0
    nameMap.set(loc.name, count + 1)
  })
  
  nameMap.forEach((count, name) => {
    if (count > 1) {
      report.duplicates += count - 1
      console.log(`   ⚠️ 重複ロケーション: "${name}" (${count}件)`)
    }
  })
  
  // 必須フィールドと住所情報チェック
  locations.forEach(loc => {
    if (!loc.name) {
      report.missingRequiredFields++
      console.log(`   ⚠️ 名前なし: ID ${loc.id}`)
    }
    
    if (!loc.address && !loc.latitude) {
      report.missingRequiredFields++
      console.log(`   ⚠️ 住所・座標なし: ${loc.name}`)
    }
  })
  
  console.log(`\n   📊 ロケーション品質サマリー:`)
  console.log(`      総レコード数: ${report.totalRecords}`)
  console.log(`      重複: ${report.duplicates}`)
  console.log(`      住所情報不足: ${report.missingRequiredFields}`)
  console.log(`      品質スコア: ${Math.round((1 - (report.duplicates + report.missingRequiredFields) / report.totalRecords) * 100)}%`)
  
  return report
}

async function checkRelationsQuality() {
  console.log('\n🔗 関連データの整合性チェック...')
  
  // エピソード-ロケーション関連
  const { data: episodeLocations, error: elError } = await supabase
    .from('episode_locations')
    .select('*, episodes!inner(*), locations!inner(*)')
  
  if (elError) {
    console.error('❌ エピソード-ロケーション関連取得エラー:', elError)
    return
  }
  
  console.log(`   ✅ エピソード-ロケーション関連: ${episodeLocations?.length || 0}件`)
  
  // エピソードあたりの平均ロケーション数
  const { data: episodes } = await supabase.from('episodes').select('id')
  const avgLocationsPerEpisode = episodeLocations ? episodeLocations.length / (episodes?.length || 1) : 0
  console.log(`   📊 エピソードあたり平均ロケーション数: ${avgLocationsPerEpisode.toFixed(2)}`)
  
  // 孤立したロケーション（どのエピソードとも関連していない）
  const { data: allLocations } = await supabase.from('locations').select('id, name')
  const linkedLocationIds = new Set(episodeLocations?.map(el => el.location_id))
  const orphanedLocations = allLocations?.filter(loc => !linkedLocationIds.has(loc.id)) || []
  
  if (orphanedLocations.length > 0) {
    console.log(`   ⚠️ 孤立したロケーション: ${orphanedLocations.length}件`)
    orphanedLocations.slice(0, 3).forEach(loc => {
      console.log(`      - ${loc.name}`)
    })
  }
  
  return {
    episodeLocationRelations: episodeLocations?.length || 0,
    avgLocationsPerEpisode,
    orphanedLocations: orphanedLocations.length
  }
}

async function checkDataCompleteness() {
  console.log('\n📈 データ充実度チェック...')
  
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, description, tags')
  
  let episodesWithDescription = 0
  let episodesWithTags = 0
  let totalTags = 0
  
  episodes?.forEach(ep => {
    if (ep.description && ep.description.length > 50) {
      episodesWithDescription++
    }
    if (ep.tags && ep.tags.length > 0) {
      episodesWithTags++
      totalTags += ep.tags.length
    }
  })
  
  const totalEpisodes = episodes?.length || 0
  
  console.log(`   📝 説明文付きエピソード: ${episodesWithDescription}/${totalEpisodes} (${Math.round(episodesWithDescription/totalEpisodes*100)}%)`)
  console.log(`   🏷️ タグ付きエピソード: ${episodesWithTags}/${totalEpisodes} (${Math.round(episodesWithTags/totalEpisodes*100)}%)`)
  console.log(`   📊 平均タグ数: ${episodesWithTags > 0 ? (totalTags/episodesWithTags).toFixed(1) : 0}`)
  
  return {
    episodesWithDescription,
    episodesWithTags,
    descriptionRate: Math.round(episodesWithDescription/totalEpisodes*100),
    tagRate: Math.round(episodesWithTags/totalEpisodes*100)
  }
}

async function generateQualityReport() {
  console.log('🔍 ステージングデータ品質分析開始...')
  console.log('='.repeat(60))
  
  // 各種品質チェック実行
  const episodeQuality = await checkEpisodesQuality()
  const locationQuality = await checkLocationsQuality()
  const relationQuality = await checkRelationsQuality()
  const completeness = await checkDataCompleteness()
  
  // 総合レポート
  console.log('\n' + '='.repeat(60))
  console.log('📊 総合品質レポート')
  console.log('='.repeat(60))
  
  console.log('\n🎯 改善が必要な項目:')
  
  if (episodeQuality && episodeQuality.duplicates > 0) {
    console.log(`   ❗ エピソードの重複を解消（${episodeQuality.duplicates}件）`)
  }
  
  if (locationQuality && locationQuality.missingRequiredFields > 0) {
    console.log(`   ❗ ロケーションの住所情報を補完（${locationQuality.missingRequiredFields}件）`)
  }
  
  if (relationQuality && relationQuality.orphanedLocations > 0) {
    console.log(`   ❗ 孤立したロケーションを関連付け（${relationQuality.orphanedLocations}件）`)
  }
  
  if (completeness && completeness.descriptionRate < 80) {
    console.log(`   ❗ エピソード説明文の充実（現在${completeness.descriptionRate}%）`)
  }
  
  console.log('\n✅ データ拡充の推奨:')
  console.log('   1. YouTube APIで追加エピソード収集（400件以上追加可能）')
  console.log('   2. エピソード説明文からロケーション情報を自動抽出')
  console.log('   3. タグシステムを活用した検索性向上')
  console.log('   4. アイテム情報の構造化収集')
  
  console.log('\n🚀 次のステップ:')
  console.log('   1. 重複データのクリーンアップ')
  console.log('   2. 追加データ収集の実行')
  console.log('   3. 関連付けの強化')
  console.log('   4. 本番環境への段階的移行')
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  generateQualityReport().catch(console.error)
}