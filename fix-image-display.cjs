const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImageDisplay() {
  console.log('🔧 画像表示問題を修正中...\n');
  
  // 確実に表示される画像に更新
  const workingImages = {
    'ninomiya-kazunari': {
      name: '二宮和也',
      image_url: 'https://yt3.ggpht.com/HqKE9fGSH8Uc9rcV_008kfAv0NK5AKpVkjGqcRnbMWz6qwtj-hkW7MH56m_ETyWNJ7FPgIoc=s800-c-k-c0x00ffffff-no-rj', // よにのちゃんねる
      source: 'よにのちゃんねる公式（代表）'
    },
    'nakamaru-yuichi': {
      name: '中丸雄一', 
      image_url: 'https://yt3.ggpht.com/PqbTQTBVYPxpocRk6rk0GQGZDOeTNOEby3TpyPJgg0c5kOtVCpm2hhWYmbNHL8GKaDzebDaYMA=s800-c-k-c0x00ffffff-no-rj', // 中丸銀河ちゃんねる
      source: '中丸銀河ちゃんねる公式'
    },
    'yamada-ryosuke': {
      name: '山田涼介',
      image_url: 'https://yt3.ggpht.com/HqKE9fGSH8Uc9rcV_008kfAv0NK5AKpVkjGqcRnbMWz6qwtj-hkW7MH56m_ETyWNJ7FPgIoc=s800-c-k-c0x00ffffff-no-rj', // よにのちゃんねる
      source: 'よにのちゃんねる公式（メンバー）'
    },
    'kikuchi-fuma': {
      name: '菊池風磨',
      image_url: 'https://yt3.ggpht.com/HqKE9fGSH8Uc9rcV_008kfAv0NK5AKpVkjGqcRnbMWz6qwtj-hkW7MH56m_ETyWNJ7FPgIoc=s800-c-k-c0x00ffffff-no-rj', // よにのちゃんねる
      source: 'よにのちゃんねる公式（メンバー）'
    }
  };
  
  let fixedCount = 0;
  
  for (const [slug, imageData] of Object.entries(workingImages)) {
    const { error } = await supabase
      .from('celebrities')
      .update({ image_url: imageData.image_url })
      .eq('slug', slug);
    
    if (!error) {
      fixedCount++;
      console.log(`✅ ${imageData.name}: ${imageData.source}`);
      console.log(`   確実に表示される画像に修正`);
    } else {
      console.error(`❌ ${imageData.name}: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 ${fixedCount}名の画像を確実に表示される形に修正完了！`);
  
  console.log('\n📱 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities');
  console.log('→ 各推しの画像が正常に表示されることを確認');
  
  console.log('\n💡 今後のTMDB画像実装:');
  console.log('1. https://www.themoviedb.org/settings/api でAPI登録');
  console.log('2. 実際のAPI Keyを取得');
  console.log('3. 本物のTMDB APIで俳優画像を取得');
  console.log('4. より高品質な個別プロフィール画像に更新');
}

fixImageDisplay();