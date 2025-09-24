import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Episode {
  id: string;
  title: string;
  description: string;
  video_url: string;
  date: string;
}

interface LocationCandidate {
  episode_id: string;
  episode_title: string;
  store_name?: string;
  address?: string;
  tabelog_url?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  notes: string;
}

async function extractLocationFromDescription(description: string, title: string): Promise<{
  store_name?: string;
  address?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  notes: string;
}> {
  // 店舗名・住所のパターンを検索
  const storePatterns = [
    /(?:店舗|お店|レストラン|カフェ|居酒屋)[:：]\s*([^\n\r]+)/i,
    /(?:撮影協力|協力)[:：]\s*([^\n\r]+)/i,
    /([^\n\r]*(?:店|レストラン|カフェ|居酒屋|焼肉|寿司|ラーメン)[^\n\r]*)/i,
  ];

  const addressPatterns = [
    /(?:住所|所在地)[:：]\s*([^\n\r]+)/i,
    /([都道府県][市区町村][^\n\r]*)/,
  ];

  let store_name: string | undefined;
  let address: string | undefined;
  let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
  let notes = '';

  // タイトルから店舗情報を推測
  const titleStoreHints = [
    /焼肉/i,
    /ラーメン/i,
    /寿司/i,
    /カフェ/i,
    /レストラン/i,
    /居酒屋/i,
    /盛岡冷麺/i,
    /資生堂/i,
  ];

  const titleHasStoreHint = titleStoreHints.some(pattern => pattern.test(title));

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
  if (!store_name && titleHasStoreHint) {
    confidence = 'low';
    notes += 'タイトルに店舗系キーワードあり、概要欄要確認; ';
  }

  // 自宅・スタジオ系の判定
  const homePatterns = [
    /自宅/i,
    /家/i,
    /スタジオ/i,
    /事務所/i,
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

async function testKamenashiLocationExtraction() {
  console.log('🧪 亀梨和也ロケーション抽出テスト開始');
  console.log('='.repeat(60));

  // 亀梨和也のエピソードを最新5件取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('id, title, description, video_url, date')
    .eq('celebrity_id', (
      await supabase
        .from('celebrities')
        .select('id')
        .eq('slug', 'kamenashi-kazuya')
        .single()
    ).data?.id)
    .order('date', { ascending: false })
    .limit(5);

  if (error || !episodes) {
    console.error('❌ 亀梨和也のエピソード取得エラー:', error);
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
    console.log('✅ 成功見込み率が高いため、亀梨和也での本格実装を推奨');
    console.log('   1. 高・中信頼度候補のタベログ検索');
    console.log('   2. WebFetch検証による品質確保');
    console.log('   3. LinkSwitch適用');
  } else if (successRate >= 40) {
    console.log('🟡 成功見込み率は中程度、一部候補で試行');
    console.log('   1. 高信頼度候補のみ先行実装');
    console.log('   2. 成功事例を基に手法改善');
  } else {
    console.log('❌ 成功見込み率が低いため、他のセレブリティを検討');
    console.log('   1. 東海オンエア、フィッシャーズ等の外出系YouTuberを試行');
    console.log('   2. バラエティ番組系セレブも検討');
  }

  console.log('\n='.repeat(60));
  console.log('🧪 テスト完了');
}

// メイン実行
testKamenashiLocationExtraction().catch(console.error);

export { testKamenashiLocationExtraction };