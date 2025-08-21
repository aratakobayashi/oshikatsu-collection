#!/usr/bin/env npx tsx

/**
 * 食べログ店舗URL自動検索ツール
 * 
 * ロケーションデータから食べログの店舗URLを自動的に見つけるスクリプト
 * Google検索APIやスクレイピングを使用して効率的に店舗を特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 本番環境の設定を読み込み
dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface SearchResult {
  location_id: string
  location_name: string
  address: string
  search_query: string
  tabelog_urls: string[]
  confidence_score: number
  manual_review_needed: boolean
}

class TabelogSearchAutomation {
  private delay = 1000 // リクエスト間隔（ミリ秒）
  
  /**
   * Google検索で食べログURLを検索
   * 注意: Google Custom Search APIキーが必要
   */
  async searchWithGoogle(query: string): Promise<string[]> {
    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID
    
    if (!googleApiKey || !searchEngineId) {
      console.log('⚠️  Google検索APIキーが設定されていません。手動検索モードに切り替えます。')
      return []
    }
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query + ' site:tabelog.com')}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.items) {
        return data.items
          .map((item: any) => item.link)
          .filter((link: string) => link.includes('tabelog.com'))
          .slice(0, 5) // 上位5件まで
      }
      
      return []
    } catch (error) {
      console.error('Google検索エラー:', error)
      return []
    }
  }
  
  /**
   * 店舗名と住所から食べログ検索クエリを生成
   */
  generateSearchQueries(locationName: string, address: string): string[] {
    const queries: string[] = []
    
    // 基本検索
    queries.push(`${locationName} ${address}`)
    
    // 住所の都道府県・区市町村のみ
    const prefectureMatch = address.match(/^(.*?[都道府県市区町村])/)
    if (prefectureMatch) {
      queries.push(`${locationName} ${prefectureMatch[1]}`)
    }
    
    // 店舗名のみ + 食べログ
    queries.push(`${locationName} 食べログ`)
    
    // 店舗名から特殊文字を除去
    const cleanedName = locationName.replace(/[【】()（）・]/g, '').trim()
    if (cleanedName !== locationName) {
      queries.push(`${cleanedName} ${address}`)
    }
    
    return queries.slice(0, 3) // 最大3パターン
  }
  
  /**
   * 食べログURLの信頼度を評価
   */
  evaluateConfidence(locationName: string, address: string, tabelogUrl: string): number {
    let score = 0
    
    // URLに店舗名の一部が含まれている
    const urlPath = tabelogUrl.toLowerCase()
    const nameWords = locationName.toLowerCase().split(/[\s・]/g)
    
    nameWords.forEach(word => {
      if (word.length > 1 && urlPath.includes(word)) {
        score += 20
      }
    })
    
    // URLに地域情報が含まれている
    if (address) {
      const addressParts = address.match(/(東京|大阪|京都|神奈川|埼玉|千葉|兵庫|愛知|福岡|北海道)/g)
      if (addressParts && addressParts.some(part => urlPath.includes(part.toLowerCase()))) {
        score += 15
      }
      
      const cityMatch = address.match(/([市区町村])/)
      if (cityMatch && urlPath.includes(cityMatch[0])) {
        score += 10
      }
    }
    
    // 基本的な食べログURLの構造チェック
    if (/tabelog\.com\/[^\/]+\/[^\/]+\/[^\/]+\/\d+/.test(tabelogUrl)) {
      score += 30
    }
    
    return Math.min(score, 100)
  }
  
  /**
   * 単一ロケーションの食べログURLを検索
   */
  async searchSingleLocation(
    locationId: string,
    locationName: string,
    address: string
  ): Promise<SearchResult> {
    console.log(`🔍 検索中: ${locationName}`)
    
    const queries = this.generateSearchQueries(locationName, address)
    const allResults: string[] = []
    
    for (const query of queries) {
      console.log(`   クエリ: ${query}`)
      
      // Google検索を試行
      const googleResults = await this.searchWithGoogle(query)
      allResults.push(...googleResults)
      
      // レート制限を避けるため待機
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }
    
    // 重複を除去し、信頼度でソート
    const uniqueUrls = [...new Set(allResults)]
    const scoredUrls = uniqueUrls.map(url => ({
      url,
      score: this.evaluateConfidence(locationName, address, url)
    })).sort((a, b) => b.score - a.score)
    
    const topScore = scoredUrls[0]?.score || 0
    
    return {
      location_id: locationId,
      location_name: locationName,
      address: address,
      search_query: queries.join(' / '),
      tabelog_urls: scoredUrls.map(item => item.url),
      confidence_score: topScore,
      manual_review_needed: topScore < 50 || scoredUrls.length === 0
    }
  }
  
  /**
   * 複数ロケーションの一括検索
   */
  async bulkSearchLocations(locationIds?: string[]): Promise<SearchResult[]> {
    try {
      let query = supabase
        .from('locations')
        .select('id, name, address')
        .not('address', 'is', null)
      
      if (locationIds) {
        query = query.in('id', locationIds)
      } else {
        // 飲食店らしいロケーションのみをフィルタリング
        query = query.or('name.ilike.%レストラン%,name.ilike.%カフェ%,name.ilike.%料理%,name.ilike.%食%')
        query = query.limit(50) // 初回は50件に制限
      }
      
      const { data: locations, error } = await query
      
      if (error) {
        console.error('❌ データ取得エラー:', error)
        return []
      }
      
      if (!locations || locations.length === 0) {
        console.log('対象ロケーションが見つかりません')
        return []
      }
      
      console.log(`📊 ${locations.length}件のロケーションを処理します`)
      console.log('⚠️  Google検索APIの制限により、処理には時間がかかる場合があります')
      
      const results: SearchResult[] = []
      
      for (const location of locations) {
        const result = await this.searchSingleLocation(
          location.id,
          location.name,
          location.address || ''
        )
        results.push(result)
        
        // 進行状況を表示
        console.log(`   ${result.confidence_score}% 信頼度 - ${result.tabelog_urls.length}件見つかりました`)
        
        // API制限を考慮して待機
        await new Promise(resolve => setTimeout(resolve, this.delay))
      }
      
      return results
      
    } catch (error) {
      console.error('❌ 一括検索エラー:', error)
      return []
    }
  }
  
  /**
   * 検索結果をCSVファイルにエクスポート
   */
  async exportResultsToCsv(results: SearchResult[], filename: string = 'tabelog-search-results.csv') {
    try {
      const csvData = [
        'ロケーションID,店舗名,住所,信頼度,食べログURL1,食べログURL2,食べログURL3,手動確認必要,検索クエリ',
        ...results.map(result => {
          const urls = result.tabelog_urls.slice(0, 3)
          while (urls.length < 3) urls.push('')
          
          return [
            result.location_id,
            `"${result.location_name}"`,
            `"${result.address}"`,
            result.confidence_score,
            `"${urls[0]}"`,
            `"${urls[1]}"`,
            `"${urls[2]}"`,
            result.manual_review_needed ? 'はい' : 'いいえ',
            `"${result.search_query}"`
          ].join(',')
        })
      ].join('\n')
      
      const fs = await import('fs')
      const outputPath = resolve(__dirname, `../${filename}`)
      fs.writeFileSync(outputPath, csvData, 'utf-8')
      
      console.log(`✅ 検索結果をCSVに保存: ${outputPath}`)
      
      // 統計情報を表示
      const highConfidence = results.filter(r => r.confidence_score >= 70).length
      const mediumConfidence = results.filter(r => r.confidence_score >= 40 && r.confidence_score < 70).length
      const needReview = results.filter(r => r.manual_review_needed).length
      
      console.log('\n📊 検索結果統計:')
      console.log(`  高信頼度 (70%+): ${highConfidence}件`)
      console.log(`  中信頼度 (40-69%): ${mediumConfidence}件`)
      console.log(`  手動確認必要: ${needReview}件`)
      
    } catch (error) {
      console.error('❌ CSV出力エラー:', error)
    }
  }
}

