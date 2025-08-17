require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

// 各グループの公式画像URL
const groupImages = [
  {
    slug: 'equal-love',
    name: '=LOVE',
    image_url: 'https://equal-love.jp/static/equallove/official/cmn/logo_heart.png',
    fallback_url: 'https://equal-love.jp/static/equallove/official/top/logo-min.png'
  },
  {
    slug: 'not-equal-me', 
    name: '≠ME',
    image_url: 'https://not-equal-me.jp/static/notequalme/cmn/logo_image.png',
    fallback_url: 'https://not-equal-me.jp/static/notequalme/top/logo-min.png'
  },
  {
    slug: 'nearly-equal-joy',
    name: '≒JOY',
    image_url: 'https://s3-aop.plusmember.jp/prod/public/yoani3rd/common/logo_image.png',
    fallback_url: 'https://nearly-equal-joy.jp/static/nearlyequaljoy/top/logo-min.png'
  }
];

async function updateGroupImages() {
  console.log('🎨 グループ画像更新開始！\n');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const group of groupImages) {
    try {
      console.log(`📸 ${group.name} の画像を更新中...`);
      console.log(`   URL: ${group.image_url}`);
      
      // 画像URLを更新
      const { data, error } = await supabase
        .from('celebrities')
        .update({ 
          image_url: group.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('slug', group.slug)
        .select();
      
      if (error) {
        console.error(`❌ ${group.name} 更新エラー:`, error.message);
        
        // フォールバックURLで再試行
        if (group.fallback_url) {
          console.log(`   🔄 フォールバックURLで再試行: ${group.fallback_url}`);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('celebrities')
            .update({ 
              image_url: group.fallback_url,
              updated_at: new Date().toISOString()
            })
            .eq('slug', group.slug)
            .select();
          
          if (!fallbackError && fallbackData) {
            console.log(`✅ ${group.name} フォールバックで更新成功！`);
            updatedCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      } else if (data && data.length > 0) {
        console.log(`✅ ${group.name} 画像更新成功！`);
        updatedCount++;
      } else {
        console.log(`⚠️ ${group.name} が見つかりません`);
        errorCount++;
      }
      
    } catch (error) {
      console.error(`❌ ${group.name} 処理エラー:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n🎉 画像更新完了！');
  console.log('='.repeat(60));
  console.log(`📊 結果:`)
  console.log(`  - 更新成功: ${updatedCount}グループ`);
  console.log(`  - エラー: ${errorCount}グループ`);
  
  console.log('\n🌐 確認URL:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/equal-love');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/not-equal-me');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/nearly-equal-joy');
}

// スクリプト実行
if (require.main === module) {
  updateGroupImages().catch(console.error);
}

module.exports = { updateGroupImages };
