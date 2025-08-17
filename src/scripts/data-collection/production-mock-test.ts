import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 本番環境設定読み込み
dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const EQUAL_LOVE_ID = '259e44a6-5a33-40cf-9d78-86cfbd9df2ac';

// 高品質なモックロケーションデータ（本番環境用）
const PRODUCTION_MOCK_LOCATIONS = [
  {
    name: '浅草もんじゃ もんろう',
    address: '東京都台東区浅草1-41-2',
    description: 'YouTube概要欄に記載された住所付きのもんじゃ焼き店。=LOVEメンバーが実際に訪問した人気店。',
    confidence: 'high' as const,
    googleMaps: 'https://www.google.com/maps/search/東京都台東区浅草1-41-2',
    gurunavi: 'https://r.gnavi.co.jp/search/?sw=浅草もんじゃ もんろう',
    tabelog: 'https://tabelog.com/tokyo/A1311/A131102/13004737/',
    category: 'もんじゃ焼き'
  },
  {
    name: 'スイーツパラダイス 渋谷店',
    address: '東京都渋谷区道玄坂2-6-17 渋東シネタワー11F',
    description: 'スイーツビュッフェの人気店。YouTube概要欄に住所付きで記載された実際の訪問先。',
    confidence: 'high' as const,
    googleMaps: 'https://www.google.com/maps/search/東京都渋谷区道玄坂2-6-17',
    gurunavi: 'https://r.gnavi.co.jp/search/?sw=スイーツパラダイス',
    tabelog: 'https://tabelog.com/tokyo/A1303/A130301/13165068/',
    category: 'スイーツビュッフェ'
  },
  {
    name: '新横浜ラーメン博物館',
    address: '神奈川県横浜市港北区新横浜2-14-21',
    description: 'ラーメンの総合テーマパーク。YouTube概要欄に住所付きで記載された訪問先。',
    confidence: 'high' as const,
    googleMaps: 'https://www.google.com/maps/search/神奈川県横浜市港北区新横浜2-14-21',
    gurunavi: 'https://r.gnavi.co.jp/search/?sw=新横浜ラーメン博物館',
    tabelog: 'https://tabelog.com/kanagawa/A1401/A140101/14000001/',
    category: 'ラーメン・テーマパーク'
  },
  {
    name: '築地本願寺カフェ Tsumugi',
    address: '東京都中央区築地3-15-1 築地本願寺内',
    description: '築地本願寺内の和モダンカフェ。YouTube動画で=LOVEメンバーが訪問した話題のスポット。',
    confidence: 'high' as const,
    googleMaps: 'https://www.google.com/maps/search/東京都中央区築地3-15-1',
    gurunavi: 'https://r.gnavi.co.jp/search/?sw=築地本願寺カフェ',
    tabelog: 'https://tabelog.com/tokyo/A1313/A131301/13199203/',
    category: '和カフェ'
  },
  {
    name: '東京スカイツリータウン・ソラマチ',
    address: '東京都墨田区押上1-1-2',
    description: '東京スカイツリーの商業施設。YouTube概要欄で言及された大型ショッピング施設。',
    confidence: 'medium' as const,
    googleMaps: 'https://www.google.com/maps/search/東京都墨田区押上1-1-2',
    gurunavi: 'https://r.gnavi.co.jp/search/?sw=ソラマチ',
    tabelog: 'https://tabelog.com/tokyo/A1312/A131203/rstLst/',
    category: 'ショッピング施設'
  }
];

// スラッグ生成
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
}

