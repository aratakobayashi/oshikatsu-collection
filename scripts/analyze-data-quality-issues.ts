#!/usr/bin/env node

/**
 * 孤独のグルメデータの品質問題分析
 * なぜ間違ったデータが入ったのかを調査
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeDataQualityIssues() {
  console.log('🔍 孤独のグルメデータの品質問題分析\n')
  console.log('=' .repeat(70))
  
  // 松重豊のIDを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', 'matsushige-yutaka')
    .single()
  
  if (!celebrity) {
    console.error('❌ 松重豊のデータが見つかりません')
    return
  }

  console.log('📊 現在のSeason1データ品質分析:\n')
  
  // Season1の全エピソードを分析
  const { data: episodes } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      description,
      episode_locations(
        location_id,
        locations(
          id,
          name,
          address,
          tabelog_url,
          description,
          affiliate_info
        )
      )
    `)
    .eq('celebrity_id', celebrity.id)
    .like('title', '%Season1%')
    .order('title')
  
  if (!episodes) return
  
  const dataQualityReport = []
  
  for (const episode of episodes) {
    const episodeNumber = episode.title.match(/第(\d+)話/)?.[1] || '不明'
    const location = episode.episode_locations?.[0]?.locations
    
    const analysis = {
      episode: episodeNumber,
      title: episode.title,
      locationName: location?.name || 'ロケーション未登録',
      address: location?.address || '住所不明',
      tabelogUrl: location?.tabelog_url || 'なし',
      hasLinkSwitch: location?.affiliate_info?.linkswitch ? '✅' : '❌',
      issues: [] as string[]
    }
    
    // データ品質チェック
    if (!location) {
      analysis.issues.push('ロケーション未登録')
    } else {
      // 店名の妥当性チェック
      if (location.name.includes('中華') && !episode.title.includes('中華') && !episode.title.includes('担々麺')) {
        analysis.issues.push('店名とエピソード内容の不一致の可能性')
      }
      
      // 住所の妥当性チェック
      const episodeLocation = episode.title.match(/(豊島区|文京区|江東区|武蔵野市|中野区|世田谷区|神奈川県|杉並区|目黒区|千葉県)/)?.[1]
      if (episodeLocation && location.address && !location.address.includes(episodeLocation)) {
        analysis.issues.push(`住所不一致: エピソード(${episodeLocation}) vs 実際(${location.address})`)
      }
      
      // 食べログURLの有効性チェック（基本的なフォーマット）
      if (location.tabelog_url && !location.tabelog_url.startsWith('https://tabelog.com/')) {
        analysis.issues.push('食べログURL形式が不正')
      }
      
      // LinkSwitch設定チェック
      if (!location.affiliate_info?.linkswitch) {
        analysis.issues.push('LinkSwitch未設定')
      }
    }
    
    dataQualityReport.push(analysis)
  }
  
  // レポート出力
  for (const report of dataQualityReport) {
    console.log(`第${report.episode}話: ${report.locationName}`)
    console.log(`   タイトル: ${report.title}`)
    console.log(`   住所: ${report.address}`)
    console.log(`   食べログ: ${report.tabelogUrl}`)
    console.log(`   LinkSwitch: ${report.hasLinkSwitch}`)
    
    if (report.issues.length > 0) {
      console.log(`   ⚠️ 問題: ${report.issues.join(', ')}`)
    } else {
      console.log(`   ✅ 問題なし`)
    }
    console.log('')
  }
  
  console.log('=' .repeat(70))
  console.log('\n📝 データ品質問題の原因分析:')
  
  const issueCount = dataQualityReport.filter(r => r.issues.length > 0).length
  const totalEpisodes = dataQualityReport.length
  
  console.log(`\n📊 統計:`)
  console.log(`   総エピソード数: ${totalEpisodes}`)
  console.log(`   問題のあるエピソード: ${issueCount}`)
  console.log(`   データ品質率: ${Math.round((totalEpisodes - issueCount) / totalEpisodes * 100)}%`)
  
  console.log(`\n🎯 推定される問題の原因:`)
  console.log(`1. 初期データ入力時の調査不足`)
  console.log(`   - エピソードタイトルから店舗を推測で入力`)
  console.log(`   - 実際の番組内容との照合不足`)
  console.log(``)
  console.log(`2. データ検証プロセスの欠如`)
  console.log(`   - 食べログURLの実在確認不足`)
  console.log(`   - 店名と提供料理の整合性チェック不足`)
  console.log(``)
  console.log(`3. 継続的なメンテナンス不足`)
  console.log(`   - 店舗の営業状況変化への対応不足`)
  console.log(`   - データの定期的な見直し不足`)
  
  console.log(`\n🛡️ 再発防止策:`)
  console.log(`1. データ入力時の必須チェック項目:`)
  console.log(`   ✅ 実際の番組視聴または公式情報での確認`)
  console.log(`   ✅ 食べログURLの実在確認（404チェック）`)
  console.log(`   ✅ 店名と提供料理の一致確認`)
  console.log(`   ✅ エピソードタイトルとロケーションの一致確認`)
  console.log(``)
  console.log(`2. 自動化可能な検証:`)
  console.log(`   ✅ 食べログURLの自動アクセス確認`)
  console.log(`   ✅ 住所とエピソード地域の一致チェック`)
  console.log(`   ✅ LinkSwitch設定の必須チェック`)
  console.log(``)
  console.log(`3. 定期的なメンテナンス:`)
  console.log(`   ✅ 月次での全URLアクセス確認`)
  console.log(`   ✅ ユーザーフィードバックの収集と対応`)
  console.log(`   ✅ 新しいエピソードの正確な調査プロセス`)
  
  return dataQualityReport
}

// 実行
analyzeDataQualityIssues().catch(console.error)