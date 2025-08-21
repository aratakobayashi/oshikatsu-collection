import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// UUID生成関数
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 残り4エピソードの調査で判明した情報（バッチ6）
const KAMENASHI_BATCH6_ADDITIONAL_INFO = [
  // chtW4R82cOg について
  // 調査結果：このエピソードは大阪の一人焼肉の動画と確認されたが、
  // 焼肉古今は既に登録済みのため、具体的な大阪の店舗は別店舗の可能性
  // さらなる調査が必要
  
  // 2F4xUoo5GSM について  
  // 調査結果：Snow Man渡辺翔太・松原タニシとの焼肉企画と推定
  // 事故物件映画宣伝関連のコラボ動画の可能性が高い
  // 具体的な店舗名は特定できず
  
  // G70oQzjkkmg, a9ePEW_lu6A について
  // 調査結果：動画の内容・店舗情報を特定できず
  // エピソードページも詳細情報を取得できない状態
];

// 亀梨和也調査結果レポートシステム（バッチ6）
export class KamenashiBatch6InvestigationReport {
  private investigatedEpisodes = [
    'xbEXP_yd8l0', // ✅ 銀座風香（特定完了）
    '2F4xUoo5GSM', // 🔍 Snow Man渡辺翔太・松原タニシ焼肉店（要調査）
    'WxKvyUgzG40', // ✅ 盛楼閣（特定完了）
    'chtW4R82cOg', // 🔍 大阪一人焼肉店（要調査）
    'G70oQzjkkmg', // ❓ エピソード内容不明
    'a9ePEW_lu6A'  // ❓ エピソード内容不明
  ];

  // メイン処理
  async generateInvestigationReport(): Promise<void> {
    console.log('🔍 亀梨和也指定エピソード詳細調査レポート（バッチ6）');
    console.log('='.repeat(60));
    console.log('📋 残り4エピソードの徹底調査結果');
    console.log(`🎯 対象エピソード: ${this.investigatedEpisodes.length}件\n`);

    try {
      // 調査結果の詳細レポート生成
      await this.generateDetailedReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // 詳細レポート生成
  private async generateDetailedReport(): Promise<void> {
    // 現在の亀梨和也ロケーション数取得
    const celebrityId = await this.getKamenashiId();
    const { count: currentLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId);

    console.log('📊 調査結果サマリー:');
    console.log(`🎯 調査対象エピソード: ${this.investigatedEpisodes.length}件`);
    console.log(`✅ 店舗特定完了: 2件`);
    console.log(`🔍 要追加調査: 2件`);
    console.log(`❓ 内容不明: 2件`);
    console.log(`📍 現在の登録店舗数: ${currentLocations}箇所\n`);

    console.log('✅ 特定完了エピソード:');
    console.log('【1】xbEXP_yd8l0 - 銀座風香');
    console.log('   🍧 Snow Man渡辺翔太との絶品かき氷企画');
    console.log('   📍 東京都中央区築地2-6-8');
    console.log('   🎉 2025年7月18日オープンの話題店');
    console.log('   ⭐ 山梨県産天然氷使用の高級かき氷\n');

    console.log('【2】WxKvyUgzG40 - 盛楼閣');
    console.log('   🍜 亀梨初の本場盛岡冷麺体験');
    console.log('   📍 岩手県盛岡市盛岡駅前通15-5 2F');
    console.log('   📞 019-654-8752');
    console.log('   ⭐ 食べログ百名店の実力派焼肉・冷麺店\n');

    console.log('🔍 要追加調査エピソード:');
    console.log('【3】2F4xUoo5GSM - Snow Man渡辺翔太・松原タニシ焼肉企画');
    console.log('   🎬 事故物件映画宣伝関連のコラボ動画と推定');
    console.log('   🥩 東京の高級焼肉店での撮影');
    console.log('   🔍 店舗名・住所の特定要調査');
    console.log('   💡 調査方法: 事故物件映画関連記事、ファン目撃情報\n');

    console.log('【4】chtW4R82cOg - 大阪一人焼肉企画');
    console.log('   🍖 大阪での一人焼肉動画');
    console.log('   🏙️ 大阪市内の焼肉店');
    console.log('   ❓ 焼肉古今とは別店舗の可能性（既登録のため）');
    console.log('   🔍 大阪の具体的店舗名要調査');
    console.log('   💡 調査方法: 大阪焼肉店、ファンブログ情報\n');

    console.log('❓ 内容不明エピソード:');
    console.log('【5】G70oQzjkkmg - エピソード詳細不明');
    console.log('   ❓ 動画内容、訪問店舗すべて不明');
    console.log('   🔍 動画の存在確認から必要');
    console.log('   💡 調査方法: 亀梨公式SNS、動画履歴確認\n');

    console.log('【6】a9ePEW_lu6A - エピソード詳細不明');
    console.log('   ❓ 動画内容、訪問店舗すべて不明');
    console.log('   🔍 動画の存在確認から必要');
    console.log('   💡 調査方法: 亀梨公式SNS、動画履歴確認\n');

    console.log('📋 調査で使用した情報源:');
    console.log('   ✅ YouTube Data API v3');
    console.log('   ✅ ファンブログ・ロケ地まとめサイト');
    console.log('   ✅ ニュース記事・エンタメサイト');
    console.log('   ✅ 店舗公式サイト・予約サイト');
    console.log('   ❌ 一部エピソードページは情報取得不可\n');

    console.log('💡 今後の調査戦略:');
    console.log('   1. 事故物件映画関連記事からコラボ店舗情報収集');
    console.log('   2. 大阪焼肉店の地域密着ファンサイト調査');
    console.log('   3. 亀梨和也公式TwitterでのYouTube告知確認');
    console.log('   4. Snow Man・なにわ男子ファンからの情報収集');
    console.log('   5. YouTubeチャンネルの動画履歴直接確認\n');

    console.log('🎯 期待される成果:');
    console.log('   📍 最大4店舗の追加特定が可能');
    console.log('   🏆 亀梨和也ロケーション総数17箇所達成');
    console.log('   ⭐ 全て具体的店舗名・住所確定データ');
    console.log('   🎪 Snow Manレベルの聖地巡礼データベース完成\n');

    console.log('📱 現在確認可能なURL:');
    console.log('   https://oshikatsu-collection.netlify.app/episodes/xbEXP_yd8l0');
    console.log('   https://oshikatsu-collection.netlify.app/episodes/WxKvyUgzG40');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');

    console.log('\n' + '='.repeat(60));
    console.log('🔥 調査継続により、さらなる店舗特定を目指します！');
    console.log('='.repeat(60));
  }

  // 亀梨和也ID取得
  private async getKamenashiId(): Promise<string> {
    const { data } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'kamenashi-kazuya')
      .single();
    return data?.id || '';
  }
}

// メイン処理
async function main() {
  const reporter = new KamenashiBatch6InvestigationReport();
  await reporter.generateInvestigationReport();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}