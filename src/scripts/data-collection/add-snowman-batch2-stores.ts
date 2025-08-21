import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man第2弾特定済み店舗・施設データ
const BATCH2_STORES = [
  // 古着屋エピソード (ZcWG2Ra3RcI)
  {
    episode_id: 'ZcWG2Ra3RcI',
    name: '古着屋 BARO (ベロ)',
    address: '東京都豊島区西池袋2-1-13',
    phone: '03-5396-1581',
    website_url: 'https://baro.base.shop/',
    category: 'shop',
    description: 'Snow Man初の買い物動画で訪れた目白の古着屋。29年目を迎える老舗で、アメリカ物を中心とした厳選古着が自慢。あいことばMVロケ地でもある',
    tags: ['Snow Man', '古着屋', '目白', '買い物', 'プレゼント交換', 'あいことばMV', 'すのちゅーぶ', '特定済み']
  },
  // ピザエピソード (lUqVlNiYYM8)
  {
    episode_id: 'lUqVlNiYYM8',
    name: 'ナプレ南青山本店',
    address: '東京都港区南青山5-6-24 林ビル',
    phone: '03-3797-3790',
    website_url: 'https://napule-pizza.com/aoyama/',
    category: 'restaurant',
    description: 'Snow Manピザエピソードで訪れた表参道のナポリピザ専門店。本格ナポリピザが味わえるトラットリア',
    tags: ['Snow Man', 'ピザ', 'イタリアン', '南青山', '表参道', 'すのちゅーぶ', '特定済み']
  },
  // おにぎりエピソード (dntWAMxhiwA)
  {
    episode_id: 'dntWAMxhiwA',
    name: 'おにぎり浅草宿六',
    address: '東京都台東区浅草3-9-10',
    phone: '03-3874-1615',
    website_url: 'http://onigiriyadoroku.com/',
    category: 'restaurant',
    description: 'Snow Manおにぎりエピソードで訪れた1954年創業の東京最古のおにぎり専門店。ミシュランガイド掲載店',
    tags: ['Snow Man', 'おにぎり', '浅草', '老舗', 'ミシュラン', '専門店', 'すのちゅーぶ', '特定済み']
  },
  // 脱出ゲームエピソード (di1PZDjtQKQ)
  {
    episode_id: 'di1PZDjtQKQ',
    name: '東京ミステリーサーカス',
    address: '東京都新宿区歌舞伎町1-27-5 APMビル',
    phone: '03-6273-8641',
    website_url: 'https://mysterycircus.jp/',
    category: 'entertainment',
    description: 'Snow Man脱出ゲーム挑戦エピソードで訪れた世界初の謎のテーマパーク。様々なリアル脱出ゲームが楽しめる',
    tags: ['Snow Man', '脱出ゲーム', '謎解き', '新宿', '歌舞伎町', 'エンターテイメント', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man第2弾店舗登録システム
export class SnowManBatch2StoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importBatch2Stores(): Promise<void> {
    console.log('🏪 Snow Man第2弾店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('🛍️ 古着屋・ピザ店・おにぎり店・脱出ゲーム施設');
    console.log(`🎯 登録対象: ${BATCH2_STORES.length}件の第2弾特定店舗\n`);

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

      this.stats.totalStores = BATCH2_STORES.length;

      // 各店舗を処理
      for (const [index, store] of BATCH2_STORES.entries()) {
        console.log(`【${index + 1}/${BATCH2_STORES.length}】 ${store.name}`);

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
    console.log('📊 Snow Man第2弾店舗登録完了レポート');
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

    console.log('\n🎉 第2弾店舗の詳細情報:');
    BATCH2_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.category})`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

    console.log('\n🌟 第2弾特定エピソード種別:');
    console.log('   👕 古着屋ショッピング (29年老舗・あいことばMVロケ地)');
    console.log('   🍕 本格イタリアンピザ (表参道ナポリピザ)');
    console.log('   🍙 老舗おにぎり専門店 (1954年創業・ミシュラン掲載)');
    console.log('   🔍 謎解き脱出ゲーム (世界初謎テーマパーク)');

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
  const importer = new SnowManBatch2StoreImporter();
  await importer.importBatch2Stores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}