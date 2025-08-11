const fs = require('fs')
const path = require('path')
const { analyzeEpisode } = require('./analyze-episode-data.cjs')
const { processAnalysisResultsDynamic, insertDataToSupabaseStaging } = require('./dynamic-data-generator-staging.cjs')

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
    const response = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=id,title,video_url,view_count&order=view_count.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    const episodes = await response.json()
    console.log(`✅ ${episodes.length}件のエピソードを発見`)
    
    // YouTube動画IDを抽出
    return episodes.map(episode => ({
      ...episode,
      videoId: extractVideoId(episode.video_url)
    })).filter(episode => episode.videoId) // 有効な動画IDがあるもののみ
    
  } catch (error) {
    console.error('❌ エピソード取得エラー:', error.message)
    return []
  }
}

// 既に処理済みかチェック
async function isAlreadyProcessed(episodeId) {
  try {
    // エピソードに関連データがあるかチェック
    const [itemsResponse, locationsResponse] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episodeId}&select=count`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episodeId}&select=count`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      })
    ])
    
    const itemsCount = await itemsResponse.json()
    const locationsCount = await locationsResponse.json()
    
    return (itemsCount[0]?.count || 0) > 0 || (locationsCount[0]?.count || 0) > 0
    
  } catch (error) {
    return false
  }
}

// バッチ処理メイン関数
async function batchAnalyzeEpisodes(options = {}) {
  const {
    maxEpisodes = 10,        // 一度に処理する最大エピソード数
    skipProcessed = true,    // 処理済みエピソードをスキップ
    delayBetween = 2000,     // エピソード間の待機時間（API制限対策）
    priorityByViews = true   // 再生数順で優先処理
  } = options
  
  console.log('🚀 よにのちゃんねる バッチ分析システム v1.0')
  console.log('=======================================\n')
  
  console.log('📋 設定:')
  console.log(`   最大処理数: ${maxEpisodes}件`)
  console.log(`   処理済みスキップ: ${skipProcessed ? 'ON' : 'OFF'}`)
  console.log(`   待機時間: ${delayBetween}ms`)
  console.log(`   優先順: ${priorityByViews ? '再生数順' : '登録順'}\n`)
  
  try {
    // 1. 全エピソードを取得
    const allEpisodes = await getAllEpisodes()
    
    if (allEpisodes.length === 0) {
      console.log('❌ 処理可能なエピソードが見つかりません')
      return
    }
    
    // 2. 処理対象エピソードを選択
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
    
    // 3. 上位エピソードを選択
    const episodesToProcess = targetEpisodes.slice(0, maxEpisodes)
    
    console.log(`\n🎬 処理対象エピソード (${episodesToProcess.length}件):`)
    episodesToProcess.forEach((episode, index) => {
      console.log(`   ${index + 1}. ${episode.title.substring(0, 50)}... (${episode.view_count.toLocaleString()}回再生)`)
    })
    
    // 4. バッチ処理実行
    console.log('\n🚀 バッチ処理開始...\n')
    
    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      totalItems: 0,
      totalLocations: 0
    }
    
    for (let i = 0; i < episodesToProcess.length; i++) {
      const episode = episodesToProcess[i]
      
      console.log(`\n[${i + 1}/${episodesToProcess.length}] 処理中: ${episode.title.substring(0, 40)}...`)
      console.log('─'.repeat(60))
      
      try {
        // 分析実行
        const analysisResult = await analyzeEpisode(episode.id, episode.videoId)
        
        if (analysisResult && analysisResult.analysis) {
          // 動的実データ作成・投入
          const analysisFilePath = path.join(__dirname, `analysis-results-${episode.id}.json`)
          
          if (fs.existsSync(analysisFilePath)) {
            const realData = processAnalysisResultsDynamic(analysisFilePath)
            
            if (realData && (realData.items.length > 0 || realData.locations.length > 0)) {
              await insertDataToSupabaseStaging(realData)
              
              results.totalItems += realData.items.length
              results.totalLocations += realData.locations.length
              results.success++
              
              console.log(`✅ 成功: アイテム${realData.items.length}件、ロケーション${realData.locations.length}件`)
            } else {
              console.log('⚠️ 有効なデータが抽出されませんでした')
            }
            
            // 分析結果ファイルを削除（容量節約）
            fs.unlinkSync(analysisFilePath)
          }
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
    
    // 5. 結果レポート
    console.log('\n' + '='.repeat(50))
    console.log('📊 バッチ処理結果レポート')
    console.log('='.repeat(50))
    console.log(`🎬 処理したエピソード: ${results.processed}件`)
    console.log(`✅ 成功: ${results.success}件`)
    console.log(`❌ 失敗: ${results.failed}件`)
    console.log(`🛍️ 新規アイテム: ${results.totalItems}件`)
    console.log(`📍 新規ロケーション: ${results.totalLocations}件`)
    
    if (results.success > 0) {
      console.log('\n🎉 バッチ処理完了！新しいデータが追加されました')
      console.log('📋 staging環境で確認してください:')
      console.log('   https://develop--oshikatsu-collection.netlify.app/')
    }
    
  } catch (error) {
    console.error('❌ バッチ処理エラー:', error.message)
  }
}

// 実行部分
if (require.main === module) {
  const args = process.argv.slice(2)
  const maxEpisodes = parseInt(args[0]) || 5  // デフォルト5件
  
  console.log(`📺 よにのちゃんねる上位${maxEpisodes}エピソードを処理します\n`)
  
  batchAnalyzeEpisodes({
    maxEpisodes: maxEpisodes,
    skipProcessed: true,
    delayBetween: 3000,  // 3秒待機でAPI制限を安全に回避
    priorityByViews: true
  })
    .then(() => {
      console.log('\n🏁 全処理完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { batchAnalyzeEpisodes, getAllEpisodes }