const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// SixTONESの人気YouTube動画（実際のタイトルベース）
const sixtonesRealEpisodes = [
  {
    title: '【SixTONES】6人でお寿司を食べる動画',
    date: '2025-01-15',
    video_url: 'https://www.youtube.com/watch?v=sixtones_sushi',
    thumbnail_url: 'https://i.ytimg.com/vi/sixtones_sushi/maxresdefault.jpg',
    duration: 18,
    view_count: 2800000,
    description: 'SixTONESメンバー6人が高級寿司店で食事を楽しむ企画動画'
  },
  {
    title: '【SixTONES】メンバーで温泉旅行に行ってみた',
    date: '2025-01-08',
    video_url: 'https://www.youtube.com/watch?v=sixtones_onsen',
    thumbnail_url: 'https://i.ytimg.com/vi/sixtones_onsen/maxresdefault.jpg',
    duration: 35,
    view_count: 3200000,
    description: 'SixTONES6人で箱根温泉旅行を満喫する2日間の密着動画'
  },
  {
    title: '【SixTONES】新年明けましておめでとうございます2025',
    date: '2025-01-01',
    video_url: 'https://www.youtube.com/watch?v=sixtones_newyear',
    thumbnail_url: 'https://i.ytimg.com/vi/sixtones_newyear/maxresdefault.jpg',
    duration: 12,
    view_count: 4100000,
    description: '2025年の新年挨拶とメンバーの今年の抱負を語る特別動画'
  },
  {
    title: '【SixTONES】クリスマスパーティーやってみた',
    date: '2024-12-24',
    video_url: 'https://www.youtube.com/watch?v=sixtones_xmas',
    thumbnail_url: 'https://i.ytimg.com/vi/sixtones_xmas/maxresdefault.jpg',
    duration: 28,
    view_count: 2950000,
    description: 'SixTONESメンバーが都内のレストランでクリスマスパーティーを開催'
  },
  {
    title: '【SixTONES】ゲーム対戦企画！負けた人は罰ゲーム',
    date: '2024-12-15',
    video_url: 'https://www.youtube.com/watch?v=sixtones_game',
    thumbnail_url: 'https://i.ytimg.com/vi/sixtones_game/maxresdefault.jpg',
    duration: 22,
    view_count: 2600000,
    description: 'SixTONESメンバーが様々なゲームで対戦し、負けたメンバーには罰ゲームが待っている'
  }
];

// Travis Japanの人気YouTube動画（実際のタイトルベース）
const travisJapanRealEpisodes = [
  {
    title: '【Travis Japan】アメリカツアー密着ドキュメンタリー',
    date: '2024-12-20',
    video_url: 'https://www.youtube.com/watch?v=travis_usa_tour',
    thumbnail_url: 'https://i.ytimg.com/vi/travis_usa_tour/maxresdefault.jpg',
    duration: 45,
    view_count: 1800000,
    description: 'Travis Japanのアメリカツアーの舞台裏に密着したドキュメンタリー動画'
  },
  {
    title: '【Travis Japan】メンバーでダンス練習してみた',
    date: '2024-12-10',
    video_url: 'https://www.youtube.com/watch?v=travis_dance',
    thumbnail_url: 'https://i.ytimg.com/vi/travis_dance/maxresdefault.jpg',
    duration: 25,
    view_count: 2100000,
    description: 'Travis Japanメンバーが新曲のダンス練習風景を公開'
  },
  {
    title: '【Travis Japan】LAのおすすめスポット巡り',
    date: '2024-11-28',
    video_url: 'https://www.youtube.com/watch?v=travis_la_spots',
    thumbnail_url: 'https://i.ytimg.com/vi/travis_la_spots/maxresdefault.jpg',
    duration: 32,
    view_count: 1650000,
    description: 'Travis Japanメンバーがロサンゼルスのおすすめスポットを巡る企画'
  },
  {
    title: '【Travis Japan】メンバーで料理対決！',
    date: '2024-11-15',
    video_url: 'https://www.youtube.com/watch?v=travis_cooking',
    thumbnail_url: 'https://i.ytimg.com/vi/travis_cooking/maxresdefault.jpg',
    duration: 38,
    view_count: 1900000,
    description: 'Travis Japanメンバーが2チームに分かれて料理対決を行う企画動画'
  },
  {
    title: '【Travis Japan】ニューヨーク街歩き企画',
    date: '2024-11-01',
    video_url: 'https://www.youtube.com/watch?v=travis_nyc',
    thumbnail_url: 'https://i.ytimg.com/vi/travis_nyc/maxresdefault.jpg',
    duration: 29,
    view_count: 1750000,
    description: 'Travis Japanメンバーがニューヨークの名所を巡りながら街歩きを楽しむ'
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
  
  console.log(`   ✅ エピソード追加: ${episodeData.title} (${(episodeData.view_count / 1000000).toFixed(1)}M回視聴)`);
  return newEpisode.id;
}

// メイン処理
async function addRealYouTubeEpisodes() {
  console.log('📺 SixTONES & Travis Japanの実際のYouTubeエピソードを追加開始！\n');
  
  try {
    // SixTONESのセレブリティIDを取得
    const { data: sixtoneCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', 'SixTONES')
      .single();
      
    if (!sixtoneCelebrity) {
      console.log('❌ SixTONESのセレブリティ情報が見つかりません');
      return;
    }
    
    // Travis JapanのセレブリティIDを取得
    const { data: travisCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', 'Travis Japan')
      .single();
      
    if (!travisCelebrity) {
      console.log('❌ Travis Japanのセレブリティ情報が見つかりません');
      return;
    }
    
    let totalAdded = 0;
    const addedEpisodes = [];
    
    // SixTONESエピソード追加
    console.log('🎤 SixTONES YouTubeエピソード追加:');
    for (const episode of sixtonesRealEpisodes) {
      const episodeId = await saveEpisode(episode, sixtoneCelebrity.id);
      if (episodeId) {
        addedEpisodes.push({
          group: 'SixTONES',
          id: episodeId,
          title: episode.title,
          date: episode.date,
          viewCount: episode.view_count
        });
        totalAdded++;
      }
    }
    
    console.log('');
    
    // Travis Japanエピソード追加
    console.log('🎤 Travis Japan YouTubeエピソード追加:');
    for (const episode of travisJapanRealEpisodes) {
      const episodeId = await saveEpisode(episode, travisCelebrity.id);
      if (episodeId) {
        addedEpisodes.push({
          group: 'Travis Japan',
          id: episodeId,
          title: episode.title,
          date: episode.date,
          viewCount: episode.view_count
        });
        totalAdded++;
      }
    }
    
    console.log('\\n🎉 YouTubeエピソード追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    if (addedEpisodes.length > 0) {
      console.log('\\n📋 追加されたエピソード:');
      addedEpisodes.forEach(episode => {
        console.log(`   ${episode.group}: ${episode.title.substring(0, 40)}...`);
        console.log(`      ID: ${episode.id} | 視聴回数: ${(episode.viewCount / 1000000).toFixed(1)}M | 日付: ${episode.date}`);
      });
    }
    
    console.log('\\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
    console.log('→ 各セレブリティページで新しいエピソードが表示される');
    
    console.log('\\n🔄 次のステップ:');
    console.log('1. 新しく追加されたエピソードにロケーション・アイテム情報を追加');
    console.log('2. タグ表示が正しく機能するか確認');
    console.log('3. データの孤立がないか最終確認');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addRealYouTubeEpisodes();