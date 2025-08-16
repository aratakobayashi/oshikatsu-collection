const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';

const supabase = createClient(supabaseUrl, supabaseKey);

// YouTube API関数
async function fetchYouTubeData(endpoint) {
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API Error: ${response.status}`);
  }
  return response.json();
}

// delay関数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 実際のYouTube動画を取得してエピソードを作成
async function fetchRealEpisodes() {
  console.log('🎥 実際のYouTube動画から正しいエピソードデータを作成中...\n');
  
  const channels = [
    {
      name: 'SixTONES',
      channelId: 'UCwjAKjycHHT1QzHrQN5Stww',
      celebrityId: 'aaecc5fd-67d6-40ef-846c-6c4f914785b7'
    },
    {
      name: 'Travis Japan',
      channelId: 'UCoEIdZkDEZdrCDCJSqwifzw',
      celebrityId: '46ccba0d-742f-4152-9d87-f10cefadbb6d'
    }
  ];
  
  for (const channel of channels) {
    console.log(`📺 ${channel.name} の動画取得中...`);
    
    try {
      // 既存のサンプルエピソードを削除
      console.log(`🗑️ ${channel.name} の既存サンプルエピソードを削除中...`);
      const { error: deleteError } = await supabase
        .from('episodes')
        .delete()
        .eq('celebrity_id', channel.celebrityId);
      
      if (deleteError) {
        console.error(`❌ 削除エラー: ${deleteError.message}`);
        continue;
      }
      console.log(`✅ 既存データ削除完了`);
      
      // YouTube APIで最新動画を取得（最大5件）
      const searchData = await fetchYouTubeData(
        `search?part=snippet&channelId=${channel.channelId}&maxResults=5&order=date&type=video`
      );
      
      if (!searchData.items || searchData.items.length === 0) {
        console.log(`⚠️ ${channel.name} の動画が見つかりません`);
        continue;
      }
      
      console.log(`📹 ${searchData.items.length}件の動画を取得`);
      
      // 動画の詳細情報を取得
      const videoIds = searchData.items.map(item => item.id.videoId).join(',');
      const detailsData = await fetchYouTubeData(
        `videos?part=snippet,statistics,contentDetails&id=${videoIds}`
      );
      
      let insertedCount = 0;
      
      // 各動画をエピソードとして挿入
      for (const video of detailsData.items) {
        const snippet = video.snippet;
        const statistics = video.statistics;
        const contentDetails = video.contentDetails;
        
        // 期間をISO 8601からミリ秒に変換
        let durationInMinutes = 0;
        if (contentDetails.duration) {
          const match = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (match) {
            const hours = parseInt(match[1] || '0');
            const minutes = parseInt(match[2] || '0');
            const seconds = parseInt(match[3] || '0');
            durationInMinutes = Math.round((hours * 60 + minutes + seconds / 60));
          }
        }
        
        const episode = {
          id: video.id, // YouTube動画IDをそのまま使用（よにのちゃんねる方式）
          title: snippet.title,
          description: snippet.description || '',
          date: snippet.publishedAt,
          duration: durationInMinutes,
          thumbnail_url: `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`, // よにのちゃんねる形式
          video_url: `https://www.youtube.com/watch?v=${video.id}`, // 実際のYouTube URL
          view_count: parseInt(statistics.viewCount || '0'),
          like_count: parseInt(statistics.likeCount || '0'),
          comment_count: parseInt(statistics.commentCount || '0'),
          celebrity_id: channel.celebrityId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('episodes')
          .insert(episode);
        
        if (insertError) {
          console.error(`❌ エピソード挿入エラー (${snippet.title}):`, insertError.message);
        } else {
          console.log(`✅ エピソード追加: ${snippet.title.substring(0, 50)}...`);
          insertedCount++;
        }
        
        // API制限対策
        await delay(200);
      }
      
      console.log(`🎉 ${channel.name}: ${insertedCount}件のエピソード追加完了\n`);
      
    } catch (error) {
      console.error(`❌ ${channel.name} 処理エラー:`, error.message);
      console.log('');
    }
  }
  
  console.log('🎊 実際のYouTube動画からのエピソード作成完了！');
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
  console.log('→ よにのちゃんねると同じように実際のYouTube動画データが表示される');
  
  console.log('\n📋 変更内容:');
  console.log('- サンプルエピソードを削除');
  console.log('- 実際のYouTube動画から正しいエピソードデータを作成');
  console.log('- よにのちゃんねると同じデータ構造（YouTube動画ID、実際のURL）');
  console.log('- 正しいサムネイル画像URL形式');
}

fetchRealEpisodes();