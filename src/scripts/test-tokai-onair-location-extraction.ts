import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

interface LocationCandidate {
  episode_id: string;
  episode_title: string;
  store_name?: string;
  address?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  notes: string;
}

async function extractLocationFromDescription(description: string, title: string): Promise<{
  store_name?: string;
  address?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  notes: string;
}> {
  // 東海オンエア特有のパターンを追加
  const storePatterns = [
    /(?:店舗|お店|レストラン|カフェ|居酒屋|コンビニ)[:：]\s*([^\n\r]+)/i,
    /(?:撮影協力|協力|取材協力)[:：]\s*([^\n\r]+)/i,
    /([^\n\r]*(?:店|レストラン|カフェ|居酒屋|焼肉|寿司|ラーメン|コンビニ|ホームセンター)[^\n\r]*)/i,
    // 愛知県特有
    /([^\n\r]*(?:岡崎|豊橋|名古屋|刈谷)[^\n\r]*)/i,
  ];

  const addressPatterns = [
    /(?:住所|所在地|場所)[:：]\s*([^\n\r]+)/i,
    /愛知県([^\n\r]+)/i,
    /(岡崎市[^\n\r]*)/i,
    /(豊橋市[^\n\r]*)/i,
    /(名古屋市[^\n\r]*)/i,
  ];

  let store_name: string | undefined;
  let address: string | undefined;
  let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
  let notes = '';

  // タイトルから店舗・場所情報を推測（東海オンエア特有）
  const titleLocationHints = [
    /コンビニ/i,
    /ホームセンター/i,
    /レストラン/i,
    /カフェ/i,
    /店/i,
    /岡崎/i,
    /愛知/i,
    /名古屋/i,
    /持ち上げ/i, // 街の持ち上げられそうな物
    /除湿機/i, // 除湿機に溜まった水を飲んで
  ];

  const titleHasLocationHint = titleLocationHints.some(pattern => pattern.test(title));

  // 概要欄から店舗名を抽出
  for (const pattern of storePatterns) {
    const match = description.match(pattern);
    if (match) {
      store_name = match[1].trim();
      confidence = 'high';
      notes += `店舗名検出: ${store_name}; `;
      break;
    }
  }

  // 住所を抽出
  for (const pattern of addressPatterns) {
    const match = description.match(pattern);
    if (match) {
      address = match[1].trim();
      if (confidence !== 'high') confidence = 'medium';
      notes += `住所検出: ${address}; `;
      break;
    }
  }

  // タイトルヒントがあるが具体的な店舗情報がない場合
  if (!store_name && titleHasLocationHint) {
    confidence = 'low';
    notes += 'タイトルに場所・店舗系キーワードあり、概要欄要確認; ';
  }

  // 自宅・スタジオ系の判定
  const homePatterns = [
    /自宅/i,
    /家/i,
    /スタジオ/i,
    /事務所/i,
    /オンライン/i,
    /電話/i,
  ];

  if (homePatterns.some(pattern => pattern.test(title) || pattern.test(description))) {
    confidence = 'none';
    notes += '自宅・スタジオ系のため対象外; ';
  }

  return {
    store_name,
    address,
    confidence,
    notes: notes || '特定の店舗情報なし'
  };
}

async function testTokaiOnairLocationExtraction() {
  console.log('🧪 東海オンエア ロケーション抽出テスト開始');
  console.log('='.repeat(60));

  // 東海オンエアのエピソードを最新5件取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', 'tokai-onair')
    .single();

  if (!celebrity) {
    console.error('❌ 東海オンエアが見つかりません。スラッグ名を確認してください。');
    return;
  }

  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('id, title, description, video_url, date')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
    .limit(5);

  if (error || !episodes) {
    console.error('❌ 東海オンエアのエピソード取得エラー:', error);
    return;
  }

  console.log(`📊 テスト対象: ${episodes.length}件のエピソード\n`);

  const candidates: LocationCandidate[] = [];

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i];
    console.log(`🔍 ${i + 1}. ${episode.title}`);
    console.log(`   日付: ${new Date(episode.date).toLocaleDateString('ja-JP')}`);
    console.log(`   URL: ${episode.video_url}`);

    // 概要欄からロケーション情報を抽出
    const locationInfo = await extractLocationFromDescription(episode.description, episode.title);

    console.log(`   信頼度: ${locationInfo.confidence}`);
    console.log(`   店舗名: ${locationInfo.store_name || 'なし'}`);
    console.log(`   住所: ${locationInfo.address || 'なし'}`);
    console.log(`   メモ: ${locationInfo.notes}`);

    candidates.push({
      episode_id: episode.id,
      episode_title: episode.title,
      store_name: locationInfo.store_name,
      address: locationInfo.address,
      confidence: locationInfo.confidence,
      notes: locationInfo.notes
    });

    console.log('   ' + '-'.repeat(40));

    // API制限対策
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 結果サマリー
  console.log('\n📈 抽出結果サマリー');
  console.log('='.repeat(60));

  const confidenceCount = {
    high: candidates.filter(c => c.confidence === 'high').length,
    medium: candidates.filter(c => c.confidence === 'medium').length,
    low: candidates.filter(c => c.confidence === 'low').length,
    none: candidates.filter(c => c.confidence === 'none').length,
  };

  console.log(`✅ High信頼度: ${confidenceCount.high}件`);
  console.log(`🟡 Medium信頼度: ${confidenceCount.medium}件`);
  console.log(`🟠 Low信頼度: ${confidenceCount.low}件`);
  console.log(`❌ 対象外: ${confidenceCount.none}件`);

  const successRate = ((confidenceCount.high + confidenceCount.medium) / episodes.length) * 100;
  console.log(`\n🎯 成功見込み率: ${successRate}% (${confidenceCount.high + confidenceCount.medium}/${episodes.length})`);

  // 高・中信頼度の候補を詳細表示
  const viableCandidates = candidates.filter(c => c.confidence === 'high' || c.confidence === 'medium');

  if (viableCandidates.length > 0) {
    console.log('\n💡 ロケーション追加候補:');
    console.log('='.repeat(60));

    viableCandidates.forEach((candidate, index) => {
      console.log(`${index + 1}. ${candidate.episode_title}`);
      console.log(`   信頼度: ${candidate.confidence}`);
      console.log(`   店舗名: ${candidate.store_name || '要調査'}`);
      console.log(`   住所: ${candidate.address || '要調査'}`);
      console.log(`   次のステップ: タベログ検索・WebFetch検証`);
      console.log('');
    });
  }

  // 推奨アクション
  console.log('📋 推奨アクション');
  console.log('='.repeat(60));

  if (successRate >= 60) {
    console.log('✅ 成功見込み率が高いため、東海オンエアでの本格実装を推奨');
    console.log('   1. 高・中信頼度候補のタベログ検索');
    console.log('   2. WebFetch検証による品質確保');
    console.log('   3. LinkSwitch適用');
  } else if (successRate >= 40) {
    console.log('🟡 成功見込み率は中程度、一部候補で試行');
    console.log('   1. 高信頼度候補のみ先行実装');
    console.log('   2. 成功事例を基に手法改善');
  } else {
    console.log('❌ 成功見込み率が低いため、他のセレブリティを検討');
    console.log('   1. フィッシャーズ、コムドット等の他のYouTuber');
    console.log('   2. バラエティ番組系セレブの検討');
  }

  console.log('\n='.repeat(60));
  console.log('🧪 テスト完了');
}

// メイン実行
testTokaiOnairLocationExtraction().catch(console.error);

export { testTokaiOnairLocationExtraction };