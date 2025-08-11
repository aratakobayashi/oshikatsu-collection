const HybridDataCollector = require('./hybrid-data-collector.cjs')

// Supabase設定
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'

// YouTube動画IDを抽出する関数
function extractVideoId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

// 全エピソードを取得
async function getAllEpisodes() {
  console.log('📋 全エピソードを取得中...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=id,title,video_url&order=view_count.desc.nullslast`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    const episodes = await response.json()
    console.log(`✅ ${episodes.length}件のエピソードを発見`)
    
    return episodes.map(episode => ({
      ...episode,
      videoId: extractVideoId(episode.video_url)
    })).filter(episode => episode.videoId)
    
  } catch (error) {
    console.error('❌ エピソード取得エラー:', error.message)
    return []
  }
}

// 既に処理済みかチェック
async function isAlreadyProcessed(episodeId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episodeId}&select=count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    })
    
    const result = await response.json()
    return (result[0]?.count || 0) > 0
    
  } catch (error) {
    return false
  }
}

// バッチハイブリッド処理
async function batchHybridProcessing(options = {}) {
  const {
    maxEpisodes = 10,
    skipProcessed = true,
    delayBetween = 5000,
    qualityThreshold = 50
  } = options
  
  console.log('🚀 バッチハイブリッド処理システム v1.0')
  console.log('=======================================')
  console.log(`📋 設定:`)
  console.log(`   最大処理数: ${maxEpisodes}件`)
  console.log(`   処理済みスキップ: ${skipProcessed ? 'ON' : 'OFF'}`)
  console.log(`   待機時間: ${delayBetween}ms`)
  console.log(`   品質閾値: ${qualityThreshold}点以上`)
  console.log('')
  
  const collector = new HybridDataCollector()
  
  try {
    // 1. 全エピソードを取得
    const allEpisodes = await getAllEpisodes()
    
    if (allEpisodes.length === 0) {
      console.log('❌ 処理可能なエピソードが見つかりません')
      return
    }
    
    // 2. 未処理エピソードをフィルタリング
    let targetEpisodes = allEpisodes
    
    if (skipProcessed) {
      console.log('🔍 処理済みエピソードをチェック中...')
      const unprocessedEpisodes = []
      
      for (const episode of allEpisodes) {
        const processed = await isAlreadyProcessed(episode.id)
        if (!processed) {
          unprocessedEpisodes.push(episode)
        }
      }
      
      targetEpisodes = unprocessedEpisodes
      console.log(`   未処理エピソード: ${targetEpisodes.length}件`)
    }
    
    if (targetEpisodes.length === 0) {
      console.log('✅ 全エピソードが処理済みです！')
      return
    }
    
    // 3. 処理対象エピソードを選択
    const episodesToProcess = targetEpisodes.slice(0, maxEpisodes)
    
    console.log(`\n🎬 処理対象エピソード (${episodesToProcess.length}件):`)
    episodesToProcess.forEach((episode, index) => {
      console.log(`   ${index + 1}. ${episode.title.substring(0, 60)}...`)
    })
    
    // 4. ハイブリッドバッチ処理実行
    console.log('\n🚀 ハイブリッドバッチ処理開始...\n')
    
    const results = {
      processed: 0,
      success: 0,
      highQuality: 0,
      mediumQuality: 0,
      lowQuality: 0,
      failed: 0,
      totalLocations: 0,
      dataSources: {
        google_search: 0,
        comment_analysis: 0,
        hybrid: 0
      }
    }
    
    for (let i = 0; i < episodesToProcess.length; i++) {
      const episode = episodesToProcess[i]
      
      console.log(`\n[${i + 1}/${episodesToProcess.length}] ハイブリッド処理中`)
      console.log(`🎬 ${episode.title.substring(0, 50)}...`)
      console.log('─'.repeat(70))
      
      try {
        // ハイブリッドデータ収集
        const collectionResult = await collector.collectEpisodeData(episode)
        
        if (collectionResult.finalLocations.length > 0) {
          // データ保存
          const saveResult = await collector.saveHybridData(collectionResult)
          
          if (saveResult.success) {
            results.success++
            results.totalLocations += saveResult.savedCount
            
            // 品質分類
            if (saveResult.qualityScore >= 80) {
              results.highQuality++
              console.log(`🏆 高品質データ (${saveResult.qualityScore}点): ${saveResult.savedCount}件保存`)
            } else if (saveResult.qualityScore >= 65) {
              results.mediumQuality++
              console.log(`🥈 中品質データ (${saveResult.qualityScore}点): ${saveResult.savedCount}件保存`)
            } else {
              results.lowQuality++
              console.log(`🥉 低品質データ (${saveResult.qualityScore}点): ${saveResult.savedCount}件保存`)
            }
            
            // データソース統計
            if (saveResult.dataSource.includes('google_search')) {
              results.dataSources.google_search++
            } else if (saveResult.dataSource.includes('comment_analysis')) {
              results.dataSources.comment_analysis++
            } else {
              results.dataSources.hybrid++
            }
            
          } else {
            console.log(`⚠️ 保存失敗: ${saveResult.message}`)
            results.failed++
          }
        } else {
          console.log(`⚠️ 有効なデータが抽出されませんでした`)
          results.failed++
        }
        
        results.processed++
        
      } catch (error) {
        console.error(`❌ エラー: ${error.message}`)
        results.failed++
      }
      
      // API制限対策の待機
      if (i < episodesToProcess.length - 1) {
        console.log(`⏳ ${delayBetween}ms 待機中...`)
        await new Promise(resolve => setTimeout(resolve, delayBetween))
      }
    }
    
    // 5. 最終結果レポート
    console.log('\n' + '='.repeat(70))
    console.log('📊 バッチハイブリッド処理 最終結果レポート')
    console.log('='.repeat(70))
    console.log(`🎬 処理エピソード: ${results.processed}件`)
    console.log(`✅ 成功: ${results.success}件`)
    console.log(`❌ 失敗: ${results.failed}件`)
    console.log(`📍 新規ロケーション: ${results.totalLocations}件`)
    
    console.log(`\n📊 品質分布:`)
    console.log(`   🏆 高品質(80+点): ${results.highQuality}件`)
    console.log(`   🥈 中品質(65-79点): ${results.mediumQuality}件`)
    console.log(`   🥉 低品質(50-64点): ${results.lowQuality}件`)
    
    console.log(`\n🔗 データソース分布:`)
    console.log(`   🔍 Google検索: ${results.dataSources.google_search}件`)
    console.log(`   💬 コメント分析: ${results.dataSources.comment_analysis}件`)
    console.log(`   🤖 ハイブリッド: ${results.dataSources.hybrid}件`)
    
    if (results.success > 0) {
      const avgQuality = ((results.highQuality * 85) + (results.mediumQuality * 72) + (results.lowQuality * 57)) / results.success
      console.log(`\n📈 平均品質スコア: ${avgQuality.toFixed(1)}点`)
      
      console.log(`\n🎉 ハイブリッド処理完了！高品質データが大量追加されました`)
      console.log(`📋 staging環境で確認:`)
      console.log(`   https://develop--oshikatsu-collection.netlify.app/`)
    }
    
  } catch (error) {
    console.error('❌ バッチ処理エラー:', error.message)
  }
}

// 実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const maxEpisodes = parseInt(args[0]) || 5
  
  console.log(`🎯 上位${maxEpisodes}エピソードをハイブリッド処理します\n`)
  
  batchHybridProcessing({
    maxEpisodes: maxEpisodes,
    skipProcessed: true,
    delayBetween: 4000, // API制限を考慮して4秒
    qualityThreshold: 50
  })
    .then(() => {
      console.log('\n🏁 ハイブリッドバッチ処理完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { batchHybridProcessing }