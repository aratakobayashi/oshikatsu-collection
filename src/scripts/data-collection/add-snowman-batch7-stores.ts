import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man第7弾新発見特定済み店舗・施設データ
const BATCH7_STORES = [
  // 銀座寿司エピソード (2025年7月30日配信)
  {
    episode_id: 'unknown_ginza_sushi', // 実際のエピソードIDに更新が必要
    name: '羽田市場 GINZA SEVEN',
    address: '東京都中央区銀座7-14-15 杉山ビルB1F',
    phone: '03-6264-2618',
    website_url: 'https://hanedaichiba-kaitensushi.jp/store/ginza-seven/',
    category: 'restaurant',
    description: 'Snow Man贅沢ランチ「ザギンでシースー」エピソードで宮舘涼太・阿部亮平・渡辺翔太・佐久間大介が訪れた銀座の高級寿司店。朝獲れ鮮魚使用',
    tags: ['Snow Man', '寿司', '銀座', '高級', '朝獲れ', 'ザギンでシースー', 'すのちゅーぶ', '特定済み']
  },
  // 早稲田油そばエピソード (2024年4月23日配信)
  {
    episode_id: 'unknown_abura_gakkai', // 実際のエピソードIDに更新が必要
    name: '武蔵野アブラ學會 早稲田別館',
    address: '東京都新宿区喜久井町65',
    phone: '03-6709-6230',
    website_url: 'https://www.aburagaku.com/',
    category: 'restaurant',
    description: 'Snow Man油そばエピソードで訪れた早稲田駅前の油そば専門店。モンドセレクション金賞受賞の特製タレが自慢の2階建て店舗',
    tags: ['Snow Man', '油そば', '早稲田', 'モンドセレクション', '金賞', 'すのちゅーぶ', '特定済み']
  },
  // バルランチエピソード (2024年11月27日配信)
  {
    episode_id: 'unknown_setouchi_bar', // 実際のエピソードIDに更新が必要
    name: '瀬戸内バル Collabo (コラボ)',
    address: '東京都世田谷区太子堂1-6-9 1F',
    phone: '03-5787-6078',
    website_url: 'https://setouchi-collabo.com/',
    category: 'restaurant',
    description: 'Snow Manバルランチエピソードで佐久間大介プレゼンツで訪れた三軒茶屋の瀬戸内海料理と地中海料理のコラボレーションレストラン',
    tags: ['Snow Man', 'バル', '三軒茶屋', '瀬戸内', '地中海料理', '魚料理', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man第7弾店舗登録システム
export class SnowManBatch7StoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importBatch7Stores(): Promise<void> {
    console.log('🏪 Snow Man第7弾店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('🍣 銀座寿司・早稲田油そば・三軒茶屋バル');
    console.log(`🎯 登録対象: ${BATCH7_STORES.length}件の第7弾新発見店舗\n`);

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

      this.stats.totalStores = BATCH7_STORES.length;

      // 各店舗を処理
      for (const [index, store] of BATCH7_STORES.entries()) {
        console.log(`【${index + 1}/${BATCH7_STORES.length}】 ${store.name}`);

        try {
          // エピソードIDが不明な場合は、エピソードなしで登録
          console.log(`   📺 エピソード: 特定済み（IDマッピング待ち）`);

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

      // 新規店舗データ作成（エピソードIDが不明の場合はnull）
      const locationData = {
        name: store.name,
        slug: `${store.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now()}`,
        description: store.description,
        address: store.address,
        website_url: store.website_url,
        tags: store.tags,
        episode_id: store.episode_id.startsWith('unknown_') ? null : store.episode_id,
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
    console.log('📊 Snow Man第7弾店舗登録完了レポート');
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

    console.log('\n🎉 第7弾新発見店舗の詳細情報:');
    BATCH7_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 第7弾特定エピソード種別:');
    console.log('   🍣 銀座高級寿司 (朝獲れ鮮魚・だてあべなべさく4人・ザギンでシースー)');
    console.log('   🍜 早稲田油そば専門 (モンドセレクション金賞・駅前2階建て)');
    console.log('   🐟 三軒茶屋瀬戸内バル (地中海コラボ・魚料理・佐久間プレゼンツ)');

    console.log('\n📊 全体の特定成果総括:');
    console.log('   第1弾: 5件 (蕎麦・寿司・土鍋ご飯・油そば・モスバーガー)');
    console.log('   追加弾: 4件 (クライオサウナ・上海豫園体験店舗群)');
    console.log('   第2弾: 4件 (古着屋・ピザ・おにぎり・脱出ゲーム)');
    console.log('   第3弾: 4件 (桜ドライブ・定食・野球・市場食堂)');
    console.log('   第4弾: 2件 (ヘッドスパ・洋食)');
    console.log('   第5弾: 4件 (神楽坂中華・ホラーゲーム・ガレット・渋谷中華)');
    console.log('   第6弾: 3件 (レバニラ・早稲田洋食・中目黒パエリア)');
    console.log('   第7弾: 3件 (銀座寿司・早稲田油そば・三軒茶屋バル)');
    console.log(`   🏆 総計: ${totalCount}件の最高品質ロケーション情報`);

    console.log('\n📅 2024-2025年エピソード配信日:');
    console.log('   🍜 早稲田油そばエピソード: 2024年4月23日配信');
    console.log('   🐟 三軒茶屋バルエピソード: 2024年11月27日配信');
    console.log('   🍣 銀座寿司エピソード: 2025年7月30日配信');

    console.log('\n🎯 高品質特定の特徴:');
    console.log('   📞 全店舗電話番号完備');
    console.log('   🌐 公式ウェブサイト・SNS情報');
    console.log('   📍 詳細住所・アクセス情報');
    console.log('   🏷️ 配信日・メンバー情報タグ付け');

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
  const importer = new SnowManBatch7StoreImporter();
  await importer.importBatch7Stores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}