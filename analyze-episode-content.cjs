require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// API設定
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GOOGLE_SEARCH_API_KEY = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

// Supabase設定
const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

// ロケーション抽出パターン
const LOCATION_PATTERNS = [
  // 具体的な店舗名（カタカナ・ひらがな・漢字混合）
  /([あ-んア-ンー一-龯A-Za-z0-9]+(?:店|屋|家|亭|庵|館|苑|カフェ|レストラン|ラーメン|寿司|焼肉|居酒屋|バル|バー))/g,
  // 地名＋店舗名
  /(東京|大阪|名古屋|福岡|札幌|仙台|広島|京都|神戸|横浜|千葉|埼玉|栃木|群馬|茨城|新宿|渋谷|原宿|表参道|銀座|六本木|恵比寿|代官山|中目黒|池袋|上野|浅草|秋葉原|お台場|豊洲|築地|赤羽|高円寺|吉祥寺|下北沢|自由が丘|二子玉川|品川|五反田|目黒|大井町|六角家|利尻らーめん味楽)[^\s]{0,10}([あ-んア-ンー一-龯A-Za-z0-9]+(?:店|屋|家|亭|庵|館|苑))/g,
  // ショッピングモール・施設・チェーン店
  /(パルコ|ルミネ|マルイ|イオン|ららぽーと|アウトレット|プレミアム|ヒルズ|タワー|スカイツリー|東京ドーム|ビッグサイト|幕張|お台場|豊洲|築地|スイパラ|サンリオカフェ|くら寿司|一蘭|天下一品|六角家|利尻らーめん|もんじゃ|カラオケ|クレーンゲーム)/g,
  // 【場所名】形式
  /【([^】]+)】/g,
];

// アイテム抽出パターン
const ITEM_PATTERNS = [
  // 食べ物・飲み物（具体的なメニュー名）
  /([あ-んア-ンー一-龯A-Za-z0-9]+(?:丼|ラーメン|うどん|そば|寿司|刺身|焼肉|ステーキ|ハンバーグ|カレー|パスタ|ピザ|サラダ|スープ|デザート|ケーキ|アイス|パフェ|かき氷|タピオカ|コーヒー|紅茶|ジュース|ビール|日本酒|ワイン|もんじゃ焼き|お好み焼き|たこ焼き|串カツ|唐揚げ|餃子|チャーハン|オムライス|ナポリタン|カルボナーラ|ペペロンチーノ))/g,
  // 商品・グッズ（具体的な商品名）
  /([あ-んア-ンー一-龯A-Za-z0-9]+(?:コスメ|化粧品|服|洋服|バッグ|靴|アクセサリー|時計|本|雑誌|CD|DVD|グッズ|ぬいぐるみ|フィギュア|ステッカー|キーホルダー|リップ|ファンデーション|アイシャドウ|マスカラ|香水|シャンプー|トリートメント))/g,
  // ブランド名・チェーン店
  /(UNIQLO|GU|ZARA|H&M|無印良品|ニトリ|IKEA|スターバックス|タリーズ|ドトール|マクドナルド|ケンタッキー|モスバーガー|サブウェイ|スイーツパラダイス|サンリオ|ポケモンセンター|アニメイト|東急ハンズ|ロフト|ドンキホーテ|コストコ|イケア)/g,
  // コラボメニュー・限定商品
  /(コラボ[メニュー|商品|グッズ|カフェ]|限定[メニュー|商品|グッズ]|[あ-んア-ンー一-龯]+コラボ)/g,
];

// ファンサイト検索キーワード生成
function generateSearchKeywords(episodeTitle, groupName) {
  const keywords = [
    `${episodeTitle} ${groupName} ロケ地`,
    `${episodeTitle} ${groupName} 撮影場所`,
    `${episodeTitle} ${groupName} お店`,
    `${groupName} ${episodeTitle} 聖地巡礼`,
    `${groupName} ${episodeTitle} カフェ レストラン`,
    `${groupName} ${episodeTitle} グッズ アイテム`,
  ];
  
  // タイトルから重要な単語を抽出してキーワードに追加
  const titleWords = episodeTitle.match(/[あ-んア-ンー一-龯A-Za-z0-9]+/g) || [];
  titleWords.forEach(word => {
    if (word.length > 2) {
      keywords.push(`${word} ${groupName} ロケ地`);
      keywords.push(`${word} ${groupName} 店`);
    }
  });
  
  return keywords.slice(0, 8); // 最大8キーワードに制限
}

