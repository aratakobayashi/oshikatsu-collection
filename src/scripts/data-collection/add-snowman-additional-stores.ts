import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 新規特定済みSnow Man店舗・施設データ
const ADDITIONAL_STORES = [
  // 冷却サウナエピソード (Phy4Y2IirX0 & 4BZAvPJT63g)
  {
    episode_id: 'Phy4Y2IirX0',
    name: 'クライオサウナ六本木',
    address: '東京都港区六本木3-13-8 斉藤ビル5F',
    phone: '03-5775-4555',
    website_url: 'https://cryosauna.jp/showroom',
    category: 'health',
    description: 'Snow Man冷却サウナ体験エピソードで訪れた-190℃クライオセラピー施設。完全予約制のプライベート空間',
    tags: ['Snow Man', 'クライオサウナ', '六本木', '冷却サウナ', '-190℃', 'すのちゅーぶ', '特定済み']
  },
  // 上海エピソード - 豫園商城の体験店舗群
  {
    episode_id: 'aN5sgWwr0mg',
    name: '麗雲閣 豫園店',
    address: '中国上海市黄浦区豫園商城内',
    phone: '+86-21-6355-9999', // 一般的な豫園商城代表番号
    website_url: 'https://www.google.com/maps/search/麗雲閣+豫園商城',
    category: 'shop',
    description: 'Snow Man上海エピソードで扇子作り体験をした1888年創業の老舗扇子店。手描き絹扇が名物',
    tags: ['Snow Man', '上海', '豫園', '扇子', '体験', 'すのちゅーぶ', '特定済み']
  },
  {
    episode_id: 'aN5sgWwr0mg', 
    name: '账房 豫園店',
    address: '中国上海市黄浦区豫園商城内',
    phone: '+86-21-6355-9999',
    website_url: 'https://www.google.com/maps/search/账房+豫園商城',
    category: 'shop',
    description: 'Snow Man上海エピソードで香嚢作り体験をした伝統工芸品店。元は会計事務所だった歴史ある建物',
    tags: ['Snow Man', '上海', '豫園', '香嚢', '体験', 'すのちゅーぶ', '特定済み']
  },
  {
    episode_id: 'aN5sgWwr0mg',
    name: '豫園商城小籠包体験店',
    address: '中国上海市黄浦区豫園商城内（GODIVA横）', 
    phone: '+86-21-6355-9999',
    website_url: 'https://www.google.com/maps/search/豫園商城+小籠包',
    category: 'restaurant',
    description: 'Snow Man上海エピソードで小籠包作り体験をした豫園商城内の店舗。GODIVAの横に位置',
    tags: ['Snow Man', '上海', '豫園', '小籠包', '体験', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man追加店舗登録システム
export class SnowManAdditionalStoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importAdditionalStores(): Promise<void> {
    console.log('🏪 Snow Man追加店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('🌟 冷却サウナ施設 + 上海体験店舗群');
    console.log(`🎯 登録対象: ${ADDITIONAL_STORES.length}件の新規特定店舗\n`);

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

      this.stats.totalStores = ADDITIONAL_STORES.length;

      // 各店舗を処理
      for (const [index, store] of ADDITIONAL_STORES.entries()) {
        console.log(`【${index + 1}/${ADDITIONAL_STORES.length}】 ${store.name}`);

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
    console.log('📊 Snow Man追加店舗登録完了レポート');
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

    console.log('\n🎉 新規追加店舗の詳細情報:');
    ADDITIONAL_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 特定済みエピソード種別:');
    console.log('   ❄️ 冷却サウナ体験 (-190℃クライオセラピー)');
    console.log('   🇨🇳 上海豫園文化体験 (扇子・香嚢・小籠包作り)');

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
  const importer = new SnowManAdditionalStoreImporter();
  await importer.importAdditionalStores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}