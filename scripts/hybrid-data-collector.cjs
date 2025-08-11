const { analyzeEpisode } = require('./analyze-episode-data.cjs')
const MockGoogleSearchEnhancer = require('./mock-google-search.cjs')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Supabase設定
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'

// ハイブリッドデータ収集システム
class HybridDataCollector {
  constructor() {
    this.googleEnhancer = new MockGoogleSearchEnhancer()
    this.headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }

  // IDとSlug生成
  generateId() {
    return crypto.randomUUID()
  }

  generateSlug(name) {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 40)
    
    const timestamp = Date.now()
    return `${baseSlug}-${timestamp}`
  }

  // データ品質スコア計算
  calculateDataQuality(data) {
    let score = 0
    let maxScore = 100
    
    // 基本情報
    if (data.name && data.name.length > 1) score += 20
    if (data.address && data.address.length > 10) score += 30
    if (data.phone && data.phone.match(/\d{2,4}-\d{2,4}-\d{4}/)) score += 25
    if (data.opening_hours && data.opening_hours.length > 5) score += 15
    
    // ネガティブスコア（低品質データの検出）
    const lowQualityPatterns = ['店', '場所', 'ここ', 'どこ', '撮影', '行った']
    if (lowQualityPatterns.some(pattern => data.name?.includes(pattern))) {
      score -= 50
    }
    
    return Math.max(0, Math.min(score, maxScore))
  }

  // エピソードの包括的データ収集
  async collectEpisodeData(episode) {
    console.log(`\n🎬 ハイブリッド収集開始: ${episode.title}`)
    console.log('='.repeat(70))
    
    const results = {
      episode: episode,
      dataSources: {
        commentAnalysis: null,
        googleSearch: null,
        fanSiteData: null
      },
      finalLocations: [],
      finalItems: [],
      qualityScore: 0,
      dataSource: 'unknown'
    }

    // Phase 1: コメント分析（従来システム）
    console.log('\n📊 Phase 1: YouTubeコメント分析...')
    try {
      const commentAnalysis = await analyzeEpisode(episode.id, episode.videoId)
      if (commentAnalysis && commentAnalysis.analysis) {
        console.log('✅ コメント分析完了')
        results.dataSources.commentAnalysis = commentAnalysis
        
        // 分析結果から暫定データを生成
        const analysisFilePath = path.join(__dirname, `analysis-results-${episode.id}.json`)
        if (fs.existsSync(analysisFilePath)) {
          const analysisData = JSON.parse(fs.readFileSync(analysisFilePath, 'utf8'))
          const tempLocations = this.extractLocationsFromComments(analysisData, episode)
          
          console.log(`   📍 コメント由来ロケーション: ${tempLocations.length}件`)
          results.dataSources.commentAnalysis.locations = tempLocations
          
          // 分析ファイルを削除
          fs.unlinkSync(analysisFilePath)
        }
      }
    } catch (error) {
      console.log(`⚠️ コメント分析エラー: ${error.message}`)
    }

    // Phase 2: Google検索強化
    console.log('\n🔍 Phase 2: Google検索強化...')
    try {
      const searchResults = await this.googleEnhancer.enhanceEpisodeInfo(episode)
      if (searchResults && searchResults.length > 0) {
        console.log(`✅ Google検索完了: ${searchResults.length}件の候補`)
        results.dataSources.googleSearch = searchResults
      }
    } catch (error) {
      console.log(`⚠️ Google検索エラー: ${error.message}`)
    }

    // Phase 3: データ品質比較・選択
    console.log('\n⚖️ Phase 3: データ品質比較...')
    
    const candidates = []
    
    // コメント分析データの評価
    if (results.dataSources.commentAnalysis?.locations) {
      results.dataSources.commentAnalysis.locations.forEach(location => {
        const quality = this.calculateDataQuality(location)
        candidates.push({
          ...location,
          source: 'comment_analysis',
          quality: quality
        })
      })
    }
    
    // Google検索データの評価
    if (results.dataSources.googleSearch) {
      results.dataSources.googleSearch.forEach(store => {
        const locationData = {
          name: store.storeName,
          address: store.address,
          phone: store.phone,
          opening_hours: store.hours
        }
        const quality = this.calculateDataQuality(locationData)
        
        candidates.push({
          ...locationData,
          source: 'google_search',
          quality: quality,
          originalConfidence: store.source.confidence
        })
      })
    }
    
    // 品質スコア順でソート
    candidates.sort((a, b) => b.quality - a.quality)
    
    console.log(`\n📊 データ候補評価結果:`)
    candidates.forEach((candidate, index) => {
      console.log(`   ${index + 1}. ${candidate.name} (品質: ${candidate.quality}, ソース: ${candidate.source})`)
    })
    
    // 最高品質データを選択
    const bestCandidates = candidates.filter(c => c.quality >= 70).slice(0, 3)
    
    if (bestCandidates.length > 0) {
      results.finalLocations = bestCandidates
      results.qualityScore = Math.max(...bestCandidates.map(c => c.quality))
      results.dataSource = bestCandidates[0].source
      
      console.log(`\n🏆 選択されたデータ: ${bestCandidates.length}件 (最高品質: ${results.qualityScore})`)
      console.log(`📋 メインソース: ${results.dataSource}`)
      
    } else {
      console.log(`\n⚠️ 品質基準(70点以上)を満たすデータなし`)
      console.log(`💡 フォールバック: 低品質データでも保存する場合があります`)
      
      // フォールバック: 50点以上なら保存
      const fallbackCandidates = candidates.filter(c => c.quality >= 50).slice(0, 2)
      if (fallbackCandidates.length > 0) {
        results.finalLocations = fallbackCandidates
        results.qualityScore = Math.max(...fallbackCandidates.map(c => c.quality))
        results.dataSource = `${fallbackCandidates[0].source}_fallback`
        
        console.log(`🔄 フォールバック適用: ${fallbackCandidates.length}件 (品質: ${results.qualityScore})`)
      }
    }
    
    return results
  }

  // コメント分析からロケーション抽出（既存ロジック改善版）
  extractLocationsFromComments(analysisData, episode) {
    const locations = []
    
    if (!analysisData.analysis?.keywords?.locations) return locations
    
    // 高信頼度のロケーションキーワードのみ
    const highQualityLocations = analysisData.analysis.keywords.locations.filter(location => 
      location.confidence === 'high' && 
      !['ここ', 'どこ', 'そこ', 'あそこ', 'いつも', 'みんな'].includes(location.keyword)
    )
    
    const locationMap = new Map()
    
    highQualityLocations.forEach(location => {
      const key = location.keyword.toLowerCase()
      if (locationMap.has(key)) {
        locationMap.get(key).mentions++
      } else {
        locationMap.set(key, {
          keyword: location.keyword,
          confidence: location.confidence,
          mentions: 1
        })
      }
    })
    
    // 上位2件のロケーションのみ
    const topLocations = Array.from(locationMap.values())
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 2)
    
    topLocations.forEach((location, index) => {
      locations.push({
        name: `${location.keyword}（${episode.title}関連）`,
        slug: this.generateSlug(location.keyword),
        description: `よにのちゃんねる ${episode.title} でコメント分析により発見`,
        tags: ['よにのちゃんねる', 'コメント分析', `信頼度${location.confidence}`]
      })
    })
    
    return locations
  }

  // Supabaseにハイブリッドデータを投入
  async saveHybridData(collectionResult) {
    console.log('\n💾 ハイブリッドデータをSupabaseに保存中...')
    
    if (collectionResult.finalLocations.length === 0) {
      console.log('⚠️ 保存対象のロケーションデータがありません')
      return { success: false, message: 'No location data' }
    }
    
    const savedLocations = []
    const relations = []
    
    for (const locationData of collectionResult.finalLocations) {
      try {
        // 重複チェック
        const duplicateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/locations?name=eq.${encodeURIComponent(locationData.name)}`,
          { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
        )
        
        const existingLocations = await duplicateResponse.json()
        
        if (existingLocations && existingLocations.length > 0) {
          console.log(`⚠️ 重複スキップ: ${locationData.name}`)
          continue
        }
        
        // 高品質ロケーションデータを作成
        const supabaseLocationData = {
          id: this.generateId(),
          name: locationData.name,
          slug: locationData.slug || this.generateSlug(locationData.name),
          address: locationData.address || null,
          phone: locationData.phone || null,
          opening_hours: locationData.opening_hours || null,
          description: locationData.description || `よにのちゃんねる ${collectionResult.episode.title} で発見`,
          tags: [
            'よにのちゃんねる',
            `品質スコア${locationData.quality}`,
            `ソース${locationData.source}`,
            ...(locationData.tags || [])
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Supabaseに投入
        const locationResponse = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(supabaseLocationData)
        })
        
        if (locationResponse.ok) {
          const insertedLocation = await locationResponse.json()
          console.log(`✅ 保存成功: ${locationData.name} (品質: ${locationData.quality})`)
          
          savedLocations.push(insertedLocation[0])
          
          // エピソード関連付けデータを準備
          relations.push({
            id: this.generateId(),
            episode_id: collectionResult.episode.id,
            location_id: insertedLocation[0].id
          })
          
        } else {
          const errorText = await locationResponse.text()
          console.log(`❌ 保存失敗: ${locationData.name} - ${errorText}`)
        }
        
      } catch (error) {
        console.error(`❌ ロケーション処理エラー: ${locationData.name} - ${error.message}`)
      }
    }
    
    // エピソード関連付けを一括実行
    for (const relation of relations) {
      try {
        const relationResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(relation)
        })
        
        if (relationResponse.ok) {
          console.log(`🔗 エピソード関連付け成功`)
        }
      } catch (error) {
        console.error(`❌ 関連付けエラー: ${error.message}`)
      }
    }
    
    return {
      success: savedLocations.length > 0,
      savedCount: savedLocations.length,
      qualityScore: collectionResult.qualityScore,
      dataSource: collectionResult.dataSource
    }
  }
}

// テスト実行用関数
async function testHybridCollector() {
  console.log('🧪 ハイブリッドデータ収集システムのテスト')
  console.log('='.repeat(60))
  
  const collector = new HybridDataCollector()
  
  // テスト用エピソード（#135以外の未処理エピソードをシミュレート）
  const testEpisode = {
    id: 'a9f42d7e50436645047654056df3c12c',
    title: '#3 ドッキリ重課金勢の男',
    videoId: 'QuBZdl0EX6U'
  }
  
  try {
    // ハイブリッド収集実行
    const result = await collector.collectEpisodeData(testEpisode)
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 ハイブリッド収集結果サマリー')
    console.log('='.repeat(60))
    console.log(`🎬 エピソード: ${result.episode.title}`)
    console.log(`📊 最終品質スコア: ${result.qualityScore}`)
    console.log(`🔗 メインデータソース: ${result.dataSource}`)
    console.log(`📍 最終ロケーション数: ${result.finalLocations.length}件`)
    
    if (result.finalLocations.length > 0) {
      console.log('\n🏆 最終選択ロケーション:')
      result.finalLocations.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location.name} (品質: ${location.quality})`)
        if (location.address) console.log(`      📍 ${location.address}`)
        if (location.phone) console.log(`      ☎️ ${location.phone}`)
      })
      
      // Supabaseに保存
      console.log('\n💾 Supabase保存テスト...')
      const saveResult = await collector.saveHybridData(result)
      
      if (saveResult.success) {
        console.log(`✅ 保存成功: ${saveResult.savedCount}件`)
        console.log(`📊 品質スコア: ${saveResult.qualityScore}`)
        console.log(`🔗 データソース: ${saveResult.dataSource}`)
      } else {
        console.log(`❌ 保存失敗: ${saveResult.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ ハイブリッド収集エラー:', error.message)
  }
}

// 実行
if (require.main === module) {
  testHybridCollector()
    .then(() => {
      console.log('\n🏁 ハイブリッドシステムテスト完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = HybridDataCollector