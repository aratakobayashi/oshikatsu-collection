import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man第5弾特定済み店舗・施設データ
const BATCH5_STORES = [
  // 街中華の名店エピソード
  {
    episode_id: 'unknown_ryuuhou', // 実際のエピソードIDに更新が必要
    name: '龍朋 (りゅうほう)',
    address: '東京都新宿区矢来町123 第一矢来ビル B1',
    phone: '03-3267-6917',
    website_url: 'https://tabelog.com/tokyo/A1309/A130905/13006446/',
    category: 'restaurant',
    description: 'Snow Man街中華エピソードで訪れた神楽坂の老舗中華料理店。1978年創業、日に300食売れるチャーハンが名物。中国料理TOKYO百名店2024選出',
    tags: ['Snow Man', '中華料理', '神楽坂', 'チャーハン', '老舗', '百名店', 'すのちゅーぶ', '特定済み']
  },
  // 謎解きゲームエピソード
  {
    episode_id: 'unknown_kurayami', // 実際のエピソードIDに更新が必要
    name: 'くらやみ遊園地 新宿南口ゲームワールド店',
    address: '東京都新宿区新宿3-35-8 タイトーステーション 新宿南口ゲームワールド店 B2',
    phone: '03-3226-0395',
    website_url: 'https://www.taito.co.jp/kurayami/shinjuku',
    category: 'entertainment',
    description: 'Snow Man謎解きゲーム挑戦エピソードで訪れたホラーアトラクション施設。2023年3月オープンの新宿駅直結地下施設',
    tags: ['Snow Man', '謎解き', 'ホラー', '新宿', 'タイトー', 'ゲーム', 'すのちゅーぶ', '特定済み']
  },
  // ガレットエピソード
  {
    episode_id: 'unknown_galette', // 実際のエピソードIDに更新が必要
    name: 'ブレッツカフェ クレープリー 表参道店',
    address: '東京都渋谷区神宮前3-5-4',
    phone: '03-3478-7855',
    website_url: 'https://www.breizh-cafe.com/',
    category: 'restaurant',
    description: 'Snow Manガレット体験エピソードで訪れた表参道のフレンチブルトン風クレープリー。本格そば粉ガレットとシードルが自慢',
    tags: ['Snow Man', 'ガレット', '表参道', 'フランス料理', 'クレープ', 'すのちゅーぶ', '特定済み']
  },
  // 渋谷中華エピソード
  {
    episode_id: 'unknown_panda', // 実際のエピソードIDに更新が必要
    name: 'パンダレストラン',
    address: '東京都渋谷区道玄坂2-6-16 井門ビル B1F',
    phone: '03-3462-1140',
    website_url: 'https://pandarestaurant.gorp.jp/',
    category: 'restaurant',
    description: 'Snow Man渋谷中華エピソードで訪れた新感覚中華レストラン。広東料理専門店で渋谷駅から徒歩3分の地下施設',
    tags: ['Snow Man', '中華料理', '渋谷', '広東料理', '新感覚', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man第5弾店舗登録システム
export class SnowManBatch5StoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importBatch5Stores(): Promise<void> {
    console.log('🏪 Snow Man第5弾店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('🏮 中華料理・ホラーゲーム・ガレット・渋谷中華');
    console.log(`🎯 登録対象: ${BATCH5_STORES.length}件の第5弾特定店舗\n`);

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

      this.stats.totalStores = BATCH5_STORES.length;

      // 各店舗を処理
      for (const [index, store] of BATCH5_STORES.entries()) {
        console.log(`【${index + 1}/${BATCH5_STORES.length}】 ${store.name}`);

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
    console.log('📊 Snow Man第5弾店舗登録完了レポート');
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

    console.log('\n🎉 第5弾店舗の詳細情報:');
    BATCH5_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 第5弾特定エピソード種別:');
    console.log('   🏮 神楽坂老舗中華 (チャーハン日300食・百名店)');
    console.log('   👻 新宿ホラーゲーム (謎解きアトラクション・地下施設)');
    console.log('   🥞 表参道ガレット (フレンチブルトン風・そば粉クレープ)');
    console.log('   🐼 渋谷新感覚中華 (広東料理・駅直結地下)');

    console.log('\n📊 全体の特定成果総括:');
    console.log('   第1弾: 5件 (蕎麦・寿司・土鍋ご飯・油そば・モスバーガー)');
    console.log('   追加弾: 4件 (クライオサウナ・上海豫園体験店舗群)');
    console.log('   第2弾: 4件 (古着屋・ピザ・おにぎり・脱出ゲーム)');
    console.log('   第3弾: 4件 (桜ドライブ・定食・野球・市場食堂)');
    console.log('   第4弾: 2件 (ヘッドスパ・洋食)');
    console.log('   第5弾: 4件 (神楽坂中華・ホラーゲーム・ガレット・渋谷中華)');
    console.log(`   🏆 総計: ${totalCount}件の超高品質ロケーション情報`);

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
  const importer = new SnowManBatch5StoreImporter();
  await importer.importBatch5Stores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}