import dotenv from 'dotenv';
import { EnhancedYouTubeLocationProcessor } from './youtube-description-extractor';
import { DatabaseLocationProcessor } from './enhanced-location-processor';

// 環境変数読み込み
dotenv.config({ path: '.env.staging' });

// テスト用のサンプル概要欄テキスト
const SAMPLE_DESCRIPTION = `
今日は=LOVEのメンバーで美味しいお店めぐりをしてきました！

📍訪れたお店：

1. 浅草もんじゃ もんろう
   住所：東京都台東区浅草1-41-2
   もんじゃ焼きが絶品でした！メンバーみんなで盛り上がりました🔥

2. スイーツパラダイス 渋谷店  
   住所：東京都渋谷区道玄坂2-6-17 渋東シネタワー11F
   スイーツビュッフェで大満足！みんなでたくさん食べました🍰

3. 新横浜ラーメン博物館
   住所：神奈川県横浜市港北区新横浜2-14-21
   色々なラーメンが楽しめて最高でした🍜

今度はまた違うお店に行きたいです！
みなさんもぜひ行ってみてください✨

#イコールラブ #グルメ #食べ歩き
`;

async function testYouTubeExtraction() {
  console.log('🧪 YouTube概要欄抽出システムテスト');
  console.log('='.repeat(60));

  const processor = new EnhancedYouTubeLocationProcessor();
  
  // 1. 直接テキスト抽出テスト
  console.log('\n📝 Step 1: サンプルテキストからの抽出テスト');
  console.log('-'.repeat(40));
  
  try {
    // extractorを直接使用してテスト
    const extractor = (processor as any).extractor;
    const restaurants = await extractor.extractRestaurantInfo(SAMPLE_DESCRIPTION);
    
    console.log(`🏪 抽出結果: ${restaurants.length}件`);
    
    restaurants.forEach((restaurant: any, index: number) => {
      console.log(`\n${index + 1}. ${restaurant.name}`);
      console.log(`   住所: ${restaurant.address}`);
      console.log(`   種類: ${restaurant.type}`);
      console.log(`   信頼度: ${restaurant.confidence}`);
      console.log(`   言及内容: ${restaurant.mentioned_context}`);
    });
    
  } catch (error) {
    console.error('❌ 抽出テストエラー:', error);
  }

  // 2. リンク生成テスト
  console.log('\n🔗 Step 2: サービスリンク生成テスト');
  console.log('-'.repeat(40));
  
  try {
    const linkGenerator = (processor as any).linkGenerator;
    const sampleRestaurant = {
      name: '浅草もんじゃ もんろう',
      address: '東京都台東区浅草1-41-2',
      type: 'もんじゃ焼き',
      mentioned_context: 'もんじゃ焼きが絶品でした！',
      confidence: 'high' as const
    };
    
    const links = await linkGenerator.generateServiceLinks(sampleRestaurant);
    
    console.log(`🏪 店舗: ${sampleRestaurant.name}`);
    console.log(`📍 Google Maps: ${links.googleMaps}`);
    console.log(`🍽️  ぐるなび: ${links.gurunavi}`);
    console.log(`📖 食べログ: ${links.tabelog}`);
    console.log(`🌶️  ホットペッパー: ${links.hotpepper}`);
    console.log(`👥 Retty: ${links.retty}`);
    
  } catch (error) {
    console.error('❌ リンク生成エラー:', error);
  }
}

async function testDatabaseIntegration() {
  console.log('\n💾 データベース統合テスト');
  console.log('='.repeat(60));

  // 環境変数チェック
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
    'YOUTUBE_API_KEY'
  ];

  console.log('🔍 環境変数チェック:');
  let allEnvVarsPresent = true;
  
  requiredEnvVars.forEach(varName => {
    const isPresent = !!process.env[varName];
    console.log(`   ${varName}: ${isPresent ? '✅ 設定済み' : '❌ 未設定'}`);
    if (!isPresent) allEnvVarsPresent = false;
  });

  if (!allEnvVarsPresent) {
    console.log('\n⚠️  一部の環境変数が未設定です。.env.stagingファイルを確認してください。');
    return;
  }

  try {
    const dbProcessor = new DatabaseLocationProcessor();
    
    console.log('\n📺 =LOVEのエピソード一覧取得テスト...');
    
    // 実際のデータベース接続テスト
    // この部分は実際のAPIキーとデータベースが必要
    console.log('✅ データベース接続テスト準備完了');
    console.log('⚠️  実際の実行は`npm run process-equal-love`コマンドで行ってください');
    
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
  }
}

async function main() {
  console.log('🚀 YouTube概要欄ベース抽出システム 統合テスト');
  console.log('='.repeat(80));
  
  // 基本的な抽出機能テスト
  await testYouTubeExtraction();
  
  // データベース統合テスト
  await testDatabaseIntegration();
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 テスト完了！');
  console.log('\n📝 次のステップ:');
  console.log('1. .env.stagingにOPENAI_API_KEYとYOUTUBE_API_KEYを設定');
  console.log('2. npm run process-equal-love で実際の抽出を実行');
  console.log('3. 結果をWebアプリで確認');
  console.log('='.repeat(80));
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}