const { analyzeEpisode } = require('./analyze-episode-data.cjs')
const fs = require('fs')

// エピソード#135の再分析
async function reanalyzeEpisode135() {
  console.log('🔍 エピソード#135の詳細分析を実行中...')
  
  const episodeId = '889b696dc7254722e960072de5b7d957'
  const videoId = 'wyEDShKJ3ig'
  
  try {
    const result = await analyzeEpisode(episodeId, videoId)
    
    if (result && result.analysis) {
      // 分析結果ファイルを読み込み
      const analysisFile = `./scripts/analysis-results-${episodeId}.json`
      
      if (fs.existsSync(analysisFile)) {
        const data = JSON.parse(fs.readFileSync(analysisFile, 'utf8'))
        
        console.log('\n📊 詳細分析結果:')
        console.log('==================')
        
        console.log('\n🛍️ アイテム関連キーワード:')
        data.analysis.keywords.items.forEach((item, index) => {
          console.log(`   ${index + 1}. "${item.keyword}" (信頼度: ${item.confidence}) - コンテキスト: ${item.context?.slice(0, 2).join(', ') || 'なし'}`)
        })
        
        console.log('\n📍 ロケーション関連キーワード:')
        data.analysis.keywords.locations.forEach((location, index) => {
          console.log(`   ${index + 1}. "${location.keyword}" (信頼度: ${location.confidence}) - コンテキスト: ${location.context?.slice(0, 2).join(', ') || 'なし'}`)
        })
        
        console.log('\n💬 取得したコメント例 (最初の10件):')
        data.analysis.comments.slice(0, 10).forEach((comment, index) => {
          console.log(`   ${index + 1}. ${comment.text.substring(0, 80)}... (👍${comment.likeCount})`)
        })
        
        console.log('\n🌐 ファンサイト情報:')
        data.analysis.fanSiteInfo.forEach((info, index) => {
          console.log(`   ${index + 1}. ${info.title}`)
          console.log(`      URL: ${info.link}`)
          console.log(`      スニペット: ${info.snippet?.substring(0, 100) || 'なし'}...`)
          console.log('')
        })
        
        // 分析ファイルは保持（検証のため）
        console.log(`\n📄 詳細分析ファイル保存: ${analysisFile}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 再分析エラー:', error.message)
  }
}

reanalyzeEpisode135()