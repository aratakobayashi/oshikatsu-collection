import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man第3弾特定済み店舗・施設データ
const BATCH3_STORES = [
  // 桜ドライブエピソード (xgZ4Uu9DitY)
  {
    episode_id: 'xgZ4Uu9DitY',
    name: 'セブンイレブン芝大門店',
    address: '東京都港区芝大門1-12-16',
    phone: '03-3435-2711',
    website_url: 'https://www.sej.co.jp/',
    category: 'shop',
    description: 'Snow Man桜ドライブエピソードで立ち寄ったコンビニエンスストア。桜を求めるドライブの途中で休憩',
    tags: ['Snow Man', 'コンビニ', '芝大門', '桜', 'ドライブ', 'すのちゅーぶ', '特定済み']
  },
  // 定食屋エピソード (qSQOsjs5ve8)
  {
    episode_id: 'qSQOsjs5ve8',
    name: 'わが家の食堂 葛西店',
    address: '東京都江戸川区中葛西8-23-5 第2宇田川ビル1F',
    phone: '03-6661-4455',
    website_url: 'https://wagayanosyokudou.com/',
    category: 'restaurant',
    description: 'Snow Man定食エピソードで訪れた24時間営業のセルフサービス定食チェーン。豚汁のうまい店として有名',
    tags: ['Snow Man', '定食', '葛西', '24時間営業', 'セルフサービス', 'すのちゅーぶ', '特定済み']
  },
  // 野球エピソード (aOQIs7lM338)
  {
    episode_id: 'aOQIs7lM338',
    name: 'アクティブ AKIBA バッティングセンター',
    address: '東京都千代田区神田花岡町1-1 ヨドバシAKIBA 9F',
    phone: '03-5209-1055',
    website_url: 'https://akiba.golf-active.jp/batting/',
    category: 'entertainment',
    description: 'Snow Man野球エピソードで訪れた秋葉原駅直結のバッティングセンター。屋外ゴルフ練習場に隣接',
    tags: ['Snow Man', 'バッティングセンター', '秋葉原', '野球', '駅直結', 'すのちゅーぶ', '特定済み']
  },
  // 市場食堂エピソード (1cQeue2ITFU) 
  {
    episode_id: '1cQeue2ITFU',
    name: '伊勢屋食堂',
    address: '東京都新宿区大久保1-12-1 第2韓国広場市場内',
    phone: '03-3232-6668',
    website_url: 'https://www.google.com/maps/search/伊勢屋食堂+大久保',
    category: 'restaurant',
    description: 'Snow Man市場食堂エピソードで訪れた新宿大久保の韓国広場市場内にある老舗定食屋。昭和レトロな雰囲気',
    tags: ['Snow Man', '市場食堂', '大久保', '韓国広場', '定食', '昭和レトロ', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man第3弾店舗登録システム
export class SnowManBatch3StoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importBatch3Stores(): Promise<void> {
    console.log('🏪 Snow Man第3弾店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('🌸 桜ドライブ・定食・野球・市場食堂');
    console.log(`🎯 登録対象: ${BATCH3_STORES.length}件の第3弾特定店舗\n`);

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

      this.stats.totalStores = BATCH3_STORES.length;

      // 各店舗を処理
      for (const [index, store] of BATCH3_STORES.entries()) {
        console.log(`【${index + 1}/${BATCH3_STORES.length}】 ${store.name}`);

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
    console.log('📊 Snow Man第3弾店舗登録完了レポート');
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

    console.log('\n🎉 第3弾店舗の詳細情報:');
    BATCH3_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 第3弾特定エピソード種別:');
    console.log('   🌸 桜ドライブ (コンビニ立ち寄り・六本木桜坂)');
    console.log('   🍽️ 24時間定食屋 (セルフサービス・葛西店)');
    console.log('   ⚾ バッティングセンター (秋葉原駅直結・9階)');
    console.log('   🏪 市場内食堂 (韓国広場・昭和レトロ)');

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
  const importer = new SnowManBatch3StoreImporter();
  await importer.importBatch3Stores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}