// メイン処理
async function main() {
  const automation = new TabelogSearchAutomation()
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
食べログ店舗URL自動検索ツール

使用方法:
  npx tsx src/scripts/tabelog-search-automation.ts --action <action> [options]

アクション:
  search         全ての飲食店ロケーションを検索
  search-ids     指定されたIDのロケーションを検索
  search-single  単一ロケーションを検索

例:
  npx tsx src/scripts/tabelog-search-automation.ts --action search
  npx tsx src/scripts/tabelog-search-automation.ts --action search-ids --ids id1,id2,id3
  npx tsx src/scripts/tabelog-search-automation.ts --action search-single --id location_id

注意:
  - Google Custom Search APIキーの設定が推奨されます
  - 大量の検索を行う場合はAPI制限にご注意ください
    `)
    return
  }
  
  const actionIndex = args.indexOf('--action')
  if (actionIndex === -1) {
    console.error('❌ --action パラメータが必要です')
    return
  }
  
  const action = args[actionIndex + 1]
  
  switch (action) {
    case 'search':
      console.log('🚀 全ロケーションの食べログURL検索を開始します')
      const allResults = await automation.bulkSearchLocations()
      if (allResults.length > 0) {
        await automation.exportResultsToCsv(allResults)
      }
      break
      
    case 'search-ids':
      const idsIndex = args.indexOf('--ids')
      if (idsIndex === -1) {
        console.error('❌ --ids パラメータが必要です')
        return
      }
      const ids = args[idsIndex + 1].split(',')
      console.log(`🚀 指定された${ids.length}件のロケーションを検索します`)
      const idResults = await automation.bulkSearchLocations(ids)
      if (idResults.length > 0) {
        await automation.exportResultsToCsv(idResults, 'tabelog-search-specific.csv')
      }
      break
      
    case 'search-single':
      const idIndex = args.indexOf('--id')
      if (idIndex === -1) {
        console.error('❌ --id パラメータが必要です')
        return
      }
      const locationId = args[idIndex + 1]
      
      const { data: location } = await supabase
        .from('locations')
        .select('name, address')
        .eq('id', locationId)
        .single()
      
      if (!location) {
        console.error('❌ ロケーションが見つかりません')
        return
      }
      
      const singleResult = await automation.searchSingleLocation(
        locationId,
        location.name,
        location.address || ''
      )
      
      console.log('\n📋 検索結果:')
      console.log(`店舗: ${singleResult.location_name}`)
      console.log(`信頼度: ${singleResult.confidence_score}%`)
      console.log(`見つかったURL数: ${singleResult.tabelog_urls.length}件`)
      
      singleResult.tabelog_urls.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`)
      })
      
      if (singleResult.manual_review_needed) {
        console.log('⚠️  手動確認が推奨されます')
      }
      break
      
    default:
      console.error(`❌ 不明なアクション: ${action}`)
  }
}

// エラーハンドリング
main().catch(console.error)