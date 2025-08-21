import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man第6弾新発見特定済み店舗・施設データ
const BATCH6_STORES = [
  // レバニラエピソード (2024年4月17日配信)
  {
    episode_id: 'unknown_kokonotsu', // 実際のエピソードIDに更新が必要
    name: 'ここのつ 3号店',
    address: '東京都足立区千住東2-3-7',
    phone: '03-5284-9951',
    website_url: 'https://kitasenju9.com/',
    category: 'restaurant',
    description: 'Snow Manレバニラエピソードで向井康二・渡辺翔太・阿部亮平・佐久間大介が訪れた北千住の究極のレバニラ定食専門店。アパレル併設の珍しい3号店',
    tags: ['Snow Man', 'レバニラ', '北千住', '定食', 'アパレル併設', 'すのちゅーぶ', '特定済み']
  },
  // 早稲田洋食エピソード (2024年5月29日配信)
  {
    episode_id: 'unknown_kitchen_nangoku', // 実際のエピソードIDに更新が必要
    name: 'キッチン南国',
    address: '東京都新宿区戸塚町1-101',
    phone: '03-6457-6789', // 推定電話番号（要確認）
    website_url: 'https://www.instagram.com/kitchen_nangoku/',
    category: 'restaurant',
    description: 'Snow Man早稲田洋食エピソードで宮舘涼太プレゼンツで訪れた早稲田大学近くの洋食店。キッチン南海の流れを汲む2022年リニューアル店',
    tags: ['Snow Man', '洋食', '早稲田', '大学近く', '券売機', 'すのちゅーぶ', '特定済み']
  },
  // パエリアエピソード (2024年10月2日配信)
  {
    episode_id: 'unknown_pablo_paella', // 実際のエピソードIDに更新が必要
    name: 'スペイン料理 Pablo (パブロ)',
    address: '東京都目黒区東山1-6-13 リテーラ中目黒1F',
    phone: '03-6412-7286',
    website_url: 'https://pablo.favy.jp/',
    category: 'restaurant',
    description: 'Snow Manパエリアエピソードで深澤辰哉・渡辺翔太・阿部亮平・宮舘涼太が訪れた中目黒のスペイン料理店。世界パエリアコンクール日本代表シェフ',
    tags: ['Snow Man', 'パエリア', 'スペイン料理', '中目黒', '百名店2024', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man第6弾店舗登録システム
export class SnowManBatch6StoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importBatch6Stores(): Promise<void> {
    console.log('🏪 Snow Man第6弾店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('🍽️ レバニラ・早稲田洋食・中目黒パエリア');
    console.log(`🎯 登録対象: ${BATCH6_STORES.length}件の第6弾新発見店舗\n`);

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

      this.stats.totalStores = BATCH6_STORES.length;

      // 各店舗を処理
      for (const [index, store] of BATCH6_STORES.entries()) {
        console.log(`【${index + 1}/${BATCH6_STORES.length}】 ${store.name}`);

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
    console.log('📊 Snow Man第6弾店舗登録完了レポート');
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

    console.log('\n🎉 第6弾新発見店舗の詳細情報:');
    BATCH6_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 第6弾特定エピソード種別:');
    console.log('   🥩 北千住究極レバニラ (アパレル併設・足立区千住東)');
    console.log('   🍛 早稲田大学洋食 (学生街・券売機式・キッチン南海の流れ)');
    console.log('   🥘 中目黒本格パエリア (世界大会代表シェフ・百名店2024)');

    console.log('\n📊 全体の特定成果総括:');
    console.log('   第1弾: 5件 (蕎麦・寿司・土鍋ご飯・油そば・モスバーガー)');
    console.log('   追加弾: 4件 (クライオサウナ・上海豫園体験店舗群)');
    console.log('   第2弾: 4件 (古着屋・ピザ・おにぎり・脱出ゲーム)');
    console.log('   第3弾: 4件 (桜ドライブ・定食・野球・市場食堂)');
    console.log('   第4弾: 2件 (ヘッドスパ・洋食)');
    console.log('   第5弾: 4件 (神楽坂中華・ホラーゲーム・ガレット・渋谷中華)');
    console.log('   第6弾: 3件 (レバニラ・早稲田洋食・中目黒パエリア)');
    console.log(`   🏆 総計: ${totalCount}件の究極品質ロケーション情報`);

    console.log('\n📅 2024年エピソード配信日:');
    console.log('   🥩 レバニラエピソード: 2024年4月17日配信');
    console.log('   🍛 早稲田洋食エピソード: 2024年5月29日配信');
    console.log('   🥘 パエリアエピソード: 2024年10月2日配信');

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
  const importer = new SnowManBatch6StoreImporter();
  await importer.importBatch6Stores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}