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

// 亀梨和也ロケーションデータ（バッチ4：新たに特定できた具体的店舗）
const KAMENASHI_BATCH4_LOCATIONS = [
  {
    name: 'Hohokam DINER（ホホカムダイナー）',
    description: '渋谷神宮前にあるアメリカンダイナー。亀梨和也とふぉ〜ゆ〜越岡裕貴がパンケーキ企画で訪問。オープンテラスの1番テーブルで撮影。越岡がオリジナルバターミルクパンケーキ（1160円）を注文。',
    address: '東京都渋谷区神宮前1-14-21',
    phone: '050-5385-3811',
    website: null,
    episode_ids: ['VwiyfeWGgAY'] // はじめしゃちょーコラボ動画と推定
  },
  {
    name: '釣船茶屋ざうお新宿店',
    description: '新宿ワシントンホテル1階にある釣り体験ができる居酒屋。亀梨和也となにわ男子高橋恭平が釣りをして自分で釣った魚を食べる企画で訪問。営業時間11:30-15:00、17:00-22:30。',
    address: '東京都新宿区西新宿3-2-9 新宿ワシントンホテル 1階',
    phone: '03-3343-6622',
    website: null,
    episode_ids: [] // 動画ID要調査
  },
  {
    name: '自家製麺223',
    description: '新宿区北新宿にある二郎系ラーメン店。亀梨和也初の二郎系ラーメン挑戦の舞台。店名「223」は店主の息子の誕生日（2月23日）由来で、偶然にも亀梨の誕生日と同じ。小ラーメン850円、ニンニクトッピングで注文。',
    address: '東京都新宿区北新宿3-9-10 久米マンション 101',
    phone: null, // 電話番号は非公開
    website: null,
    episode_ids: ['HjLd3wFnPvc']
  }
];

// 亀梨和也ロケーション登録システム（バッチ4）
export class KamenashiBatch4LocationImporter {
  private stats = {
    totalLocations: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importKamenashiBatch4Locations(): Promise<void> {
    console.log('📍 亀梨和也ロケーションデータベース登録（バッチ4）');
    console.log('='.repeat(60));
    console.log('🔍 新たに特定できた具体的店舗を追加登録');
    console.log(`🎯 登録対象: ${KAMENASHI_BATCH4_LOCATIONS.length}箇所\n`);

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
    this.stats.totalLocations = KAMENASHI_BATCH4_LOCATIONS.length;
    const celebrityId = await this.getKamenashiId();

    for (const [index, location] of KAMENASHI_BATCH4_LOCATIONS.entries()) {
      console.log(`【${index + 1}/${KAMENASHI_BATCH4_LOCATIONS.length}】 ${location.name}`);

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
          episode_id: location.episode_ids.length > 0 ? location.episode_ids[0] : null,
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
    console.log('📊 亀梨和也ロケーション登録完了レポート（バッチ4）');
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

    // 亀梨和也ロケーションの詳細取得
    const { data: allKamenashiLocations } = await supabase
      .from('locations')
      .select('name, address')
      .eq('celebrity_id', celebrityId)
      .order('name');

    console.log('\n📈 処理結果:');
    console.log(`📍 対象ロケーション: ${this.stats.totalLocations}箇所`);
    console.log(`✅ 新規登録: ${this.stats.successfulImports}箇所`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📍 総ロケーション数: ${totalLocations}箇所`);
    console.log(`📺 亀梨和也ロケーション数: ${kamenashiLocations}箇所`);

    const successRate = this.stats.totalLocations > 0 
      ? Math.round((this.stats.successfulImports / this.stats.totalLocations) * 100)
      : 0;
    console.log(`🎯 登録成功率: ${successRate}%`);

    console.log('\n🏪 バッチ4で新規登録された店舗:');
    console.log('   🥞 Hohokam DINER: アメリカンダイナー（渋谷神宮前）');
    console.log('   🎣 釣船茶屋ざうお新宿店: 釣り体験居酒屋（新宿ワシントンホテル）');
    console.log('   🍜 自家製麺223: 二郎系ラーメン（新宿区北新宿）');

    console.log('\n📊 亀梨和也全ロケーション一覧:');
    if (allKamenashiLocations && allKamenashiLocations.length > 0) {
      allKamenashiLocations.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location.name}`);
        if (location.address) {
          console.log(`      📍 ${location.address}`);
        }
      });
    }

    console.log('\n🌟 亀梨和也ロケーション特徴:');
    console.log('   🍽️ グルメ店舗が中心（ラーメン、もんじゃ、焼肉、寿司等）');
    console.log('   🌍 国際的：東京、岡山、鳥取、スイス');
    console.log('   💎 高級店から庶民派まで幅広いレンジ');
    console.log('   🎬 コラボ企画での訪問が多数');
    console.log('   📱 YouTube効果でファンの聖地化');

    console.log('\n📝 さらなる調査候補:');
    console.log('   🔍 和田毅さんとの家系ラーメン店');
    console.log('   🔍 なにわ男子道枝駿佑との夜景焼肉店');  
    console.log('   🔍 Snow Man渡辺翔太との東京高級焼肉店');
    console.log('   🔍 絶品かき氷専門店（渡辺翔太コラボ）');
    console.log('   🔍 大阪一人焼肉店');

    console.log('\n📱 確認URL:');
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
  const importer = new KamenashiBatch4LocationImporter();
  await importer.importKamenashiBatch4Locations();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}