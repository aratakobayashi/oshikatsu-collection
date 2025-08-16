const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSixTONESEpisodes() {
  console.log('📊 SixTONES エピソード分析開始！\n');
  
  const sixtonesId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7';
  
  // SixTONESのエピソードを取得
  console.log('📺 SixTONESのエピソード一覧を取得中...');
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('id, title, description, date, view_count')
    .eq('celebrity_id', sixtonesId)
    .order('view_count', { ascending: false })
    .limit(30); // 人気上位30件を分析
  
  if (error) {
    console.error('❌ エピソード取得エラー:', error.message);
    return;
  }
  
  if (!episodes || episodes.length === 0) {
    console.log('⚠️ SixTONESのエピソードが見つかりません');
    return;
  }
  
  console.log(`✅ ${episodes.length}件のエピソードを取得\n`);
  
  // ロケーション・アイテムの候補を抽出
  const locationCandidates = [];
  const itemCandidates = [];
  
  console.log('🔍 エピソードタイトル分析（人気順トップ30）:');
  console.log('='.repeat(80));
  
  episodes.forEach((episode, index) => {
    console.log(`\n[${index + 1}] ${episode.title}`);
    console.log(`📅 ${new Date(episode.date).toLocaleDateString('ja-JP')}`);
    console.log(`👀 ${episode.view_count?.toLocaleString()}回再生`);
    
    // タイトルからロケーション候補を抽出
    const locations = extractLocations(episode.title);
    const items = extractItems(episode.title);
    
    if (locations.length > 0) {
      console.log(`📍 ロケーション候補: ${locations.join(', ')}`);
      locations.forEach(loc => {
        locationCandidates.push({
          episode: episode,
          location: loc,
          priority: getPriority(loc, episode.title)
        });
      });
    }
    
    if (items.length > 0) {
      console.log(`🛍️ アイテム候補: ${items.join(', ')}`);
      items.forEach(item => {
        itemCandidates.push({
          episode: episode,
          item: item,
          priority: getPriority(item, episode.title)
        });
      });
    }
    
    if (locations.length === 0 && items.length === 0) {
      console.log(`ℹ️ 具体的な場所・アイテムなし`);
    }
  });
  
  // 優先度順にソート
  locationCandidates.sort((a, b) => b.priority - a.priority);
  itemCandidates.sort((a, b) => b.priority - a.priority);
  
  console.log('\n\n🎯 ロケーション追加候補（優先度順）:');
  console.log('='.repeat(80));
  locationCandidates.slice(0, 15).forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.location} (優先度: ${candidate.priority})`);
    console.log(`   エピソード: ${candidate.episode.title}`);
    console.log(`   エピソードID: ${candidate.episode.id}`);
    console.log('');
  });
  
  console.log('\n🛍️ アイテム追加候補（優先度順）:');
  console.log('='.repeat(80));
  itemCandidates.slice(0, 15).forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.item} (優先度: ${candidate.priority})`);
    console.log(`   エピソード: ${candidate.episode.title}`);
    console.log(`   エピソードID: ${candidate.episode.id}`);
    console.log('');
  });
  
  console.log('\n💡 次のステップ:');
  console.log('1. 上記の候補からデータを作成');
  console.log('2. 住所や詳細情報を調査');
  console.log('3. データベースに追加');
  console.log('4. エピソードとの紐づけを確認');
}