// YouTubeコメント取得
async function getYouTubeComments(videoId, maxResults = 100) {
  if (!YOUTUBE_API_KEY) {
    console.log('⚠️ YouTube API キーが設定されていません');
    return [];
  }

  try {
    console.log(`📝 コメント取得中: ${videoId}`);
    
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?key=${YOUTUBE_API_KEY}&videoId=${videoId}&part=snippet&order=relevance&maxResults=${maxResults}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.log(`⚠️ コメント取得エラー: ${data.error.message}`);
      return [];
    }
    
    if (!data.items || data.items.length === 0) {
      console.log('📝 コメントが見つかりませんでした');
      return [];
    }
    
    const comments = data.items.map(item => ({
      text: item.snippet.topLevelComment.snippet.textDisplay,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      likeCount: item.snippet.topLevelComment.snippet.likeCount || 0
    }));
    
    console.log(`✅ ${comments.length}件のコメントを取得`);
    return comments;
    
  } catch (error) {
    console.error(`❌ コメント取得エラー:`, error.message);
    return [];
  }
}

// Google検索でファンサイト情報収集
async function searchFanSites(keywords) {
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log('⚠️ Google Search API設定が不完全です');
    return [];
  }

  const results = [];
  
  try {
    for (const keyword of keywords.slice(0, 3)) { // API制限のため3キーワードまで
      console.log(`🔍 ファンサイト検索: "${keyword}"`);
      
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(keyword)}&num=5`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items) {
        data.items.forEach(item => {
          results.push({
            title: item.title,
            snippet: item.snippet,
            url: item.link,
            keyword: keyword
          });
        });
      }
      
      // API制限対策で少し待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ ${results.length}件のファンサイト情報を収集`);
    return results;
    
  } catch (error) {
    console.error(`❌ ファンサイト検索エラー:`, error.message);
    return [];
  }
}

// ノイズフィルタ（除外する単語）
const NOISE_FILTERS = {
  locations: [
    '踊ってみた', '密着', '絶叫注意', '大爆笑', '超平和', '神回',
    'YouTube', 'Live', 'Vlog', 'メイキング', '裏側', '出演メンバー',
    '動画', 'チャンネル', '配信', 'ライブ', '生配信', '博多Vlog',
    '夏休み', 'メンバー', 'イコラブ', '=LOVE', '≠ME', '≒JOY', 'ノイミー',
    'ニアジョイ', 'こういう風に', 'セレモニアルピッチだけでも', '串刺しの',
    'イコラブちゃんじゃなく', 'ハンバーガー部コラボ', 'ハンバーガー部初',
    'ませぎ商', 'お通しのセンス良い', 'ニアジョイ ... Aug 14, 2024 ...'
  ],
  items: [
    'YouTube', 'Live', 'Vlog', 'メイキング', '裏側', '動画',
    'チャンネル', '配信', 'ライブ', '生配信', 'しょこの活動が',
    'なんか', '新しい活動に', '2人とも', 'イコラブちゃんって',
    'DeNAマジで', 'でこの感じなのが', 'あゆみん基本', '2人ともお'
  ]
};

// テキストからロケーション情報抽出
function extractLocations(text) {
  const locations = new Set();
  
  LOCATION_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // クリーンアップ
        let cleaned = match
          .replace(/行ってきた|行きました|お店|カフェ|レストラン|ラーメン|焼肉|寿司|居酒屋/g, '')
          .replace(/[【】()（）]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // ノイズフィルタ適用
        const isNoise = NOISE_FILTERS.locations.some(noise => 
          cleaned.includes(noise) || cleaned === noise
        );
        
        // 品質チェック
        if (!isNoise && 
            cleaned.length > 2 && 
            cleaned.length < 20 && // 短めに調整
            !/^[0-9\s\.]+$/.test(cleaned) && // 数字のみ除外
            !/^[a-zA-Z\s]+$/.test(cleaned) && // 英語のみ除外（ブランド名は除く）
            !cleaned.includes('コラボ') && // コラボ系は一般的すぎる
            !cleaned.includes('ハンバー')) { // 部分的な単語除外
          locations.add(cleaned);
        }
      });
    }
  });
  
  return Array.from(locations);
}

