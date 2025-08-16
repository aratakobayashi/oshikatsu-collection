const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// YouTubeチャンネルの正しい画像URL（高解像度）
const youtubeChannelImages = [
  {
    name: 'SixTONES',
    channelId: 'UCwjAKjycHHT1QzHrQN5Stww',
    // SixTONES公式YouTubeチャンネルの実際の画像URL
    imageUrl: 'https://yt3.ggpht.com/ytc/AKedOLRsOGUxDRWJMUkzJGxOcXUeLsWp4S5CW1lBRjA8=s800-c-k-c0x00ffffff-no-rj',
    description: 'SixTONES公式YouTubeチャンネルのプロフィール画像'
  },
  {
    name: 'Travis Japan',
    channelId: 'UCoEIdZkDEZdrCDCJSqwifzw',
    // Travis Japan公式YouTubeチャンネルの実際の画像URL
    imageUrl: 'https://yt3.ggpht.com/ytc/AKedOLQs7n_-JfmL5xJRWzUr4d1mOdK1jqxLOzHvZyA_=s800-c-k-c0x00ffffff-no-rj',
    description: 'Travis Japan公式YouTubeチャンネルのプロフィール画像'
  }
];

// セレブリティ画像を更新
async function updateCelebrityImage(celebrityName, imageUrl, description) {
  try {
    console.log(`🔄 ${celebrityName} の画像を更新中...`);
    
    const { data, error } = await supabase
      .from('celebrities')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('name', celebrityName)
      .select('id, name, image_url');
    
    if (error) {
      console.error(`❌ ${celebrityName} 更新エラー:`, error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ ${celebrityName} 画像更新完了`);
      console.log(`   ID: ${data[0].id}`);
      console.log(`   新しい画像URL: ${imageUrl}`);
      console.log(`   説明: ${description}`);
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

// 現在の画像を確認
async function checkCurrentImages() {
  try {
    console.log('🔍 現在の画像URL確認:\n');
    
    for (const channel of youtubeChannelImages) {
      const { data, error } = await supabase
        .from('celebrities')
        .select('id, name, image_url')
        .eq('name', channel.name)
        .single();
      
      if (error) {
        console.error(`❌ ${channel.name} 取得エラー:`, error.message);
        continue;
      }
      
      console.log(`📺 ${channel.name}:`);
      console.log(`   ID: ${data.id}`);
      console.log(`   現在の画像URL: ${data.image_url || 'なし'}`);
      console.log(`   新しい画像URL: ${channel.imageUrl}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ 現在画像確認エラー:', error.message);
  }
}

// メイン処理
async function updateGroupYouTubeImages() {
  console.log('🎭 グループYouTube画像の更新開始！\n');
  
  try {
    // 現在の画像を確認
    await checkCurrentImages();
    
    let totalUpdated = 0;
    
    console.log('🔄 画像更新開始:\n');
    
    // 各グループの画像を更新
    for (const channel of youtubeChannelImages) {
      const success = await updateCelebrityImage(
        channel.name, 
        channel.imageUrl, 
        channel.description
      );
      
      if (success) totalUpdated++;
      console.log('');
    }
    
    console.log('🎉 グループYouTube画像更新完了！');
    console.log(`📊 更新件数: ${totalUpdated}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
    console.log('→ 各グループページでYouTubeチャンネル画像が表示される');
    
    console.log('\n📋 更新内容:');
    console.log('- SixTONES: 公式YouTubeチャンネル画像に変更');
    console.log('- Travis Japan: 公式YouTubeチャンネル画像に変更');
    console.log('- よにのちゃんねると同じ形式の画像表示');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

updateGroupYouTubeImages();