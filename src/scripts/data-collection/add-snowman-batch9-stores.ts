import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man第9弾新発見特定済み店舗・施設データ
const BATCH9_STORES = [
  // 水族館癒しエピソード (2024年11月13日配信)
  {
    episode_id: 'unknown_shinagawa_aquarium', // 実際のエピソードIDに更新が必要
    name: 'しながわ水族館',
    address: '東京都品川区勝島3-2-1 しながわ区民公園内',
    phone: '03-3762-3433',
    website_url: 'https://www.aquarium.gr.jp/',
    category: 'entertainment',
    description: 'Snow Man水族館で癒しエピソードで佐久間大介プレゼンツで岩本照・ラウール・宮舘涼太・佐久間大介が訪れた品川区民公園内の水族館',
    tags: ['Snow Man', '水族館', '品川', '癒し', 'ペンギン', 'イルカ', 'すのちゅーぶ', '特定済み']
  },
  // 渋谷ゲームセンタークレーンゲームエピソード
  {
    episode_id: 'unknown_adores_shibuya', // 実際のエピソードIDに更新が必要
    name: 'アドアーズ渋谷店',
    address: '東京都渋谷区宇田川町13-11 KN渋谷1ビル 1-4F',
    phone: '03-3496-5856',
    website_url: 'https://www.adores.jp/tenpo/shibuya.html',
    category: 'entertainment',
    description: 'Snow Manクレーンゲームエピソードで深澤辰哉が達人技を披露した渋谷最大級のプライズフロアを誇るゲームセンター',
    tags: ['Snow Man', 'クレーンゲーム', '渋谷', 'ゲームセンター', 'プリクラ', 'すのちゅーぶ', '特定済み']
  },
  // 新宿脱出ゲームエピソード (2024年5月24日配信)
  {
    episode_id: 'unknown_noescape_shinjuku', // 実際のエピソードIDに更新が必要
    name: 'NoEscape 新宿店',
    address: '東京都渋谷区代々木3-46-16 小野木ビル5F',
    phone: '03-6276-7561',
    website_url: 'https://noescape.co.jp/shinjuku/',
    category: 'entertainment',
    description: 'Snow Manリアル脱出！謎解きゲームエピソードで挑戦したリアル体験脱出ゲーム専門店。代々木駅徒歩7分の5階建てビル',
    tags: ['Snow Man', '脱出ゲーム', '新宿', '代々木', '謎解き', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man第9弾店舗登録システム
export class SnowManBatch9StoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importBatch9Stores(): Promise<void> {
    console.log('🏪 Snow Man第9弾店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('🐧 品川水族館・渋谷ゲーセン・新宿脱出ゲーム');
    console.log(`🎯 登録対象: ${BATCH9_STORES.length}件の第9弾新発見店舗\n`);

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

      this.stats.totalStores = BATCH9_STORES.length;

      // 各店舗を処理
      for (const [index, store] of BATCH9_STORES.entries()) {
        console.log(`【${index + 1}/${BATCH9_STORES.length}】 ${store.name}`);

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
    console.log('📊 Snow Man第9弾店舗登録完了レポート');
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

    console.log('\n🎉 第9弾新発見店舗の詳細情報:');
    BATCH9_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 第9弾特定エピソード種別:');
    console.log('   🐧 品川区民公園水族館 (ペンギン・イルカ・癒し・佐久間プレゼンツ)');
    console.log('   🎮 渋谷最大級ゲームセンター (クレーンゲーム達人・深澤辰哉)');
    console.log('   🔍 代々木リアル脱出ゲーム (謎解きゲーム・5階建てビル)');

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
    console.log('   第9弾: 3件 (品川水族館・渋谷ゲーセン・新宿脱出ゲーム)');
    console.log(`   🏆 総計: ${totalCount}件の究極品質ロケーション情報`);

    console.log('\n📅 2024年エピソード配信日:');
    console.log('   🔍 脱出ゲームエピソード: 2024年5月24日配信');
    console.log('   🐧 水族館エピソード: 2024年11月13日配信');

    console.log('\n🎯 エンターテイメント施設拡充の成果:');
    console.log('   🌊 水族館・アクアリウム施設');
    console.log('   🎮 ゲームセンター・アーケード施設');
    console.log('   🧩 体験型エンターテイメント施設');
    console.log('   🗾 関東全域（品川・渋谷・新宿・代々木）');

    console.log('\n🌟 50件達成間近:');
    console.log(`   現在: ${totalCount}件`);
    console.log(`   目標まで: ${50 - totalCount}件`);

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
  const importer = new SnowManBatch9StoreImporter();
  await importer.importBatch9Stores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}