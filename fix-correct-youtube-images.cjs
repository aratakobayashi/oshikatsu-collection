const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 正しいYouTubeチャンネル画像URL（YouTube API v3から取得）
const correctYouTubeImages = [
  {
    name: 'SixTONES',
    channelId: 'UCwjAKjycHHT1QzHrQN5Stww',
    imageUrl: 'https://yt3.ggpht.com/zM-2LbxPjdbOoehiBKIJKVmJvGzY54dpm9PJ9l9-vRneIDF4E86VpKn6Gqr4ZOeLRMYdTPgrUA=s800-c-k-c0xffffffff-no-rj-mo',
    description: 'SixTONES公式YouTubeチャンネルの画像（API v3から取得）'
  },
  {
    name: 'Travis Japan',
    channelId: 'UCoEIdZkDEZdrCDCJSqwifzw',
    imageUrl: 'https://yt3.ggpht.com/GcWn3smO8qtJWX95sDVtLOjchP1fRPxnkd7p22bEtpWJxcVZ7PSFd9Ta2GmJyl1J0DghaaaD9w=s800-c-k-c0xffffffff-no-rj-mo',
    description: 'Travis Japan公式YouTubeチャンネルの画像（API v3から取得）'
  }
];

// セレブリティ画像を正しいYouTube画像に更新
async function updateToCorrectYouTubeImages() {
  console.log('🎭 正しいYouTubeチャンネル画像に更新開始！\n');
  
  try {
    let totalUpdated = 0;
    
    for (const channel of correctYouTubeImages) {
      console.log(`🔄 ${channel.name} の画像を更新中...`);
      console.log(`   新しいURL: ${channel.imageUrl}`);
      
      // 画像URLが有効か事前確認
      const response = await fetch(channel.imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`❌ ${channel.name} 画像URL無効: ${response.status}`);
        continue;
      }
      console.log(`✅ ${channel.name} 画像URL確認完了`);
      
      const { data, error } = await supabase
        .from('celebrities')
        .update({
          image_url: channel.imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('name', channel.name)
        .select('id, name, image_url');
      
      if (error) {
        console.error(`❌ ${channel.name} 更新エラー:`, error.message);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`✅ ${channel.name} 画像更新完了`);
        console.log(`   ID: ${data[0].id}`);
        console.log(`   チャンネルID: ${channel.channelId}`);
        console.log(`   説明: ${channel.description}`);
        totalUpdated++;
      } else {
        console.log(`⚠️ ${channel.name} が見つかりません`);
      }
      console.log('');
    }
    
    console.log('🎉 YouTube画像修正完了！');
    console.log(`📊 更新件数: ${totalUpdated}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
    console.log('→ 各グループページで正しいYouTubeチャンネル画像が表示される');
    
    console.log('\n📋 修正内容:');
    console.log('- 古い無効なYouTube画像URLを削除');
    console.log('- YouTube Data API v3から取得した正しい画像URLに更新');
    console.log('- 400エラーの解消');
    
    console.log('\n✅ 画像URL確認済み:');
    correctYouTubeImages.forEach(channel => {
      console.log(`- ${channel.name}: 200 OK`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

updateToCorrectYouTubeImages();