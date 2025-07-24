// src/scripts/data-collection/step1-episode-search.ts

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数読み込み（Node.js環境用）
dotenv.config({ path: '.env.local' })

// 環境変数（VITE_プレフィックスを除去）
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY!
const GOOGLE_SEARCH_ENGINE_ID = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID!

// デバッグ用（環境変数チェック）
console.log('🔍 Environment Variables Check:')
console.log(`SUPABASE_URL: ${SUPABASE_URL ? '✅ SET' : '❌ NOT SET'}`)
console.log(`SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET'}`)
console.log(`GOOGLE_API_KEY: ${GOOGLE_API_KEY ? '✅ SET' : '❌ NOT SET'}`)
console.log(`GOOGLE_SEARCH_ENGINE_ID: ${GOOGLE_SEARCH_ENGINE_ID ? '✅ SET' : '❌ NOT SET'}`)
console.log('---')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 型定義
interface Episode {
  id: string
  celebrity_id: string
  title: string
  date: string
  platform: string
  celebrity?: {
    name: string
  }
}

interface SupabaseEpisode {
  id: string
  title: string
  date: string
  platform: string
  celebrity: {
    name: string
  }[]
}

interface GoogleSearchItem {
  title: string
  snippet: string
  link: string
  displayLink: string
}

interface SearchQuery {
  query: string
  type: 'fashion' | 'location' | 'general'
  priority: number
}

interface SearchResult {
  title: string
  snippet: string
  link: string
  displayLink: string
}

interface Step1Output {
  episode_id: string
  search_results: SearchResult[]
  query_count: number
  api_quota_remaining: number
  processing_time: number
}

// **Step 1.1: 検索クエリ生成ロジック**
export const generateSearchQueries = (episode: Episode): SearchQuery[] => {
  const celebrity_name = episode.celebrity?.name || ''
  const title = episode.title
  const platform = episode.platform

  const queries: SearchQuery[] = []

  // 1. ファッション・アイテム系クエリ（最優先）
  queries.push({
    query: `${celebrity_name} ${title} 衣装 ファッション ブランド`,
    type: 'fashion',
    priority: 1
  })

  queries.push({
    query: `${celebrity_name} ${title} 着用 アイテム 服 バッグ`,
    type: 'fashion', 
    priority: 2
  })

  // 2. ロケーション系クエリ
  queries.push({
    query: `${title} 撮影地 ロケ地 場所`,
    type: 'location',
    priority: 3
  })

  queries.push({
    query: `${celebrity_name} ${title} レストラン カフェ`,
    type: 'location',
    priority: 4
  })

  // 3. 一般情報クエリ
  if (platform) {
    queries.push({
      query: `${celebrity_name} ${platform} ${title} 情報`,
      type: 'general',
      priority: 5
    })
  }

  // プラットフォーム別特化クエリ
  if (platform === 'youtube') {
    queries.push({
      query: `${celebrity_name} YouTube ${title} 紹介 商品`,
      type: 'fashion',
      priority: 2
    })
  }

  return queries.sort((a, b) => a.priority - b.priority).slice(0, 4) // 上位4つに限定
}

// **Step 1.2: Google Custom Search実行**
export const executeGoogleSearch = async (query: string): Promise<SearchResult[]> => {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=10`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (!data.items) {
      console.warn(`No search results for query: ${query}`)
      return []
    }

    return data.items.map((item: GoogleSearchItem) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      displayLink: item.displayLink
    }))
  } catch (error) {
    console.error('Google Search API Error:', error)
    return []
  }
}

// **Step 1.3: メイン処理関数**
export const processEpisodeStep1 = async (episode: Episode): Promise<Step1Output> => {
  const startTime = Date.now()
  
  console.log(`🔍 Processing Episode: ${episode.title} (${episode.celebrity?.name})`)
  
  // 1.1 検索クエリ生成
  const searchQueries = generateSearchQueries(episode)
  console.log(`📝 Generated ${searchQueries.length} search queries`)
  
  // 1.2 各クエリで検索実行
  const allSearchResults: SearchResult[] = []
  let queryCount = 0
  
  for (const searchQuery of searchQueries) {
    console.log(`🔎 Searching: ${searchQuery.query}`)
    
    const results = await executeGoogleSearch(searchQuery.query)
    allSearchResults.push(...results)
    queryCount++
    
    // API制限対策: 1秒待機
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log(`✅ Found ${results.length} results`)
  }
  
  const processingTime = Date.now() - startTime
  
  // API残枠計算（月3000クエリ想定）
  const apiQuotaRemaining = 3000 - queryCount // 簡易計算
  
  const output: Step1Output = {
    episode_id: episode.id,
    search_results: allSearchResults,
    query_count: queryCount,
    api_quota_remaining: apiQuotaRemaining,
    processing_time: processingTime
  }
  
  console.log(`🎯 Step 1 Complete: ${allSearchResults.length} total results in ${processingTime}ms`)
  
  return output
}

// **Step 1.4: バッチ処理（複数エピソード）**
export const processMultipleEpisodesStep1 = async (limit: number = 10): Promise<Step1Output[]> => {
  console.log(`🚀 Starting Step 1 batch processing for ${limit} episodes`)
  
  // Supabaseからエピソード取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      date,
      platform,
      celebrity:celebrities(name)
    `)
    .limit(limit)
  
  if (error) {
    console.error('Failed to fetch episodes:', error)
    return []
  }
  
  if (!episodes || episodes.length === 0) {
    console.log('No episodes found')
    return []
  }
  
  console.log(`📊 Found ${episodes.length} episodes to process`)
  
  const results: Step1Output[] = []
  
  for (const supabaseEpisode of episodes) {
    try {
      // SupabaseEpisodeをEpisodeに変換
      const episode: Episode = {
        id: (supabaseEpisode as SupabaseEpisode).id,
        celebrity_id: '', // Supabaseクエリでは取得していないので空文字
        title: (supabaseEpisode as SupabaseEpisode).title,
        date: (supabaseEpisode as SupabaseEpisode).date,
        platform: (supabaseEpisode as SupabaseEpisode).platform,
        celebrity: Array.isArray((supabaseEpisode as SupabaseEpisode).celebrity) && (supabaseEpisode as SupabaseEpisode).celebrity.length > 0 
          ? { name: (supabaseEpisode as SupabaseEpisode).celebrity[0].name }
          : undefined
      }
      
      const result = await processEpisodeStep1(episode)
      results.push(result)
      
      // プログレス表示
      console.log(`📈 Progress: ${results.length}/${episodes.length} episodes processed`)
      
      // API制限対策: エピソード間で2秒待機
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`Failed to process episode ${supabaseEpisode.id}:`, error)
    }
  }
  
  console.log(`🎉 Step 1 batch processing complete: ${results.length} episodes processed`)
  
  return results
}

