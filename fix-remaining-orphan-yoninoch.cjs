const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// キーワード抽出関数
function extractKeywords(locationName) {
  const keywords = [];
  
  // 地名・場所キーワード
  const locationKeywords = [
    '渋谷', '新宿', '池袋', '銀座', '赤坂', '青山', '表参道', '原宿', '六本木', '恵比寿',
    '中目黒', '代官山', '吉祥寺', '下北沢', '三軒茶屋', '自由が丘', '二子玉川',
    '横浜', '川崎', '千葉', '埼玉', '神奈川', '東京', '品川', '新橋', '有楽町',
    '上野', '浅草', '錦糸町', '門前仲町', '豊洲', '月島', '築地', '神楽坂',
    '四谷', '市ヶ谷', '飯田橋', '後楽園', '春日', '本郷', '湯島', '御茶ノ水',
    '秋葉原', '神田', '東京駅', '大手町', '丸の内', '日本橋', '人形町', '茅場町'
  ];
  
  // 業種・タイプキーワード
  const typeKeywords = [
    'カフェ', '喫茶', 'レストラン', '居酒屋', 'バー', '焼肉', '寿司', 'ラーメン',
    'うどん', 'そば', 'パン屋', 'ベーカリー', 'ケーキ', 'スイーツ', 'デザート',
    'ホテル', '旅館', '温泉', '銭湯', 'スパ', 'サウナ', '美容院', 'サロン',
    '映画館', 'シネマ', '劇場', 'ライブハウス', 'クラブ', 'カラオケ',
    '公園', '庭園', '動物園', '水族館', '博物館', '美術館', 'ギャラリー',
    '神社', '寺', '教会', 'タワー', '展望台', 'スカイツリー', '東京タワー',
    'ショッピング', 'デパート', '百貨店', 'モール', 'アウトレット', 'マーケット',
    'スタジオ', 'オフィス', '会社', '学校', '大学', '図書館', '病院', 'クリニック'
  ];
  
  // ブランド・チェーン店キーワード
  const brandKeywords = [
    'スターバックス', 'ドトール', 'タリーズ', 'プロント', 'ベローチェ',
    'マクドナルド', 'ケンタッキー', 'モスバーガー', 'ロッテリア', 'フレッシュネス',
    'ファミリーマート', 'セブンイレブン', 'ローソン', 'ミニストップ',
    'ユニクロ', 'GU', 'ZARA', 'H&M', '無印良品', 'ニトリ', 'IKEA',
    'すき家', '吉野家', '松屋', 'なか卯', 'かつや', 'やよい軒', '大戸屋',
    'ガスト', 'サイゼリヤ', 'ジョナサン', 'デニーズ', 'ロイヤルホスト',
    'ヨドバシ', 'ビックカメラ', 'ヤマダ電機', 'エディオン', 'ケーズデンキ'
  ];
  
  const allKeywords = [...locationKeywords, ...typeKeywords, ...brandKeywords];
  
  for (const keyword of allKeywords) {
    if (locationName.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  // 短い単語は除外（1文字のものなど）
  return [...new Set(keywords)].filter(k => k.length >= 2);
}

// エピソードマッチング関数（改良版）
async function findBestEpisodeMatch(locationName, keywords, yoninoId) {
  console.log(`  🔍 キーワード: [${keywords.join(', ')}]`);
  
  // 1. 完全一致（ロケーション名がエピソードタイトルに含まれる）
  for (const fullName of [locationName]) {
    if (fullName.length >= 3) {
      const { data } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', yoninoId)
        .ilike('title', `%${fullName}%`)
        .limit(1);
      
      if (data && data.length > 0) {
        console.log(`  ✅ 完全一致: ${data[0].title}`);
        return data[0];
      }
    }
  }
  
  // 2. キーワードマッチング（優先度順）
  const priorityKeywords = keywords.sort((a, b) => b.length - a.length);
  
  for (const keyword of priorityKeywords) {
    if (keyword.length >= 2) {
      const { data } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', yoninoId)
        .ilike('title', `%${keyword}%`)
        .limit(1);
      
      if (data && data.length > 0) {
        console.log(`  ✅ キーワード一致 "${keyword}": ${data[0].title}`);
        return data[0];
      }
    }
  }
  
  // 3. 部分マッチング（ロケーション名の一部）
  const parts = locationName.split(/[\s・（）()]/);
  for (const part of parts) {
    if (part.length >= 3) {
      const { data } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', yoninoId)
        .ilike('title', `%${part}%`)
        .limit(1);
      
      if (data && data.length > 0) {
        console.log(`  ✅ 部分一致 "${part}": ${data[0].title}`);
        return data[0];
      }
    }
  }
  
  return null;
}

async function fixRemainingOrphanYoninoch() {
  console.log('🔧 よにのちゃんねるの残り孤立ロケーションを修正開始！\n');
  
  const yoninoId = '75dbf1ce-0b0b-4f60-a5d8-87138b1c6f50';
  
  // 孤立ロケーションを取得
  const { data: orphanLocations } = await supabase
    .from('locations')
    .select('*')
    .eq('celebrity_id', yoninoId)
    .is('episode_id', null)
    .order('name');
  
  console.log(`📍 孤立ロケーション数: ${orphanLocations.length}件\n`);
  
  if (orphanLocations.length === 0) {
    console.log('✅ 孤立ロケーションはありません！');
    return;
  }
  
  let linkedCount = 0;
  let unlinkedCount = 0;
  
  for (let i = 0; i < orphanLocations.length; i++) {
    const location = orphanLocations[i];
    console.log(`\n[${i + 1}/${orphanLocations.length}] ${location.name}`);
    console.log(`  📍 ${location.address || '住所不明'}`);
    
    // キーワード抽出
    const keywords = extractKeywords(location.name);
    
    if (keywords.length === 0) {
      console.log('  ⚠️ 有効なキーワードなし');
      unlinkedCount++;
      continue;
    }
    
    // 最適なエピソードを検索
    const episode = await findBestEpisodeMatch(location.name, keywords, yoninoId);
    
    if (episode) {
      // ロケーションを更新
      const { error } = await supabase
        .from('locations')
        .update({ 
          episode_id: episode.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id);
      
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
  
  console.log('\n🎉 よにのちゃんねる孤立ロケーション修正完了！');
  console.log('='.repeat(60));
  console.log(`📊 結果:`);
  console.log(`  - 処理対象: ${orphanLocations.length}件`);
  console.log(`  - 紐づけ成功: ${linkedCount}件`);
  console.log(`  - 紐づけ失敗: ${unlinkedCount}件`);
  console.log(`  - 成功率: ${Math.round((linkedCount / orphanLocations.length) * 100)}%`);
  
  // 最終確認
  const { count: finalOrphans } = await supabase
    .from('locations')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', yoninoId)
    .is('episode_id', null);
  
  console.log(`\n📈 最終状況:`);
  console.log(`  - 残り孤立ロケーション: ${finalOrphans}件`);
  
  if (finalOrphans === 0) {
    console.log('  🎊 全ての孤立ロケーションが解消されました！');
  } else {
    console.log(`  ⚠️ ${finalOrphans}件のロケーションがまだ孤立しています`);
  }
  
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/yoninoch');
  console.log('→ ロケーションがエピソードに正しく紐づいているか確認');
}

fixRemainingOrphanYoninoch();