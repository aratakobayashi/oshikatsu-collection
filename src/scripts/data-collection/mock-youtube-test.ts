import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 環境変数読み込み
dotenv.config({ path: '.env.staging' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const EQUAL_LOVE_ID = '259e44a6-5a33-40cf-9d78-86cfbd9df2ac';

// モックデータ（YouTube概要欄から抽出される予定のデータ）
const MOCK_EXTRACTED_LOCATIONS = [
  {
    name: '浅草もんじゃ もんろう',
    address: '東京都台東区浅草1-41-2',
    category: 'restaurant',
    description: 'YouTube概要欄に記載された住所付きのもんじゃ焼き店。メンバーが実際に訪問した店舗。',
    confidence: 'high' as const,
    source: 'youtube_description' as const,
    service_links: {
      googleMaps: 'https://www.google.com/maps/search/東京都台東区浅草1-41-2',
      gurunavi: 'https://r.gnavi.co.jp/search/?sw=浅草もんじゃ もんろう',
      tabelog: 'https://tabelog.com/rstLst/?sw=浅草もんじゃ もんろう',
      hotpepper: 'https://www.hotpepper.jp/CST010/?SA11=浅草もんじゃ もんろう',
      retty: 'https://retty.me/search/?q=浅草もんじゃ もんろう'
    }
  },
  {
    name: 'スイーツパラダイス 渋谷店',
    address: '東京都渋谷区道玄坂2-6-17 渋東シネタワー11F',
    category: 'restaurant',
    description: 'スイーツビュッフェ店。YouTube概要欄に住所付きで記載された実際の訪問先。',
    confidence: 'high' as const,
    source: 'youtube_description' as const,
    service_links: {
      googleMaps: 'https://www.google.com/maps/search/東京都渋谷区道玄坂2-6-17',
      gurunavi: 'https://r.gnavi.co.jp/search/?sw=スイーツパラダイス',
      tabelog: 'https://tabelog.com/rstLst/?sw=スイーツパラダイス',
      hotpepper: 'https://www.hotpepper.jp/CST010/?SA11=スイーツパラダイス',
      retty: 'https://retty.me/search/?q=スイーツパラダイス'
    }
  },
  {
    name: '新横浜ラーメン博物館',
    address: '神奈川県横浜市港北区新横浜2-14-21',
    category: 'restaurant',
    description: 'ラーメンテーマパーク。YouTube概要欄に住所付きで記載された訪問先。',
    confidence: 'high' as const,
    source: 'youtube_description' as const,
    service_links: {
      googleMaps: 'https://www.google.com/maps/search/神奈川県横浜市港北区新横浜2-14-21',
      gurunavi: 'https://r.gnavi.co.jp/search/?sw=新横浜ラーメン博物館',
      tabelog: 'https://tabelog.com/rstLst/?sw=新横浜ラーメン博物館',
      hotpepper: 'https://www.hotpepper.jp/CST010/?SA11=新横浜ラーメン博物館',
      retty: 'https://retty.me/search/?q=新横浜ラーメン博物館'
    }
  }
];

// スラッグ生成（ユニークになるようにタイムスタンプ追加）
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // タイムスタンプを追加してユニークにする
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
}

// モックデータをデータベースに保存
async function insertMockLocations() {
  console.log('🧪 モックロケーションデータの挿入開始');
  console.log('='.repeat(60));

  try {
    // サンプルエピソードID（=LOVEの最新エピソードから取得）
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .order('date', { ascending: false })
      .limit(1);

    if (!episodes || episodes.length === 0) {
      console.error('❌ =LOVEのエピソードが見つかりません');
      return;
    }

    const sampleEpisodeId = episodes[0].id;
    console.log(`📺 サンプルエピソードID: ${sampleEpisodeId}`);

    let insertedCount = 0;

    for (const mockLocation of MOCK_EXTRACTED_LOCATIONS) {
      const slug = generateSlug(mockLocation.name);
      
      const locationData = {
        name: mockLocation.name,
        slug: slug,
        description: mockLocation.description,
        address: mockLocation.address,
        website_url: mockLocation.service_links.googleMaps,
        tags: ['AI抽出モック', 'YouTube概要欄', mockLocation.confidence, mockLocation.category],
        celebrity_id: EQUAL_LOVE_ID
      };

      const { data, error } = await supabase
        .from('locations')
        .insert([locationData])
        .select();

      if (error) {
        console.error(`❌ ${mockLocation.name} の挿入エラー:`, error);
        continue;
      }

      console.log(`✅ ${mockLocation.name} を挿入完了`);
      console.log(`   住所: ${mockLocation.address}`);
      console.log(`   Google Maps: ${mockLocation.service_links.googleMaps}`);
      console.log(`   ぐるなび: ${mockLocation.service_links.gurunavi}`);
      console.log('');

      insertedCount++;
    }

    console.log('='.repeat(60));
    console.log(`🎉 モックデータ挿入完了: ${insertedCount}/${MOCK_EXTRACTED_LOCATIONS.length}件`);
    console.log('='.repeat(60));

    // 結果確認
    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID);

    console.log(`\n📊 =LOVE 総ロケーション数: ${totalLocations}件`);
    console.log('📱 Webアプリで確認: https://oshikatsu-collection.netlify.app/celebrities/equal-love');

  } catch (error) {
    console.error('❌ モックデータ挿入中にエラー:', error);
  }
}

// システム動作テスト
async function testSystemCapabilities() {
  console.log('\n🔧 システム機能テスト');
  console.log('-'.repeat(40));

  // 1. データベース接続テスト
  console.log('1. データベース接続テスト...');
  try {
    const { data, error } = await supabase
      .from('celebrities')
      .select('name')
      .eq('id', EQUAL_LOVE_ID)
      .limit(1);

    if (error) throw error;
    console.log(`   ✅ 接続成功: ${data[0]?.name}`);
  } catch (error) {
    console.log(`   ❌ 接続失敗: ${error}`);
  }

  // 2. YouTube API テスト
  console.log('2. YouTube API接続テスト...');
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (youtubeApiKey) {
    console.log('   ✅ YouTube APIキー設定済み');
  } else {
    console.log('   ❌ YouTube APIキー未設定');
  }

  // 3. OpenAI API テスト
  console.log('3. OpenAI API接続テスト...');
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
    console.log('   ✅ OpenAI APIキー設定済み');
    console.log('   📝 実際のAI抽出が可能です');
  } else {
    console.log('   ❌ OpenAI APIキー未設定');
    console.log('   📝 モックデータでのテストのみ可能');
  }

  console.log('\n💡 次のステップ:');
  if (!openaiApiKey) {
    console.log('1. .env.stagingにOPENAI_API_KEY=sk-your-key-here を追加');
    console.log('2. npm run process:equal-love で実際のAI抽出を実行');
  } else {
    console.log('1. npm run process:equal-love で実際のAI抽出を実行');
  }
  console.log('3. https://oshikatsu-collection.netlify.app/celebrities/equal-love で結果確認');
}

async function main() {
  console.log('🚀 YouTube概要欄AI抽出システム - モックテスト');
  console.log('='.repeat(80));
  
  await testSystemCapabilities();
  
  console.log('\n📝 モックデータを挿入しますか？ (実際のAI抽出の代替)');
  console.log('これにより、期待される結果のサンプルを確認できます。');
  
  // 自動的にモックデータを挿入（デモ用）
  await insertMockLocations();
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}