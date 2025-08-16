const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Travis Japanの代表的なYouTubeエピソード（手動で追加）
const travisJapanEpisodes = [
  {
    title: '【Travis Japan】LA観光！ハリウッドサイン＆ビーチを巡る旅',
    date: '2025-08-12',
    video_url: 'https://www.youtube.com/watch?v=travis1',
    thumbnail_url: 'https://i.ytimg.com/vi/travis1/maxresdefault.jpg',
    duration: 32,
    view_count: 1200000,
    description: 'Travis Japanがアメリカ・ロサンゼルスの有名観光地を巡る'
  },
  {
    title: '【Travis Japan】ニューヨーク街歩き！タイムズスクエア＆ブロードウェイ',
    date: '2025-08-07',
    video_url: 'https://www.youtube.com/watch?v=travis2',
    thumbnail_url: 'https://i.ytimg.com/vi/travis2/maxresdefault.jpg',
    duration: 28,
    view_count: 980000,
    description: 'ニューヨークの象徴的なスポットを訪れて街の魅力を満喫'
  },
  {
    title: '【Travis Japan】東京スカイツリー＆押上グルメ探訪',
    date: '2025-08-01',
    video_url: 'https://www.youtube.com/watch?v=travis3',
    thumbnail_url: 'https://i.ytimg.com/vi/travis3/maxresdefault.jpg',
    duration: 25,
    view_count: 750000,
    description: '東京スカイツリー周辺の人気グルメスポットを探索'
  },
  {
    title: '【Travis Japan】横浜中華街食べ歩き！本格中華料理を満喫',
    date: '2025-07-28',
    video_url: 'https://www.youtube.com/watch?v=travis4',
    thumbnail_url: 'https://i.ytimg.com/vi/travis4/maxresdefault.jpg',
    duration: 30,
    view_count: 820000,
    description: '横浜中華街の有名レストランで本格中華料理を楽しむ'
  },
  {
    title: '【Travis Japan】お台場デート！チームラボ＆ショッピング',
    date: '2025-07-22',
    video_url: 'https://www.youtube.com/watch?v=travis5',
    thumbnail_url: 'https://i.ytimg.com/vi/travis5/maxresdefault.jpg',
    duration: 35,
    view_count: 950000,
    description: 'お台場の人気スポットでアートとショッピングを楽しむ'
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
async function addTravisJapanSampleEpisodes() {
  console.log('📺 Travis Japanのサンプルエピソードを追加開始！\n');
  
  try {
    // Travis JapanグループのセレブリティIDを取得
    const { data: travisCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', 'Travis Japan')
      .single();
      
    if (!travisCelebrity) {
      console.log('❌ Travis Japanのセレブリティ情報が見つかりません');
      return;
    }
    
    console.log('👥 Travis Japanグループエピソード追加:');
    
    let totalAdded = 0;
    const addedEpisodes = [];
    
    for (const episode of travisJapanEpisodes) {
      const episodeId = await saveEpisode(episode, travisCelebrity.id);
      if (episodeId) {
        addedEpisodes.push({
          id: episodeId,
          title: episode.title,
          date: episode.date
        });
        totalAdded++;
      }
    }
    
    console.log('\n🎉 Travis Japanエピソード追加完了！');
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
    console.log('2. データが孤立しないよう確実にepisode_idに紐づける');
    console.log('3. タグ情報を適切に設定する');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addTravisJapanSampleEpisodes();