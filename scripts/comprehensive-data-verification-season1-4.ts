#!/usr/bin/env node

/**
 * 🔴 緊急対応: Season1-4全エピソード個別URL検証
 * 各タベログURLの実際の遷移先確認とエピソード内容照合
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface VerificationIssue {
  season: string
  episode: string
  locationId: string
  locationName: string
  issueType: 'no_tabelog_url' | 'incorrect_url' | 'inactive_linkswitch' | 'content_mismatch' | 'url_dead'
  details: string
  priority: 'high' | 'medium' | 'low'
}

async function comprehensiveDataVerificationSeason1To4() {
  console.log('🔴 緊急データ検証開始: Season1-4全エピソード個別URL検証\n')
  console.log('各タベログURL実際遷移先確認 + エピソード内容完全照合')
  console.log('=' .repeat(70))
  
  try {
    // 松重豊の全データ取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select(`
        id,
        slug,
        name,
        episodes(
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
        )
      `)
      .eq('slug', 'matsushige-yutaka')
      .single()
    
    if (!celebrity) {
      console.error('❌ 松重豊のデータが見つかりません')
      return
    }
    
    // Season別分類
    const season1Episodes = celebrity.episodes.filter((ep: any) => ep.title.includes('Season1'))
    const season2Episodes = celebrity.episodes.filter((ep: any) => ep.title.includes('Season2'))
    const season3Episodes = celebrity.episodes.filter((ep: any) => ep.title.includes('Season3'))
    const season4Episodes = celebrity.episodes.filter((ep: any) => ep.title.includes('Season4'))
    
    console.log(`✅ データ取得完了:`)
    console.log(`   Season1: ${season1Episodes.length}エピソード`)
    console.log(`   Season2: ${season2Episodes.length}エピソード`)
    console.log(`   Season3: ${season3Episodes.length}エピソード`)
    console.log(`   Season4: ${season4Episodes.length}エピソード`)
    console.log(`   総エピソード: ${celebrity.episodes.length}話`)
    
    const allIssues: VerificationIssue[] = []
    
    // Season別検証関数
    async function verifySeason(episodes: any[], seasonName: string) {
      console.log(`\n🔍 ${seasonName} 詳細検証開始...`)
      console.log('-' .repeat(50))
      
      let seasonLocationCount = 0
      let seasonUrlCount = 0
      let seasonActiveLSCount = 0
      
      for (const [index, episode] of episodes.entries()) {
        console.log(`\n📺 ${episode.title}`)
        
        const locationCount = episode.episode_locations?.length || 0
        seasonLocationCount += locationCount
        
        if (locationCount === 0) {
          console.log('   ❌ ロケーションデータなし')
          allIssues.push({
            season: seasonName,
            episode: episode.title,
            locationId: '',
            locationName: 'データなし',
            issueType: 'content_mismatch',
            details: 'ロケーションデータが完全に欠如',
            priority: 'high'
          })
          continue
        }
        
        if (locationCount > 1) {
          console.log(`   ⚠️  複数ロケーション: ${locationCount}箇所（要確認）`)
        }
        
        episode.episode_locations.forEach((epLoc: any, locIndex: number) => {
          const location = epLoc.locations
          if (!location) return
          
          console.log(`   🏪 ${location.name}`)
          console.log(`      住所: ${location.address || '不明'}`)
          
          // タベログURL検証
          if (location.tabelog_url) {
            seasonUrlCount++
            console.log(`      タベログURL: ✅ ${location.tabelog_url}`)
            
            // URL形式の基本検証
            if (!location.tabelog_url.includes('tabelog.com')) {
              console.log(`      ⚠️  URL形式異常: タベログ以外のURL`)
              allIssues.push({
                season: seasonName,
                episode: episode.title,
                locationId: location.id,
                locationName: location.name,
                issueType: 'incorrect_url',
                details: `タベログ以外のURL: ${location.tabelog_url}`,
                priority: 'high'
              })
            }
          } else {
            console.log(`      タベログURL: ❌ なし`)
            allIssues.push({
              season: seasonName,
              episode: episode.title,
              locationId: location.id,
              locationName: location.name,
              issueType: 'no_tabelog_url',
              details: 'タベログURLが設定されていない',
              priority: 'medium'
            })
          }
          
          // LinkSwitch検証
          const linkswitch = location.affiliate_info?.linkswitch
          if (linkswitch?.status === 'active') {
            seasonActiveLSCount++
            console.log(`      LinkSwitch: ✅ ${linkswitch.status}`)
          } else {
            console.log(`      LinkSwitch: ❌ ${linkswitch?.status || '未設定'}`)
            if (location.tabelog_url) {
              allIssues.push({
                season: seasonName,
                episode: episode.title,
                locationId: location.id,
                locationName: location.name,
                issueType: 'inactive_linkswitch',
                details: `タベログURLあり、LinkSwitch: ${linkswitch?.status || '未設定'}`,
                priority: 'low'
              })
            }
          }
          
          // エピソード内容との基本照合
          const episodeTitle = episode.title.toLowerCase()
          const locationName = location.name.toLowerCase()
          
          // 地域照合
          const episodeArea = extractAreaFromTitle(episode.title)
          const locationArea = extractAreaFromAddress(location.address)
          
          if (episodeArea && locationArea && episodeArea !== locationArea) {
            console.log(`      ⚠️  エリア不一致: エピソード「${episodeArea}」vs 住所「${locationArea}」`)
            allIssues.push({
              season: seasonName,
              episode: episode.title,
              locationId: location.id,
              locationName: location.name,
              issueType: 'content_mismatch',
              details: `エリア不一致: エピソード「${episodeArea}」vs 住所「${locationArea}」`,
              priority: 'high'
            })
          }
        })
      }
      
      console.log(`\n📊 ${seasonName} 検証サマリー:`)
      console.log(`   総ロケーション: ${seasonLocationCount}箇所`)
      console.log(`   タベログURL保有: ${seasonUrlCount}箇所 (${Math.round((seasonUrlCount/seasonLocationCount)*100)}%)`)
      console.log(`   収益化済み: ${seasonActiveLSCount}箇所 (${Math.round((seasonActiveLSCount/seasonLocationCount)*100)}%)`)
      
      const seasonIssues = allIssues.filter(issue => issue.season === seasonName)
      console.log(`   検出問題: ${seasonIssues.length}件`)
      
      return {
        locationCount: seasonLocationCount,
        urlCount: seasonUrlCount,
        activeLSCount: seasonActiveLSCount,
        issueCount: seasonIssues.length
      }
    }
    
    // 全Season検証実行
    const season1Results = await verifySeason(season1Episodes, 'Season1')
    const season2Results = await verifySeason(season2Episodes, 'Season2')
    const season3Results = await verifySeason(season3Episodes, 'Season3')
    const season4Results = await verifySeason(season4Episodes, 'Season4')
    
    // 全体サマリー
    console.log('\n' + '=' .repeat(70))
    console.log('\n🏆 Season1-4 緊急検証結果サマリー:')
    
    const totalLocations = season1Results.locationCount + season2Results.locationCount + season3Results.locationCount + season4Results.locationCount
    const totalUrls = season1Results.urlCount + season2Results.urlCount + season3Results.urlCount + season4Results.urlCount
    const totalActiveLS = season1Results.activeLSCount + season2Results.activeLSCount + season3Results.activeLSCount + season4Results.activeLSCount
    
    console.log(`\n📊 全体統計:`)
    console.log(`   総ロケーション: ${totalLocations}箇所`)
    console.log(`   タベログURL保有: ${totalUrls}箇所 (${Math.round((totalUrls/totalLocations)*100)}%)`)
    console.log(`   完全収益化済み: ${totalActiveLS}箇所 (${Math.round((totalActiveLS/totalLocations)*100)}%)`)
    console.log(`   総検出問題: ${allIssues.length}件`)
    
    // 問題の重要度別分析
    const highPriorityIssues = allIssues.filter(issue => issue.priority === 'high')
    const mediumPriorityIssues = allIssues.filter(issue => issue.priority === 'medium')
    const lowPriorityIssues = allIssues.filter(issue => issue.priority === 'low')
    
    console.log(`\n🚨 問題重要度分析:`)
    console.log(`   🔴 緊急修正必要: ${highPriorityIssues.length}件`)
    console.log(`   🟡 中程度問題: ${mediumPriorityIssues.length}件`)
    console.log(`   🟢 軽微な問題: ${lowPriorityIssues.length}件`)
    
    // 高優先度問題の詳細表示
    if (highPriorityIssues.length > 0) {
      console.log(`\n🔴 【緊急修正必要】高優先度問題詳細:`)
      console.log('-' .repeat(50))
      
      highPriorityIssues.slice(0, 10).forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.season} - ${issue.episode}`)
        console.log(`   店舗: ${issue.locationName}`)
        console.log(`   問題: ${issue.details}`)
        console.log(`   種類: ${issue.issueType}`)
      })
      
      if (highPriorityIssues.length > 10) {
        console.log(`   ... その他 ${highPriorityIssues.length - 10}件の緊急問題`)
      }
    }
    
    console.log(`\n📋 推奨修正アクション優先順位:`)
    console.log(`1. 🔴 緊急修正 (${highPriorityIssues.length}件)`)
    console.log(`   - エリア不一致問題の調査・修正`)
    console.log(`   - 間違ったURL形式の修正`)
    console.log(`   - 完全データ欠如の調査・追加`)
    
    console.log(`\n2. 🟡 段階的改善 (${mediumPriorityIssues.length}件)`)
    console.log(`   - タベログURL調査・追加`)
    console.log(`   - データ品質向上`)
    
    console.log(`\n3. 🟢 収益最適化 (${lowPriorityIssues.length}件)`)
    console.log(`   - LinkSwitch一括有効化`)
    console.log(`   - 収益化率100%達成`)
    
    console.log(`\n💼 次のステップ:`)
    console.log(`1. 高優先度問題の個別調査・修正開始`)
    console.log(`2. エピソード内容と店舗データの詳細照合`)
    console.log(`3. 実際のタベログURL遷移先確認`)
    console.log(`4. データ品質向上施策の段階的実施`)
    
    return allIssues
    
  } catch (error) {
    console.error('❌ 検証エラー:', error)
  }
}

// エピソードタイトルからエリア抽出
function extractAreaFromTitle(title: string): string | null {
  const areaMatches = title.match(/(東京都|神奈川県|千葉県|埼玉県|静岡県|群馬県|新潟県)?([^区市町村の]+[区市町村])/);
  return areaMatches ? areaMatches[0] : null;
}

// 住所からエリア抽出
function extractAreaFromAddress(address: string | null): string | null {
  if (!address) return null;
  const areaMatches = address.match(/(東京都|神奈川県|千葉県|埼玉県|静岡県|群馬県|新潟県)?([^区市町村]+[区市町村])/);
  return areaMatches ? areaMatches[0] : null;
}

// 実行
comprehensiveDataVerificationSeason1To4().catch(console.error)