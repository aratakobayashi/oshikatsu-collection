// Google検索APIを使用してエピソード情報を補完
class GoogleSearchEnhancer {
  constructor(apiKey, searchEngineId) {
    this.apiKey = apiKey
    this.searchEngineId = searchEngineId
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1'
  }

  // エピソード用の検索クエリ生成
  generateSearchQueries(episode) {
    const queries = []
    
    // 基本クエリ
    if (episode.title) {
      queries.push({
        type: 'basic',
        query: `"よにのちゃんねる" "${episode.title}" 店 レストラン`,
        priority: 'high'
      })
    }
    
    // エピソード番号での検索
    const episodeMatch = episode.title?.match(/#(\d+)/)
    if (episodeMatch) {
      const episodeNumber = episodeMatch[1]
      queries.push({
        type: 'episode_number',
        query: `よにのちゃんねる #${episodeNumber} 朝食 場所 店`,
        priority: 'high'
      })
      
      queries.push({
        type: 'episode_detailed',
        query: `ジャにの #${episodeNumber} 朝飯 レストラン 住所`,
        priority: 'medium'
      })
    }
    
    // ファンサイト特化検索
    queries.push({
      type: 'fansite',
      query: `site:8888-info.hatenablog.com "${episode.title}"`,
      priority: 'high'
    })
    
    queries.push({
      type: 'fansite_alternative',
      query: `よにのちゃんねる 朝ごはん "${episode.title}" filetype:html`,
      priority: 'medium'
    })
    
    // Twitter/SNS情報
    queries.push({
      type: 'social',
      query: `"${episode.title}" 店 場所 -youtube.com`,
      priority: 'low'
    })
    
    return queries.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  // Google Custom Search APIを実行
  async performSearch(query, options = {}) {
    const { maxResults = 10, language = 'ja' } = options
    
    console.log(`🔍 Google検索実行: "${query}"`)
    
    try {
      const url = new URL(this.baseUrl)
      url.searchParams.set('key', this.apiKey)
      url.searchParams.set('cx', this.searchEngineId)
      url.searchParams.set('q', query)
      url.searchParams.set('num', maxResults.toString())
      url.searchParams.set('lr', `lang_${language}`)
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      console.log(`✅ ${data.items?.length || 0}件の結果を取得`)
      
      return {
        success: true,
        totalResults: data.searchInformation?.totalResults || '0',
        items: data.items || [],
        searchTime: data.searchInformation?.searchTime || 0
      }
      
    } catch (error) {
      console.error(`❌ Google検索エラー: ${error.message}`)
      return {
        success: false,
        error: error.message,
        items: []
      }
    }
  }

  // 検索結果から店舗情報を抽出
  extractStoreInfo(searchResults) {
    console.log('🏪 検索結果から店舗情報を抽出中...')
    
    const storeInfoList = []
    
    for (const result of searchResults) {
      const storeInfo = this.analyzeSearchResult(result)
      if (storeInfo) {
        storeInfoList.push(storeInfo)
      }
    }
    
    console.log(`📊 抽出された店舗情報: ${storeInfoList.length}件`)
    return storeInfoList
  }

  // 個別の検索結果を分析
  analyzeSearchResult(result) {
    const { title, snippet, link } = result
    
    // 店舗名の抽出パターン
    const storeNamePatterns = [
      /🥩【([^】]+)】/,  // 8888-infoスタイル
      /【([^】]+)】.*(?:で|にて|の|へ)/,
      /「([^」]+)」.*(?:で|にて|の|へ)/,
      /([^\s]+(?:店|レストラン|カフェ|食堂))/, 
    ]
    
    // 住所抽出パターン  
    const addressPatterns = [
      /住所[：:]\s*([^\n\r]+)/,
      /([東京都|神奈川県|千葉県|埼玉県][^\s]{5,30})/,
      /(\d{3}-\d{4}.*?[区市町村][^\s]{2,20})/
    ]
    
    // 電話番号抽出パターン
    const phonePatterns = [
      /電話[：:]?\s*(\d{2,4}-\d{2,4}-\d{4})/,
      /TEL[：:]?\s*(\d{2,4}-\d{2,4}-\d{4})/,
      /(\d{3}-\d{4}-\d{4})/
    ]
    
    // 営業時間抽出パターン
    const hoursPatterns = [
      /営業時間[：:]\s*([^\n\r]+)/,
      /(\d{1,2}:\d{2}-\d{1,2}:\d{2})/,
      /(\d{1,2}時.*?\d{1,2}時)/
    ]
    
    const text = `${title} ${snippet}`
    
    let storeName = null
    let address = null
    let phone = null
    let hours = null
    
    // 各パターンでの抽出試行
    for (const pattern of storeNamePatterns) {
      const match = text.match(pattern)
      if (match) {
        storeName = match[1].trim()
        break
      }
    }
    
    for (const pattern of addressPatterns) {
      const match = text.match(pattern)
      if (match) {
        address = match[1].trim()
        break
      }
    }
    
    for (const pattern of phonePatterns) {
      const match = text.match(pattern)
      if (match) {
        phone = match[1].trim()
        break
      }
    }
    
    for (const pattern of hoursPatterns) {
      const match = text.match(pattern)
      if (match) {
        hours = match[1].trim()
        break
      }
    }
    
    // 最低限店舗名があれば情報として採用
    if (storeName && storeName.length > 1) {
      const confidence = this.calculateConfidence(storeName, address, phone, hours, link)
      
      return {
        storeName,
        address,
        phone,
        hours,
        source: {
          title,
          snippet,
          link,
          confidence
        }
      }
    }
    
    return null
  }

  // 信頼度スコア計算
  calculateConfidence(storeName, address, phone, hours, link) {
    let score = 0
    
    // 基本スコア
    if (storeName) score += 20
    if (address) score += 30
    if (phone) score += 25  
    if (hours) score += 15
    
    // ソース信頼度ボーナス
    if (link.includes('8888-info.hatenablog.com')) score += 20
    if (link.includes('tabelog.com')) score += 15
    if (link.includes('gurunavi.com')) score += 15
    if (link.includes('hotpepper.jp')) score += 10
    
    return Math.min(score, 100) // 最大100点
  }

  // エピソード用の包括的検索
  async enhanceEpisodeInfo(episode) {
    console.log(`🚀 エピソード情報の検索強化開始: ${episode.title}`)
    console.log('='.repeat(60))
    
    const queries = this.generateSearchQueries(episode)
    console.log(`📋 生成された検索クエリ: ${queries.length}件\n`)
    
    const allResults = []
    
    for (let i = 0; i < queries.length; i++) {
      const queryInfo = queries[i]
      console.log(`[${i + 1}/${queries.length}] ${queryInfo.type} (${queryInfo.priority}) 検索中...`)
      
      const result = await this.performSearch(queryInfo.query, {
        maxResults: 8
      })
      
      if (result.success && result.items.length > 0) {
        allResults.push(...result.items.map(item => ({
          ...item,
          queryType: queryInfo.type,
          priority: queryInfo.priority
        })))
      }
      
      // API制限対策の待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`\n📊 総検索結果: ${allResults.length}件`)
    
    // 店舗情報の抽出と統合
    const storeInfoList = this.extractStoreInfo(allResults)
    
    // 信頼度順でソート
    const rankedStores = storeInfoList
      .sort((a, b) => b.source.confidence - a.source.confidence)
      .slice(0, 3) // 上位3件
    
    console.log(`\n🎯 最終候補店舗: ${rankedStores.length}件`)
    rankedStores.forEach((store, index) => {
      console.log(`\n${index + 1}. ${store.storeName} (信頼度: ${store.source.confidence})`)
      if (store.address) console.log(`   📍 ${store.address}`)
      if (store.phone) console.log(`   ☎️ ${store.phone}`)
      if (store.hours) console.log(`   🕒 ${store.hours}`)
      console.log(`   🔗 ${store.source.link}`)
    })
    
    return rankedStores
  }
}

// テスト実行用
async function testGoogleSearchEnhancer() {
  console.log('🧪 Google検索エンハンサーのテスト開始\n')
  
  // 実際のAPI設定が必要
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY || 'YOUR_API_KEY'
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || 'YOUR_SEARCH_ENGINE_ID'
  
  if (apiKey === 'YOUR_API_KEY') {
    console.log('⚠️ Google Search API キーが設定されていません')
    console.log('環境変数を設定してください:')
    console.log('export GOOGLE_SEARCH_API_KEY="your_api_key"')
    console.log('export GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id"')
    return
  }
  
  const enhancer = new GoogleSearchEnhancer(apiKey, searchEngineId)
  
  // テスト用エピソード#135
  const testEpisode = {
    id: '889b696dc7254722e960072de5b7d957',
    title: '#135【新シリーズ】折角だから朝飯だけ食べてみた',
    videoId: 'wyEDShKJ3ig'
  }
  
  try {
    const enhancedInfo = await enhancer.enhanceEpisodeInfo(testEpisode)
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 検索強化完了！')
    
    if (enhancedInfo.length > 0) {
      console.log(`✅ ${enhancedInfo.length}件の高品質店舗情報を発見`)
    } else {
      console.log('⚠️ 店舗情報が見つかりませんでした')
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message)
  }
}

// 実行
if (require.main === module) {
  testGoogleSearchEnhancer()
}

module.exports = GoogleSearchEnhancer