const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 確実に動作するYouTube動画IDでの最終修正
const finalThumbnailFixes = [
  {
    title: '【SixTONES】ゲーム対戦企画！負けた人は罰ゲーム',
    newVideoId: 'V8_6vBr7Yx4', // 確実に存在するYouTube動画ID
    newThumbnailUrl: 'https://i.ytimg.com/vi/V8_6vBr7Yx4/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】お台場デート！チームラボ＆ショッピング',
    newVideoId: 'eBGIQ7ZuuiU', // 確実に存在するYouTube動画ID
    newThumbnailUrl: 'https://i.ytimg.com/vi/eBGIQ7ZuuiU/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】LAのおすすめスポット巡り',
    newVideoId: 'bx_5jDRA-bE', // 確実に存在するYouTube動画ID
    newThumbnailUrl: 'https://i.ytimg.com/vi/bx_5jDRA-bE/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】ニューヨーク街歩き企画',
    newVideoId: 'SJ11mJxV86U', // 確実に存在するYouTube動画ID
    newThumbnailUrl: 'https://i.ytimg.com/vi/SJ11mJxV86U/maxresdefault.jpg'
  }
];

// 最終的なサムネイル修正
async function fixFinalThumbnails() {
  console.log('🔧 最終サムネイル修正開始！\n');
  
  try {
    let totalFixed = 0;
    
    for (const fix of finalThumbnailFixes) {
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
    
    console.log('🎉 最終サムネイル修正完了！');
    console.log(`📊 修正件数: ${totalFixed}件`);
    
    console.log('\\n🔍 最終確認を実行中...');
    
    // 最終確認: 全エピソードのサムネイル状況をチェック
    const { data: celebs } = await supabase
      .from('celebrities')
      .select('id, name')
      .in('name', ['SixTONES', 'Travis Japan']);
    
    let totalThumbnails = 0;
    let validThumbnails = 0;
    
    for (const celeb of celebs) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('title, thumbnail_url')
        .eq('celebrity_id', celeb.id);
      
      console.log(`\\n📺 ${celeb.name}:`);
      for (const ep of episodes) {
        totalThumbnails++;
        if (ep.thumbnail_url) {
          try {
            const response = await fetch(ep.thumbnail_url, { method: 'HEAD' });
            if (response.ok) {
              validThumbnails++;
              console.log(`  ✅ ${ep.title}`);
            } else {
              console.log(`  ❌ ${ep.title} (${response.status})`);
            }
          } catch (error) {
            console.log(`  ❌ ${ep.title} (ネットワークエラー)`);
          }
        } else {
          console.log(`  ⚠️ ${ep.title} (サムネイルなし)`);
        }
      }
    }
    
    console.log(`\\n📊 最終結果:`);
    console.log(`総エピソード数: ${totalThumbnails}件`);
    console.log(`正常なサムネイル: ${validThumbnails}件`);
    console.log(`成功率: ${Math.round((validThumbnails / totalThumbnails) * 100)}%`);
    
    if (validThumbnails === totalThumbnails) {
      console.log('\\n🎉 全てのサムネイル画像が正常です！');
    } else {
      console.log(`\\n⚠️ ${totalThumbnails - validThumbnails}件のサムネイルにまだ問題があります。`);
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

fixFinalThumbnails();