// テキストからアイテム情報抽出
function extractItems(text) {
  const items = new Set();
  
  ITEM_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // クリーンアップ
        let cleaned = match
          .replace(/食べた|いただいた|注文|頼んだ|買った|購入|ゲット|手に入れた/g, '')
          .replace(/[【】()（）]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // ノイズフィルタ適用
        const isNoise = NOISE_FILTERS.items.some(noise => 
          cleaned.includes(noise) || cleaned === noise
        );
        
        // 品質チェック
        if (!isNoise && 
            cleaned.length > 2 && 
            cleaned.length < 15 && // 短めに調整
            !/^[0-9\s\.]+$/.test(cleaned) && // 数字のみ除外
            !cleaned.match(/^[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/) && // 日本語を含む
            !cleaned.includes('本') && // 「〜本当」などの曖昧な表現除外
            !cleaned.includes('コラボ')) { // コラボ系は一般的すぎる
          items.add(cleaned);
        }
      });
    }
  });
  
  return Array.from(items);
}

// エピソード分析
async function analyzeEpisode(episode) {
  console.log(`\n🎬 分析中: ${episode.title.substring(0, 50)}...`);
  
  const groupNames = {
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac': '=LOVE',
    'ed64611c-a6e5-4b84-a36b-7383b73913d5': '≠ME',
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a': '≒JOY'
  };
  
  const groupName = groupNames[episode.celebrity_id] || 'Unknown';
  
  // 1. エピソードタイトル・説明文から抽出
  const titleText = episode.title + ' ' + (episode.description || '');
  const titleLocations = extractLocations(titleText);
  const titleItems = extractItems(titleText);
  
  console.log(`📍 タイトルから抽出: ロケーション${titleLocations.length}件, アイテム${titleItems.length}件`);
  
  // 2. YouTubeコメントから抽出
  const comments = await getYouTubeComments(episode.id, 50);
  const commentText = comments.map(c => c.text).join(' ');
  const commentLocations = extractLocations(commentText);
  const commentItems = extractItems(commentText);
  
  console.log(`💬 コメントから抽出: ロケーション${commentLocations.length}件, アイテム${commentItems.length}件`);
  
  // 3. ファンサイトから抽出
  const searchKeywords = generateSearchKeywords(episode.title, groupName);
  const fanSiteResults = await searchFanSites(searchKeywords);
  const fanSiteText = fanSiteResults.map(r => r.title + ' ' + r.snippet).join(' ');
  const fanSiteLocations = extractLocations(fanSiteText);
  const fanSiteItems = extractItems(fanSiteText);
  
  console.log(`🌐 ファンサイトから抽出: ロケーション${fanSiteLocations.length}件, アイテム${fanSiteItems.length}件`);
  
  // 4. 結果統合とスコア計算
  const allLocations = [...new Set([...titleLocations, ...commentLocations, ...fanSiteLocations])];
  const allItems = [...new Set([...titleItems, ...commentItems, ...fanSiteItems])];
  
  // ソース別スコア付け（タイトル > ファンサイト > コメント）
  const locationScores = {};
  const itemScores = {};
  
  allLocations.forEach(location => {
    let score = 0;
    if (titleLocations.includes(location)) score += 10;
    if (fanSiteLocations.includes(location)) score += 5;
    if (commentLocations.includes(location)) score += 2;
    locationScores[location] = score;
  });
  
  allItems.forEach(item => {
    let score = 0;
    if (titleItems.includes(item)) score += 10;
    if (fanSiteItems.includes(item)) score += 5;
    if (commentItems.includes(item)) score += 2;
    itemScores[item] = score;
  });
  
  return {
    episode,
    locations: allLocations.map(loc => ({ name: loc, score: locationScores[loc] })),
    items: allItems.map(item => ({ name: item, score: itemScores[item] })),
    sources: {
      title: { locations: titleLocations, items: titleItems },
      comments: { locations: commentLocations, items: commentItems, count: comments.length },
      fanSites: { locations: fanSiteLocations, items: fanSiteItems, count: fanSiteResults.length }
    }
  };
}

