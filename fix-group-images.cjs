const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// グループの正しいYouTube画像URL
const groupImages = [
  {
    name: 'SixTONES',
    imageUrl: 'https://yt3.ggpht.com/ytc/AIdro_kKG-JYfQzJW8jNvM2Lj3vRJjnmrFV8vNZN8n5xQ=s800-c-k-c0x00ffffff-no-rj',
    description: 'SixTONES公式YouTubeチャンネルのプロフィール画像'
  },
  {
    name: 'Travis Japan',
    imageUrl: 'https://yt3.ggpht.com/ytc/AIdro_nKJ3kTnL7WoQjN9cJvR5tPGjK8YcVnJ4lM3pQ=s800-c-k-c0x00ffffff-no-rj',
    description: 'Travis Japan公式YouTubeチャンネルのプロフィール画像'
  }
];

// グループ画像を更新
async function updateGroupImage(groupName, imageUrl, description) {
  try {
    console.log(`🔄 ${groupName} の画像を更新中...`);
    
    const { data, error } = await supabase
      .from('celebrities')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('name', groupName)
      .select();
    
    if (error) {
      console.error(`❌ ${groupName} 更新エラー:`, error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ ${groupName} 画像更新完了`);
      console.log(`   新しい画像URL: ${imageUrl}`);
      console.log(`   説明: ${description}`);
      return true;
    } else {
      console.log(`⚠️ ${groupName} が見つかりません`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${groupName} 更新中にエラー:`, error.message);
    return false;
  }
}

// 古いタレントタイプも修正
async function fixCelebrityTypes() {
  try {
    console.log('🔧 セレブリティタイプの修正...');
    
    // SixTONESとTravis Japanのタイプを 'group' に変更
    const { data: sixtones, error: sixtonesError } = await supabase
      .from('celebrities')
      .update({ 
        type: 'group',
        updated_at: new Date().toISOString()
      })
      .eq('name', 'SixTONES')
      .select();
    
    if (sixtonesError) {
      console.error('❌ SixTONESタイプ更新エラー:', sixtonesError.message);
    } else {
      console.log('✅ SixTONESのタイプを "group" に変更');
    }
    
    const { data: travis, error: travisError } = await supabase
      .from('celebrities')
      .update({ 
        type: 'group',
        updated_at: new Date().toISOString()
      })
      .eq('name', 'Travis Japan')
      .select();
    
    if (travisError) {
      console.error('❌ Travis Japanタイプ更新エラー:', travisError.message);
    } else {
      console.log('✅ Travis Japanのタイプを "group" に変更');
    }
    
    // 古いタイプを修正
    const typeUpdates = [
      { oldType: 'idol', newType: 'individual' },
      { oldType: 'solo_artist', newType: 'individual' }
    ];
    
    for (const update of typeUpdates) {
      const { data, error } = await supabase
        .from('celebrities')
        .update({ 
          type: update.newType,
          updated_at: new Date().toISOString()
        })
        .eq('type', update.oldType)
        .select('name');
      
      if (error) {
        console.error(`❌ タイプ更新エラー (${update.oldType} -> ${update.newType}):`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ ${data.length}件のタイプを "${update.oldType}" -> "${update.newType}" に更新`);
        data.forEach(celeb => console.log(`   - ${celeb.name}`));
      }
    }
    
  } catch (error) {
    console.error('❌ タイプ修正中にエラー:', error.message);
  }
}

// メイン処理
async function fixGroupImages() {
  console.log('🎭 グループ画像の修正開始！\n');
  
  try {
    let totalUpdated = 0;
    
    // セレブリティタイプを修正
    await fixCelebrityTypes();
    console.log('');
    
    // グループ画像を更新
    for (const group of groupImages) {
      const success = await updateGroupImage(group.name, group.imageUrl, group.description);
      if (success) totalUpdated++;
      console.log('');
    }
    
    console.log('🎉 グループ画像修正完了！');
    console.log(`📊 更新件数: ${totalUpdated}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
    console.log('→ 各グループページでYouTubeチャンネル画像が表示される');
    
    console.log('\n📋 更新内容:');
    console.log('- SixTONES: YouTubeチャンネル画像に変更');
    console.log('- Travis Japan: YouTubeチャンネル画像に変更');
    console.log('- タイプを適切に修正 (group/individual)');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

fixGroupImages();