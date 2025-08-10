const fs = require('fs')
const path = require('path')

// 設定
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag'
const GOOGLE_SEARCH_API_KEY = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY || 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag'
const GOOGLE_SEARCH_ENGINE_ID = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID || '3649ae354f33b4553'

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

// YouTube Comments API からコメント取得
async function getVideoComments(videoId, maxResults = 100) {
  console.log(`🔍 コメントを取得中... (動画ID: ${videoId})`)
  
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?key=${YOUTUBE_API_KEY}&textFormat=plainText&part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.error) {
      console.error('❌ YouTube API エラー:', data.error.message)
      return []
    }
    
    const comments = data.items?.map(item => ({
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt
    })) || []
    
    console.log(`✅ ${comments.length}件のコメントを取得`)
    return comments
  } catch (error) {
    console.error('❌ コメント取得エラー:', error.message)
    return []
  }
}

// キーワード抽出（アイテム・ロケーション関連）
function extractKeywords(comments) {
  console.log('🔍 キーワードを抽出中...')
  
  const itemKeywords = [
    // ファッション関連
    'Tシャツ', 'シャツ', 'パーカー', 'ジャケット', 'コート', 'ジーンズ', 'パンツ', 'スカート', 'ワンピース',
    'スニーカー', '靴', 'ブーツ', 'サンダル', 'バッグ', 'リュック', '帽子', 'キャップ', 'ニット帽',
    '時計', 'アクセサリー', 'ネックレス', 'ブレスレット', 'ピアス', 'リング', 'メガネ', 'サングラス',
    // ブランド関連
    '着てる', '履いてる', 'ブランド', '服', '衣装', 'コーデ', 'ファッション', '可愛い', 'かっこいい',
    'どこの', 'どこで買った', '同じ', '欲しい', '真似したい'
  ]
  
  const locationKeywords = [
    // 場所関連
    '会場', '場所', 'どこ', '建物', 'ホール', 'スタジアム', 'アリーナ', 'ドーム', 'センター',
    '東京', '大阪', '名古屋', '福岡', '札幌', '横浜', '神奈川', '埼玉', '千葉',
    'カフェ', 'レストラン', '店', 'ショップ', 'モール', '駅', '空港', 'ホテル',
    '撮影', 'ロケ', '背景', 'ここ', 'あそこ', '行きたい', '行った', '訪問'
  ]
  
  const timeKeywords = [
    // タイムスタンプ関連
    '分', '秒', '時間', 'のとき', 'のところ', 'シーン', '場面'
  ]
  
  const results = {
    items: [],
    locations: [],
    timestamps: []
  }
  
  comments.forEach((comment, index) => {
    const text = comment.text.toLowerCase()
    
    // アイテム関連キーワードをチェック
    itemKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        results.items.push({
          comment: comment.text,
          keyword: keyword,
          likeCount: comment.likeCount,
          confidence: comment.likeCount > 10 ? 'high' : comment.likeCount > 5 ? 'medium' : 'low'
        })
      }
    })
    
    // ロケーション関連キーワードをチェック
    locationKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        results.locations.push({
          comment: comment.text,
          keyword: keyword,
          likeCount: comment.likeCount,
          confidence: comment.likeCount > 10 ? 'high' : comment.likeCount > 5 ? 'medium' : 'low'
        })
      }
    })
    
    // タイムスタンプ関連をチェック
    const timeRegex = /(\d+):(\d+)|(\d+)分(\d+)?秒?|(\d+)秒/g
    const timeMatches = text.match(timeRegex)
    if (timeMatches) {
      results.timestamps.push({
        comment: comment.text,
        timeMatches: timeMatches,
        likeCount: comment.likeCount
      })
    }
  })
  
  console.log(`✅ キーワード抽出完了:`)
  console.log(`   🛍️ アイテム関連: ${results.items.length}件`)
  console.log(`   📍 ロケーション関連: ${results.locations.length}件`)
  console.log(`   ⏰ タイムスタンプ関連: ${results.timestamps.length}件`)
  
  return results
}

// Google Custom Search でファンサイト情報取得
async function searchFanSites(episodeTitle, additionalKeywords = []) {
  console.log('🔍 ファンサイト情報を検索中...')
  
  const searchQueries = [
    `"${episodeTitle}" アイテム ファッション`,
    `"${episodeTitle}" 服 ブランド`,
    `"${episodeTitle}" 場所 ロケーション`,
    `"${episodeTitle}" 会場`,
    ...additionalKeywords.map(keyword => `"${episodeTitle}" ${keyword}`)
  ]
  
  const results = []
  
  for (const query of searchQueries.slice(0, 3)) { // API制限を考慮して3件まで
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.items) {
        results.push(...data.items.map(item => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          query: query
        })))
      }
      
      // API制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('❌ 検索エラー:', error.message)
    }
  }
  
  console.log(`✅ ${results.length}件のファンサイト情報を発見`)
  return results
}

// メイン分析関数
async function analyzeEpisode(episodeId, videoId) {
  console.log(`🎬 エピソード分析開始: ${episodeId}`)
  
  try {
    // 1. エピソード情報取得
    const episodeResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=*&id=eq.${episodeId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const episodes = await episodeResponse.json()
    
    if (!episodes || episodes.length === 0) {
      console.error('❌ エピソードが見つかりません')
      return
    }
    
    const episode = episodes[0]
    console.log(`📺 対象エピソード: ${episode.title}`)
    
    // 2. YouTubeコメント分析
    const comments = await getVideoComments(videoId, 200)
    if (comments.length === 0) {
      console.log('⚠️ コメントが取得できませんでした')
      return
    }
    
    // 3. キーワード抽出
    const keywords = extractKeywords(comments)
    
    // 4. ファンサイト検索
    const fanSiteInfo = await searchFanSites(episode.title, ['よにの', '山田涼介', 'ジャにの'])
    
    // 5. 結果をファイルに保存
    const results = {
      episode: episode,
      analysis: {
        comments: comments.slice(0, 50), // 上位50件のみ保存
        keywords: keywords,
        fanSites: fanSiteInfo
      },
      analyzedAt: new Date().toISOString()
    }
    
    const outputPath = path.join(__dirname, `analysis-results-${episodeId}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8')
    
    console.log(`\n🎉 分析完了！`)
    console.log(`📄 結果ファイル: ${outputPath}`)
    console.log(`\n📊 分析サマリー:`)
    console.log(`   💬 コメント数: ${comments.length}件`)
    console.log(`   🛍️ アイテム候補: ${keywords.items.length}件`)
    console.log(`   📍 ロケーション候補: ${keywords.locations.length}件`)
    console.log(`   ⏰ タイムスタンプ: ${keywords.timestamps.length}件`)
    console.log(`   🌐 ファンサイト情報: ${fanSiteInfo.length}件`)
    
    return results
    
  } catch (error) {
    console.error('❌ 分析エラー:', error.message)
  }
}

// 実行部分
if (require.main === module) {
  const episodeId = process.argv[2] || '5af068026f46542dbc432385cd565cfa'
  const videoId = process.argv[3] || 'aipq7JTWYBo'
  
  console.log('🤖 よにのちゃんねる 自動データ収集システム v1.0')
  console.log('=====================================\n')
  
  analyzeEpisode(episodeId, videoId)
    .then(() => {
      console.log('\n✅ 処理完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { analyzeEpisode, getVideoComments, extractKeywords, searchFanSites }