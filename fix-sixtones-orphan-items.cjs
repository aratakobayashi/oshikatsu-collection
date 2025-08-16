const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// アイテム名からキーワードを抽出
function extractItemKeywords(itemName, tags = []) {
  const keywords = [];
  
  // ブランドキーワード
  const brandKeywords = [
    'エルメス', 'HERMES', 'ティファニー', 'TIFFANY', 'バレンシアガ', 'BALENCIAGA',
    'ルイ・ヴィトン', 'LOUIS VUITTON', 'ダミエ', 'モノグラム',
    'ベルト', 'ブレスレット', 'スニーカー', '財布', 'シューズ',
    '銀座', '散策', '散歩', '購入', 'ショッピング', '試着'
  ];
  
  // アイテム名から抽出
  for (const keyword of brandKeywords) {
    if (itemName.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  // タグも追加
  if (tags) {
    keywords.push(...tags.filter(tag => tag.length >= 2));
  }
  
  return [...new Set(keywords)];
}

// 手動マッピング（既知の関連性）
const manualMappings = [
  {
    itemName: 'エルメス Hベルト',
    episodeKeywords: ['銀座', 'ショッピング', '散歩', 'エルメス', 'ベルト'],
    reason: '銀座散歩・ショッピング企画でのファッションアイテム'
  },
  {
    itemName: 'ティファニー Tワイヤー ブレスレット',
    episodeKeywords: ['銀座', 'ショッピング', '散歩', 'ティファニー', 'アクセサリー'],
    reason: '銀座散歩・ショッピング企画でのアクセサリー'
  },
  {
    itemName: 'バレンシアガ トリプルS スニーカー',
    episodeKeywords: ['銀座', 'ショッピング', '散歩', 'スニーカー', 'ファッション'],
    reason: '銀座散歩企画での着用シューズ'
  },
  {
    itemName: 'ルイ・ヴィトン ダミエ・キャンバス ポルトフォイユ・ブラザ',
    episodeKeywords: ['銀座', 'ショッピング', '散歩', 'ヴィトン', '財布'],
    reason: '銀座散歩・ショッピング企画での購入検討アイテム'
  }
];

// エピソード検索
async function findEpisodeForItem(itemName, tags, sixtonesId) {
  console.log(`  🔍 アイテム: ${itemName}`);
  
  // 手動マッピングをチェック
  const mapping = manualMappings.find(m => m.itemName === itemName);
  if (mapping) {
    console.log(`  💡 手動マッピング使用: ${mapping.reason}`);
    
    for (const keyword of mapping.episodeKeywords) {
      const { data } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', sixtonesId)
        .ilike('title', `%${keyword}%`)
        .limit(1);
      
      if (data && data.length > 0) {
        console.log(`  ✅ マッチ "${keyword}": ${data[0].title}`);
        return data[0];
      }
    }
  }
  
  // 自動キーワード抽出
  const keywords = extractItemKeywords(itemName, tags);
  console.log(`  🏷️ キーワード: [${keywords.join(', ')}]`);
  
  for (const keyword of keywords) {
    if (keyword.length >= 2) {
      const { data } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', sixtonesId)
        .ilike('title', `%${keyword}%`)
        .limit(1);
      
      if (data && data.length > 0) {
        console.log(`  ✅ キーワード一致 "${keyword}": ${data[0].title}`);
        return data[0];
      }
    }
  }
  
  // 関連性の高いエピソードを手動で探す
  const relatedQueries = ['銀座', 'ショッピング', '散歩', '買い物', 'ファッション'];
  
  for (const query of relatedQueries) {
    const { data } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', sixtonesId)
      .ilike('title', `%${query}%`)
      .limit(1);
    
    if (data && data.length > 0) {
      console.log(`  ✅ 関連検索 "${query}": ${data[0].title}`);
      return data[0];
    }
  }
  
  return null;
}

async function fixSixTONESOrphanItems() {
  console.log('🛍️ SixTONES の孤立アイテムを修正開始！\n');
  
  const sixtonesId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7';
  
  // 孤立アイテムを取得
  const { data: orphanItems } = await supabase
    .from('items')
    .select('*')
    .eq('celebrity_id', sixtonesId)
    .is('episode_id', null)
    .order('name');
  
  console.log(`🛍️ 孤立アイテム数: ${orphanItems.length}件\n`);
  
  if (orphanItems.length === 0) {
    console.log('✅ 孤立アイテムはありません！');
    return;
  }
  
  let linkedCount = 0;
  let unlinkedCount = 0;
  
  for (let i = 0; i < orphanItems.length; i++) {
    const item = orphanItems[i];
    console.log(`\n[${i + 1}/${orphanItems.length}] ${item.name}`);
    console.log(`  📝 ${item.description || '説明なし'}`);
    console.log(`  🏷️ ${item.category || 'カテゴリなし'}`);
    
    // 最適なエピソードを検索
    const episode = await findEpisodeForItem(item.name, item.tags, sixtonesId);
    
    if (episode) {
      // アイテムを更新
      const { error } = await supabase
        .from('items')
        .update({ 
          episode_id: episode.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      if (error) {
        console.log(`  ❌ 更新エラー: ${error.message}`);
        unlinkedCount++;
      } else {
        console.log(`  🎉 紐づけ成功！`);
        linkedCount++;
      }
    } else {
      console.log('  ❌ マッチするエピソードなし');
      unlinkedCount++;
    }
    
    // 処理間隔
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 SixTONES 孤立アイテム修正完了！');
  console.log('='.repeat(60));
  console.log(`📊 結果:`);
  console.log(`  - 処理対象: ${orphanItems.length}件`);
  console.log(`  - 紐づけ成功: ${linkedCount}件`);
  console.log(`  - 紐づけ失敗: ${unlinkedCount}件`);
  console.log(`  - 成功率: ${Math.round((linkedCount / orphanItems.length) * 100)}%`);
  
  // 最終確認
  const { count: finalOrphans } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', sixtonesId)
    .is('episode_id', null);
  
  console.log(`\n📈 最終状況:`);
  console.log(`  - 残り孤立アイテム: ${finalOrphans}件`);
  
  if (finalOrphans === 0) {
    console.log('  🎊 全ての孤立アイテムが解消されました！');
  } else {
    console.log(`  ⚠️ ${finalOrphans}件のアイテムがまだ孤立しています`);
  }
  
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
  console.log('→ アイテムがエピソードに正しく紐づいているか確認');
}

fixSixTONESOrphanItems();