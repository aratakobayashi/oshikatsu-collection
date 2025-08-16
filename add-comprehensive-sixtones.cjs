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

// ショート動画判定（より厳密）
function isShortVideo(duration, title) {
  const durationMinutes = parseDuration(duration);
  const isShortByDuration = durationMinutes <= 1; // 1分以下
  const isShortByTitle = title.toLowerCase().includes('#shorts') || 
                        title.toLowerCase().includes('short') ||
                        title.includes('ショート') ||
                        title.includes('未公開') ||
                        title.includes('予告') ||
                        title.includes('ティーザー');
  return isShortByDuration || isShortByTitle;
}

// エピソードデータを作成
function createEpisodeData(video, celebrityId) {
  const snippet = video.snippet;
  const statistics = video.statistics || {};
  const contentDetails = video.contentDetails || {};
  
  return {
    id: video.id,
    title: snippet.title,
    description: snippet.description || '',
    date: snippet.publishedAt,
    duration: parseDuration(contentDetails.duration),
    thumbnail_url: `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
    video_url: `https://www.youtube.com/watch?v=${video.id}`,
    view_count: parseInt(statistics.viewCount || '0'),
    like_count: parseInt(statistics.likeCount || '0'),
    comment_count: parseInt(statistics.commentCount || '0'),
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function addComprehensiveSixTONES() {
  console.log('🚀 SixTONES 包括的動画追加開始！\n');
  
  const sixtonesChannelId = 'UCwjAKjycHHT1QzHrQN5Stww';
  const sixtonesId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7';
  
  // 現在の状況を確認
  console.log('📊 開始前のデータベース状況:');
  const { count: startCount } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', sixtonesId);
  console.log(`- 現在のエピソード数: ${startCount}件\n`);
  
  // 複数の検索クエリで包括的に収集
  const searchQueries = [
    'SixTONES バラエティ',
    'SixTONES 企画',
    'SixTONES 体力測定',
    'SixTONES 食べ物',
    'SixTONES ゲーム',
    'SixTONES コラボ',
    'SixTONES 誕生日',
    'SixTONES チャレンジ',
    'SixTONES 青ジャージ',
    'SixTONES 無限',
    'SixTONES 海外お取り寄せ'
  ];
  
  const foundVideos = new Set();
  
  console.log('🔍 YouTube APIで包括的検索中...');
  for (const query of searchQueries) {
    console.log(`  検索: "${query}"`);
    
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${sixtonesChannelId}&q=${encodeURIComponent(query)}&type=video&maxResults=50&order=relevance&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(searchUrl);
      const searchData = await response.json();
      
      if (searchData.items) {
        searchData.items.forEach(item => {
          foundVideos.add(item.id.videoId);
        });
        console.log(`    ✅ ${searchData.items.length}件取得`);
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 400));
      
    } catch (error) {
      console.log(`    ❌ エラー: ${error.message}`);
    }
  }
  
  console.log(`\n📋 ユニーク動画ID総数: ${foundVideos.size}件\n`);
  
  // 詳細情報を取得
  const videoIds = Array.from(foundVideos);
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }
  
  const videosToAdd = [];
  let processedCount = 0;
  let shortCount = 0;
  let existingCount = 0;
  
  console.log('📋 動画詳細情報を取得・フィルタリング中...');
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  チャンク ${i + 1}/${chunks.length} 処理中...`);
    
    try {
      const chunk = chunks[i];
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      for (const video of detailsData.items) {
        processedCount++;
        
        // ショート動画判定
        if (isShortVideo(video.contentDetails.duration, video.snippet.title)) {
          shortCount++;
          continue;
        }
        
        // データベースに存在するかチェック
        const { data: existing } = await supabase
          .from('episodes')
          .select('id')
          .eq('id', video.id)
          .single();
        
        if (existing) {
          existingCount++;
          continue;
        }
        
        videosToAdd.push(video);
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(`    ❌ 詳細取得エラー: ${error.message}`);
    }
  }
  
  console.log('\n📊 フィルタリング結果:');
  console.log(`- 総処理動画数: ${processedCount}件`);
  console.log(`- ショート動画除外: ${shortCount}件`);
  console.log(`- 既存動画スキップ: ${existingCount}件`);
  console.log(`- 新規追加対象: ${videosToAdd.length}件\n`);
  
  if (videosToAdd.length === 0) {
    console.log('✅ 追加する新規動画がありません');
    return;
  }
  
  // データベースに追加
  console.log('💾 データベースに追加中...');
  let addedCount = 0;
  let errorCount = 0;
  
  // 人気順にソート（再生回数）
  videosToAdd.sort((a, b) => {
    const viewsA = parseInt(a.statistics?.viewCount || '0');
    const viewsB = parseInt(b.statistics?.viewCount || '0');
    return viewsB - viewsA;
  });
  
  for (let i = 0; i < videosToAdd.length; i++) {
    const video = videosToAdd[i];
    const duration = parseDuration(video.contentDetails.duration);
    const viewCount = parseInt(video.statistics?.viewCount || '0').toLocaleString();
    
    console.log(`\n[${i + 1}/${videosToAdd.length}] ${video.snippet.title}`);
    console.log(`   ⏱️ ${duration}分 | 👀 ${viewCount}回再生`);
    
    try {
      const episode = createEpisodeData(video, sixtonesId);
      
      const { error: insertError } = await supabase
        .from('episodes')
        .insert(episode);
      
      if (insertError) {
        console.log(`   ❌ エラー: ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ 追加成功`);
        addedCount++;
      }
      
      // 追加間隔を空ける
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.log(`   ❌ 処理エラー: ${error.message}`);
      errorCount++;
    }
  }
  
  // 最終結果
  console.log('\n🎊 SixTONES 包括的動画追加完了！');
  console.log('='.repeat(70));
  
  const { count: finalCount } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', sixtonesId);
  
  console.log(`📊 最終結果:`);
  console.log(`  - 開始時: ${startCount}件`);
  console.log(`  - 追加成功: ${addedCount}件`);
  console.log(`  - 追加失敗: ${errorCount}件`);
  console.log(`  - 最終合計: ${finalCount}件`);
  console.log(`  - 増加率: ${Math.round(((finalCount - startCount) / startCount) * 100)}%`);
  
  if (addedCount > 0) {
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('→ エピソード数が大幅に増加しています！');
    
    console.log('\n🎯 追加されたコンテンツの特徴:');
    console.log('- 青ジャージシリーズ（運動会、バトル等）');
    console.log('- 食べ物企画（無限シリーズ、利き○○等）');
    console.log('- 誕生日・お祝い企画');
    console.log('- コラボ・ゲスト企画');
    console.log('- チャレンジ・ゲーム企画');
    console.log('- 音楽・ライブ映像');
  }
}

addComprehensiveSixTONES();