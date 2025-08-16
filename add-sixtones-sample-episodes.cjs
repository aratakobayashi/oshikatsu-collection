const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// SixTONESの代表的なYouTubeエピソード（手動で追加）
const sixtonesEpisodes = [
  {
    title: '【SixTONES】東京観光を満喫！浅草めぐり',
    date: '2025-08-10',
    video_url: 'https://www.youtube.com/watch?v=sample1',
    thumbnail_url: 'https://i.ytimg.com/vi/sample1/maxresdefault.jpg',
    duration: 25,
    view_count: 850000,
    description: 'SixTONESのメンバーが浅草の名所を巡りながら東京観光を楽しむ企画動画',
  },
  {
    title: '【SixTONES】新宿グルメツアー！話題のレストラン巡り',
    date: '2025-08-05',
    video_url: 'https://www.youtube.com/watch?v=sample2',
    thumbnail_url: 'https://i.ytimg.com/vi/sample2/maxresdefault.jpg',
    duration: 30,
    view_count: 920000,
    description: 'メンバーが新宿の人気レストランを訪れて美味しい料理を堪能する',
  },
  {
    title: '【SixTONES】原宿ファッション散策 最新トレンドをチェック',
    date: '2025-07-30',
    video_url: 'https://www.youtube.com/watch?v=sample3',
    thumbnail_url: 'https://i.ytimg.com/vi/sample3/maxresdefault.jpg',
    duration: 22,
    view_count: 760000,
    description: '原宿の人気ショップを回って最新ファッションアイテムを探す',
  },
  {
    title: '【SixTONES】渋谷の夜を満喫！話題のカフェ＆バー巡り',
    date: '2025-07-25',
    video_url: 'https://www.youtube.com/watch?v=sample4',
    thumbnail_url: 'https://i.ytimg.com/vi/sample4/maxresdefault.jpg',
    duration: 28,
    view_count: 680000,
    description: '渋谷の人気カフェやバーを訪れて夜の街を楽しむ',
  },
  {
    title: '【SixTONES】銀座ショッピング！高級ブランド店めぐり',
    date: '2025-07-20',
    video_url: 'https://www.youtube.com/watch?v=sample5',
    thumbnail_url: 'https://i.ytimg.com/vi/sample5/maxresdefault.jpg',
    duration: 35,
    view_count: 890000,
    description: '銀座の高級ブランド店を訪れてメンバーがお買い物を楽しむ',
  }
];

// エピソード保存関数
async function saveEpisode(episodeData, celebrityId) {
  // 既存チェック
  const { data: existing } = await supabase
    .from('episodes')
    .select('id')
    .eq('video_url', episodeData.video_url)
    .single();
  
  if (existing) {
    console.log(`   📺 既存: ${episodeData.title}`);
    return existing.id;
  }
  
  const newEpisode = {
    id: crypto.randomUUID(),
    title: episodeData.title,
    date: episodeData.date,
    video_url: episodeData.video_url,
    thumbnail_url: episodeData.thumbnail_url,
    duration: episodeData.duration,
    view_count: episodeData.view_count,
    description: episodeData.description,
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('episodes')
    .insert(newEpisode);
  
  if (error) {
    console.error(`❌ 保存エラー: ${error.message}`);
    return null;
  }
  
  console.log(`   ✅ エピソード追加: ${episodeData.title}`);
  return newEpisode.id;
}

// メイン処理
async function addSixTONESSampleEpisodes() {
  console.log('📺 SixTONESのサンプルエピソードを追加開始！\n');
  
  try {
    // SixTONESグループのセレブリティIDを取得
    const { data: sixtoneCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', 'SixTONES')
      .single();
      
    if (!sixtoneCelebrity) {
      console.log('❌ SixTONESのセレブリティ情報が見つかりません');
      return;
    }
    
    console.log('👥 SixTONESグループエピソード追加:');
    
    let totalAdded = 0;
    const addedEpisodes = [];
    
    for (const episode of sixtonesEpisodes) {
      const episodeId = await saveEpisode(episode, sixtoneCelebrity.id);
      if (episodeId) {
        addedEpisodes.push({
          id: episodeId,
          title: episode.title,
          date: episode.date
        });
        totalAdded++;
      }
    }
    
    console.log('\n🎉 SixTONESエピソード追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    if (addedEpisodes.length > 0) {
      console.log('\n📋 追加されたエピソード:');
      addedEpisodes.forEach(episode => {
        console.log(`   - ${episode.title} (${episode.date})`);
        console.log(`     ID: ${episode.id}`);
      });
    }
    
    console.log('\n🔄 次のステップ:');
    console.log('1. 各エピソードにロケーション・アイテム情報を手動で追加');
    console.log('2. Travis Japanのエピソードも同様に追加');
    console.log('3. データが孤立しないよう確実にepisode_idに紐づける');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addSixTONESSampleEpisodes();