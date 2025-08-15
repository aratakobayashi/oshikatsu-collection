const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient('https://awaarykghpylggygkiyp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE');

async function addSpecialItems() {
  console.log('🍹 特別アイテムを追加中...');
  
  const yamadaCelebrity = await supabase.from('celebrities').select('id').eq('slug', 'yamada-ryosuke').single();
  const semiEpisode = await supabase.from('episodes').select('id').ilike('title', '%セミオトコ%').eq('celebrity_id', yamadaCelebrity.data.id).single();
  const namiyaEpisode = await supabase.from('episodes').select('id').ilike('title', '%ナミヤ%').eq('celebrity_id', yamadaCelebrity.data.id).single();
  
  const specialItems = [
    {
      id: crypto.randomUUID(),
      name: 'セミオ（劇中ドリンク）',
      slug: 'semio-drink',
      description: 'セミオトコ劇中で登場するドリンク。蓮月カフェで実際に注文可能',
      price: 500,
      brand: '蓮月カフェ',
      category: 'food_drink',
      tags: ['drama_item', 'cafe_menu', 'fan_pilgrimage'],
      episode_id: semiEpisode.data.id,
      celebrity_id: yamadaCelebrity.data.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: '昭和レトロ商品',
      slug: 'showa-retro-goods',
      description: '昭和の町で販売されている当時の商品（駄菓子、玩具など）',
      price: 100,
      purchase_url: 'https://www.showa-no-machi.com/',
      brand: '豊後高田昭和の町',
      category: 'retro_goods',
      tags: ['retro_item', 'souvenir', 'filming_location_goods'],
      episode_id: namiyaEpisode.data.id,
      celebrity_id: yamadaCelebrity.data.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  for (const item of specialItems) {
    const { error } = await supabase.from('items').insert(item);
    if (!error) {
      console.log(`✅ 追加: ${item.name}`);
    } else {
      console.error(`❌ エラー: ${error.message}`);
    }
  }
  
  console.log('🎉 特別アイテム追加完了！');
}

addSpecialItems();