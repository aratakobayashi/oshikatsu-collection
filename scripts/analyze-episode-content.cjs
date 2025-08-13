require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// エピソード分析用のカテゴリ定義
const EPISODE_CATEGORIES = {
  // 食事関連
  '朝食': ['朝食', '朝飯', '朝ごはん', '朝食!!', '朝飯!!'],
  '食事': ['ランチ', '昼食', '夜飯', '晩飯', '食事', '飯', 'グルメ'],
  
  // 移動・場所関連
  'ドライブ': ['ドライブ', '移動', '車', '運転'],
  '旅行': ['旅', '旅行', 'よにの旅', '福岡', '軽井沢', '鎌倉'],
  
  // 企画・ゲーム関連
  'ゲーム': ['ゲーム', 'APEX', 'ゲーム実況', 'デリバリー', 'クイズ'],
  '企画': ['企画', 'チャレンジ', '実験', '検証', '利き'],
  
  // 人物・ゲスト関連
  'ゲスト': ['ゲスト', 'コラボ', '来客', '友達', '先輩', '後輩'],
  '誕生日': ['誕生日', 'おめでとう', '祝', 'バースデー'],
  
  // イベント・特別回
  '記念回': ['記念', '達成', '周年', '100回', '200回', '300回', '400回'],
  '生配信': ['生配信', 'ライブ', 'リアルタイム'],
  
  // 日常・その他
  '日常': ['日常', '普通', 'ルーティン', '日々'],
  'トーク': ['トーク', '話', '質問', 'インタビュー'],
  '買い物': ['買い物', 'ショッピング', '購入', 'プレゼント']
}

// ロケーション抽出用キーワード
const LOCATION_KEYWORDS = [
  // 地域名
  '東京', '渋谷', '原宿', '代官山', '表参道', '六本木', '新宿', '池袋', '銀座',
  '大阪', '京都', '福岡', '横浜', '鎌倉', '軽井沢', '名古屋', '神戸',
  
  // 店舗タイプ
  'カフェ', 'レストラン', 'ファミレス', 'コンビニ', 'ホテル', 'ショップ',
  'デパート', 'モール', 'スタジオ', '会場', 'テーマパーク', 'ユニバ',
  
  // 具体的な場所
  '築地', '浅草', '秋葉原', 'スカイツリー', '東京ドーム', '武道館',
  'ディズニー', 'USJ', 'ユニバーサル'
]

// アイテム抽出用キーワード
const ITEM_KEYWORDS = [
  // 服装
  'Tシャツ', 'シャツ', 'パーカー', 'ジャケット', 'コート', '服', 'ファッション',
  'スニーカー', '靴', 'ブーツ', 'サンダル', 'スリッパ',
  'バッグ', 'リュック', 'カバン', '財布',
  
  // アクセサリー
  'ネックレス', 'ピアス', '時計', 'リング', '指輪', 'ブレスレット',
  'サングラス', 'メガネ', '帽子', 'キャップ', 'ハット',
  
  // ブランド名
  'GUCCI', 'CHANEL', 'LOUIS VUITTON', 'Nike', 'adidas', 'Supreme',
  'UNIQLO', 'GU', 'ZARA', 'H&M'
]

