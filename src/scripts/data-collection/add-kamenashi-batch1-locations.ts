import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// UUID生成関数
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 亀梨和也ロケーションデータ（バッチ1：10箇所）
const KAMENASHI_BATCH1_LOCATIONS = [
  {
    name: 'SHISEIDO THE STORE',
    description: '資生堂銀座本店の美容複合施設。コスメティックス、ヘア＆メーキャップ、フォトスタジオなどを備えた資生堂の旗艦店。',
    address: '東京都中央区銀座8-8-3',
    phone: '03-3573-4801',
    category: 'beauty_store',
    website: 'https://thestore.shiseido.co.jp/',
    latitude: 35.6689,
    longitude: 139.7632,
    episode_ids: ['1Tyk01eTqCY']
  },
  {
    name: 'もんじゃ かっぱ祭り',
    description: '東京・浅草にある老舗もんじゃ焼き店。江戸っ子亀梨の大好物として紹介された名店。',
    address: '東京都台東区西浅草1-3-14',
    phone: '03-5806-8839',
    category: 'restaurant',
    website: null,
    latitude: 35.7135,
    longitude: 139.7917,
    episode_ids: ['rRtQ8rhdXno']
  },
  {
    name: 'くら寿司 大阪・関西万博店',
    description: '2025年大阪・関西万博会場にオープンしたくら寿司史上最大規模の店舗。135メートルのレーンと338席を誇る世界最大のくら寿司。',
    address: '大阪府大阪市此花区夢洲2丁目1-1 大阪・関西万博会場内',
    phone: null,
    category: 'restaurant',
    website: 'https://www.kurasushi.co.jp/2025expo/store/',
    latitude: 34.6554,
    longitude: 135.4267,
    episode_ids: ['TwwdTyfl9FQ']
  },
  {
    name: '一蘭ラーメン',
    description: 'Snow Man宮館涼太（ダテっちょ）と数年ぶりに訪問した一蘭ラーメン店。味集中カウンターでのこだわりトッピング体験。',
    address: null, // 店舗特定要調査
    phone: null,
    category: 'restaurant',
    website: 'https://ichiran.co.jp/',
    latitude: null,
    longitude: null,
    episode_ids: ['hLEUaWy6_kU']
  },
  {
    name: 'パテック フィリップ ジュネーブサロン',
    description: 'スイス・ジュネーブにあるパテック フィリップの本店。3000万円の高級時計を見学した世界最高峰の時計店。',
    address: 'Rue du Rhône 41, 1204 Genève, Switzerland',
    phone: '+41-22-807-02-00',
    category: 'luxury_store',
    website: 'https://www.patek.com/',
    latitude: 46.2044,
    longitude: 6.1432,
    episode_ids: ['3ZnxNCg-uHg']
  },
  {
    name: 'じゃんがら ラーメン',
    description: '亀梨とふぉ〜ゆ〜越岡がジュニア時代に通った思い出の濃厚豚骨ラーメン店。原宿にある老舗ラーメン店。',
    address: '東京都渋谷区神宮前4-30-3 東急プラザ表参道原宿 B1F',
    phone: '03-3403-5363',
    category: 'restaurant',
    website: null,
    latitude: 35.6702,
    longitude: 139.7071,
    episode_ids: ['Yh0PvWpXNoY', 'RNqVszct9PU']
  },
  {
    name: '牛角 焼肉食べ放題',
    description: 'Hey! Say! JUMP髙木雄也と訪問した焼肉チェーン店。食べ放題で焼肉を堪能した店舗。',
    address: null, // 具体的店舗要調査
    phone: null,
    category: 'restaurant',
    website: 'https://www.gyukaku.ne.jp/',
    latitude: null,
    longitude: null,
    episode_ids: ['8HTsVA9ZK0k', 'vS12vjDjicE']
  },
  {
    name: '城崎温泉旅館',
    description: '兵庫県豊岡市の城崎温泉にある旅館。豪華朝食が絶品として紹介された温泉旅館。',
    address: null, // 具体的旅館名要調査
    phone: null,
    category: 'hotel',
    website: null,
    latitude: 35.6127,
    longitude: 134.7999,
    episode_ids: ['gzZENFTu99Q']
  },
  {
    name: 'スイス5つ星ホテル',
    description: 'スイス旅行で宿泊した5つ星ホテル。豪華朝食バイキングと絶景ロケーションが自慢の最高級ホテル。',
    address: null, // 具体的ホテル名要調査
    phone: null,
    category: 'hotel',
    website: null,
    latitude: null,
    longitude: null,
    episode_ids: ['MVa0cRvCfeQ']
  },
  {
    name: 'タイ5つ星ホテル',
    description: 'タイ旅行で宿泊した5つ星ホテル。テラスで食べる朝食が絶品の豪華リゾートホテル。',
    address: null, // 具体的ホテル名要調査
    phone: null,
    category: 'hotel',
    website: null,
    latitude: null,
    longitude: null,
    episode_ids: ['53Qe8dMBEg0']
  }
];

