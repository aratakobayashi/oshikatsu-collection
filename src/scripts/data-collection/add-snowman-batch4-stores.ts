import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man第4弾特定済み店舗・施設データ
const BATCH4_STORES = [
  // 頭蓋骨はがしエピソード (ANeTPsKcS54)
  {
    episode_id: 'ANeTPsKcS54',
    name: 'Dr.HEAD 新宿本店',
    address: '東京都新宿区西新宿7-7-33 新銘ビルB1',
    phone: '03-6820-2473',
    website_url: 'https://dr-head.com/',
    category: 'health',
    description: 'Snow Man頭蓋骨はがし体験エピソードで訪れた眠活特化のドライヘッドスパ専門店。話題の頭蓋骨剥がしで快眠効果',
    tags: ['Snow Man', '頭蓋骨はがし', '新宿', 'ドライヘッドスパ', 'マッサージ', 'すのちゅーぶ', '特定済み']
  },
  // プライベート飯エピソード (hysx8Y1EZyo) - 荒川の洋食屋
  {
    episode_id: 'hysx8Y1EZyo',
    name: 'キッチンぴーなっつ',
    address: '東京都荒川区西尾久6-18-1',
    phone: '03-3819-9016',
    website_url: 'https://www.kitchen-peanut.com/',
    category: 'restaurant',
    description: 'Snow Manプライベート飯で訪れた荒川の隠れ家洋食店。旬の食材にこだわるハンバーグが自慢の老舗',
    tags: ['Snow Man', '洋食', '荒川', 'ハンバーグ', 'プライベート飯', '隠れ家', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man第4弾店舗登録システム
export class SnowManBatch4StoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importBatch4Stores(): Promise<void> {
    console.log('🏪 Snow Man第4弾店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('💆‍♂️ ヘッドスパ・洋食店');
    console.log(`🎯 登録対象: ${BATCH4_STORES.length}件の第4弾特定店舗\n`);

    try {
      // Snow ManのセレブリティID取得
      const { data: snowMan } = await supabase
        .from('celebrities')
        .select('id, name')
        .eq('slug', 'snow-man')
        .single();

      if (!snowMan) {
        console.error('❌ Snow Manが見つかりません');
        return;
      }

      console.log(`✅ セレブリティ確認: ${snowMan.name} (ID: ${snowMan.id})\n`);

      this.stats.totalStores = BATCH4_STORES.length;

      // 各店舗を処理
      for (const [index, store] of BATCH4_STORES.entries()) {
        console.log(`【${index + 1}/${BATCH4_STORES.length}】 ${store.name}`);

        try {
          // エピソード存在チェック
          const { data: episode } = await supabase
            .from('episodes')
            .select('id, title')
            .eq('id', store.episode_id)
            .single();

          if (!episode) {
            console.log(`   ⚠️ エピソードID ${store.episode_id} が見つかりません`);
            continue;
          }

          console.log(`   📺 エピソード: ${episode.title}`);

          // 店舗保存
          const result = await this.saveStore(store, snowMan.id);
          
          if (result === 'success') {
            this.stats.successfulImports++;
            console.log(`   ✅ 登録成功: ${store.name}`);
            console.log(`      📍 住所: ${store.address}`);
            console.log(`      📞 電話: ${store.phone}`);
            console.log(`      🌐 Web: ${store.website_url}`);
          } else if (result === 'duplicate') {
            console.log(`   ⚠️ 既存スキップ: ${store.name}`);
          } else {
            this.stats.errors++;
            console.log(`   ❌ 登録エラー: ${store.name}`);
          }

        } catch (error) {
          console.error(`   ❌ 処理エラー: ${error.message}`);
          this.stats.errors++;
        }
      }

      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // 店舗保存
  private async saveStore(store: any, celebrityId: string): Promise<'success' | 'duplicate' | 'error'> {
    try {
      // 既存チェック（名前で重複判定）
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', store.name)
        .eq('celebrity_id', celebrityId)
        .single();

      if (existing) {
        return 'duplicate';
      }

      // 新規店舗データ作成
      const locationData = {
        name: store.name,
        slug: `${store.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now()}`,
        description: store.description,
        address: store.address,
        website_url: store.website_url,
        tags: store.tags,
        episode_id: store.episode_id,
        celebrity_id: celebrityId
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      return error ? 'error' : 'success';
    } catch {
      return 'error';
    }
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Snow Man第4弾店舗登録完了レポート');
    console.log('='.repeat(60));

    // 総ロケーション数取得
    const { count: totalCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', await this.getSnowManId());

    console.log('\n📈 処理結果:');
    console.log(`🏪 対象店舗: ${this.stats.totalStores}件`);
    console.log(`✅ 新規登録: ${this.stats.successfulImports}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📍 Snow Man総ロケーション数: ${totalCount}件`);

    const successRate = Math.round((this.stats.successfulImports / this.stats.totalStores) * 100);
    console.log(`🎯 登録成功率: ${successRate}%`);

    console.log('\n🎉 第4弾店舗の詳細情報:');
    BATCH4_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 第4弾特定エピソード種別:');
    console.log('   💆‍♂️ ドライヘッドスパ (頭蓋骨はがし・眠活特化)');
    console.log('   🍖 洋食レストラン (プライベート飯・ハンバーグ専門)');

    console.log('\n📊 全体の特定成果まとめ:');
    console.log('   第1弾: 5件 (蕎麦・寿司・土鍋ご飯・油そば・モスバーガー)');
    console.log('   追加弾: 4件 (クライオサウナ・上海豫園体験店舗群)');
    console.log('   第2弾: 4件 (古着屋・ピザ・おにぎり・脱出ゲーム)');
    console.log('   第3弾: 4件 (桜ドライブ・定食・野球・市場食堂)');
    console.log('   第4弾: 2件 (ヘッドスパ・洋食)');
    console.log(`   📍 総計: ${totalCount}件の高品質ロケーション情報`);

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/snow-man');
    console.log('\n' + '='.repeat(60));
  }

  // Snow Man ID取得
  private async getSnowManId(): Promise<string> {
    const { data } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'snow-man')
      .single();
    return data?.id || '';
  }
}

// メイン処理
async function main() {
  const importer = new SnowManBatch4StoreImporter();
  await importer.importBatch4Stores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}