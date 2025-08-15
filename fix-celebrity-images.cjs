const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCelebrityImages() {
  console.log('🖼️ 推しの画像を安全なプレースホルダーに修正中...\n');

  const celebrityUpdates = [
    {
      slug: 'ninomiya-kazunari',
      name: '二宮和也',
      image_url: 'https://ui-avatars.com/api/?name=二宮和也&background=ff6b6b&color=fff&size=400&font-size=0.4'
    },
    {
      slug: 'nakamaru-yuichi', 
      name: '中丸雄一',
      image_url: 'https://ui-avatars.com/api/?name=中丸雄一&background=4ecdc4&color=fff&size=400&font-size=0.4'
    },
    {
      slug: 'yamada-ryosuke',
      name: '山田涼介', 
      image_url: 'https://ui-avatars.com/api/?name=山田涼介&background=45b7d1&color=fff&size=400&font-size=0.4'
    },
    {
      slug: 'kikuchi-fuma',
      name: '菊池風磨',
      image_url: 'https://ui-avatars.com/api/?name=菊池風磨&background=f093fb&color=fff&size=400&font-size=0.4'
    }
  ];

  try {
    for (const celebrity of celebrityUpdates) {
      const { error } = await supabase
        .from('celebrities')
        .update({ image_url: celebrity.image_url })
        .eq('slug', celebrity.slug);

      if (error) {
        console.error(`❌ ${celebrity.name} の画像更新に失敗:`, error.message);
      } else {
        console.log(`✅ ${celebrity.name} の画像を更新しました`);
        console.log(`   新しい画像: ${celebrity.image_url}\n`);
      }
    }

    console.log('🎉 すべての推しの画像を安全なプレースホルダーに更新完了！');
    console.log('📱 著作権の問題なく、綺麗な文字ベースアバターを使用しています。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

fixCelebrityImages();