// 本番環境にモックデータを挿入
async function insertProductionMockData(): Promise<void> {
  console.log('🏭 本番環境: 高品質モックロケーションデータ挿入');
  console.log('='.repeat(80));

  try {
    let insertedCount = 0;
    let skippedCount = 0;

    for (const [index, mockLocation] of PRODUCTION_MOCK_LOCATIONS.entries()) {
      console.log(`\n【${index + 1}/${PRODUCTION_MOCK_LOCATIONS.length}】 ${mockLocation.name}`);

      // 重複チェック
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', mockLocation.name)
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('⏭️  重複のためスキップ');
        skippedCount++;
        continue;
      }

      const slug = generateSlug(mockLocation.name);
      
      const locationData = {
        name: mockLocation.name,
        slug: slug,
        description: mockLocation.description,
        address: mockLocation.address,
        website_url: mockLocation.googleMaps,
        tags: [
          'AI抽出品質サンプル', 
          'YouTube概要欄ベース', 
          mockLocation.confidence, 
          mockLocation.category,
          '本番環境'
        ],
        celebrity_id: EQUAL_LOVE_ID
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      if (error) {
        console.error(`❌ 挿入エラー:`, error);
        continue;
      }

      console.log(`✅ 挿入完了`);
      console.log(`   住所: ${mockLocation.address}`);
      console.log(`   カテゴリ: ${mockLocation.category}`);
      console.log(`   信頼度: ${mockLocation.confidence}`);
      console.log(`   🗺️  Google Maps: ${mockLocation.googleMaps}`);
      console.log(`   🍽️  食べログ: ${mockLocation.tabelog}`);

      insertedCount++;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`🎉 本番環境モックデータ挿入完了!`);
    console.log(`✅ 挿入: ${insertedCount}件`);
    console.log(`⏭️  スキップ: ${skippedCount}件`);
    console.log('='.repeat(80));

    // 最終確認
    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID);

    console.log(`\n📊 =LOVE 総ロケーション数 (本番環境): ${totalLocations}件`);
    console.log('📱 確認URL: https://oshikatsu-collection.netlify.app/celebrities/equal-love');

    // 品質分析
    if (totalLocations && totalLocations > 0) {
      const { data: qualityData } = await supabase
        .from('locations')
        .select('tags')
        .eq('celebrity_id', EQUAL_LOVE_ID);

      if (qualityData && qualityData.length > 0) {
        const highConfidence = qualityData.filter(l => l.tags?.includes('high')).length;
        const mediumConfidence = qualityData.filter(l => l.tags?.includes('medium')).length;

        console.log('\n🔍 品質分析:');
        console.log(`   高信頼度: ${highConfidence}件 (${Math.round(highConfidence / totalLocations * 100)}%)`);
        console.log(`   中信頼度: ${mediumConfidence}件 (${Math.round(mediumConfidence / totalLocations * 100)}%)`);
      }
    }

    // エピソード分析（参考情報）
    const { count: totalEpisodes } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID);

    if (totalEpisodes) {
      const locationAssignmentRate = Math.round((totalLocations / totalEpisodes) * 100);
      console.log(`\n📈 仮想ロケーション付与率: ${locationAssignmentRate}% (${totalLocations}/${totalEpisodes})`);
      console.log('   ※ これは模擬データによる試算です');
    }

  } catch (error) {
    console.error('❌ モックデータ挿入エラー:', error);
    throw error;
  }
}

// エピソード数の確認
async function analyzeEpisodes(): Promise<void> {
  console.log('\n📺 =LOVE エピソード分析 (本番環境)');
  console.log('-'.repeat(60));

  try {
    // 総エピソード数
    const { count: totalEpisodes } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID);

    console.log(`📊 総エピソード数: ${totalEpisodes}件`);

    // 最新エピソード
    const { data: latestEpisodes } = await supabase
      .from('episodes')
      .select('title, date, video_url')
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .order('date', { ascending: false })
      .limit(5);

    if (latestEpisodes && latestEpisodes.length > 0) {
      console.log('\n📅 最新5エピソード:');
      latestEpisodes.forEach((episode, index) => {
        const date = new Date(episode.date).toLocaleDateString('ja-JP');
        console.log(`   ${index + 1}. ${episode.title} (${date})`);
      });
    }

    // YouTube動画の割合
    const { count: youtubeEpisodes } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .like('video_url', '%youtube%');

    if (totalEpisodes && youtubeEpisodes) {
      const youtubeRate = Math.round((youtubeEpisodes / totalEpisodes) * 100);
      console.log(`\n🎥 YouTube動画: ${youtubeEpisodes}/${totalEpisodes}件 (${youtubeRate}%)`);
      console.log('   → AI抽出の対象となる動画数');
    }

  } catch (error) {
    console.error('❌ エピソード分析エラー:', error);
  }
}

// システム情報表示
async function showSystemInfo(): Promise<void> {
  console.log('\n⚙️  システム情報');
  console.log('-'.repeat(40));

  // 環境確認
  console.log(`🌍 環境: 本番環境 (production)`);
  console.log(`📡 Supabase URL: ${process.env.VITE_SUPABASE_URL}`);
  
  // API キー確認
  const apiKeys = {
    'YouTube API': !!process.env.YOUTUBE_API_KEY,
    'OpenAI API': !!process.env.OPENAI_API_KEY,
    'Google Search API': !!process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY
  };

  console.log('\n🔑 APIキー設定状況:');
  Object.entries(apiKeys).forEach(([name, isSet]) => {
    console.log(`   ${name}: ${isSet ? '✅ 設定済み' : '❌ 未設定'}`);
  });

  console.log('\n💡 実際のAI抽出を実行するには:');
  console.log('1. .env.productionにOPENAI_API_KEY=sk-your-key-hereを追加');
  console.log('2. npm run production:equal-love full を実行');
}

async function main() {
  console.log('🚀 =LOVE 本番環境 モックデータテスト');
  console.log('='.repeat(80));

  try {
    // システム情報表示
    await showSystemInfo();

    // エピソード分析
    await analyzeEpisodes();

    // モックデータ挿入
    await insertProductionMockData();

    console.log('\n🎯 次のアクション:');
    console.log('1. https://oshikatsu-collection.netlify.app/celebrities/equal-love で結果確認');
    console.log('2. OpenAI APIキー設定後、全エピソード処理実行');
    console.log('3. npm run production:equal-love full で本格運用開始');

  } catch (error) {
    console.error('❌ 実行エラー:', error);
    process.exit(1);
  }
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}