// 亀梨和也ロケーション登録システム（バッチ1）
export class KamenashiBatch1LocationImporter {
  private stats = {
    totalLocations: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importKamenashiBatch1Locations(): Promise<void> {
    console.log('📍 亀梨和也ロケーションデータベース登録（バッチ1）');
    console.log('='.repeat(60));
    console.log('🏪 店舗・施設情報を具体的に特定して登録');
    console.log(`🎯 登録対象: ${KAMENASHI_BATCH1_LOCATIONS.length}箇所\n`);

    try {
      // 各ロケーションを順次登録
      await this.importLocations();
      
      // レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // ロケーション登録
  private async importLocations(): Promise<void> {
    this.stats.totalLocations = KAMENASHI_BATCH1_LOCATIONS.length;

    for (const [index, location] of KAMENASHI_BATCH1_LOCATIONS.entries()) {
      console.log(`【${index + 1}/${KAMENASHI_BATCH1_LOCATIONS.length}】 ${location.name}`);

      try {
        // 既存ロケーションチェック（名前で重複確認）
        const { data: existing } = await supabase
          .from('locations')
          .select('id')
          .eq('name', location.name)
          .single();

        if (existing) {
          console.log('   ⚠️ 既存ロケーションをスキップ');
          continue;
        }

        // 新規ロケーションデータ作成（Snow Manスクリプトと同じスキーマ）
        const locationData = {
          name: location.name,
          slug: `${location.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now()}`,
          description: location.description,
          address: location.address,
          website_url: location.website,
          episode_id: location.episode_ids[0], // 最初のエピソードIDを使用
          celebrity_id: await this.getKamenashiId()
        };
        
        // 電話番号があればdescriptionに追加
        if (location.phone) {
          locationData.description += `\n電話番号: ${location.phone}`;
        }

        const { error } = await supabase
          .from('locations')
          .insert([locationData]);

        if (error) {
          console.error('   ❌ ロケーション登録エラー:', error.message);
          this.stats.errors++;
        } else {
          console.log('   ✅ ロケーション登録成功');
          console.log(`      📍 ${location.address || '住所調査中'}`);
          console.log(`      🏷️ タイプ: ${location.category}`);
          if (location.phone) {
            console.log(`      📞 ${location.phone}`);
          }
          if (location.episode_ids.length > 1) {
            console.log(`      📺 関連エピソード: ${location.episode_ids.length}件`);
          }
          this.stats.successfulImports++;
        }

      } catch (error) {
        console.error(`   ❌ 処理エラー: ${error.message}`);
        this.stats.errors++;
      }
      
      console.log(); // 空行追加
    }
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('='.repeat(60));
    console.log('📊 亀梨和也ロケーション登録完了レポート（バッチ1）');
    console.log('='.repeat(60));

    // 総ロケーション数取得
    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true });

    console.log('\n📈 処理結果:');
    console.log(`📍 対象ロケーション: ${this.stats.totalLocations}箇所`);
    console.log(`✅ 新規登録: ${this.stats.successfulImports}箇所`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📍 総ロケーション数: ${totalLocations}箇所`);

    const successRate = this.stats.totalLocations > 0 
      ? Math.round((this.stats.successfulImports / this.stats.totalLocations) * 100)
      : 0;
    console.log(`🎯 登録成功率: ${successRate}%`);

    console.log('\n🏪 登録済みカテゴリ:');
    console.log('   💄 美容・コスメ店: SHISEIDO THE STORE');
    console.log('   🍽️ 飲食店: もんじゃかっぱ祭り、くら寿司、一蘭、じゃんがら、牛角');
    console.log('   ⌚ 高級ブランド店: パテック フィリップ');
    console.log('   🏨 ホテル・旅館: 城崎温泉旅館、スイス5つ星ホテル、タイ5つ星ホテル');

    console.log('\n📝 次回バッチ予定:');
    console.log('   - 焼肉店詳細（Snow Man渡辺翔太、なにわ男子道枝駿佑コラボ回）');
    console.log('   - ラーメン店詳細（鳥取牛骨、家系、二郎系）');
    console.log('   - 美容室・サロン（長年通う美容室）');
    console.log('   - 各地方のグルメ店（岡山、京都、大阪など）');

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/locations');
    console.log('\n' + '='.repeat(60));
  }

  // 亀梨和也ID取得
  private async getKamenashiId(): Promise<string> {
    const { data } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'kamenashi-kazuya')
      .single();
    return data?.id || '';
  }
}

// メイン処理
async function main() {
  const importer = new KamenashiBatch1LocationImporter();
  await importer.importKamenashiBatch1Locations();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}