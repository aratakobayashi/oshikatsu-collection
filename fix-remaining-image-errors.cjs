const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// エラーパターンの定義
const errorPatterns = {
  // ローカル画像404エラー
  localImages: [
    'assassination_classroom.jpg',
    'assassination_classroom_2.jpg', 
    'kindaichi.jpg',
    'momikeshite_fuyu.jpg',
    'semi_otoko.jpg'
  ],
  
  // YouTube チャンネル403エラー
  youtubeChannels: [
    '5vzs99I3DWZGTDHcpMd63ASJCgsb_jdMkkfHhYU40zptGqQkeUd53WFn5kb6KMZq0DaRpf_DZA=s800-c-k-c0x00ffffff-no-rj'
  ],
  
  // Unsplash 404エラー
  unsplashErrors: [
    'photo-1565299624946-b28f40a0ca4b'
  ],
  
  // Uniqlo 403エラー
  uniqlοErrors: [
    '422553_item_01_400.jpg'
  ]
};

// delay関数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 壊れた画像URLを検出・修正
async function fixRemainingImageErrors() {
  console.log('🔧 残存する画像エラーの一括修正開始...\n');
  
  let totalFixed = 0;

  try {
    // 1. ローカル画像404エラーの修正
    console.log('📸 ローカル画像404エラー修正中...');
    
    for (const imageName of errorPatterns.localImages) {
      console.log(`🔍 検索中: ${imageName}`);
      
      // 全テーブルでこの画像を検索
      const tables = ['celebrities', 'locations', 'items', 'episodes'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id, image_url, thumbnail_url')
            .or(`image_url.like.%${imageName}%,thumbnail_url.like.%${imageName}%`);

          if (error) {
            console.error(`❌ ${table}検索エラー:`, error.message);
            continue;
          }

          if (data && data.length > 0) {
            console.log(`📋 ${table}テーブルで${data.length}件発見`);
            
            for (const record of data) {
              let updates = {};
              
              if (record.image_url && record.image_url.includes(imageName)) {
                updates.image_url = `/placeholder-${table.slice(0, -1)}.jpg`;
              }
              if (record.thumbnail_url && record.thumbnail_url.includes(imageName)) {
                updates.thumbnail_url = `/placeholder-video.jpg`;
              }
              
              if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                  .from(table)
                  .update(updates)
                  .eq('id', record.id);

                if (!updateError) {
                  console.log(`✅ ${table} ID:${record.id} 修正完了`);
                  totalFixed++;
                } else {
                  console.error(`❌ ${table} ID:${record.id} 修正失敗:`, updateError.message);
                }
              }
              
              await delay(100);
            }
          }
        } catch (err) {
          console.error(`❌ ${table}テーブル処理エラー:`, err.message);
        }
        
        await delay(500);
      }
    }

    // 2. YouTube チャンネル403エラーの修正
    console.log('\n🎥 YouTube チャンネル403エラー修正中...');
    
    for (const channelUrl of errorPatterns.youtubeChannels) {
      try {
        const { data, error } = await supabase
          .from('celebrities')
          .select('id, name, image_url')
          .like('image_url', `%${channelUrl}%`);

        if (data && data.length > 0) {
          console.log(`📋 YouTube チャンネル画像: ${data.length}件発見`);
          
          for (const celebrity of data) {
            const { error: updateError } = await supabase
              .from('celebrities')
              .update({ image_url: '/placeholder-celebrity.jpg' })
              .eq('id', celebrity.id);

            if (!updateError) {
              console.log(`✅ ${celebrity.name} のYouTube画像修正完了`);
              totalFixed++;
            }
            
            await delay(100);
          }
        }
      } catch (err) {
        console.error(`❌ YouTube チャンネル修正エラー:`, err.message);
      }
    }

    // 3. Unsplash 404エラーの修正
    console.log('\n🌅 Unsplash 404エラー修正中...');
    
    for (const unsplashId of errorPatterns.unsplashErrors) {
      try {
        const { data: locations, error } = await supabase
          .from('locations')
          .select('id, name, image_url')
          .like('image_url', `%${unsplashId}%`);

        if (locations && locations.length > 0) {
          console.log(`📋 Unsplash画像: ${locations.length}件発見`);
          
          for (const location of locations) {
            const { error: updateError } = await supabase
              .from('locations')
              .update({ image_url: '/placeholder-location.jpg' })
              .eq('id', location.id);

            if (!updateError) {
              console.log(`✅ ${location.name} のUnsplash画像修正完了`);
              totalFixed++;
            }
            
            await delay(100);
          }
        }
      } catch (err) {
        console.error(`❌ Unsplash修正エラー:`, err.message);
      }
    }

    // 4. Uniqlo 403エラーの修正
    console.log('\n👕 Uniqlo 403エラー修正中...');
    
    for (const uniqlοUrl of errorPatterns.uniqlοErrors) {
      try {
        const { data: items, error } = await supabase
          .from('items')
          .select('id, name, image_url')
          .like('image_url', `%${uniqlοUrl}%`);

        if (items && items.length > 0) {
          console.log(`📋 Uniqlo商品画像: ${items.length}件発見`);
          
          for (const item of items) {
            const { error: updateError } = await supabase
              .from('items')
              .update({ image_url: '/placeholder-item.jpg' })
              .eq('id', item.id);

            if (!updateError) {
              console.log(`✅ ${item.name} のUniqlo画像修正完了`);
              totalFixed++;
            }
            
            await delay(100);
          }
        }
      } catch (err) {
        console.error(`❌ Uniqlo修正エラー:`, err.message);
      }
    }

    console.log(`\n🎉 残存画像エラー修正完了！`);
    console.log(`📊 総修正件数: ${totalFixed}件`);
    
    console.log('\n🔍 修正内容:');
    console.log('- ローカル画像404 → プレースホルダー画像');
    console.log('- YouTube チャンネル403 → プレースホルダー画像');
    console.log('- Unsplash 404 → プレースホルダー画像');
    console.log('- Uniqlo 403 → プレースホルダー画像');
    
    console.log('\n✅ これでトップページの404/403エラーが解消されます！');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

fixRemainingImageErrors();