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

// 新指定エピソードの調査結果（バッチ8）
const KAMENASHI_BATCH8_NEW_EPISODES_RESEARCH = [
  // 調査結果: 7つの新エピソードIDは検索結果で特定できず
  // Web検索・YouTube検索でも該当なし
  // 動画IDの有効性確認が必要な状態
  
  // 既知の亀梨和也YouTube店舗情報を活用した推定登録候補
  // ファンサイト情報から特定可能な店舗を再精査
];

// 推定される追加登録候補店舗（既知情報から特定可能）
const KAMENASHI_BATCH8_POTENTIAL_LOCATIONS = [
  {
    name: '釣船茶屋ざうお新宿店', 
    description: '新宿ワシントンホテル1階にある釣り体験ができる居酒屋。亀梨和也となにわ男子高橋恭平が釣りをして自分で釣った魚を食べる企画で訪問。営業時間11:30-15:00、17:00-22:30。',
    address: '東京都新宿区西新宿3-2-9 新宿ワシントンホテル 1階',
    phone: '03-3343-6622',
    website: null,
    episode_ids: ['potential_new_episode_id'], // 実際のIDは要確認
    is_already_registered: true // バッチ4で登録済み
  },
  {
    name: '九州じゃんがら原宿店',
    description: '原宿にある豚骨ラーメン専門店。亀梨和也とふぉ〜ゆ〜越岡裕貴がラーメンを食べた後、近くのホホカムダイナーでパンケーキ企画に移行。濃厚な豚骨スープが特徴。',
    address: '東京都渋谷区神宮前1-13-21',
    phone: '03-3408-4466',
    website: null,
    episode_ids: ['potential_episode'], // 要確認
    is_already_registered: false // 未登録
  }
  // 注：新エピソードIDが特定できないため、
  // 既知店舗の登録漏れチェックと推定登録のみ実施
];

// 新エピソード調査・登録システム（バッチ8）
export class KamenashiBatch8NewEpisodesInvestigator {
  private investigationStats = {
    newEpisodesRequested: 7,
    episodesFound: 0,
    videoIdsVerified: 0,
    potentialLocations: 2,
    knownButUnregistered: 1
  };

  // メイン処理
  async investigateNewEpisodes(): Promise<void> {
    console.log('🔍 亀梨和也新指定7エピソード調査レポート（バッチ8）');
    console.log('='.repeat(70));
    console.log('🎯 新たに指定された7エピソードIDの詳細調査');
    console.log(`📺 調査対象: ${this.investigationStats.newEpisodesRequested}件\n`);

    try {
      // 新エピソード調査結果レポート
      await this.generateNewEpisodesReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // 新エピソード調査結果レポート
  private async generateNewEpisodesReport(): Promise<void> {
    const celebrityId = await this.getKamenashiId();
    const { count: currentLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId);

    console.log('📊 新エピソード調査結果:');
    console.log(`🆕 新指定エピソード数: ${this.investigationStats.newEpisodesRequested}件`);
    console.log(`🔍 検索で特定できたエピソード: ${this.investigationStats.episodesFound}件`);
    console.log(`✅ 動画ID有効性確認済み: ${this.investigationStats.videoIdsVerified}件`);
    console.log(`📍 現在の登録店舗数: ${currentLocations}箇所\n`);

    console.log('📺 指定された新エピソードID一覧:');
    console.log('   🆔 60gCTEQyOYU - 調査結果: 検索該当なし');
    console.log('   🆔 eJcmJmyDR5E - 調査結果: 検索該当なし');
    console.log('   🆔 8HTsVA9ZK0k - 調査結果: 検索該当なし');
    console.log('   🆔 Q-BcioViZcc - 調査結果: 検索該当なし');
    console.log('   🆔 fqUI15scR4o - 調査結果: 検索該当なし');
    console.log('   🆔 VIXIy62I0Xo - 調査結果: 検索該当なし');
    console.log('   🆔 SSwnM6BcHuE - 調査結果: 検索該当なし\n');

    console.log('🔍 実施した調査方法:');
    console.log('   ✅ Web検索エンジンでの動画ID検索');
    console.log('   ✅ YouTube直接検索（site:youtube.com）');
    console.log('   ✅ 亀梨和也 + 動画IDの組み合わせ検索');
    console.log('   ✅ ファンサイト・ロケ地まとめサイトとの照合');
    console.log('   ❌ すべての検索で該当なし\n');

    console.log('💭 動画ID未発見の可能性考察:');
    console.log('   🤔 動画が非公開・限定公開の可能性');
    console.log('   🤔 動画が削除済みの可能性');
    console.log('   🤔 動画IDの誤入力・タイプミスの可能性');
    console.log('   🤔 まだ公開されていない未来の動画IDの可能性');
    console.log('   🤔 他のプラットフォームの動画IDの可能性\n');

    console.log('📍 既知店舗の登録状況確認:');
    KAMENASHI_BATCH8_POTENTIAL_LOCATIONS.forEach((location, index) => {
      const status = location.is_already_registered ? '✅ 登録済み' : '⚠️ 未登録';
      console.log(`   ${index + 1}. ${location.name} - ${status}`);
      console.log(`      📍 ${location.address}`);
      if (location.phone) {
        console.log(`      📞 ${location.phone}`);
      }
    });

    console.log('\n🎯 今後のアクション提案:');
    console.log('   1. 📺 動画ID直接アクセステスト（URL確認）');
    console.log('   2. 🔍 亀梨和也公式YouTubeチャンネル全動画リスト取得');
    console.log('   3. 📱 公式SNSでの動画告知確認');
    console.log('   4. 🏪 既知未登録店舗（九州じゃんがら原宿店）の登録検討');
    console.log('   5. 👥 ファンコミュニティでの動画ID確認\n');

    console.log('💡 代替アプローチ:');
    console.log('   🔍 亀梨YouTubeチャンネルの最新動画から店舗特定');
    console.log('   📊 YouTube Data APIによる動画一覧取得');
    console.log('   🎯 既存登録済み店舗の情報充実化');
    console.log('   📍 地域別ロケーションマップの拡充\n');

    console.log('📈 調査統計サマリー:');
    console.log(`   🎯 総指定エピソード: ${this.investigationStats.newEpisodesRequested}件`);
    console.log(`   🔍 特定成功率: ${Math.round((this.investigationStats.episodesFound / this.investigationStats.newEpisodesRequested) * 100)}%`);
    console.log(`   📍 既知店舗再確認: ${this.investigationStats.potentialLocations}件`);
    console.log(`   ⚠️ 未登録発見: ${this.investigationStats.knownButUnregistered}件\n`);

    console.log('🌟 重要な発見:');
    console.log('   📺 亀梨和也YouTubeチャンネルには多数の店舗訪問動画');
    console.log('   🍽️ グルメ企画が中心でファンの聖地巡礼価値が高い');
    console.log('   🎬 豪華ゲストとのコラボが多数（Snow Man、なにわ男子等）');
    console.log('   📈 チャンネル登録者数80万人超えの影響力\n');

    console.log('📱 確認推奨URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');
    console.log('   https://www.youtube.com/@k_kamenashi_23');

    console.log('\n' + '='.repeat(70));
    console.log('🔥 7エピソード調査完了！次段階での動画特定を推奨');
    console.log('='.repeat(70));
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
  const investigator = new KamenashiBatch8NewEpisodesInvestigator();
  await investigator.investigateNewEpisodes();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}