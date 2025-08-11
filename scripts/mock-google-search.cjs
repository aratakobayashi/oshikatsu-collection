// Google検索のモック版（APIキーなしでテスト）
class MockGoogleSearchEnhancer {
  // #135エピソード用のモックデータ
  getMockSearchResults(query) {
    console.log(`🔍 モック検索実行: "${query}"`)
    
    // 実際のGoogle検索結果を模した現実的なデータ
    const mockResults = {
      'よにのちゃんねる #135 朝食': [
        {
          title: '#135【新シリーズ】折角だから朝飯だけ食べてみた - よにのチャンネル',
          snippet: '二宮和也、中丸雄一、菊池風磨、山田涼介が朝食を食べに「銀座 竹葉亭」へ。銀だらの西京焼きや明太子を堪能。住所: 東京都中央区銀座6-6-7 営業時間: 11:30-14:00, 17:00-21:00',
          link: 'https://example-fansite.com/episode135'
        },
        {
          title: 'よにのちゃんねる #135 ロケ地情報',
          snippet: '銀座竹葉亭で朝食ロケ。伝統的な日本料理店で、銀だらちょうだいシーンが話題に。電話: 03-3571-3101',
          link: 'https://location-guide.com/yonino135'
        }
      ],
      'ジャにの #135 朝飯 レストラン': [
        {
          title: '【ジャにの】#135朝飯ロケまとめ',
          snippet: '撮影場所は銀座の老舗料理店「竹葉亭 銀座店」。創業1870年の歴史ある店で、うなぎと川魚料理が自慢。',
          link: 'https://janino-locations.jp/135'
        }
      ],
      'site:8888-info.hatenablog.com "#135"': [], // 実際には見つからない
      'よにのちゃんねる 朝ごはん "折角だから朝飯だけ食べてみた"': [
        {
          title: 'よにのちゃんねる朝ごはんシリーズ全店舗まとめ',
          snippet: '#135では銀座竹葉亭を訪問。住所: 東京都中央区銀座6-6-7 TEL: 03-3571-3101 営業: 11:30-21:00',
          link: 'https://yonino-breakfast-guide.com'
        }
      ]
    }
    
    // クエリに最も適したモック結果を返す
    for (const [pattern, results] of Object.entries(mockResults)) {
      if (query.includes(pattern.split(' ')[1]) || query.includes('#135')) {
        return {
          success: true,
          totalResults: results.length.toString(),
          items: results,
          searchTime: 0.1
        }
      }
    }
    
    return { success: true, items: [] }
  }

  // 店舗情報抽出（実際のアルゴリズムを使用）
  analyzeSearchResult(result) {
    const { title, snippet, link } = result
    
    const storeNamePatterns = [
      /「([^」]+)」/,
      /【([^】]+)】/,
      /([^\s]+(?:店|亭|レストラン|カフェ|食堂))/,
      /(竹葉亭|銀座[^\s]*店)/
    ]
    
    const addressPatterns = [
      /住所[：:]\s*([^\n\r]+)/,
      /(東京都[^\s]{10,40})/,
      /(中央区銀座[^\s]+)/
    ]
    
    const phonePatterns = [
      /電話[：:]?\s*(\d{2,4}-\d{2,4}-\d{4})/,
      /TEL[：:]?\s*(\d{2,4}-\d{2,4}-\d{4})/,
      /(\d{2,4}-\d{4}-\d{4})/
    ]
    
    const hoursPatterns = [
      /営業時間?[：:]\s*([^\n\r]+)/,
      /営業[：:]?\s*([^\n\r]+)/,
      /(\d{1,2}:\d{2}-\d{1,2}:\d{2})/
    ]
    
    const text = `${title} ${snippet}`
    
    let storeName = null, address = null, phone = null, hours = null
    
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
    
    if (storeName && storeName.length > 1) {
      const confidence = this.calculateConfidence(storeName, address, phone, hours, link)
      
      return {
        storeName,
        address, 
        phone,
        hours,
        source: { title, snippet, link, confidence }
      }
    }
    
    return null
  }

  calculateConfidence(storeName, address, phone, hours, link) {
    let score = 0
    
    if (storeName) score += 20
    if (address) score += 30
    if (phone) score += 25
    if (hours) score += 15
    
    // ソース信頼度
    if (link.includes('fansite')) score += 20
    if (link.includes('location-guide')) score += 15
    if (link.includes('tabelog.com')) score += 15
    
    return Math.min(score, 100)
  }

  // 模擬的なエピソード情報強化
  async enhanceEpisodeInfo(episode) {
    console.log(`🚀 エピソード情報の模擬検索開始: ${episode.title}`)
    console.log('='.repeat(60))
    
    const queries = [
      'よにのちゃんねる #135 朝食 場所',
      'ジャにの #135 朝飯 レストラン 住所',
      'よにのちゃんねる 朝ごはん "折角だから朝飯だけ食べてみた"'
    ]
    
    const allResults = []
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      console.log(`[${i + 1}/${queries.length}] 検索中: "${query}"`)
      
      const result = this.getMockSearchResults(query)
      if (result.success && result.items.length > 0) {
        allResults.push(...result.items)
        console.log(`✅ ${result.items.length}件の結果を取得`)
      } else {
        console.log(`⚠️ 結果なし`)
      }
      
      // 待機時間（リアルAPIを模倣）
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log(`\n📊 総検索結果: ${allResults.length}件`)
    
    // 店舗情報抽出
    const storeInfoList = []
    for (const result of allResults) {
      const storeInfo = this.analyzeSearchResult(result)
      if (storeInfo) {
        storeInfoList.push(storeInfo)
      }
    }
    
    // 信頼度順ソート
    const rankedStores = storeInfoList
      .sort((a, b) => b.source.confidence - a.source.confidence)
      .slice(0, 3)
    
    console.log(`\n🎯 抽出された店舗情報: ${rankedStores.length}件`)
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

// テスト実行
async function testMockGoogleSearch() {
  console.log('🧪 モックGoogle検索エンハンサーのテスト\n')
  
  const enhancer = new MockGoogleSearchEnhancer()
  
  const testEpisode = {
    id: '889b696dc7254722e960072de5b7d957', 
    title: '#135【新シリーズ】折角だから朝飯だけ食べてみた',
    videoId: 'wyEDShKJ3ig'
  }
  
  try {
    const enhancedInfo = await enhancer.enhanceEpisodeInfo(testEpisode)
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 模擬検索完了！')
    
    if (enhancedInfo.length > 0) {
      console.log(`✅ ${enhancedInfo.length}件の店舗候補を発見`)
      
      // 最高信頼度の店舗を推奨
      const bestMatch = enhancedInfo[0]
      console.log(`\n🏆 推奨店舗: ${bestMatch.storeName}`)
      console.log(`📍 住所: ${bestMatch.address || '情報なし'}`)
      console.log(`☎️ 電話: ${bestMatch.phone || '情報なし'}`)
      console.log(`🕒 営業時間: ${bestMatch.hours || '情報なし'}`)
      
    } else {
      console.log('⚠️ 店舗情報が見つかりませんでした')
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message)
  }
}

if (require.main === module) {
  testMockGoogleSearch()
}

module.exports = MockGoogleSearchEnhancer