// データベースに保存
async function saveAnalysisResults(analysisResult) {
  const { episode, locations, items } = analysisResult;
  
  let savedLocations = 0;
  let savedItems = 0;
  
  try {
    // ロケーション保存（スコア7以上で最適化）
    console.log(`📊 ロケーション候補: ${locations.length}件`);
    const qualifyingLocs = locations.filter(l => l.score >= 7);
    console.log(`✅ スコア7以上のロケーション: ${qualifyingLocs.length}件`);
    for (const location of qualifyingLocs) {
      const locationData = {
        id: randomUUID(),
        name: location.name,
        slug: location.name.toLowerCase()
          .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
        episode_id: episode.id,
        celebrity_id: episode.celebrity_id,
        description: `${location.name}（分析スコア: ${location.score}）`,
        tags: ['自動抽出', `スコア${location.score}`],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('locations')
        .insert(locationData);
      
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          console.log(`⏭️ ロケーション重複スキップ: ${location.name} (スコア: ${location.score})`);
        } else {
          console.error(`❌ ロケーション保存エラー: ${error.message}`);
        }
      } else {
        console.log(`✅ ロケーション保存: ${location.name} (スコア: ${location.score})`);
        savedLocations++;
      }
    }
    
    // アイテム保存（スコア7以上で最適化）
    console.log(`📊 アイテム候補: ${items.length}件`);
    const qualifyingItems = items.filter(i => i.score >= 7);
    console.log(`✅ スコア7以上のアイテム: ${qualifyingItems.length}件`);
    for (const item of qualifyingItems) {
      const itemData = {
        id: randomUUID(),
        name: item.name,
        slug: item.name.toLowerCase()
          .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
        episode_id: episode.id,
        celebrity_id: episode.celebrity_id,
        description: `${item.name}（分析スコア: ${item.score}）`,
        category: 'その他',
        tags: ['自動抽出', `スコア${item.score}`],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('items')
        .insert(itemData);
      
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          console.log(`⏭️ アイテム重複スキップ: ${item.name} (スコア: ${item.score})`);
        } else {
          console.error(`❌ アイテム保存エラー: ${error.message}`);
        }
      } else {
        console.log(`✅ アイテム保存: ${item.name} (スコア: ${item.score})`);
        savedItems++;
      }
    }
    
  } catch (error) {
    console.error(`❌ 保存処理エラー:`, error.message);
  }
  
  return { savedLocations, savedItems };
}

// メイン処理
async function analyzeEpisodesContent() {
  console.log('🔍 エピソード内容分析開始！\n');
  console.log('📋 分析対象: =LOVE・≠ME・≒JOY の最新エピソード');
  
  try {
    // より多くのエピソードを分析（グルメ・お出かけ系）
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('*')
      .in('celebrity_id', [
        '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
        'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
        '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
      ])
      .or('title.ilike.%食%,title.ilike.%ラーメン%,title.ilike.%グルメ%,title.ilike.%ハンバーガー%,title.ilike.%カフェ%,title.ilike.%もんじゃ%,title.ilike.%お出かけ%,title.ilike.%散歩%,title.ilike.%買い物%,title.ilike.%ショッピング%,title.ilike.%遊び%,title.ilike.%行ってきた%,title.ilike.%店%')
      .limit(15); // 効率的な分析のため調整
    
    if (error) {
      console.error('❌ エピソード取得エラー:', error.message);
      return;
    }
    
    console.log(`📺 分析対象エピソード: ${episodes.length}件\n`);
    
    let totalSavedLocations = 0;
    let totalSavedItems = 0;
    let processedCount = 0;
    
    for (const episode of episodes) {
      try {
        const analysisResult = await analyzeEpisode(episode);
        const { savedLocations, savedItems } = await saveAnalysisResults(analysisResult);
        
        totalSavedLocations += savedLocations;
        totalSavedItems += savedItems;
        processedCount++;
        
        console.log(`📊 [${processedCount}/${episodes.length}] 完了: +${savedLocations}ロケーション, +${savedItems}アイテム`);
        
        // API制限対策で少し待つ
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`❌ エピソード分析エラー: ${error.message}`);
      }
    }
    
    console.log('\n🎉 分析完了！');
    console.log('='.repeat(60));
    console.log(`📊 結果サマリー:`);
    console.log(`  - 処理エピソード: ${processedCount}件`);
    console.log(`  - 追加ロケーション: ${totalSavedLocations}件`);
    console.log(`  - 追加アイテム: ${totalSavedItems}件`);
    
    console.log('\n🌐 確認URL:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/equal-love');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/not-equal-me');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/nearly-equal-joy');
    
  } catch (error) {
    console.error('❌ 処理中にエラーが発生:', error);
  }
}

// スクリプト実行
if (require.main === module) {
  analyzeEpisodesContent().catch(console.error);
}

module.exports = { analyzeEpisode, extractLocations, extractItems };