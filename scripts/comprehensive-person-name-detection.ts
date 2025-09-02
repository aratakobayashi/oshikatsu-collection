#!/usr/bin/env node

/**
 * 徹底的な人名ロケーションデータ検出
 * 残存する全ての人名パターンを特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function comprehensivePersonNameDetection() {
  console.log('🔍 徹底的な人名データ検出')
  console.log('='.repeat(60))

  // 全データを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone,
      episode_locations(
        id, episode_id,
        episodes(id, title, celebrities(name))
      )
    `)
    .order('name')

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 分析対象: ${locations.length}件`)

  // 高度な人名検出関数
  const analyzeForPersonName = (name: string, location: any) => {
    if (!name) return { isPerson: false, confidence: 0, reason: 'no_name' }
    
    const trimmedName = name.trim()
    let confidence = 0
    let reasons = []

    // 1. 確実な人名パターン（高信頼度）
    
    // フルネーム形式（姓名がスペースで区切られている）
    if (/^[一-龯]{1,4}\s+[一-龯]{1,4}$/.test(trimmedName)) {
      confidence += 90
      reasons.push('漢字姓名（スペース区切り）')
    }
    
    if (/^[ア-ン]{2,4}\s+[ア-ン]{2,4}$/.test(trimmedName)) {
      confidence += 90
      reasons.push('カタカナ姓名（スペース区切り）')
    }
    
    if (/^[ぁ-ん]{2,4}\s+[ぁ-ん]{2,4}$/.test(trimmedName)) {
      confidence += 90
      reasons.push('ひらがな姓名（スペース区切り）')
    }

    // 英語フルネーム
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(trimmedName)) {
      confidence += 85
      reasons.push('英語フルネーム')
    }

    // 日本語+英語の組み合わせ（アイドル名に多い）
    if (/^[一-龯ぁ-んア-ン]{2,8}\s+[A-Za-z\s]+$/.test(trimmedName) ||
        /^[A-Za-z\s]+\s+[一-龯ぁ-んア-ン]{2,8}$/.test(trimmedName)) {
      confidence += 95
      reasons.push('日英混合フルネーム')
    }

    // 2. アイドル・芸能人の特徴的パターン
    
    // ≠MEメンバーっぽいパターン
    if (/[一-龯]{2,4}\s+[一-龯ぁ-んア-ン]{2,8}\s+[A-Za-z\s]+/.test(trimmedName)) {
      confidence += 95
      reasons.push('≠MEメンバー形式')
    }

    // グループ名 + 個人名
    if (/(Snow Man|SixTONES|≠ME|=LOVE|Travis Japan)\s*[一-龯ぁ-んア-ン]+/.test(trimmedName)) {
      confidence += 90
      reasons.push('グループ名+個人名')
    }

    // 3. 中信頼度パターン
    
    // 「〜さん」「〜様」「〜氏」「〜先生」
    if (/[一-龯ぁ-んア-ン]{2,8}(さん|様|氏|先生|くん|ちゃん)$/.test(trimmedName)) {
      confidence += 70
      reasons.push('敬称付き人名')
    }

    // 一般的な日本人の姓名（スペースなし）
    const commonSurnames = ['田中', '佐藤', '鈴木', '高橋', '渡辺', '山田', '松本', '中村', '小林', '加藤', '吉田', '山本', '斎藤', '山口', '松田', '井上', '木村', '林', '清水', '山崎']
    const commonGivenNames = ['太郎', '次郎', '花子', '美咲', '翔太', '大輔', '健太', '智子', '恵子', '裕子', '明', '清', '実', '愛', '優', '翔', '蓮', '陽菜', 'さくら', 'ゆい']
    
    if (commonSurnames.some(surname => trimmedName.startsWith(surname)) ||
        commonGivenNames.some(name => trimmedName.includes(name))) {
      confidence += 50
      reasons.push('一般的な日本人名')
    }

    // 4. 除外パターン（確実に店舗・施設）
    
    const definitelyNotPersonPatterns = [
      // 店舗系
      /(店|ショップ|カフェ|レストラン|バー|居酒屋|食堂|軒|亭|庵|館|屋|堂)$/,
      // 施設系
      /(公園|駅|ホーム|ビル|マンション|センター|タワー|プラザ|モール)$/,
      // 料理・ジャンル系
      /(ラーメン|うどん|そば|寿司|焼肉|焼鳥|中華|イタリアン|フレンチ|和食|洋食)/,
      // ブランド・チェーン系
      /(マクドナルド|スターバックス|ケンタッキー|ドミノ|ピザハット)/,
      // 明らかな施設名
      /^(東京|大阪|神奈川|千葉|埼玉|横浜|名古屋|京都|神戸)/
    ]

    if (definitelyNotPersonPatterns.some(pattern => pattern.test(trimmedName))) {
      confidence = Math.max(0, confidence - 80)
      reasons.push('明確な非人名パターン')
    }

    // タベログURLがある場合は店舗確度が高い
    if (location.tabelog_url) {
      confidence = Math.max(0, confidence - 60)
      reasons.push('タベログURL存在')
    }

    // 電話番号がある場合も店舗確度が高い
    if (location.phone) {
      confidence = Math.max(0, confidence - 40)
      reasons.push('電話番号存在')
    }

    // 具体的住所がある場合も店舗確度が高い
    if (location.address && location.address.length > 15 && 
        !location.address.includes('東京都内') && 
        !location.address.includes('各店舗')) {
      confidence = Math.max(0, confidence - 30)
      reasons.push('具体的住所存在')
    }

    return {
      isPerson: confidence >= 60,
      confidence: Math.min(100, confidence),
      reasons: reasons,
      name: trimmedName
    }
  }

  // 全データを分析
  console.log('\n🔍 人名パターン分析中...')
  
  const suspiciousPersonNames = locations
    .map(loc => ({
      ...loc,
      analysis: analyzeForPersonName(loc.name, loc)
    }))
    .filter(loc => loc.analysis.confidence > 30) // 30%以上の可能性があるものを抽出
    .sort((a, b) => b.analysis.confidence - a.analysis.confidence)

  console.log(`\n👤 【人名の可能性があるデータ】`)
  console.log('='.repeat(50))
  console.log(`検出数: ${suspiciousPersonNames.length}件`)

  // 信頼度別に表示
  const highConfidence = suspiciousPersonNames.filter(loc => loc.analysis.confidence >= 80)
  const mediumConfidence = suspiciousPersonNames.filter(loc => loc.analysis.confidence >= 60 && loc.analysis.confidence < 80)
  const lowConfidence = suspiciousPersonNames.filter(loc => loc.analysis.confidence >= 30 && loc.analysis.confidence < 60)

  if (highConfidence.length > 0) {
    console.log(`\n🚨 【高確度人名データ (80%+)】- ${highConfidence.length}件`)
    highConfidence.forEach((loc, i) => {
      console.log(`${i+1}. "${loc.name}" (${loc.analysis.confidence}%)`)
      console.log(`   ID: ${loc.id.slice(0, 8)}...`)
      console.log(`   住所: ${loc.address || 'なし'}`)
      console.log(`   理由: ${loc.analysis.reasons.join(', ')}`)
      console.log(`   エピソード: ${loc.episode_locations?.length || 0}件`)
      if (loc.tabelog_url) console.log(`   📱 タベログURL: あり`)
      console.log('')
    })
  }

  if (mediumConfidence.length > 0) {
    console.log(`\n⚠️ 【中確度人名データ (60-79%)】- ${mediumConfidence.length}件`)
    mediumConfidence.forEach((loc, i) => {
      console.log(`${i+1}. "${loc.name}" (${loc.analysis.confidence}%)`)
      console.log(`   ID: ${loc.id.slice(0, 8)}...`)
      console.log(`   住所: ${loc.address || 'なし'}`)
      console.log(`   理由: ${loc.analysis.reasons.join(', ')}`)
      console.log(`   エピソード: ${loc.episode_locations?.length || 0}件`)
      if (loc.tabelog_url) console.log(`   📱 タベログURL: あり`)
      console.log('')
    })
  }

  if (lowConfidence.length > 0) {
    console.log(`\n🤔 【低確度人名データ (30-59%)】- ${lowConfidence.length}件`)
    lowConfidence.slice(0, 10).forEach((loc, i) => {
      console.log(`${i+1}. "${loc.name}" (${loc.analysis.confidence}%)`)
      console.log(`   理由: ${loc.analysis.reasons.join(', ')}`)
      console.log('')
    })
    if (lowConfidence.length > 10) {
      console.log(`   ... 他${lowConfidence.length - 10}件`)
    }
  }

  // 削除推奨リスト
  const deleteRecommendations = [...highConfidence, ...mediumConfidence]

  console.log(`\n🗑️ 【削除推奨データ】`)
  console.log('='.repeat(40))
  console.log(`高確度 + 中確度: ${deleteRecommendations.length}件`)

  if (deleteRecommendations.length > 0) {
    console.log('\n削除推奨ID一覧:')
    deleteRecommendations.forEach((loc, i) => {
      console.log(`${i+1}. ${loc.id} - "${loc.name}" (${loc.analysis.confidence}%)`)
    })
  }

  return {
    total_locations: locations.length,
    high_confidence: highConfidence.length,
    medium_confidence: mediumConfidence.length,
    low_confidence: lowConfidence.length,
    delete_recommendations: deleteRecommendations,
    total_suspicious: suspiciousPersonNames.length
  }
}

// 実行
comprehensivePersonNameDetection()
  .then(result => {
    console.log(`\n✅ 徹底分析完了!`)
    console.log(`   総データ数: ${result.total_locations}件`)
    console.log(`   高確度人名: ${result.high_confidence}件`)
    console.log(`   中確度人名: ${result.medium_confidence}件`)
    console.log(`   低確度人名: ${result.low_confidence}件`)
    console.log(`   削除推奨: ${result.high_confidence + result.medium_confidence}件`)
    
    if (result.delete_recommendations.length > 0) {
      console.log(`\n⚠️  ${result.delete_recommendations.length}件の人名データが見つかりました！`)
    } else {
      console.log(`\n✅ 高・中確度の人名データは見つかりませんでした。`)
    }
  })
  .catch(error => {
    console.error('❌ 分析エラー:', error)
  })