// **Step 1.5: 結果保存（オプション）**
export const saveStep1Results = async (results: Step1Output[]): Promise<void> => {
  const fileName = `step1-results-${new Date().toISOString().split('T')[0]}.json`
  const jsonData = JSON.stringify(results, null, 2)
  
  // Node.js環境の場合
  if (typeof window === 'undefined') {
    // Dynamic import for Node.js environment
    const fs = await import('fs')
    fs.writeFileSync(`./data/${fileName}`, jsonData)
    console.log(`💾 Results saved to ./data/${fileName}`)
  } else {
    // ブラウザ環境の場合はダウンロード
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    console.log(`💾 Results downloaded as ${fileName}`)
  }
}

// **Step 1.6: テスト関数**
export const testStep1 = async (): Promise<void> => {
  console.log('🧪 Testing Step 1 implementation...')
  
  // テスト用エピソード
  const testEpisode: Episode = {
    id: 'test-123',
    celebrity_id: 'celebrity-123',
    title: '逃げるは恥だが役に立つ',
    date: '2016-10-25',
    platform: 'TBS',
    celebrity: {
      name: '新垣結衣'
    }
  }
  
  const result = await processEpisodeStep1(testEpisode)
  
  console.log('🎯 Test Results:')
  console.log(`- Episode ID: ${result.episode_id}`)
  console.log(`- Search Results: ${result.search_results.length}`)
  console.log(`- Queries Used: ${result.query_count}`)
  console.log(`- Processing Time: ${result.processing_time}ms`)
  console.log(`- API Quota Remaining: ${result.api_quota_remaining}`)
  
  // サンプル結果表示
  if (result.search_results.length > 0) {
    console.log('\n📋 Sample Search Results:')
    result.search_results.slice(0, 3).forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`)
      console.log(`   ${item.snippet}`)
      console.log(`   ${item.link}`)
      console.log('')
    })
  }
}

// **使用例・実行用**
// Node.js環境でのメイン実行関数
const main = async () => {
  console.log('🚀 Step 1 実行開始...\n')
  
  try {
    // テスト実行
    await testStep1()
    
    console.log('\n📊 実際のエピソードで3件処理...')
    // 実際のエピソード3件で処理
    const results = await processMultipleEpisodesStep1(3)
    
    if (results.length > 0) {
      console.log(`\n🎉 処理完了! ${results.length}件のエピソードを処理しました`)
      
      // 結果サマリー
      const totalResults = results.reduce((sum, r) => sum + r.search_results.length, 0)
      const totalQueries = results.reduce((sum, r) => sum + r.query_count, 0)
      const avgTime = results.reduce((sum, r) => sum + r.processing_time, 0) / results.length
      
      console.log(`📈 結果サマリー:`)
      console.log(`- 検索結果総数: ${totalResults}件`)
      console.log(`- 使用クエリ数: ${totalQueries}件`)
      console.log(`- 平均処理時間: ${Math.round(avgTime)}ms`)
      console.log(`- API残枠: ${results[0].api_quota_remaining}件`)
      
      // 結果を保存
      await saveStep1Results(results)
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// Node.js環境での実行
if (typeof window === 'undefined') {
  main()
}

/*
// 単一エピソード処理
const episode = await getEpisodeById('episode-123')
const result = await processEpisodeStep1(episode)

// バッチ処理（10件）
const batchResults = await processMultipleEpisodesStep1(10)

// 結果保存
await saveStep1Results(batchResults)

// テスト実行
await testStep1()
*/