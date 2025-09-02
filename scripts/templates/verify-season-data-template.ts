#!/usr/bin/env node

/**
 * Season別データ検証テンプレート
 * 新規Season追加後の品質チェック用
 * 
 * 使用方法:
 * 1. SEASON_TO_VERIFY を対象Seasonに設定
 * 2. スクリプトを実行して問題を特定
 * 3. 問題があれば修正スクリプトを作成
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ==========================================
// 検証対象Season設定
// ==========================================
const SEASON_TO_VERIFY = 'Season5' // 検証したいSeasonを指定

// ==========================================
// 品質基準定義
// ==========================================
const QUALITY_STANDARDS = {
  areaAccuracy: 100,      // エリア一致率 100% 必須
  cuisineAccuracy: 100,   // 料理ジャンル一致率 100% 必須
  urlValidity: 100,       // タベログURL正確性 100% 必須
  businessStatusAccuracy: 95, // 営業状況正確性 95% 以上
  linkSwitchOptimization: 100, // 営業中店舗LinkSwitch有効率 100%
}

interface ValidationIssue {
  episodeTitle: string
  locationName: string
  issueType: 'area_mismatch' | 'cuisine_mismatch' | 'url_invalid' | 'business_status_unknown' | 'linkswitch_inactive'
  severity: 'critical' | 'high' | 'medium' | 'low'
  details: string
  recommendedAction: string
}

async function verifySeasonDataQuality() {
  console.log(`🔍 ${SEASON_TO_VERIFY} データ品質検証開始...\n`)
  console.log('Season1-4で学んだ品質基準に基づく包括的チェック')
  console.log('=' .repeat(70))
  
  try {
    // 対象Seasonのデータ取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        description,
        episode_locations(
          id,
          location_id,
          locations(
            id,
            name,
            address,
            tabelog_url,
            affiliate_info,
            description,
            slug
          )
        )
      `)
      .ilike('title', `%${SEASON_TO_VERIFY}%`)
      .order('title')
    
    if (!episodes || episodes.length === 0) {
      console.log(`❌ ${SEASON_TO_VERIFY}のエピソードが見つかりません`)
      return
    }
    
    console.log(`✅ ${SEASON_TO_VERIFY}データ取得: ${episodes.length}エピソード\n`)
    
    const validationIssues: ValidationIssue[] = []
    let totalLocations = 0
    let validLocations = 0
    
    // 各エピソードを検証
    for (const [index, episode] of episodes.entries()) {
      console.log(`🔍 Episode ${index + 1}/${episodes.length}: ${episode.title}`)
      
      const location = episode.episode_locations?.[0]?.locations
      if (!location) {
        console.log('   ❌ ロケーションデータなし')
        validationIssues.push({
          episodeTitle: episode.title,
          locationName: 'データなし',
          issueType: 'url_invalid',
          severity: 'critical',
          details: 'ロケーションデータが完全に欠如',
          recommendedAction: 'エピソード内容を調査し、正しい店舗データを追加'
        })
        continue
      }
      
      totalLocations++
      console.log(`   🏪 店舗: ${location.name}`)
      console.log(`   📍 住所: ${location.address}`)
      
      // エリア検証
      const expectedArea = extractAreaFromTitle(episode.title)
      const actualArea = extractAreaFromAddress(location.address)
      
      if (expectedArea && actualArea && !isAreaMatching(expectedArea, actualArea)) {
        console.log(`   🔴 エリア不一致: 期待「${expectedArea}」vs 実際「${actualArea}」`)
        validationIssues.push({
          episodeTitle: episode.title,
          locationName: location.name,
          issueType: 'area_mismatch',
          severity: 'critical',
          details: `エリア不一致: エピソード「${expectedArea}」vs 住所「${actualArea}」`,
          recommendedAction: '正しいエリアの店舗を調査し、データを修正'
        })
      } else {
        console.log('   ✅ エリア一致')
      }
      
      // 料理ジャンル検証
      const expectedCuisine = extractCuisineFromTitle(episode.title)
      const actualCuisine = location.affiliate_info?.restaurant_info?.cuisine_type
      
      if (expectedCuisine && actualCuisine && !isCuisineMatching(expectedCuisine, actualCuisine)) {
        console.log(`   🔴 料理ジャンル不一致: 期待「${expectedCuisine}」vs 実際「${actualCuisine}」`)
        validationIssues.push({
          episodeTitle: episode.title,
          locationName: location.name,
          issueType: 'cuisine_mismatch',
          severity: 'critical',
          details: `料理ジャンル不一致: エピソード「${expectedCuisine}」vs 実際「${actualCuisine}」`,
          recommendedAction: '正しい料理ジャンルの店舗を調査し、データを修正'
        })
      } else {
        console.log('   ✅ 料理ジャンル一致')
      }
      
      // タベログURL検証
      if (!location.tabelog_url) {
        console.log('   🟡 タベログURLなし')
        validationIssues.push({
          episodeTitle: episode.title,
          locationName: location.name,
          issueType: 'url_invalid',
          severity: 'medium',
          details: 'タベログURLが設定されていない',
          recommendedAction: 'タベログを調査してURLを追加'
        })
      } else if (!location.tabelog_url.includes('tabelog.com')) {
        console.log('   🔴 無効なタベログURL')
        validationIssues.push({
          episodeTitle: episode.title,
          locationName: location.name,
          issueType: 'url_invalid',
          severity: 'high',
          details: 'タベログ以外のURLが設定されている',
          recommendedAction: '正しいタベログURLに修正'
        })
      } else {
        console.log('   ✅ タベログURL有効')
      }
      
      // LinkSwitch検証
      const linkswitch = location.affiliate_info?.linkswitch
      const businessStatus = location.affiliate_info?.restaurant_info?.business_status
      
      if (businessStatus === 'permanently_closed') {
        console.log('   ⚠️  閉店店舗（LinkSwitch無効は適切）')
      } else if (linkswitch?.status === 'active') {
        console.log('   ✅ LinkSwitch有効（収益化済み）')
        validLocations++
      } else {
        console.log('   🟡 LinkSwitch無効（要有効化）')
        validationIssues.push({
          episodeTitle: episode.title,
          locationName: location.name,
          issueType: 'linkswitch_inactive',
          severity: 'low',
          details: '営業中店舗だがLinkSwitchが無効',
          recommendedAction: 'LinkSwitchを有効化して収益化'
        })
      }
      
      // データ品質確認
      const verificationStatus = location.affiliate_info?.restaurant_info?.verification_status
      if (verificationStatus?.includes('verified')) {
        console.log('   ✅ 検証済みデータ')
      } else {
        console.log('   🟡 要検証データ')
      }
      
      console.log() // 空行
    }
    
    // 検証結果サマリー
    console.log('=' .repeat(70))
    console.log(`\n🏆 ${SEASON_TO_VERIFY} データ品質検証結果:`)
    
    const criticalIssues = validationIssues.filter(i => i.severity === 'critical')
    const highIssues = validationIssues.filter(i => i.severity === 'high')
    const mediumIssues = validationIssues.filter(i => i.severity === 'medium')
    const lowIssues = validationIssues.filter(i => i.severity === 'low')
    
    console.log(`\n📊 品質統計:`)
    console.log(`   総エピソード: ${episodes.length}話`)
    console.log(`   総ロケーション: ${totalLocations}箇所`)
    console.log(`   検証済みロケーション: ${validLocations}箇所 (${Math.round((validLocations/totalLocations)*100)}%)`)
    console.log(`   総検出問題: ${validationIssues.length}件`)
    
    console.log(`\n🚨 問題重要度分析:`)
    console.log(`   🔴 緊急修正必要: ${criticalIssues.length}件`)
    console.log(`   🟠 高優先度: ${highIssues.length}件`)
    console.log(`   🟡 中優先度: ${mediumIssues.length}件`)
    console.log(`   🟢 軽微: ${lowIssues.length}件`)
    
    // 品質基準との比較
    const areaAccuracy = ((totalLocations - criticalIssues.filter(i => i.issueType === 'area_mismatch').length) / totalLocations) * 100
    const cuisineAccuracy = ((totalLocations - criticalIssues.filter(i => i.issueType === 'cuisine_mismatch').length) / totalLocations) * 100
    const urlValidity = ((totalLocations - validationIssues.filter(i => i.issueType === 'url_invalid').length) / totalLocations) * 100
    const linkSwitchRate = (validLocations / totalLocations) * 100
    
    console.log(`\n📈 品質指標vs基準:`)
    console.log(`   エリア正確性: ${areaAccuracy.toFixed(1)}% (基準: ${QUALITY_STANDARDS.areaAccuracy}%) ${areaAccuracy >= QUALITY_STANDARDS.areaAccuracy ? '✅' : '❌'}`)
    console.log(`   料理ジャンル正確性: ${cuisineAccuracy.toFixed(1)}% (基準: ${QUALITY_STANDARDS.cuisineAccuracy}%) ${cuisineAccuracy >= QUALITY_STANDARDS.cuisineAccuracy ? '✅' : '❌'}`)
    console.log(`   URL正確性: ${urlValidity.toFixed(1)}% (基準: ${QUALITY_STANDARDS.urlValidity}%) ${urlValidity >= QUALITY_STANDARDS.urlValidity ? '✅' : '❌'}`)
    console.log(`   収益化率: ${linkSwitchRate.toFixed(1)}% (基準: ${QUALITY_STANDARDS.linkSwitchOptimization}%) ${linkSwitchRate >= QUALITY_STANDARDS.linkSwitchOptimization ? '✅' : '🟡'}`)
    
    // 重要問題の詳細表示
    if (criticalIssues.length > 0) {
      console.log(`\n🔴 【緊急修正必要】重要問題詳細:`)
      console.log('-' .repeat(50))
      
      criticalIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.episodeTitle}`)
        console.log(`   店舗: ${issue.locationName}`)
        console.log(`   問題: ${issue.details}`)
        console.log(`   推奨対応: ${issue.recommendedAction}`)
      })
    }
    
    // 推奨アクション
    console.log(`\n📋 推奨修正アクション:`)
    if (criticalIssues.length > 0) {
      console.log(`1. 🔴 緊急修正 (${criticalIssues.length}件)`)
      console.log(`   - エリア・料理ジャンル不一致の調査・修正`)
      console.log(`   - 間違ったロケ地データの完全置換`)
    }
    
    if (highIssues.length > 0) {
      console.log(`2. 🟠 高優先修正 (${highIssues.length}件)`)
      console.log(`   - URL形式の修正`)
      console.log(`   - データ品質向上`)
    }
    
    if (mediumIssues.length > 0 || lowIssues.length > 0) {
      console.log(`3. 🟡 段階的改善 (${mediumIssues.length + lowIssues.length}件)`)
      console.log(`   - タベログURL調査・追加`)
      console.log(`   - LinkSwitch最適化`)
    }
    
    // 品質認証
    const isHighQuality = criticalIssues.length === 0 && highIssues.length === 0
    
    if (isHighQuality) {
      console.log(`\n🏆🏆🏆 ${SEASON_TO_VERIFY} 高品質データ認証！ 🏆🏆🏆`)
      console.log('Season1-4と同等の品質基準を満たしています。')
    } else {
      console.log(`\n⚠️  品質改善が必要です`)
      console.log('重要問題を修正してからリリースしてください。')
    }
    
    return {
      totalEpisodes: episodes.length,
      totalLocations,
      validLocations,
      totalIssues: validationIssues.length,
      criticalIssues: criticalIssues.length,
      isHighQuality
    }
    
  } catch (error) {
    console.error('❌ 検証エラー:', error)
  }
}

// ヘルパー関数群（Season1-4検証スクリプトから移植）
function extractAreaFromTitle(title: string): string | null {
  const areaPatterns = [
    // 都道府県+市区町村パターン
    /(東京都|神奈川県|千葉県|埼玉県|静岡県|群馬県|新潟県|愛知県)([^区市町村]+[区市町村])/,
    // 市区町村のみパターン  
    /([^区市町村]+[区市町村])/,
  ];
  
  for (const pattern of areaPatterns) {
    const match = title.match(pattern);
    if (match) return match[0];
  }
  
  return null;
}

function extractAreaFromAddress(address: string | null): string | null {
  if (!address) return null;
  
  const match = address.match(/(東京都|神奈川県|千葉県|埼玉県|静岡県|群馬県|新潟県|愛知県)([^区市町村]+[区市町村])/);
  return match ? match[0] : null;
}

function extractCuisineFromTitle(title: string): string | null {
  const cuisinePatterns = [
    /ラーメン|中華|チャーハン|餃子/,
    /寿司|刺身|海鮮/,
    /焼肉|ステーキ|ハンバーグ/,
    /カレー|インド|タイ|ベトナム|エスニック/,
    /イタリアン|パスタ|ピザ/,
    /フレンチ|洋食/,
    /和食|定食|天ぷら/,
    /居酒屋|焼き鳥/,
    /カフェ|喫茶|パン|ベーカリー/,
    /そば|うどん/
  ];
  
  for (const pattern of cuisinePatterns) {
    const match = title.match(pattern);
    if (match) return match[0];
  }
  
  return null;
}

function isAreaMatching(expected: string, actual: string): boolean {
  return expected === actual || 
         expected.includes(actual.replace(/東京都|神奈川県|千葉県|埼玉県/, '')) ||
         actual.includes(expected.replace(/東京都|神奈川県|千葉県|埼玉県/, ''));
}

function isCuisineMatching(expected: string, actual: string): boolean {
  return expected === actual ||
         actual.includes(expected) ||
         expected.includes(actual);
}

// 実行
verifySeasonDataQuality().catch(console.error)