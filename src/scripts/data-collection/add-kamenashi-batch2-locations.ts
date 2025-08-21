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

// 亀梨和也ロケーションデータ（バッチ2：高級焼肉店・ラーメン店詳細）
const KAMENASHI_BATCH2_LOCATIONS = [
  {
    name: '焼肉古今',
    description: '2024年2月開店の西麻布にある高級焼肉店。但馬牛や神戸牛などの最高級肉を提供し、専門の肉職人がフルサービスで焼いてくれる贅沢な店。亀梨がひとり焼肉で22,400円のコースを堪能。',
    address: '東京都港区西麻布1-10-7 FT-2の2F',
    phone: '03-6804-6229',
    website: null,
    episode_ids: ['33tz7AoUPuU']
  },
  {
    name: 'ごっつおらーめん鳥取店',
    description: '鳥取県の名物牛骨ラーメン専門店。鳥取撮影終わりに亀梨が訪問し「あっさりの奥にめちゃくちゃコクがある」と絶賛。亀梨のYouTube効果でファンの聖地となった。',
    address: '鳥取県鳥取市末広温泉町159-4',
    phone: '0857-35-0977',
    website: 'https://gottsuo.jp/',
    episode_ids: ['QJNOclrBszU']
  },
  {
    name: '夜景の見える焼肉店（詳細調査中）',
    description: 'なにわ男子道枝駿佑とのコラボ動画で訪れた上空からの夜景が美しい焼肉店。横浜ドライブ後の豪華焼肉パーティー会場として利用。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['LaNwtYYQ3Wo']
  },
  {
    name: 'Snow Man渡辺翔太との高級焼肉店',
    description: 'Snow Man渡辺翔太とゲスト松原タニシさんを迎えた東京の高級焼肉店。事故物件映画の宣伝も兼ねたコラボ動画の舞台。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['2F4xUoo5GSM']
  },
  {
    name: '家系ラーメン店（和田毅コラボ）',
    description: '元メジャーリーガー和田毅さんとの野球解説仕事終わりに訪問した家系ラーメン店。和田さんの人生初家系ラーメン体験の舞台。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['9BZhVltYM7c']
  },
  {
    name: '京都の濃厚ラーメン店',
    description: '京都での朝食として訪れた濃厚ラーメン店。一人で朝からラーメンをすする亀梨の贅沢な朝食風景。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['VIXIy62I0Xo']
  },
  {
    name: '二郎系ラーメン店',
    description: '亀梨初の二郎系ラーメン挑戦の舞台となった店舗。ニンニクマシマシの本格的な二郎系体験。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['HjLd3wFnPvc']
  },
  {
    name: '盛岡冷麺店',
    description: '本場岩手の盛岡冷麺を提供する店舗。お仕事前日に絶品焼肉と冷麺を爆食いした贅沢グルメ体験の場。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['WxKvyUgzG40']
  },
  {
    name: 'Snow Man渡辺翔太との絶品かき氷店',
    description: 'Snow Man渡辺翔太との贅沢かき氷企画で訪れた専門店。神のクオリティの味に2人とも悶絶した絶品かき氷店。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['xbEXP_yd8l0']
  },
  {
    name: '亀梨の美容室（長年通うお店）',
    description: '亀梨が長年通っている美容室。作戦会議をしながら髪を切ってもらう、亀梨の美容ルーティンが見られる貴重なロケ地。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['sgCXnoqCYNs']
  }
];

// 亀梨和也ロケーション登録システム（バッチ2）
export class KamenashiBatch2LocationImporter {
  private stats = {
    totalLocations: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importKamenashiBatch2Locations(): Promise<void> {
    console.log('📍 亀梨和也ロケーションデータベース登録（バッチ2）');
    console.log('='.repeat(60));
    console.log('🥩 高級焼肉店・ラーメン店・美容室を中心に登録');
    console.log(`🎯 登録対象: ${KAMENASHI_BATCH2_LOCATIONS.length}箇所\n`);

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
    this.stats.totalLocations = KAMENASHI_BATCH2_LOCATIONS.length;
    const celebrityId = await this.getKamenashiId();

    for (const [index, location] of KAMENASHI_BATCH2_LOCATIONS.entries()) {
      console.log(`【${index + 1}/${KAMENASHI_BATCH2_LOCATIONS.length}】 ${location.name}`);

      try {
        // 既存ロケーションチェック（名前で重複確認）
        const { data: existing } = await supabase
          .from('locations')
          .select('id')
          .eq('name', location.name)
          .single();

        if (existing) {
          console.log('   ⚠️ 既存ロケーションをスキップ');
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
          console.log(`      📍 ${location.address || '住所調査中'}`);
          if (location.phone) {
            console.log(`      📞 ${location.phone}`);
          }
          if (location.episode_ids.length > 1) {
            console.log(`      📺 関連エピソード: ${location.episode_ids.length}件`);
          }
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
    console.log('📊 亀梨和也ロケーション登録完了レポート（バッチ2）');
    console.log('='.repeat(60));

    // 総ロケーション数取得
    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true });

    console.log('\n📈 処理結果:');
    console.log(`📍 対象ロケーション: ${this.stats.totalLocations}箇所`);
    console.log(`✅ 新規登録: ${this.stats.successfulImports}箇所`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📍 総ロケーション数: ${totalLocations}箇所`);

    const successRate = this.stats.totalLocations > 0 
      ? Math.round((this.stats.successfulImports / this.stats.totalLocations) * 100)
      : 0;
    console.log(`🎯 登録成功率: ${successRate}%`);

    console.log('\n🏪 バッチ2登録済みカテゴリ:');
    console.log('   🥩 高級焼肉店: 焼肉古今、夜景焼肉店、Snow Man翔太コラボ店');
    console.log('   🍜 ラーメン専門店: 鳥取牛骨、家系、二郎系、京都濃厚、盛岡冷麺');
    console.log('   🍧 スイーツ店: 絶品かき氷店');
    console.log('   💇 美容室: 亀梨の長年通う美容室');

    console.log('\n📝 詳細調査が必要な店舗:');
    console.log('   🔍 夜景の見える焼肉店（道枝駿佑コラボ）');
    console.log('   🔍 Snow Man翔太との高級焼肉店');
    console.log('   🔍 和田毅さんとの家系ラーメン店');
    console.log('   🔍 京都の濃厚ラーメン店');
    console.log('   🔍 二郎系ラーメン店');
    console.log('   🔍 盛岡冷麺店');
    console.log('   🔍 絶品かき氷店');
    console.log('   🔍 美容室');

    console.log('\n📝 次回バッチ予定:');
    console.log('   - 岡山1泊2日旅行の旅館・レストラン');
    console.log('   - HIKAKINコラボ、はじめしゃちょーコラボ店舗');
    console.log('   - その他地方グルメ店（京都、大阪、横浜など）');
    console.log('   - 数珠つなぎ企画での各店舗');

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/locations');
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
  const importer = new KamenashiBatch2LocationImporter();
  await importer.importKamenashiBatch2Locations();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}