async function analyzeEpisodeContent() {
  console.log('🎬 よにのちゃんねる エピソード内容分析開始\n')
  
  // よにのちゃんねるのエピソードを全取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
  
  if (error || !episodes) {
    console.error('❌ エピソード取得エラー:', error)
    return
  }
  
  console.log(`📺 分析対象エピソード数: ${episodes.length}件\n`)
  
  const analysisResults = {
    categories: {},
    locations: {},
    items: {},
    episodeAnalysis: []
  }
  
  episodes.forEach((episode, index) => {
    const title = episode.title || ''
    const description = episode.description || ''
    const combinedText = `${title} ${description}`.toLowerCase()
    
    const analysis = {
      id: episode.id,
      title: episode.title,
      date: episode.date,
      categories: [],
      locations: [],
      items: [],
      tags: []
    }
    
    // カテゴリ分析
    Object.entries(EPISODE_CATEGORIES).forEach(([category, keywords]) => {
      const hasKeyword = keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      )
      if (hasKeyword) {
        analysis.categories.push(category)
        analysisResults.categories[category] = (analysisResults.categories[category] || 0) + 1
      }
    })
    
    // ロケーション抽出
    LOCATION_KEYWORDS.forEach(location => {
      if (combinedText.includes(location.toLowerCase())) {
        analysis.locations.push(location)
        analysisResults.locations[location] = (analysisResults.locations[location] || 0) + 1
      }
    })
    
    // アイテム抽出
    ITEM_KEYWORDS.forEach(item => {
      if (combinedText.includes(item.toLowerCase())) {
        analysis.items.push(item)
        analysisResults.items[item] = (analysisResults.items[item] || 0) + 1
      }
    })
    
    // 特殊パターンの検出
    if (title.match(/#\d+/)) {
      analysis.tags.push('ナンバリング回')
    }
    if (title.includes('!!')) {
      analysis.tags.push('特別回')
    }
    if (title.includes('緊急') || title.includes('速報')) {
      analysis.tags.push('緊急回')
    }
    if (title.includes('未公開')) {
      analysis.tags.push('未公開映像')
    }
    
    analysisResults.episodeAnalysis.push(analysis)
    
    // 進行状況表示
    if ((index + 1) % 50 === 0) {
      console.log(`📊 分析進行状況: ${index + 1}/${episodes.length} 完了`)
    }
  })
  
  return analysisResults
}

function displayAnalysisResults(results) {
  console.log('\n📊 分析結果サマリー\n')
  
  // カテゴリ別集計
  console.log('🏷️  カテゴリ別エピソード数:')
  const sortedCategories = Object.entries(results.categories)
    .sort(([,a], [,b]) => b - a)
  sortedCategories.forEach(([category, count]) => {
    console.log(`  ${category}: ${count}件`)
  })
  
  // ロケーション別集計
  console.log('\n📍 登場ロケーション TOP10:')
  const sortedLocations = Object.entries(results.locations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
  sortedLocations.forEach(([location, count]) => {
    console.log(`  ${location}: ${count}件`)
  })
  
  // アイテム別集計
  console.log('\n👕 登場アイテム TOP10:')
  const sortedItems = Object.entries(results.items)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
  sortedItems.forEach(([item, count]) => {
    console.log(`  ${item}: ${count}件`)
  })
  
  // 分析例表示
  console.log('\n🔍 分析例（最新5件）:')
  results.episodeAnalysis.slice(0, 5).forEach((episode, i) => {
    console.log(`\n${i + 1}. ${episode.title}`)
    console.log(`   カテゴリ: ${episode.categories.join(', ') || 'なし'}`)
    console.log(`   ロケーション: ${episode.locations.join(', ') || 'なし'}`)
    console.log(`   アイテム: ${episode.items.join(', ') || 'なし'}`)
    console.log(`   タグ: ${episode.tags.join(', ') || 'なし'}`)
  })
}

async function saveAnalysisToDatabase(results) {
  console.log('\n💾 分析結果をデータベースに保存中...')
  
  let updateCount = 0
  
  for (const episode of results.episodeAnalysis) {
    try {
      // エピソードにタグ情報を更新
      const tags = [
        ...episode.categories,
        ...episode.locations,
        ...episode.items,
        ...episode.tags
      ].filter(Boolean)
      
      if (tags.length > 0) {
        const { error } = await supabase
          .from('episodes')
          .update({ 
            tags: tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', episode.id)
        
        if (error) {
          console.error(`❌ 更新エラー (${episode.title}):`, error.message)
        } else {
          updateCount++
          if (updateCount % 50 === 0) {
            console.log(`✅ 更新進行状況: ${updateCount}件完了`)
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ 処理エラー (${episode.title}):`, error)
    }
  }
  
  console.log(`\n📊 データベース更新完了: ${updateCount}件`)
}

async function main() {
  try {
    const results = await analyzeEpisodeContent()
    displayAnalysisResults(results)
    await saveAnalysisToDatabase(results)
    
    console.log('\n🎉 エピソード内容分析完了！')
    
  } catch (error) {
    console.error('❌ 分析エラー:', error)
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { analyzeEpisodeContent, EPISODE_CATEGORIES, LOCATION_KEYWORDS, ITEM_KEYWORDS }