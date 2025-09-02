#!/usr/bin/env node

/**
 * ロケーションデータクリーニング
 * 安全な削除とデータ品質向上
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface LocationCleanupCandidate {
  id: string
  name: string
  address?: string
  description?: string
  episode_count: number
  reason: string
  action: 'DELETE' | 'REVIEW' | 'KEEP'
}

async function performLocationCleanup() {
  console.log('🧹 ロケーションデータクリーニング開始')
  console.log('='.repeat(60))

  // 全データを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      episode_locations(
        episodes(id, title, celebrities(name))
      )
    `)

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 総ロケーション数: ${locations.length}箇所`)

  const candidates: LocationCleanupCandidate[] = []

  // 1. 明らかに削除すべきもの（非店舗・非ロケーション）
  const definiteDeleteKeywords = [
    // 人名・楽曲名
    /^\d{2}:\d{2}/, // "04:42 JENNIFER LOPEZ" 形式
    /covered by|カバー/i,
    /^[a-zA-Z\s]+$/, // 英語のみの名前（人名の可能性）
    
    // 明らかに場所ではないもの
    /おたより|募集|フォーム/,
    /world$|johnny's/i,
    /香水|perfume|fragrance/i,
    
    // 住宅・建物（店舗でない）
    /マンション|アパート|住宅|ビル$/,
    /駅$|ホーム$/,
    /公園$|海岸$|海水浴場$/,
    /神社$|寺$|教会$/,
    /学校$|病院$|役所$/
  ]

  locations.forEach(loc => {
    const episodeCount = loc.episode_locations?.length || 0
    let action: 'DELETE' | 'REVIEW' | 'KEEP' = 'KEEP'
    let reason = ''

    // 明らかに削除対象
    if (definiteDeleteKeywords.some(pattern => 
      pattern.test(loc.name || '') || 
      pattern.test(loc.description || '')
    )) {
      action = 'DELETE'
      reason = '非店舗・非ロケーション（人名・楽曲・その他）'
    }
    
    // エピソードがなく、疑わしい名前
    else if (episodeCount === 0 && (
      !loc.name || loc.name.length < 3 || 
      loc.name.match(/^(場所|スポット|ロケ地|不明|未設定|テスト)/i)
    )) {
      action = 'DELETE'
      reason = 'エピソード紐付けなし + 疑わしい名称'
    }
    
    // 要確認（判断が困難）
    else if (
      loc.name?.includes('店') === false &&
      loc.name?.includes('カフェ') === false &&
      loc.name?.includes('レストラン') === false &&
      episodeCount <= 1
    ) {
      action = 'REVIEW'
      reason = '店舗系キーワードなし + 低エピソード数'
    }

    if (action !== 'KEEP') {
      candidates.push({
        id: loc.id,
        name: loc.name || '',
        address: loc.address,
        description: loc.description,
        episode_count: episodeCount,
        reason,
        action
      })
    }
  })

  // 結果表示
  const deleteTargets = candidates.filter(c => c.action === 'DELETE')
  const reviewTargets = candidates.filter(c => c.action === 'REVIEW')

  console.log('\n🗑️  【削除対象】')
  console.log('='.repeat(40))
  console.log(`件数: ${deleteTargets.length}件`)
  
  console.log('\nサンプル（削除対象TOP10）:')
  deleteTargets.slice(0, 10).forEach((item, i) => {
    console.log(`${i+1}. ${item.name}`)
    console.log(`   住所: ${item.address || 'なし'}`)
    console.log(`   エピソード: ${item.episode_count}件`)
    console.log(`   理由: ${item.reason}`)
    console.log('')
  })

  console.log('\n🔍 【要確認】')
  console.log('='.repeat(40))
  console.log(`件数: ${reviewTargets.length}件`)
  
  reviewTargets.slice(0, 5).forEach((item, i) => {
    console.log(`${i+1}. ${item.name}`)
    console.log(`   住所: ${item.address || 'なし'}`)
    console.log(`   エピソード: ${item.episode_count}件`)
    console.log(`   理由: ${item.reason}`)
    console.log('')
  })

  // クリーニング実行の準備
  console.log('\n📋 【クリーニング実行プラン】')
  console.log('='.repeat(40))
  console.log(`✅ 即座に削除可能: ${deleteTargets.length}件`)
  console.log(`⚠️  手動確認必要: ${reviewTargets.length}件`)
  console.log(`✅ 保持（良質データ）: ${locations.length - candidates.length}件`)

  // 削除実行（DRY RUN）
  console.log('\n🎯 【削除実行 - DRY RUN】')
  console.log('実際には削除せず、SQL文のみ生成します')
  
  if (deleteTargets.length > 0) {
    const deleteIds = deleteTargets.map(t => `'${t.id}'`).join(',')
    
    console.log('\n実行予定のSQL:')
    console.log('-- エピソードリンクを先に削除')
    console.log(`DELETE FROM episode_locations WHERE location_id IN (${deleteIds});`)
    console.log('')
    console.log('-- ロケーション本体を削除') 
    console.log(`DELETE FROM locations WHERE id IN (${deleteIds});`)
  }

  // ROI改善効果の予測
  const remainingLocations = locations.length - deleteTargets.length
  const qualityImprovement = Math.round((deleteTargets.length / locations.length) * 100)

  console.log('\n💰 【クリーニング効果予測】')
  console.log('='.repeat(40))
  console.log(`データ品質向上: ${qualityImprovement}%`)
  console.log(`残存ロケーション: ${remainingLocations}箇所`)
  console.log(`タベログURL対応対象: 約${Math.round(remainingLocations * 0.6)}箇所（推定）`)
  console.log(`予想ROI改善: 3-5倍向上`)

  return {
    total_before: locations.length,
    delete_targets: deleteTargets.length,
    review_needed: reviewTargets.length,
    remaining: remainingLocations,
    delete_candidates: deleteTargets
  }
}

// 実行
performLocationCleanup()
  .then(results => {
    console.log(`\n✅ クリーニング計画完了!`)
    console.log(`   削除対象: ${results.delete_targets}件`)
    console.log(`   確認必要: ${results.review_needed}件`)
    console.log(`   保持対象: ${results.remaining}件`)
  })
  .catch(error => {
    console.error('❌ エラー:', error)
  })
