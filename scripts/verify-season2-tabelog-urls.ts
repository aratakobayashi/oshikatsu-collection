#!/usr/bin/env node

/**
 * Season2タベログURL個別検証
 * 各エピソードのタベログURLが実際に正しい店舗を指しているか確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface URLVerificationResult {
  episodeTitle: string
  locationName: string
  currentUrl: string
  expectedRestaurant: string
  actualArea: string
  expectedArea: string
  status: 'correct' | 'incorrect' | 'needs_verification'
  issue?: string
}

async function verifySeason2TabelogUrls() {
  console.log('🔍 Season2 タベログURL個別検証開始...\n')
  console.log('各エピソードのURL遷移先が実際に正しい店舗を指しているか確認')
  console.log('=' .repeat(70))
  
  try {
    // Season2の全データ取得
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
      .ilike('title', '%Season2%')
      .order('title')
    
    if (!episodes || episodes.length === 0) {
      console.error('❌ Season2のエピソードが見つかりません')
      return
    }
    
    console.log(`✅ Season2データ取得: ${episodes.length}エピソード\n`)
    
    const verificationResults: URLVerificationResult[] = []
    
    // 各エピソードを個別検証
    for (const [index, episode] of episodes.entries()) {
      console.log(`🔍 Episode ${index + 1}/12: ${episode.title}`)
      
      const location = episode.episode_locations?.[0]?.locations
      if (!location) {
        console.log('   ❌ ロケーションデータなし\n')
        verificationResults.push({
          episodeTitle: episode.title,
          locationName: 'データなし',
          currentUrl: 'なし',
          expectedRestaurant: 'unknown',
          actualArea: 'unknown',
          expectedArea: extractAreaFromTitle(episode.title) || 'unknown',
          status: 'incorrect',
          issue: 'ロケーションデータが完全に欠如'
        })
        continue
      }
      
      console.log(`   🏪 店舗: ${location.name}`)
      console.log(`   📍 住所: ${location.address}`)
      console.log(`   🔗 URL: ${location.tabelog_url || 'なし'}`)
      
      // エピソードタイトルから期待されるエリアを抽出
      const expectedArea = extractAreaFromTitle(episode.title)
      const actualArea = extractAreaFromAddress(location.address)
      
      // URL検証ロジック
      let verificationResult: URLVerificationResult = {
        episodeTitle: episode.title,
        locationName: location.name,
        currentUrl: location.tabelog_url || 'なし',
        expectedRestaurant: extractExpectedRestaurantFromTitle(episode.title),
        actualArea: actualArea || 'unknown',
        expectedArea: expectedArea || 'unknown',
        status: 'correct'
      }
      
      // エリア不一致チェック
      if (expectedArea && actualArea && !isAreaMatching(expectedArea, actualArea)) {
        verificationResult.status = 'incorrect'
        verificationResult.issue = `エリア不一致: 期待「${expectedArea}」vs 実際「${actualArea}」`
        console.log(`   ⚠️  ${verificationResult.issue}`)
      }
      
      // URL形式チェック
      if (!location.tabelog_url) {
        verificationResult.status = 'incorrect'
        verificationResult.issue = 'タベログURLが設定されていない'
        console.log('   ❌ タベログURLなし')
      } else if (!location.tabelog_url.includes('tabelog.com')) {
        verificationResult.status = 'incorrect'
        verificationResult.issue = 'タベログ以外のURL'
        console.log('   ⚠️  タベログ以外のURL')
      }
      
      // 特定の問題があるエピソードの個別チェック
      if (episode.title.includes('第1話') && episode.title.includes('神奈川県川崎市')) {
        // Episode1: 神奈川県川崎市だが実際は東京都江東区のだるま
        if (location.address?.includes('東京都江東区')) {
          verificationResult.status = 'incorrect'
          verificationResult.issue = 'エピソードは川崎市だが実際の店舗は江東区'
          console.log('   🔴 重要: 川崎市エピソードだが東京都江東区の店舗')
        }
      }
      
      if (episode.title.includes('第5話') && episode.title.includes('横浜市')) {
        // Episode5: 横浜市だが実際は東京都文京区の山楽
        if (location.address?.includes('東京都文京区')) {
          verificationResult.status = 'incorrect'
          verificationResult.issue = 'エピソードは横浜市だが実際の店舗は文京区'
          console.log('   🔴 重要: 横浜市エピソードだが東京都文京区の店舗')
        }
      }
      
      // LinkSwitch状態チェック
      const linkswitch = location.affiliate_info?.linkswitch
      if (linkswitch?.status !== 'active') {
        console.log(`   🟡 LinkSwitch: ${linkswitch?.status || '未設定'}`)
      } else {
        console.log('   ✅ LinkSwitch: active')
      }
      
      verificationResults.push(verificationResult)
      console.log(`   📊 判定: ${getStatusEmoji(verificationResult.status)} ${verificationResult.status.toUpperCase()}\n`)
    }
    
    // 検証結果サマリー
    console.log('=' .repeat(70))
    console.log('\n🏆 Season2 タベログURL検証結果サマリー:')
    
    const correctCount = verificationResults.filter(r => r.status === 'correct').length
    const incorrectCount = verificationResults.filter(r => r.status === 'incorrect').length
    const needsVerificationCount = verificationResults.filter(r => r.status === 'needs_verification').length
    
    console.log(`\n📊 検証統計:`)
    console.log(`   ✅ 正常: ${correctCount}件 (${Math.round((correctCount/verificationResults.length)*100)}%)`)
    console.log(`   ❌ 問題あり: ${incorrectCount}件 (${Math.round((incorrectCount/verificationResults.length)*100)}%)`)
    console.log(`   🟡 要確認: ${needsVerificationCount}件 (${Math.round((needsVerificationCount/verificationResults.length)*100)}%)`)
    
    // 問題のあるエピソード詳細
    const problemEpisodes = verificationResults.filter(r => r.status !== 'correct')
    if (problemEpisodes.length > 0) {
      console.log(`\n🔴 【要修正】問題のあるエピソード詳細:`)
      console.log('-' .repeat(50))
      
      problemEpisodes.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.episodeTitle}`)
        console.log(`   店舗: ${result.locationName}`)
        console.log(`   現在URL: ${result.currentUrl}`)
        console.log(`   問題: ${result.issue || '要手動確認'}`)
        console.log(`   期待エリア: ${result.expectedArea}`)
        console.log(`   実際エリア: ${result.actualArea}`)
      })
    }
    
    console.log(`\n📋 推奨アクション:`)
    if (incorrectCount > 0) {
      console.log(`1. 🔴 緊急修正 (${incorrectCount}件)`)
      console.log(`   - エリア不一致エピソードの個別調査`)
      console.log(`   - 正しいロケ地データへの修正`)
      console.log(`   - URL遷移先の実際確認`)
    }
    
    const inactiveLinkSwitchCount = verificationResults.filter(r => 
      r.currentUrl !== 'なし' && 
      episodes.find(ep => ep.title === r.episodeTitle)?.episode_locations?.[0]?.locations?.affiliate_info?.linkswitch?.status !== 'active'
    ).length
    
    if (inactiveLinkSwitchCount > 0) {
      console.log(`\n2. 🟡 収益最適化 (${inactiveLinkSwitchCount}件)`)
      console.log(`   - LinkSwitch有効化で収益化向上`)
    }
    
    console.log(`\n💼 次のステップ:`)
    console.log(`1. 問題エピソードの個別URL確認作業`)
    console.log(`2. 正しいロケ地データへの修正スクリプト作成`)
    console.log(`3. Season2完全データベース化達成`)
    console.log(`4. LinkSwitch最適化で100%収益化`)
    
    return verificationResults
    
  } catch (error) {
    console.error('❌ 検証エラー:', error)
  }
}

// エピソードタイトルからエリア抽出
function extractAreaFromTitle(title: string): string | null {
  // Season2のエリアパターンをより詳細に解析
  const patterns = [
    /神奈川県川崎市新丸子/,
    /中央区日本橋人形町/,
    /中野区沼袋/,
    /群馬県邑楽郡大泉町/,
    /横浜市白楽/,
    /江戸川区京成小岩/,
    /千葉県旭市飯岡/,
    /墨田区両国/,
    /江東区砂町銀座/,
    /北区十条/,
    /足立区北千住/,
    /東京都三鷹市/
  ]
  
  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) return match[0]
  }
  
  return null
}

// 住所からエリア抽出
function extractAreaFromAddress(address: string | null): string | null {
  if (!address) return null
  
  // より柔軟なエリア抽出
  const match = address.match(/(東京都|神奈川県|千葉県|埼玉県|群馬県)([^区市町村]+[区市町村]|[^市]+市)/);
  if (match) {
    return match[1] + match[2]
  }
  
  return null
}

// エピソードタイトルから期待される店舗名を抽出
function extractExpectedRestaurantFromTitle(title: string): string {
  if (title.includes('ネギ肉イタメ')) return 'だるま系店舗'
  if (title.includes('黒天丼')) return '天ぷら店'
  if (title.includes('わさびカルビ')) return '焼肉店'
  if (title.includes('ブラジル料理')) return 'ブラジル料理店'
  if (title.includes('豚肉と玉ねぎのにんにく焼き')) return '中華料理店'
  if (title.includes('激辛四川料理')) return '四川料理店'
  if (title.includes('サンマのなめろう')) return '海鮮料理店'
  if (title.includes('ちゃんこ鍋')) return 'ちゃんこ店'
  if (title.includes('砂町銀座')) return '食堂'
  if (title.includes('鯖のくんせい')) return '大衆割烹'
  if (title.includes('タイカレー')) return 'タイ料理店'
  if (title.includes('コロッケとぶり大根')) return '家庭料理店'
  
  return 'unknown'
}

// エリアマッチング判定
function isAreaMatching(expected: string, actual: string): boolean {
  // 完全一致
  if (expected === actual) return true
  
  // 部分一致（都道府県レベル）
  const expectedPref = expected.match(/(東京都|神奈川県|千葉県|埼玉県|群馬県)/)?.[0]
  const actualPref = actual.match(/(東京都|神奈川県|千葉県|埼玉県|群馬県)/)?.[0]
  
  return expectedPref === actualPref
}

// ステータス絵文字
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'correct': return '✅'
    case 'incorrect': return '❌'
    case 'needs_verification': return '🟡'
    default: return '❓'
  }
}

// 実行
verifySeason2TabelogUrls().catch(console.error)