const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// ロケーション名からキーワードを抽出
function extractKeywords(locationName) {
  const keywords = [];
  
  // 地名キーワード
  const locationKeywords = [
    '渋谷', '新宿', '原宿', '池袋', '恵比寿', '代官山', '青山', '銀座', '六本木', '表参道',
    '神楽坂', '築地', '浅草', '上野', '秋葉原', '新橋', '有楽町', '日本橋', '赤坂', '品川',
    '吉祥寺', '下北沢', '中野', '高円寺', '三軒茶屋', '自由が丘', '二子玉川', '成城',
    '横浜', '川崎', '鎌倉', '江ノ島', '湘南', '千葉', '浦安', '船橋', '柏', '松戸',
    '大宮', '川越', '所沢', '立川', '八王子', '町田', '府中', '調布', '武蔵野',
    '沖縄', '那覇', '名古屋', '大阪', '京都', '神戸', '福岡', '札幌', '仙台'
  ];
  
  // 店舗・施設タイプキーワード
  const typeKeywords = [
    'ラーメン', 'らーめん', 'うどん', 'そば', '蕎麦', 'カレー', 'パスタ', 'イタリアン',
    'フレンチ', '焼肉', '寿司', '鮨', '天ぷら', '居酒屋', '定食', '食堂', 'バー',
    'カフェ', 'COFFEE', 'Coffee', 'コーヒー', 'スターバックス', 'スタバ', 'ドトール',
    'パン', 'ベーカリー', 'ケーキ', 'スイーツ', 'アイス', 'クレープ', 'たこ焼き',
    'ホテル', '旅館', '温泉', '銭湯', 'サウナ', 'スパ', 'ジム', 'フィットネス',
    '神社', '寺', '寺院', '教会', '公園', '美術館', '博物館', '水族館', '動物園',
    'ショップ', '店', 'デパート', '百貨店', 'モール', 'アウトレット', 'ブランド',
    'シネマ', '映画館', 'カラオケ', 'ボウリング', 'ゲーセン', 'パチンコ'
  ];
  
  // ブランド・チェーン店キーワード
  const brandKeywords = [
    'マクドナルド', 'マック', 'ケンタッキー', 'KFC', 'モス', 'ロッテリア', 'サブウェイ',
    'スターバックス', 'ドトール', 'タリーズ', 'プロント', 'ベローチェ', 'エクセルシオール',
    'セブンイレブン', 'ファミマ', 'ローソン', 'ミニストップ', 'サンクス', 'デイリー',
    'ユニクロ', 'GU', 'しまむら', 'H&M', 'ZARA', 'GAP', '無印良品', 'MUJI',
    'ダイソー', 'セリア', 'キャンドゥ', 'ニトリ', 'IKEA', 'コストコ', 'イオン',
    'ヨドバシ', 'ビックカメラ', 'ヤマダ電機', 'エディオン', 'ケーズデンキ',
    // ファッションブランド
    'ルイ・ヴィトン', 'ルイヴィトン', 'ティファニー', 'エルメス', 'バレンシアガ',
    'グッチ', 'プラダ', 'シャネル', 'クリスチャンディオール', 'フェンディ',
    'Supreme', 'ナイキ', 'Nike', 'アディダス', 'Adidas', 'ヴァンズ', 'Vans',
    'コンバース', 'ニューバランス', 'New Balance', 'エアジョーダン', 'Jordan'
  ];
  
  const allKeywords = [...locationKeywords, ...typeKeywords, ...brandKeywords];
  
  // 完全一致でキーワードを抽出
  for (const keyword of allKeywords) {
    if (locationName.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  // 店名から重要そうな部分を抽出（カタカナ、ひらがな、漢字、英数字の組み合わせ）
  const nameMatches = locationName.match(/[ァ-ヴー]+|[あ-ゞ]+|[一-龯]+|[A-Za-z0-9]+/g);
  if (nameMatches) {
    nameMatches.forEach(match => {
      if (match.length >= 2 && !allKeywords.includes(match)) {
        keywords.push(match);
      }
    });
  }
  
  return [...new Set(keywords)]; // 重複除去
}

// エピソードタイトルとキーワードの関連度を計算
function calculateRelevance(episodeTitle, keywords) {
  let score = 0;
  const titleLower = episodeTitle.toLowerCase();
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    if (titleLower.includes(keywordLower)) {
      // キーワードの長さに応じてスコアを調整
      score += keyword.length >= 3 ? 10 : 5;
    }
  }
  
  return score;
}

// 最適なエピソードを検索
async function findBestMatchingEpisode(locationName, celebrityId) {
  const keywords = extractKeywords(locationName);
  
  if (keywords.length === 0) {
    console.log(`  ⚠️ ${locationName}: キーワードが抽出できませんでした`);
    return null;
  }
  
  console.log(`  🔍 ${locationName}: キーワード [${keywords.join(', ')}]`);
  
  // 全エピソードを取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('id, title')
    .eq('celebrity_id', celebrityId);
  
  if (error || !episodes) {
    console.log(`  ❌ エピソード取得エラー: ${error?.message}`);
    return null;
  }
  
  // 各エピソードの関連度を計算
  const scoredEpisodes = episodes.map(episode => ({
    ...episode,
    score: calculateRelevance(episode.title, keywords)
  })).filter(episode => episode.score > 0)
    .sort((a, b) => b.score - a.score);
  
  if (scoredEpisodes.length === 0) {
    console.log(`  ⚠️ ${locationName}: マッチするエピソードが見つかりませんでした`);
    return null;
  }
  
  const bestMatch = scoredEpisodes[0];
  console.log(`  ✅ ${locationName}: 最適マッチ "${bestMatch.title}" (スコア: ${bestMatch.score})`);
  
  return bestMatch;
}

// 孤立アイテムを自動紐づけ
async function autoLinkOrphanItems(celebrityId, celebrityName) {
  console.log(`🛍️ ${celebrityName}の孤立アイテムの自動紐づけ開始！\n`);
  
  // 孤立アイテムを取得
  console.log('🛍️ 孤立アイテム一覧を取得中...');
  const { data: orphanItems, error } = await supabase
    .from('items')
    .select('id, name, description, category')
    .eq('celebrity_id', celebrityId)
    .is('episode_id', null)
    .order('name');
  
  if (error) {
    console.error('❌ 孤立アイテム取得エラー:', error.message);
    return;
  }
  
  if (!orphanItems || orphanItems.length === 0) {
    console.log('✅ 孤立アイテムはありません！');
    return;
  }
  
  console.log(`📊 ${orphanItems.length}件の孤立アイテムを発見\n`);
  
  let successCount = 0;
  let failureCount = 0;
  
  // 各アイテムを処理
  for (let i = 0; i < orphanItems.length; i++) {
    const item = orphanItems[i];
    console.log(`\n[${i + 1}/${orphanItems.length}] ${item.name}`);
    
    try {
      // 最適なエピソードを検索
      const bestEpisode = await findBestMatchingEpisode(item.name, celebrityId);
      
      if (bestEpisode) {
        // エピソードに紐づけ
        const { error: updateError } = await supabase
          .from('items')
          .update({ episode_id: bestEpisode.id })
          .eq('id', item.id);
        
        if (updateError) {
          console.log(`  ❌ 紐づけ失敗: ${updateError.message}`);
          failureCount++;
        } else {
          console.log(`  🎯 紐づけ成功: "${bestEpisode.title.substring(0, 40)}..."`);
          successCount++;
        }
      } else {
        failureCount++;
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`  ❌ 処理エラー: ${error.message}`);
      failureCount++;
    }
  }
  
  console.log('\n🎊 アイテム自動紐づけ完了！');
  console.log('='.repeat(50));
  console.log(`📊 結果サマリー:`);
  console.log(`  ✅ 成功: ${successCount}件`);
  console.log(`  ❌ 失敗: ${failureCount}件`);
  console.log(`  📈 成功率: ${Math.round((successCount / (successCount + failureCount)) * 100)}%`);
  
  return { successCount, failureCount };
}

// 孤立ロケーションを自動紐づけ
async function autoLinkOrphanLocations() {
  console.log('🤖 孤立データの自動紐づけ開始！\n');
  
  const targets = [
    { id: 'UC2alHD2WkakOiTxCxF-uMAg', name: 'よにのちゃんねる' },
    { id: 'aaecc5fd-67d6-40ef-846c-6c4f914785b7', name: 'SixTONES' },
    { id: '46ccba0d-742f-4152-9d87-f10cefadbb6d', name: 'Travis Japan' }
  ];
  
  for (const target of targets) {
    console.log(`\n🎭 ${target.name} の処理開始`);
    console.log('='.repeat(60));
    
    // アイテムの紐づけ
    await autoLinkOrphanItems(target.id, target.name);
    
    // ロケーションの紐づけ（よにのちゃんねるのみ）
    if (target.id === 'UC2alHD2WkakOiTxCxF-uMAg') {
      await autoLinkOrphanLocationsForYonino(target.id);
    }
  }
  
  return;
}

async function autoLinkOrphanLocationsForYonino(celebrityId) {
  
  // 孤立ロケーションを取得
  console.log('📍 孤立ロケーション一覧を取得中...');
  const { data: orphanLocations, error } = await supabase
    .from('locations')
    .select('id, name, address, description')
    .eq('celebrity_id', celebrityId)
    .is('episode_id', null)
    .order('name');
  
  if (error) {
    console.error('❌ 孤立ロケーション取得エラー:', error.message);
    return;
  }
  
  if (!orphanLocations || orphanLocations.length === 0) {
    console.log('✅ 孤立ロケーションはありません！');
    return;
  }
  
  console.log(`📊 ${orphanLocations.length}件の孤立ロケーションを発見\n`);
  
  let successCount = 0;
  let failureCount = 0;
  
  // 各ロケーションを処理
  for (let i = 0; i < orphanLocations.length; i++) {
    const location = orphanLocations[i];
    console.log(`\n[${i + 1}/${orphanLocations.length}] ${location.name}`);
    
    try {
      // 最適なエピソードを検索
      const bestEpisode = await findBestMatchingEpisode(location.name, celebrityId);
      
      if (bestEpisode) {
        // エピソードに紐づけ
        const { error: updateError } = await supabase
          .from('locations')
          .update({ episode_id: bestEpisode.id })
          .eq('id', location.id);
        
        if (updateError) {
          console.log(`  ❌ 紐づけ失敗: ${updateError.message}`);
          failureCount++;
        } else {
          console.log(`  🎯 紐づけ成功: "${bestEpisode.title.substring(0, 40)}..."`);
          successCount++;
        }
      } else {
        failureCount++;
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`  ❌ 処理エラー: ${error.message}`);
      failureCount++;
    }
  }
  
  console.log('\n🎊 自動紐づけ完了！');
  console.log('='.repeat(50));
  console.log(`📊 結果サマリー:`);
  console.log(`  ✅ 成功: ${successCount}件`);
  console.log(`  ❌ 失敗: ${failureCount}件`);
  console.log(`  📈 成功率: ${Math.round((successCount / (successCount + failureCount)) * 100)}%`);
  
  if (successCount > 0) {
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/yoninano');
    console.log('→ エピソード詳細ページでロケーションが表示されているか確認');
  }
  
  if (failureCount > 0) {
    console.log('\n💡 失敗した場合の対処法:');
    console.log('- 手動でエピソードとの紐づけを確認');
    console.log('- ロケーション名により具体的なキーワードを含める');
    console.log('- エピソードタイトルとの関連性を再検討');
  }
}

autoLinkOrphanLocations();