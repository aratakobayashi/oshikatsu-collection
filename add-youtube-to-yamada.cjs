const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

// 設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const youtubeApiKey = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';
const yoniChannelId = 'UC2alHD2WkakOiTxCxF-uMAg';

const supabase = createClient(supabaseUrl, supabaseKey);

// YouTube API呼び出し
async function youtubeApiCall(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}&key=${youtubeApiKey}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// 全動画取得（既存のYouTube動画から）
async function getExistingYoutubeVideos() {
  console.log('📺 既存のよにのちゃんねる動画を取得中...');
  
  // よにのちゃんねるセレブリティを確認
  const { data: yoninoEpisodes } = await supabase
    .from('episodes')
    .select('*')
    .like('video_url', '%youtube.com%')
    .like('title', '%よにのちゃんねる%');
  
  console.log(`✅ ${yoninoEpisodes?.length || 0}本のよにのちゃんねる動画を発見`);
  
  return yoninoEpisodes || [];
}

// 山田涼介出演回を特定
function identifyYamadaEpisodes(videos) {
  console.log('🔍 山田涼介出演回を特定中...');
  
  const yamadaKeywords = [
    '山田涼介', '山田', 'やまだ', 'ヤマダ', 'YAMADA',
    'Hey! Say! JUMP', 'ヘイセイジャンプ', 'HSJ'
  ];
  
  const yamadaEpisodes = videos.filter(video => {
    const title = video.title.toLowerCase();
    const description = (video.description || '').toLowerCase();
    const searchText = `${title} ${description}`;
    
    return yamadaKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
  });
  
  console.log(`✅ 山田涼介出演回: ${yamadaEpisodes.length}本を特定`);
  
  // 特定されたエピソードを表示
  yamadaEpisodes.slice(0, 5).forEach((episode, i) => {
    console.log(`   ${i + 1}. ${episode.title}`);
  });
  
  if (yamadaEpisodes.length > 5) {
    console.log(`   ... 他 ${yamadaEpisodes.length - 5}本`);
  }
  
  return yamadaEpisodes;
}

// 山田涼介にエピソードを追加
async function addYoutubeToYamada() {
  console.log('🚀 山田涼介にYouTubeエピソードを追加開始！\n');
  
  try {
    // 山田涼介のセレブリティ情報を取得
    const { data: yamadaCelebrity } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'yamada-ryosuke')
      .single();
    
    if (!yamadaCelebrity) {
      throw new Error('山田涼介のセレブリティ情報が見つかりません');
    }
    
    console.log(`🎭 対象: ${yamadaCelebrity.name} (ID: ${yamadaCelebrity.id})\n`);
    
    // 既存のよにのちゃんねる動画を取得
    const existingVideos = await getExistingYoutubeVideos();
    
    // 山田涼介出演回を特定
    const yamadaEpisodes = identifyYamadaEpisodes(existingVideos);
    
    console.log('\n💾 山田涼介のセレブリティIDに紐付け直し中...');
    
    let savedCount = 0;
    let skippedCount = 0;
    
    for (const episode of yamadaEpisodes) {
      // 既に山田涼介に紐付いているかチェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('video_url', episode.video_url)
        .eq('celebrity_id', yamadaCelebrity.id)
        .single();
      
      if (existing) {
        skippedCount++;
        continue;
      }
      
      // 新規エピソードとして追加
      const newEpisode = {
        id: crypto.randomUUID(),
        title: episode.title,
        description: episode.description,
        date: episode.date,
        thumbnail_url: episode.thumbnail_url,
        video_url: episode.video_url,
        celebrity_id: yamadaCelebrity.id,  // 山田涼介のIDに紐付け
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('episodes')
        .insert(newEpisode);
      
      if (!error) {
        savedCount++;
        console.log(`✅ 追加: ${episode.title.substring(0, 50)}...`);
      } else {
        console.error(`❌ エラー: ${error.message}`);
      }
      
      // API制限対策
      if (savedCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n🎉 YouTube動画追加完了！');
    console.log('📊 結果サマリー:');
    console.log(`   山田涼介出演回: ${yamadaEpisodes.length}本`);
    console.log(`   新規追加: ${savedCount}本`);
    console.log(`   スキップ（既存）: ${skippedCount}本`);
    
    // 更新後の確認
    const { count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', yamadaCelebrity.id)
      .like('video_url', '%youtube.com%');
    
    console.log(`\n📺 山田涼介の総YouTube動画数: ${count}本`);
    
    const { count: totalCount } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', yamadaCelebrity.id);
    
    console.log(`📊 山田涼介の総エピソード数: ${totalCount}本`);
    
    console.log('\n🌐 確認方法:');
    console.log('1. https://oshikatsu-collection.netlify.app/celebrities/yamada-ryosuke');
    console.log('2. フィルタで「YouTube」を選択');
    console.log('3. よにのちゃんねる動画が表示されることを確認');
    console.log('4. フィルタで「映画・ドラマ」を選択');
    console.log('5. TMDB作品が表示されることを確認');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

addYoutubeToYamada();