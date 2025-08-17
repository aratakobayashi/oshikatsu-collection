require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function removeAllScores() {
  console.log('🧹 全データベースからスコア表示を削除\n');
  
  // 1. locations テーブルのスコア表示をチェック
  const { data: locationsWithScores } = await supabase
    .from('locations')
    .select('id, name, description')
    .or('description.ilike.%スコア%,description.ilike.%分析%,description.ilike.%自動抽出%');
  
  if (locationsWithScores && locationsWithScores.length > 0) {
    console.log('📍 スコア表示があるロケーション:', locationsWithScores.length, '件');
    
    for (const location of locationsWithScores) {
      // スコア部分を削除してクリーンな説明に
      let cleanDescription = location.name;
      
      // 括弧内の分析情報を削除
      cleanDescription = cleanDescription.replace(/（[^）]*スコア[^）]*）/g, '');
      cleanDescription = cleanDescription.replace(/\([^)]*スコア[^)]*\)/g, '');
      
      const { error } = await supabase
        .from('locations')
        .update({ description: cleanDescription })
        .eq('id', location.id);
      
      if (!error) {
        console.log('✅ 修正:', location.name);
      }
    }
  } else {
    console.log('📍 ロケーションにスコア表示なし');
  }
  
  // 2. items テーブルのスコア表示をチェック
  const { data: itemsWithScores } = await supabase
    .from('items')
    .select('id, name, description')
    .or('description.ilike.%スコア%,description.ilike.%分析%,description.ilike.%自動抽出%');
  
  if (itemsWithScores && itemsWithScores.length > 0) {
    console.log('\n🛍️ スコア表示があるアイテム:', itemsWithScores.length, '件');
    
    for (const item of itemsWithScores) {
      let cleanDescription = item.name;
      
      // 括弧内の分析情報を削除
      cleanDescription = cleanDescription.replace(/（[^）]*スコア[^）]*）/g, '');
      cleanDescription = cleanDescription.replace(/\([^)]*スコア[^)]*\)/g, '');
      
      const { error } = await supabase
        .from('items')
        .update({ description: cleanDescription })
        .eq('id', item.id);
      
      if (!error) {
        console.log('✅ 修正:', item.name);
      }
    }
  } else {
    console.log('\n🛍️ アイテムにスコア表示なし');
  }
  
  // 3. 'タグ' フィールドからも自動抽出タグを削除
  console.log('\n🏷️ 自動抽出タグの削除...');
  
  // locations のタグをクリーンアップ
  const { data: locationsWithTags } = await supabase
    .from('locations')
    .select('id, name, tags')
    .not('tags', 'is', null);
  
  if (locationsWithTags) {
    for (const location of locationsWithTags) {
      if (location.tags && Array.isArray(location.tags)) {
        // '自動抽出' や 'スコア' 関連のタグを除去
        const cleanTags = location.tags.filter(tag => 
          !tag.includes('自動抽出') && 
          !tag.includes('スコア') && 
          !tag.includes('分析')
        );
        
        if (cleanTags.length !== location.tags.length) {
          const { error } = await supabase
            .from('locations')
            .update({ tags: cleanTags.length > 0 ? cleanTags : null })
            .eq('id', location.id);
          
          if (!error) {
            console.log('✅ タグクリーンアップ:', location.name);
          }
        }
      }
    }
  }
  
  // items のタグもクリーンアップ
  const { data: itemsWithTags } = await supabase
    .from('items')
    .select('id, name, tags')
    .not('tags', 'is', null);
  
  if (itemsWithTags) {
    for (const item of itemsWithTags) {
      if (item.tags && Array.isArray(item.tags)) {
        const cleanTags = item.tags.filter(tag => 
          !tag.includes('自動抽出') && 
          !tag.includes('スコア') && 
          !tag.includes('分析')
        );
        
        if (cleanTags.length !== item.tags.length) {
          const { error } = await supabase
            .from('items')
            .update({ tags: cleanTags.length > 0 ? cleanTags : null })
            .eq('id', item.id);
          
          if (!error) {
            console.log('✅ タグクリーンアップ:', item.name);
          }
        }
      }
    }
  }
  
  console.log('\n🎉 スコア表示の完全削除完了！');
  console.log('✅ ユーザーには技術的な詳細が表示されなくなりました');
}

removeAllScores().catch(console.error);
