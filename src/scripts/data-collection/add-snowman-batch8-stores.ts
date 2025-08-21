import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man第8弾新発見特定済み店舗・施設データ
const BATCH8_STORES = [
  // 土鍋ご飯エピソード (2025年6月12日配信)
  {
    episode_id: 'unknown_ikushika_nakameguro', // 実際のエピソードIDに更新が必要
    name: '土鍋ご飯 いくしか 中目黒店',
    address: '東京都目黒区中目黒1-4-6-1F',
    phone: '03-6303-1944',
    website_url: 'https://ikushika.com/',
    category: 'restaurant',
    description: 'Snow Man土鍋ご飯エピソードで岩本照・深澤辰哉・向井康二・阿部亮平が訪れた中目黒の定食屋。土鍋炊きご飯おかわり自由の人気店',
    tags: ['Snow Man', '土鍋ご飯', '中目黒', '定食', 'おかわり自由', 'すのちゅーぶ', '特定済み']
  },
  // FlyStation室内スカイダイビングエピソード (2024年5月1日配信)
  {
    episode_id: 'unknown_flystation_koshigaya', // 実際のエピソードIDに更新が必要
    name: 'FlyStation Japan (フライステーション)',
    address: '埼玉県越谷市レイクタウン6-19-3',
    phone: '048-940-5010',
    website_url: 'https://flystation.jp/',
    category: 'entertainment',
    description: 'Snow Man疑似スカイダイビングエピソードで佐久間大介プレゼンツで訪れた日本で唯一のインドア・スカイダイビング施設',
    tags: ['Snow Man', 'スカイダイビング', '越谷', 'レイクタウン', '体験', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man第8弾店舗登録システム
export class SnowManBatch8StoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importBatch8Stores(): Promise<void> {
    console.log('🏪 Snow Man第8弾店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('🍚 中目黒土鍋ご飯・越谷室内スカイダイビング');
    console.log(`🎯 登録対象: ${BATCH8_STORES.length}件の第8弾新発見店舗\n`);

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

      this.stats.totalStores = BATCH8_STORES.length;

      // 各店舗を処理
      for (const [index, store] of BATCH8_STORES.entries()) {
        console.log(`【${index + 1}/${BATCH8_STORES.length}】 ${store.name}`);

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
    console.log('📊 Snow Man第8弾店舗登録完了レポート');
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

    console.log('\n🎉 第8弾新発見店舗の詳細情報:');
    BATCH8_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 第8弾特定エピソード種別:');
    console.log('   🍚 中目黒土鍋定食屋 (おかわり自由・向井プレゼンツ)');
    console.log('   🪂 越谷室内スカイダイビング (日本で唯一・佐久間プレゼンツ)');

    console.log('\n📊 全体の特定成果総括:');
    console.log('   第1弾: 5件 (蕎麦・寿司・土鍋ご飯・油そば・モスバーガー)');
    console.log('   追加弾: 4件 (クライオサウナ・上海豫園体験店舗群)');
    console.log('   第2弾: 4件 (古着屋・ピザ・おにぎり・脱出ゲーム)');
    console.log('   第3弾: 4件 (桜ドライブ・定食・野球・市場食堂)');
    console.log('   第4弾: 2件 (ヘッドスパ・洋食)');
    console.log('   第5弾: 4件 (神楽坂中華・ホラーゲーム・ガレット・渋谷中華)');
    console.log('   第6弾: 3件 (レバニラ・早稲田洋食・中目黒パエリア)');
    console.log('   第7弾: 3件 (銀座寿司・早稲田油そば・三軒茶屋バル)');
    console.log('   第8弾: 2件 (中目黒土鍋・越谷スカイダイビング)');
    console.log(`   🏆 総計: ${totalCount}件の超高品質ロケーション情報`);

    console.log('\n📅 2024-2025年エピソード配信日:');
    console.log('   🪂 スカイダイビングエピソード: 2024年5月1日配信');
    console.log('   🍚 土鍋ご飯エピソード: 2025年6月12日配信');

    console.log('\n🎯 新ジャンル開拓の成果:');
    console.log('   🏃‍♂️ アクティビティ体験施設');
    console.log('   🍚 専門定食屋（土鍋ご飯）');
    console.log('   🌍 関東エリア拡大（埼玉県越谷市）');

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
  const importer = new SnowManBatch8StoreImporter();
  await importer.importBatch8Stores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}