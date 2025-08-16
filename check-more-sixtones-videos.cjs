const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';

const supabase = createClient(supabaseUrl, supabaseKey);

// 期間をISO 8601から分に変換
function parseDuration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return Math.round(hours * 60 + minutes + seconds / 60);
  }
  return 0;
}

async function checkMoreSixTONESVideos() {
  console.log('🔍 SixTONES さらなる動画の調査開始！\n');
  
  const sixtonesChannelId = 'UCwjAKjycHHT1QzHrQN5Stww';
  const sixtonesId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7';
  
  console.log('📊 現在のデータベース状況:');
  const { count: currentCount } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', sixtonesId);
  console.log(`- 現在のエピソード数: ${currentCount}件\n`);
  
  // 複数の検索クエリで幅広く調査
  const searchQueries = [
    'SixTONES バラエティ',
    'SixTONES 企画',
    'SixTONES 体力測定',
    'SixTONES 食べ物',
    'SixTONES ゲーム',
    'SixTONES コラボ',
    'SixTONES 誕生日',
    'SixTONES チャレンジ'
  ];
  
  const foundVideos = new Set();
  let totalFound = 0;
  
  for (const query of searchQueries) {
    console.log(`🔍 検索中: "${query}"`);
    
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${sixtonesChannelId}&q=${encodeURIComponent(query)}&type=video&maxResults=50&order=relevance&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(searchUrl);
      const searchData = await response.json();
      
      if (searchData.items) {
        let newInQuery = 0;
        searchData.items.forEach(item => {
          if (!foundVideos.has(item.id.videoId)) {
            foundVideos.add(item.id.videoId);
            newInQuery++;
          }
        });
        console.log(`  ✅ ${searchData.items.length}件取得 (新規: ${newInQuery}件)`);
        totalFound += newInQuery;
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`  ❌ エラー: ${error.message}`);
    }
  }
  
  console.log(`\n📋 検索結果サマリー:`);
  console.log(`- ユニーク動画ID数: ${foundVideos.size}件`);
  
  // 詳細情報を取得して1分以上の動画を抽出
  const videoIds = Array.from(foundVideos);
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }
  
  const validVideos = [];
  const existingVideos = [];
  const shortVideos = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`📋 詳細情報取得中 (${i + 1}/${chunks.length})...`);
    
    try {
      const chunk = chunks[i];
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      for (const video of detailsData.items) {
        const duration = parseDuration(video.contentDetails.duration);
        
        if (duration <= 1) {
          shortVideos.push(video);
          continue;
        }
        
        // データベースに存在するかチェック
        const { data: existing } = await supabase
          .from('episodes')
          .select('id')
          .eq('id', video.id)
          .single();
        
        if (existing) {
          existingVideos.push(video);
        } else {
          validVideos.push(video);
        }
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(`  ❌ 詳細取得エラー: ${error.message}`);
    }
  }
  
  console.log('\n📊 詳細分析結果:');
  console.log(`- 1分以下の動画: ${shortVideos.length}件 (除外)`);
  console.log(`- 既存の動画: ${existingVideos.length}件`);
  console.log(`- 新規追加候補: ${validVideos.length}件`);
  
  if (validVideos.length > 0) {
    console.log('\n🎯 新規追加候補 (最新20件):');
    console.log('='.repeat(80));
    
    // 日付順でソート
    validVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
    
    validVideos.slice(0, 20).forEach((video, index) => {
      const duration = parseDuration(video.contentDetails.duration);
      const publishDate = new Date(video.snippet.publishedAt).toLocaleDateString('ja-JP');
      const viewCount = parseInt(video.statistics.viewCount || '0').toLocaleString();
      
      console.log(`${index + 1}. ${video.snippet.title}`);
      console.log(`   📅 ${publishDate} | ⏱️ ${duration}分 | 👀 ${viewCount}回再生`);
      console.log(`   🆔 ${video.id}`);
      console.log('');
    });
    
    if (validVideos.length > 20) {
      console.log(`... 他 ${validVideos.length - 20}件`);
    }
    
    console.log('\n💡 推奨アクション:');
    console.log(`✅ ${validVideos.length}件の新規動画を追加可能`);
    console.log('✅ バラエティ企画、チャレンジ動画が豊富');
    console.log('✅ 高再生数の人気コンテンツを含む');
    
  } else {
    console.log('\n✅ 新規追加候補なし');
    console.log('現在のコレクションは十分に網羅されています！');
  }
  
  // API制限状況の分析
  console.log('\n🔧 API制限についての分析:');
  console.log('- YouTube Data API v3の1日あたりクォータ制限');
  console.log('- チャンネルの動画総数 vs 取得済み動画数');
  console.log('- ページ制限設定の影響');
  console.log('');
  console.log('💡 最適化案:');
  console.log('- 定期的な増分更新の実装');
  console.log('- 人気度・関連度による優先順位付け');
  console.log('- 複数検索クエリによる包括的収集');
  
  return validVideos.length;
}

checkMoreSixTONESVideos();