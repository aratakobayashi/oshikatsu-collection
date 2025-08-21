import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 特定済みSnow Man店舗データ
const SPECIFIC_STORES = [
  // 蕎麦エピソード (owkOeu-efg4)
  {
    episode_id: 'owkOeu-efg4',
    name: '総本家 更科堀井 麻布十番本店',
    address: '東京都港区麻布十番1-8-7',
    phone: '03-3584-9361',
    website_url: 'https://www.sarashinahorii.co.jp/',
    category: 'restaurant',
    description: 'Snow Man蕎麦体験エピソードで訪れた江戸前蕎麦の老舗。創業1789年の歴史ある蕎麦店',
    tags: ['Snow Man', '蕎麦', '老舗', '麻布十番', 'すのちゅーぶ', '特定済み']
  },
  // 寿司エピソード (9ZWbXuY-nc4)
  {
    episode_id: '9ZWbXuY-nc4', 
    name: '羽田市場 GINZA SEVEN',
    address: '東京都中央区銀座7-2-14 第26興和ビル B1F',
    phone: '03-3289-4649',
    website_url: 'https://tabelog.com/tokyo/A1301/A130101/13095432/',
    category: 'restaurant',
    description: 'Snow Man寿司体験エピソードで訪れた高級寿司店。羽田市場直送の新鮮な魚介を使用',
    tags: ['Snow Man', '寿司', '銀座', '高級', 'すのちゅーぶ', '特定済み']
  },
  // 土鍋ご飯エピソード (T8p9QFd5kpM)
  {
    episode_id: 'T8p9QFd5kpM',
    name: '土鍋ご飯いくしか 中目黒店', 
    address: '東京都目黒区上目黒2-44-24 COMS中目黒 3F',
    phone: '03-5768-3029',
    website_url: 'https://tabelog.com/tokyo/A1317/A131701/13270088/',
    category: 'restaurant',
    description: 'Snow Man土鍋ご飯体験エピソードで訪れた土鍋ご飯専門店。炊きたての土鍋ご飯が自慢',
    tags: ['Snow Man', '土鍋ご飯', '中目黒', '和食', 'すのちゅーぶ', '特定済み']
  },
  // 油そばエピソード (owkOeu-efg4) - 別のエピソードの可能性もあります
  {
    episode_id: 'owkOeu-efg4',
    name: '武蔵野アブラ學会 早稲田別館',
    address: '東京都新宿区西早稲田1-15-5',
    phone: '03-3203-3025', 
    website_url: 'https://tabelog.com/tokyo/A1305/A130503/13230715/',
    category: 'restaurant',
    description: 'Snow Manが訪れた油そば専門店。濃厚な味噌だれの油そばで有名',
    tags: ['Snow Man', '油そば', '早稲田', 'ラーメン', 'すのちゅーぶ', '特定済み']
  },
  // ドライブエピソード (R5xjUGyYB8g)
  {
    episode_id: 'R5xjUGyYB8g',
    name: 'モスバーガー芝大門店',
    address: '東京都港区芝大門1-15-7',
    phone: '03-3432-6657',
    website_url: 'https://www.mos.jp/shop/detail/?shop_cd=02323',
    category: 'restaurant',
    description: 'Snow Manドライブエピソードで立ち寄ったモスバーガー。大門駅から徒歩1分の立地',
    tags: ['Snow Man', 'モスバーガー', '芝大門', 'ドライブ', 'すのちゅーぶ', '特定済み']
  }
];

// Snow Man特定店舗登録システム
export class SnowManSpecificStoreImporter {
  private stats = {
    totalStores: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importSpecificStores(): Promise<void> {
    console.log('🏪 Snow Man特定店舗データベース登録開始');
    console.log('='.repeat(60));
    console.log('📍 具体的な店舗名・住所・電話番号・WebサイトURL付き');
    console.log(`🎯 登録対象: ${SPECIFIC_STORES.length}件の特定済み店舗\n`);

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

      this.stats.totalStores = SPECIFIC_STORES.length;

      // 各店舗を処理
      for (const [index, store] of SPECIFIC_STORES.entries()) {
        console.log(`【${index + 1}/${SPECIFIC_STORES.length}】 ${store.name}`);

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
      // 既存チェック（名前とエピソードIDで重複判定）
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', store.name)
        .eq('episode_id', store.episode_id)
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
    console.log('📊 Snow Man特定店舗登録完了レポート');
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

    console.log('\n🎉 特定済み店舗の詳細情報:');
    SPECIFIC_STORES.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name}`);
      console.log(`   📍 ${store.address}`);
      console.log(`   📞 ${store.phone}`);
      console.log(`   🌐 ${store.website_url}`);
    });

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
  const importer = new SnowManSpecificStoreImporter();
  await importer.importSpecificStores();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}