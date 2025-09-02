const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBulkExternalUrls() {
  console.log('🔧 一括外部URL修正開始...\n');
  
  let totalFixed = 0;

  // 1. YouTube maxresdefault.jpg -> hqdefault.jpg 一括修正
  try {
    console.log('📺 YouTube maxresdefault.jpg 修正中...');
    
    const { data: brokenYoutubeUrls, error: selectError } = await supabase
      .from('episodes')
      .select('id, title, thumbnail_url')
      .like('thumbnail_url', '%maxresdefault.jpg%');

    if (selectError) {
      console.error('❌ YouTube URL取得エラー:', selectError.message);
    } else if (brokenYoutubeUrls && brokenYoutubeUrls.length > 0) {
      console.log(`🎯 修正対象: ${brokenYoutubeUrls.length}件`);
      
      for (const episode of brokenYoutubeUrls) {
        const fixedUrl = episode.thumbnail_url.replace('maxresdefault.jpg', 'hqdefault.jpg');
        
        const { error: updateError } = await supabase
          .from('episodes')
          .update({ thumbnail_url: fixedUrl })
          .eq('id', episode.id);

        if (!updateError) {
          console.log(`✅ 修正: ${episode.title}`);
          totalFixed++;
        } else {
          console.error(`❌ 修正失敗: ${episode.title}`, updateError.message);
        }
        
        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      console.log('✅ YouTube maxresdefault.jpg 問題なし');
    }
  } catch (error) {
    console.error('❌ YouTube URL修正エラー:', error.message);
  }

  // 2. TMDB broken URLs 検出・修正
  try {
    console.log('\n🎬 TMDB 404エラー検出中...');
    
    const { data: celebrities, error } = await supabase
      .from('celebrities')
      .select('id, name, image_url')
      .not('image_url', 'is', null)
      .like('image_url', '%tmdb%');

    if (error) {
      console.error('❌ TMDB URL取得エラー:', error.message);
    } else if (celebrities && celebrities.length > 0) {
      console.log(`🔍 TMDB URL確認対象: ${celebrities.length}件`);
      
      // 壊れたTMDB URLをプレースホルダーに置換
      for (const celebrity of celebrities) {
        try {
          // 画像URLの有効性をチェック（簡易）
          const response = await fetch(celebrity.image_url, { method: 'HEAD' });
          
          if (!response.ok) {
            // 404の場合はプレースホルダーに変更
            const { error: updateError } = await supabase
              .from('celebrities')
              .update({ image_url: '/placeholder-celebrity.jpg' })
              .eq('id', celebrity.id);

            if (!updateError) {
              console.log(`✅ TMDB修正: ${celebrity.name} -> プレースホルダー`);
              totalFixed++;
            }
          }
        } catch (fetchError) {
          // ネットワークエラーの場合もプレースホルダーに変更
          const { error: updateError } = await supabase
            .from('celebrities')
            .update({ image_url: '/placeholder-celebrity.jpg' })
            .eq('id', celebrity.id);

          if (!updateError) {
            console.log(`✅ TMDB修正: ${celebrity.name} -> プレースホルダー (ネットワークエラー)`);
            totalFixed++;
          }
        }
        
        // API制限とサーバー負荷を避けるため待機
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  } catch (error) {
    console.error('❌ TMDB URL修正エラー:', error.message);
  }

  console.log(`\n🎉 一括外部URL修正完了！`);
  console.log(`📊 総修正件数: ${totalFixed}件`);
  
  console.log('\n⚡ Page Speed Insights 再測定推奨:');
  console.log('https://pagespeed.web.dev/analysis/https-oshikatsu-collection-netlify-app/');
}

fixBulkExternalUrls();