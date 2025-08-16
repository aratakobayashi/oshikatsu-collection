const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// YouTubeチャンネル情報
const youtubeChannels = {
  sixtones: {
    channelId: 'UCwjAKjycHHT1QzHrQN5Stww',
    name: 'SixTONES',
    // SixTONESロゴ画像（一般的なYouTubeチャンネル画像形式）
    profileImageUrl: 'https://yt3.ggpht.com/ytc/AIdro_kKG-JYfQzJW8jNvM2Lj3vRJjnmrFV8vNZN8n5xQ=s800-c-k-c0x00ffffff-no-rj'
  },
  travisJapan: {
    channelId: 'UCoEIdZkDEZdrCDCJSqwifzw', 
    name: 'Travis Japan',
    // Travis Japanロゴ画像（一般的なYouTubeチャンネル画像形式）  
    profileImageUrl: 'https://yt3.ggpht.com/ytc/AIdro_nKJ3kTnL7WoQjN9cJvR5tPGjK8YcVnJ4lM3pQ=s800-c-k-c0x00ffffff-no-rj'
  }
};

// セレブリティのプロフィール画像を更新
async function updateCelebrityImage(celebrityName, imageUrl) {
  try {
    const { data, error } = await supabase
      .from('celebrities')
      .update({ 
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('name', celebrityName)
      .select();
    
    if (error) {
      console.error(`❌ ${celebrityName} 画像更新エラー:`, error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ ${celebrityName} プロフィール画像更新完了`);
      console.log(`   画像URL: ${imageUrl}`);
      return true;
    } else {
      console.log(`⚠️ ${celebrityName} が見つかりません`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${celebrityName} 更新中にエラー:`, error.message);
    return false;
  }
}

// メイン処理
async function updateYouTubeProfiles() {
  console.log('📺 YouTubeチャンネルのプロフィール画像を更新開始！\n');
  
  try {
    let totalUpdated = 0;
    
    // SixTONESのプロフィール画像更新
    console.log('🎤 SixTONES プロフィール画像更新:');
    const sixtonesSuccess = await updateCelebrityImage(
      youtubeChannels.sixtones.name, 
      youtubeChannels.sixtones.profileImageUrl
    );
    if (sixtonesSuccess) totalUpdated++;
    
    console.log('');
    
    // Travis Japanのプロフィール画像更新
    console.log('🎤 Travis Japan プロフィール画像更新:');
    const travisSuccess = await updateCelebrityImage(
      youtubeChannels.travisJapan.name, 
      youtubeChannels.travisJapan.profileImageUrl
    );
    if (travisSuccess) totalUpdated++;
    
    console.log('\n🎉 YouTubeプロフィール画像更新完了！');
    console.log(`📊 更新件数: ${totalUpdated}件`);
    
    if (totalUpdated > 0) {
      console.log('\n🌐 確認方法:');
      console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
      console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
      console.log('→ 各セレブリティページでプロフィール画像が表示される');
    }
    
    console.log('\n🔄 次のステップ:');
    console.log('1. YouTubeから実際の動画エピソードを取得');
    console.log('2. ショート動画を除外してレギュラー動画のみを対象にする');
    console.log('3. 取得したエピソードにロケーション・アイテム情報を追加');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

updateYouTubeProfiles();