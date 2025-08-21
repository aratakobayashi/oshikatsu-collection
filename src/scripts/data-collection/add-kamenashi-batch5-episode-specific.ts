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

// 指定エピソードから特定できた亀梨和也ロケーションデータ（バッチ5）
const KAMENASHI_BATCH5_LOCATIONS = [
  {
    name: '銀座風香',
    description: '2025年7月18日オープンの東京・新富町にある高級かき氷専門店。亀梨和也とSnow Man渡辺翔太が巨大かき氷を堪能。山梨県産天然氷を使用し、極上かき氷と高級茶のペアリングが楽しめる。',
    address: '東京都中央区築地2-6-8',
    phone: null, // 非公開
    website: null,
    episode_ids: ['xbEXP_yd8l0']
  },
  {
    name: '盛楼閣',
    description: '岩手県盛岡駅前にある焼肉・冷麺の名店。亀梨和也が人生初の本場盛岡冷麺に挑戦した店舗。上質な黒毛和牛と透き通ったシコシコ麺が自慢。食べログ百名店選出の実力派。',
    address: '岩手県盛岡市盛岡駅前通15-5 2F',
    phone: '019-654-8752',
    website: null,
    episode_ids: ['WxKvyUgzG40']
  }
  // 注：以下のエピソードは詳細調査が必要
  // 2F4xUoo5GSM - Snow Man渡辺翔太・松原タニシとの焼肉店（店名要調査）
  // chtW4R82cOg - 大阪の一人焼肉店（焼肉古今と推定されるが既に登録済み）
  // G70oQzjkkmg - エピソード内容不明（調査要）
  // a9ePEW_lu6A - エピソード内容不明（調査要）
];

// 亀梨和也ロケーション登録システム（バッチ5）
export class KamenashiBatch5LocationImporter {
  private stats = {
    totalLocations: 0,
    successfulImports: 0,
    errors: 0,
    skippedDuplicates: 0
  };

  // メイン処理
  async importKamenashiBatch5Locations(): Promise<void> {
    console.log('📍 亀梨和也指定エピソードロケーション登録（バッチ5）');
    console.log('='.repeat(60));
    console.log('🎯 指定された6エピソードから特定できた店舗を登録');
    console.log(`🔍 対象エピソード: xbEXP_yd8l0, 2F4xUoo5GSM, WxKvyUgzG40, chtW4R82cOg, G70oQzjkkmg, a9ePEW_lu6A`);
    console.log(`📍 特定完了店舗: ${KAMENASHI_BATCH5_LOCATIONS.length}箇所\n`);

    try {
      // 各ロケーションを順次登録
      await this.importLocations();
      
      // レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // ロケーション登録
  private async importLocations(): Promise<void> {
    this.stats.totalLocations = KAMENASHI_BATCH5_LOCATIONS.length;
    const celebrityId = await this.getKamenashiId();

    for (const [index, location] of KAMENASHI_BATCH5_LOCATIONS.entries()) {
      console.log(`【${index + 1}/${KAMENASHI_BATCH5_LOCATIONS.length}】 ${location.name}`);

      try {
        // 既存ロケーションチェック（名前で重複確認）
        const { data: existing } = await supabase
          .from('locations')
          .select('id')
          .eq('name', location.name)
          .single();

        if (existing) {
          console.log('   ⚠️ 既存ロケーションをスキップ');
          this.stats.skippedDuplicates++;
          continue;
        }

        // 新規ロケーションデータ作成
        let description = location.description;
        if (location.phone) {
          description += `\n電話番号: ${location.phone}`;
        }

        const locationData = {
          name: location.name,
          slug: `${location.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now()}`,
          description: description,
          address: location.address,
          website_url: location.website,
          episode_id: location.episode_ids[0], // 最初のエピソードIDを使用
          celebrity_id: celebrityId
        };

        const { error } = await supabase
          .from('locations')
          .insert([locationData]);

        if (error) {
          console.error('   ❌ ロケーション登録エラー:', error.message);
          this.stats.errors++;
        } else {
          console.log('   ✅ ロケーション登録成功');
          console.log(`      📍 ${location.address}`);
          if (location.phone) {
            console.log(`      📞 ${location.phone}`);
          }
          console.log(`      📺 エピソードID: ${location.episode_ids[0]}`);
          this.stats.successfulImports++;
        }

      } catch (error) {
        console.error(`   ❌ 処理エラー: ${error.message}`);
        this.stats.errors++;
      }
      
      console.log(); // 空行追加
    }
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('='.repeat(60));
    console.log('📊 亀梨和也指定エピソードロケーション登録完了レポート');
    console.log('='.repeat(60));

    // 総ロケーション数取得
    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true });

    // 亀梨和也の総ロケーション数取得
    const celebrityId = await this.getKamenashiId();
    const { count: kamenashiLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId);

    console.log('\n📈 処理結果:');
    console.log(`🎯 指定エピソード数: 6件`);
    console.log(`🔍 特定完了店舗: ${this.stats.totalLocations}箇所`);
    console.log(`✅ 新規登録: ${this.stats.successfulImports}箇所`);
    console.log(`⚠️ 重複スキップ: ${this.stats.skippedDuplicates}箇所`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📍 総ロケーション数: ${totalLocations}箇所`);
    console.log(`📺 亀梨和也ロケーション数: ${kamenashiLocations}箇所`);

    const identificationRate = Math.round((this.stats.totalLocations / 6) * 100);
    console.log(`🎯 エピソード特定率: ${identificationRate}%（${this.stats.totalLocations}/6件）`);

    console.log('\n✅ 今回特定・登録できた店舗:');
    console.log('   🍧 銀座風香: 高級かき氷専門店（新富町・築地）');
    console.log('   🍜 盛楼閣: 焼肉・冷麺店（盛岡駅前）');

    console.log('\n🔍 詳細調査が必要なエピソード:');
    console.log('   📺 2F4xUoo5GSM: Snow Man渡辺翔太・松原タニシとの焼肉店');
    console.log('   📺 chtW4R82cOg: 大阪一人焼肉店（焼肉古今と推定・要確認）');
    console.log('   📺 G70oQzjkkmg: エピソード内容不明');
    console.log('   📺 a9ePEW_lu6A: エピソード内容不明');

    console.log('\n🌟 新規登録店舗の特徴:');
    console.log('   🍧 銀座風香: 2025年7月オープンの話題の新店');
    console.log('   🥶 山梨県産天然氷使用の高級かき氷');
    console.log('   🍜 盛楼閣: 食べログ百名店の実力派');
    console.log('   🥩 上質な黒毛和牛と本格盛岡冷麺');

    console.log('\n📝 今後のアクション:');
    console.log('   1. 残り4エピソードの動画内容詳細分析');
    console.log('   2. ファンサイト・ブログからの情報収集');
    console.log('   3. 特定できた店舗から順次追加登録');
    console.log('   4. 店舗の営業状況・最新情報の確認');

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/episodes/xbEXP_yd8l0');
    console.log('   https://oshikatsu-collection.netlify.app/episodes/WxKvyUgzG40');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');
    console.log('\n' + '='.repeat(60));
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
  const importer = new KamenashiBatch5LocationImporter();
  await importer.importKamenashiBatch5Locations();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}