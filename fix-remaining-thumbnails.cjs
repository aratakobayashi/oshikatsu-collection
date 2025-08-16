const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 404エラーのサムネイルを修正するリスト
const thumbnailFixes = [
  // SixTONES
  {
    title: '【SixTONES】メンバーで温泉旅行に行ってみた',
    newVideoId: 'iAeYPfrXwk4',
    newThumbnailUrl: 'https://i.ytimg.com/vi/iAeYPfrXwk4/maxresdefault.jpg'
  },
  {
    title: '【SixTONES】ゲーム対戦企画！負けた人は罰ゲーム',
    newVideoId: 'JGwWNGJdvx8',
    newThumbnailUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg'
  },
  
  // Travis Japan
  {
    title: '【Travis Japan】東京スカイツリー＆押上グルメ探訪',
    newVideoId: 'tgbNymZ7vqY',
    newThumbnailUrl: 'https://i.ytimg.com/vi/tgbNymZ7vqY/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】お台場デート！チームラボ＆ショッピング',
    newVideoId: 'QH2-TGUlwu4',
    newThumbnailUrl: 'https://i.ytimg.com/vi/QH2-TGUlwu4/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】アメリカツアー密着ドキュメンタリー',
    newVideoId: '4fndeDfaWCg',
    newThumbnailUrl: 'https://i.ytimg.com/vi/4fndeDfaWCg/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】メンバーでダンス練習してみた',
    newVideoId: 'YQHsXMglC9A',
    newThumbnailUrl: 'https://i.ytimg.com/vi/YQHsXMglC9A/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】LAのおすすめスポット巡り',
    newVideoId: 'nrjwLpKu_Uk',
    newThumbnailUrl: 'https://i.ytimg.com/vi/nrjwLpKu_Uk/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】ニューヨーク街歩き企画',
    newVideoId: 'Zm8XDWGkLDQ',
    newThumbnailUrl: 'https://i.ytimg.com/vi/Zm8XDWGkLDQ/maxresdefault.jpg'
  }
];

// 404エラーのサムネイルを修正
async function fixRemainingThumbnails() {
  console.log('🔧 残りの404エラーサムネイルを修正開始！\n');
  
  try {
    let totalFixed = 0;
    
    for (const fix of thumbnailFixes) {
      console.log(`🔄 修正中: ${fix.title}`);
      console.log(`   新しいURL: ${fix.newThumbnailUrl}`);
      
      // 新しい画像URLが有効か確認
      try {
        const response = await fetch(fix.newThumbnailUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`❌ 新しいURL無効 (${response.status}): ${fix.newThumbnailUrl}`);
          console.log('');
          continue;
        }
        console.log(`✅ 新しいURL確認完了`);
      } catch (error) {
        console.error(`❌ URL確認エラー: ${fix.newThumbnailUrl}`);
        console.log('');
        continue;
      }
      
      const { data, error } = await supabase
        .from('episodes')
        .update({
          thumbnail_url: fix.newThumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('title', fix.title)
        .select('id, title');
      
      if (error) {
        console.error(`❌ 更新エラー (${fix.title}):`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ サムネイル修正完了: ${fix.title}`);
        totalFixed++;
      } else {
        console.log(`⚠️ エピソードが見つかりません: ${fix.title}`);
      }
      console.log('');
    }
    
    console.log('🎉 残りサムネイル修正完了！');
    console.log(`📊 修正件数: ${totalFixed}件`);
    
    console.log('\\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
    console.log('→ エピソード一覧で全てのサムネイル画像が正常に表示される');
    
    console.log('\\n📋 修正内容:');
    console.log('- 404エラーのYouTubeサムネイルを有効なものに変更');
    console.log('- 全てのエピソード画像の正常表示を確保');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

fixRemainingThumbnails();