// ロケーション候補を抽出
function extractLocations(title) {
  const locations = [];
  
  // 地名パターン
  const placePatterns = [
    /([東西南北]?[都道府県市区町村]{1,10}[区市町村])/g,
    /(渋谷|新宿|原宿|池袋|恵比寿|代官山|青山|銀座|六本木|表参道)/g,
    /(神楽坂|築地|浅草|上野|秋葉原|新橋|有楽町|日本橋|赤坂|品川)/g,
    /(吉祥寺|下北沢|中野|高円寺|三軒茶屋|自由が丘|二子玉川|成城)/g,
    /(横浜|川崎|鎌倉|江ノ島|湘南|千葉|浦安|船橋)/g,
    /(沖縄|那覇|名古屋|大阪|京都|神戸|福岡|札幌|仙台)/g
  ];
  
  // 施設パターン
  const facilityPatterns = [
    /(タワーレコード|TOWER RECORDS?)/gi,
    /(ディズニーランド|ディズニーシー|ディズニー)/gi,
    /(東京ドーム|武道館|横浜アリーナ|さいたまスーパーアリーナ)/gi,
    /(スカイツリー|東京タワー|渋谷スカイ)/gi,
    /(美術館|博物館|水族館|動物園)/gi,
    /(神社|寺|教会)/gi,
    /(ホテル|旅館|リゾート)/gi,
    /(球場|スタジアム|アリーナ)/gi,
    /(公園|庭園)/gi,
    /(駅|空港|港)/gi
  ];
  
  // レストラン・ショップパターン
  const shopPatterns = [
    /(スターバックス|スタバ|ドトール|タリーズ)/gi,
    /(マクドナルド|マック|ケンタッキー|KFC)/gi,
    /(ユニクロ|GU|H&M|ZARA)/gi,
    /(ヨドバシ|ビックカメラ|ヤマダ電機)/gi,
    /(イオン|ららぽーと|アウトレット)/gi,
    /([ァ-ヴー]{3,}(?:カフェ|レストラン|ショップ|ストア))/gi,
    /([A-Za-z]{3,}(?:CAFE|RESTAURANT|SHOP|STORE))/gi
  ];
  
  const allPatterns = [...placePatterns, ...facilityPatterns, ...shopPatterns];
  
  allPatterns.forEach(pattern => {
    const matches = title.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (match.length >= 2) {
          locations.push(match);
        }
      });
    }
  });
  
  return [...new Set(locations)]; // 重複除去
}

// アイテム候補を抽出
function extractItems(title) {
  const items = [];
  
  // ファッションアイテムパターン
  const fashionPatterns = [
    /(Tシャツ|シャツ|パーカー|ジャケット|コート|スーツ)/gi,
    /(ジーンズ|パンツ|スカート|ワンピース)/gi,
    /(スニーカー|ブーツ|サンダル|靴)/gi,
    /(バッグ|財布|ベルト|時計|アクセサリー)/gi,
    /(帽子|キャップ|ハット|サングラス)/gi,
    /(ネックレス|ブレスレット|指輪|ピアス)/gi
  ];
  
  // ブランドパターン
  const brandPatterns = [
    /(Supreme|シュプリーム)/gi,
    /(Nike|ナイキ|Adidas|アディダス)/gi,
    /(Louis Vuitton|ルイ・?ヴィトン)/gi,
    /(Tiffany|ティファニー)/gi,
    /(Hermes|エルメス)/gi,
    /(Balenciaga|バレンシアガ)/gi,
    /(Gucci|グッチ)/gi,
    /(Prada|プラダ)/gi,
    /(Chanel|シャネル)/gi
  ];
  
  // 食べ物・飲み物パターン
  const foodPatterns = [
    /(ラーメン|うどん|そば|パスタ|カレー)/gi,
    /(寿司|焼肉|鍋|天ぷら|とんかつ)/gi,
    /(ピザ|ハンバーガー|サンドイッチ|パン)/gi,
    /(ケーキ|アイス|チョコレート|お菓子)/gi,
    /(コーヒー|お茶|ジュース|ビール)/gi
  ];
  
  const allPatterns = [...fashionPatterns, ...brandPatterns, ...foodPatterns];
  
  allPatterns.forEach(pattern => {
    const matches = title.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (match.length >= 2) {
          items.push(match);
        }
      });
    }
  });
  
  return [...new Set(items)]; // 重複除去
}

// 優先度を計算
function getPriority(item, title) {
  let priority = 1;
  
  // 具体的な固有名詞なら優先度アップ
  if (/[A-Z][a-z]+/.test(item)) priority += 3;
  if (/[ァ-ヴー]{3,}/.test(item)) priority += 2;
  
  // タイトルでの位置による優先度
  const position = title.indexOf(item);
  if (position < title.length / 3) priority += 2; // 前半にある
  
  // 長さによる優先度
  if (item.length >= 5) priority += 1;
  
  return priority;
}

analyzeSixTONESEpisodes();