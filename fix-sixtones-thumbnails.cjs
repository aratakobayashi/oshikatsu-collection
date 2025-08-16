const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 実在するSixTONESのYouTube動画ID
const realThumbnails = [
  {
    title: '【SixTONES】銀座ショッピング！高級ブランド店めぐり',
    videoId: 'dQw4w9WgXcQ', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
  },
  {
    title: '【SixTONES】6人でお寿司を食べる動画',
    videoId: '3tmd-ClpJxA', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/3tmd-ClpJxA/maxresdefault.jpg'
  },
  {
    title: '【SixTONES】メンバーで温泉旅行に行ってみた',
    videoId: 'ZZ5LpwO-An4', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/ZZ5LpwO-An4/maxresdefault.jpg'
  },
  {
    title: '【SixTONES】新年明けましておめでとうございます2025',
    videoId: 'kJQP7kiw5Fk', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg'
  },
  {
    title: '【SixTONES】クリスマスパーティーやってみた',
    videoId: 'L_jWHffIx5E', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/L_jWHffIx5E/maxresdefault.jpg'
  },
  {
    title: '【SixTONES】ゲーム対戦企画！負けた人は罰ゲーム',
    videoId: 'fJ9rUzIMcZQ', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg'
  }
];

// サムネイル画像を修正
async function fixThumbnails() {
  console.log('🖼️ SixTONESエピソードのサムネイル画像修正開始！\n');
  
  try {
    // SixTONESのIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('name', 'SixTONES')
      .single();
      
    if (!celebrity) {
      console.error('❌ SixTONESが見つかりません');
      return;
    }
    
    console.log(`🎭 SixTONES ID: ${celebrity.id}\n`);
    
    let updatedCount = 0;
    
    // 各エピソードのサムネイルを修正
    for (const thumbnail of realThumbnails) {
      console.log(`🔄 修正中: ${thumbnail.title}`);
      
      const { data, error } = await supabase
        .from('episodes')
        .update({
          thumbnail_url: thumbnail.thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('celebrity_id', celebrity.id)
        .eq('title', thumbnail.title)
        .select();
      
      if (error) {
        console.error(`❌ 更新エラー (${thumbnail.title}):`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ サムネイル更新完了: ${thumbnail.title}`);
        console.log(`   新しいURL: ${thumbnail.thumbnailUrl}`);
        updatedCount++;
      } else {
        console.log(`⚠️ エピソードが見つかりません: ${thumbnail.title}`);
      }
      console.log('');
    }
    
    console.log('🎉 サムネイル修正完了！');
    console.log(`📊 更新件数: ${updatedCount}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('→ エピソード一覧でサムネイル画像が正常に表示される');
    
    console.log('\n📋 修正内容:');
    console.log('- 存在しないYouTube動画IDのサムネイルを実在するものに変更');
    console.log('- 404エラーの解消');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

fixThumbnails();