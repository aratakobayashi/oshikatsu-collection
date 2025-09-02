#!/usr/bin/env node

/**
 * Season4 Episode5-8 データ問題一括分析
 * 各エピソードの間違ったデータを詳細分析し、正しいロケ地調査の優先順位を決定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeSeason4Episodes5To8DataIssues() {
  console.log('🔍 Season4 Episode5-8 データ問題一括分析...\n')
  console.log('各エピソードの間違ったデータ詳細分析と修正優先順位決定')
  console.log('=' .repeat(60))
  
  try {
    // Season4 Episode5-8を取得
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
            description
          )
        )
      `)
      .ilike('title', '%Season4%')
      .in('title', [
        '孤独のグルメ Season4 第5話「愛知県知多郡日間賀島のしらすの天ぷらとたこめし」',
        '孤独のグルメ Season4 第6話「東京都江東区木場のチーズクルチャとラムミントカレー」',
        '孤独のグルメ Season4 第7話「台東区鳥越の明太クリームパスタとかつサンド」',
        '孤独のグルメ Season4 第8話「杉並区阿佐ヶ谷のオックステールスープとアサイーボウル」'
      ])
    
    if (!episodes || episodes.length === 0) {
      console.error('❌ Season4 Episode5-8が見つかりません')
      return
    }
    
    console.log(`✅ 取得したエピソード: ${episodes.length}話`)
    
    const dataIssues: any[] = []
    
    // 各エピソードを分析
    episodes.forEach((episode: any) => {
      const episodeNumber = episode.title.match(/第(\d+)話/)?.[1]
      console.log(`\n📺 Episode${episodeNumber}: ${episode.title}`)
      
      const locationCount = episode.episode_locations?.length || 0
      console.log(`   ロケーション数: ${locationCount}`)
      
      if (locationCount === 0) {
        console.log('   ❌ ロケーションデータなし')
        dataIssues.push({
          episode: episodeNumber,
          title: episode.title,
          issue: 'no_location_data',
          priority: 'high',
          details: 'ロケーションデータが完全に欠如'
        })
        return
      }
      
      const location = episode.episode_locations[0].locations
      if (!location) {
        console.log('   ❌ ロケーション詳細なし')
        return
      }
      
      console.log(`   🏪 現在の店舗: ${location.name}`)
      console.log(`   📍 現在の住所: ${location.address}`)
      console.log(`   🔗 タベログURL: ${location.tabelog_url || 'なし'}`)
      
      // エピソードタイトルから期待される情報を抽出
      const titleAnalysis = analyzeTitleContent(episode.title)
      const locationAnalysis = analyzeLocationData(location)
      
      console.log(`\n   📋 期待vs実際の比較:`)
      console.log(`   期待エリア: ${titleAnalysis.expectedArea}`)
      console.log(`   実際エリア: ${locationAnalysis.actualArea}`)
      console.log(`   期待料理: ${titleAnalysis.expectedCuisine}`)
      console.log(`   実際料理: ${locationAnalysis.actualCuisine}`)
      
      // 不一致を検出
      const areaMatch = titleAnalysis.expectedArea === locationAnalysis.actualArea
      const cuisineMatch = titleAnalysis.expectedCuisine.some((expected: string) => 
        locationAnalysis.actualCuisine.some((actual: string) => 
          actual.includes(expected) || expected.includes(actual)
        )
      )
      
      let issueLevel = 'none'
      let issues = []
      
      if (!areaMatch) {
        issues.push(`エリア不一致: 期待「${titleAnalysis.expectedArea}」vs 実際「${locationAnalysis.actualArea}」`)
        issueLevel = 'high'
      }
      
      if (!cuisineMatch) {
        issues.push(`料理ジャンル不一致: 期待「${titleAnalysis.expectedCuisine.join(',')}」vs 実際「${locationAnalysis.actualCuisine.join(',')}」`)
        if (issueLevel !== 'high') issueLevel = 'medium'
      }
      
      if (!location.tabelog_url) {
        issues.push('タベログURL欠如')
        if (issueLevel === 'none') issueLevel = 'low'
      }
      
      if (issues.length > 0) {
        console.log(`   ⚠️ 問題: ${issues.join(', ')}`)
        dataIssues.push({
          episode: episodeNumber,
          title: episode.title,
          currentLocation: {
            name: location.name,
            address: location.address,
            tabelog_url: location.tabelog_url
          },
          expectedInfo: titleAnalysis,
          issues: issues,
          issue: issues.length > 1 ? 'multiple_issues' : 'single_issue',
          priority: issueLevel,
          details: issues.join(' & ')
        })
      } else {
        console.log(`   ✅ データ品質良好`)
      }
    })
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n📊 Season4 Episode5-8 問題分析結果:')
    
    const highPriorityIssues = dataIssues.filter(issue => issue.priority === 'high')
    const mediumPriorityIssues = dataIssues.filter(issue => issue.priority === 'medium')
    const lowPriorityIssues = dataIssues.filter(issue => issue.priority === 'low')
    
    console.log(`\n🚨 問題重要度別サマリー:`)
    console.log(`   🔴 緊急修正必要: ${highPriorityIssues.length}件`)
    console.log(`   🟡 修正推奨: ${mediumPriorityIssues.length}件`)
    console.log(`   🟢 軽微な問題: ${lowPriorityIssues.length}件`)
    
    if (highPriorityIssues.length > 0) {
      console.log(`\n🔴 緊急修正必要な問題:`)
      highPriorityIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. Episode${issue.episode}: ${issue.details}`)
        console.log(`   期待: ${issue.expectedInfo?.expectedArea} - ${issue.expectedInfo?.expectedCuisine.join(',')}`)
        if (issue.currentLocation) {
          console.log(`   現在: ${issue.currentLocation.name} (${issue.currentLocation.address})`)
        }
      })
    }
    
    if (mediumPriorityIssues.length > 0) {
      console.log(`\n🟡 修正推奨な問題:`)
      mediumPriorityIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. Episode${issue.episode}: ${issue.details}`)
        console.log(`   期待: ${issue.expectedInfo?.expectedArea} - ${issue.expectedInfo?.expectedCuisine.join(',')}`)
        if (issue.currentLocation) {
          console.log(`   現在: ${issue.currentLocation.name} (${issue.currentLocation.address})`)
        }
      })
    }
    
    console.log(`\n📋 修正優先順位:`)
    console.log(`1. 🔴 Episode5: 愛知県日間賀島しらす天ぷら → 現在「韓美膳（豊島区韓国料理）」`)
    console.log(`2. 🔴 Episode6: 東京江東区木場インドカレー → 現在「天麩羅さかい（銀座天ぷら）」`)
    console.log(`3. 🔴 Episode7: 台東区鳥越パスタ → 現在「エチオピア（新宿カレー）」`)
    console.log(`4. 🔴 Episode8: 杉並区阿佐ヶ谷ハワイアン → 現在「川豊（浅草うなぎ）」`)
    
    console.log(`\n💡 推奨修正戦略:`)
    console.log(`   戦略A: エピソード順に1つずつ丁寧に修正`)
    console.log(`   戦略B: 調査が容易なものから優先的に修正`)
    console.log(`   戦略C: 影響度の大きいもの（タベログURL有無）から修正`)
    
    console.log(`\n🎯 次のアクション:`)
    console.log(`1. Episode5「日間賀島しらす天ぷら」の正しいロケ地調査`)
    console.log(`2. 実際の店舗情報・タベログURL取得`)
    console.log(`3. データ修正・LinkSwitch設定`)
    console.log(`4. Episode6-8も同様に順次対応`)
    
    return dataIssues
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// エピソードタイトル分析
function analyzeTitleContent(title: string) {
  const areaMatch = title.match(/(東京都|神奈川県|千葉県|埼玉県|愛知県|静岡県|群馬県|新潟県|台東区|江東区|杉並区|渋谷区|中央区|足柄下郡|知多郡|八王子市|[\u4e00-\u9fa5]+区|[\u4e00-\u9fa5]+市|[\u4e00-\u9fa5]+町|[\u4e00-\u9fa5]+島)/);
  const expectedArea = areaMatch ? areaMatch[1] : '不明'
  
  // 料理キーワード抽出
  const cuisineKeywords = []
  if (title.includes('しらす') || title.includes('天ぷら')) cuisineKeywords.push('海鮮', '天ぷら')
  if (title.includes('カレー')) cuisineKeywords.push('カレー', 'インド料理')
  if (title.includes('パスタ')) cuisineKeywords.push('パスタ', 'イタリアン')
  if (title.includes('オックステール') || title.includes('アサイーボウル')) cuisineKeywords.push('ハワイアン', 'スープ')
  
  return {
    expectedArea,
    expectedCuisine: cuisineKeywords
  }
}

// ロケーションデータ分析
function analyzeLocationData(location: any) {
  const address = location.address || ''
  const areaMatch = address.match(/(東京都|神奈川県|千葉県|埼玉県|愛知県|静岡県|群馬県|新潟県|台東区|江東区|杉並区|渋谷区|中央区|足柄下郡|知多郡|八王子市|[\u4e00-\u9fa5]+区|[\u4e00-\u9fa5]+市|[\u4e00-\u9fa5]+町|[\u4e00-\u9fa5]+島)/)
  const actualArea = areaMatch ? areaMatch[1] : address
  
  // 店名から料理ジャンル推測
  const name = location.name || ''
  const cuisineKeywords = []
  
  if (name.includes('韓') || name.includes('Korean')) cuisineKeywords.push('韓国料理')
  if (name.includes('天麩羅') || name.includes('天ぷら')) cuisineKeywords.push('天ぷら')
  if (name.includes('エチオピア') || name.includes('カレー')) cuisineKeywords.push('カレー')
  if (name.includes('うなぎ') || name.includes('川豊')) cuisineKeywords.push('うなぎ')
  if (name.includes('イタリア')) cuisineKeywords.push('イタリアン')
  
  return {
    actualArea,
    actualCuisine: cuisineKeywords
  }
}

// 実行
analyzeSeason4Episodes5To8DataIssues().catch(console.error)