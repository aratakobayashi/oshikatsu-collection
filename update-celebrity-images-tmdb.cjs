const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// TMDB API設定
const TMDB_API_KEY = '4573ec6c37323f6f89002cb24c690875';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// delay関数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// TMDBから人物情報を検索
async function searchPersonOnTMDB(name) {
  try {
    const encodedName = encodeURIComponent(name);
    const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodedName}&language=ja-JP`;
    
    console.log(`🔍 TMDB検索: ${name}`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const person = data.results[0]; // 最初の結果を使用
      if (person.profile_path) {
        const imageUrl = `${TMDB_IMAGE_BASE_URL}${person.profile_path}`;
        console.log(`✅ 画像発見: ${name} -> ${imageUrl}`);
        return {
          imageUrl,
          tmdbId: person.id,
          popularity: person.popularity,
          knownFor: person.known_for_department
        };
      }
    }
    
    console.log(`❌ 画像なし: ${name}`);
    return null;
  } catch (error) {
    console.error(`❌ TMDB検索エラー (${name}):`, error.message);
    return null;
  }
}

// セレブリティの画像を更新
async function updateCelebrityImage(celebrity, tmdbData) {
  try {
    const updates = {
      image_url: tmdbData.imageUrl,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('celebrities')
      .update(updates)
      .eq('id', celebrity.id)
      .select();
    
    if (error) {
      console.error(`❌ 更新エラー (${celebrity.name}):`, error.message);
      return false;
    }
    
    console.log(`✅ 画像更新完了: ${celebrity.name}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新中にエラー (${celebrity.name}):`, error.message);
    return false;
  }
}

// YouTube チャンネル画像の取得（仮のURL）
function getYouTubeChannelImage(celebrityName) {
  // YouTubeチャンネル画像のURL（一般的なパターン）
  const channelImages = {
    'SixTONES': 'https://yt3.ggpht.com/ytc/AIdro_kKG-JYfQzJW8jNvM2Lj3vRJjnmrFV8vNZN8n5xQ=s800-c-k-c0x00ffffff-no-rj',
    'Travis Japan': 'https://yt3.ggpht.com/ytc/AIdro_nKJ3kTnL7WoQjN9cJvR5tPGjK8YcVnJ4lM3pQ=s800-c-k-c0x00ffffff-no-rj',
    'よにのちゃんねる': 'https://yt3.ggpht.com/HqKE9fGSH8Uc9rcV_008kfAv0NK5AKpVkjGqcRnbMWz6qwtj-hkW7MH56m_ETyWNJ7FPgIoc=s800-c-k-c0x00ffffff-no-rj'
  };
  
  return channelImages[celebrityName] || null;
}

// グループ・YouTubeチャンネルの画像を更新
async function updateGroupImage(celebrity) {
  try {
    const imageUrl = getYouTubeChannelImage(celebrity.name);
    
    if (!imageUrl) {
      console.log(`⚠️ YouTube画像なし: ${celebrity.name}`);
      return false;
    }
    
    const updates = {
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('celebrities')
      .update(updates)
      .eq('id', celebrity.id)
      .select();
    
    if (error) {
      console.error(`❌ 更新エラー (${celebrity.name}):`, error.message);
      return false;
    }
    
    console.log(`✅ YouTube画像更新完了: ${celebrity.name} -> ${imageUrl}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新中にエラー (${celebrity.name}):`, error.message);
    return false;
  }
}

// メイン処理
async function updateAllCelebrityImages() {
  console.log('🎭 セレブリティ画像の一括更新開始！\n');
  
  try {
    // 全セレブリティを取得
    const { data: celebrities, error } = await supabase
      .from('celebrities')
      .select('id, name, type')
      .eq('status', 'active');
    
    if (error) {
      console.error('❌ セレブリティ取得エラー:', error.message);
      return;
    }
    
    if (!celebrities || celebrities.length === 0) {
      console.log('❌ セレブリティが見つかりません');
      return;
    }
    
    console.log(`📋 対象セレブリティ: ${celebrities.length}件\n`);
    
    let totalUpdated = 0;
    let tmdbUpdated = 0;
    let youtubeUpdated = 0;
    
    for (let i = 0; i < celebrities.length; i++) {
      const celebrity = celebrities[i];
      console.log(`\n${i + 1}/${celebrities.length} 処理中: ${celebrity.name} (${celebrity.type})`);
      
      let success = false;
      
      if (celebrity.type === 'individual' || celebrity.type === 'celebrity') {
        // 個人タレント → TMDB から画像取得
        const tmdbData = await searchPersonOnTMDB(celebrity.name);
        if (tmdbData) {
          success = await updateCelebrityImage(celebrity, tmdbData);
          if (success) tmdbUpdated++;
        }
      } else if (celebrity.type === 'group' || celebrity.type === 'youtube_channel') {
        // グループ・YouTubeチャンネル → YouTube画像
        success = await updateGroupImage(celebrity);
        if (success) youtubeUpdated++;
      }
      
      if (success) totalUpdated++;
      
      // API制限を考慮して少し待機
      await delay(100);
    }
    
    console.log('\n🎉 セレブリティ画像更新完了！');
    console.log(`📊 総更新件数: ${totalUpdated}件`);
    console.log(`📊 TMDB画像: ${tmdbUpdated}件`);
    console.log(`📊 YouTube画像: ${youtubeUpdated}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities');
    console.log('→ 各セレブリティの画像が表示される');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

updateAllCelebrityImages();