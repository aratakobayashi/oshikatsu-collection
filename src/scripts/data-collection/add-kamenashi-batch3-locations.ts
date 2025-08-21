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

// 亀梨和也ロケーションデータ（バッチ3：旅行先・YouTuberコラボ）
const KAMENASHI_BATCH3_LOCATIONS = [
  {
    name: 'EL SUENITO（エルスエニート）',
    description: '2024年4月開業の岡山県備前市日生町にある1日1組限定のプライベートヴィラ。亀梨YouTubeチャンネル1周年企画でSnow Man宮舘涼太・鈴木福と豪華バーベキューを楽しんだ高級宿泊施設。プール・サウナ完備。',
    address: '岡山県備前市日生町日生641-51',
    phone: null,
    website: 'https://el-suenito.com',
    episode_ids: ['8-pKbYjUTc4', 'fh2_iEESohc']
  },
  {
    name: 'HIKAKIN 20億円ハウス',
    description: '日本最大YouTuberヒカキンの20億円豪邸（賃貸）。71畳のリビング、室内温水プール、ジャグジー2つ、4トイレを完備。亀梨と100人前巨大チャーハン作りとルームツアーを実施。',
    address: null, // 非公開住所
    phone: null,
    website: null,
    episode_ids: ['j7F0RB86Yho']
  },
  {
    name: 'はじめしゃちょー 4億円の家',
    description: '人気YouTuberはじめしゃちょーの静岡県の4億円豪邸（購入3億円＋改装1億円）。4階建てでガレージ・バスケットコート完備。亀梨が手料理を振る舞いルームツアーを実施。',
    address: null, // 静岡県某所（非公開）
    phone: null,
    website: null,
    episode_ids: ['VwiyfeWGgAY']
  },
  {
    name: '岡山の牡蠣小屋',
    description: '亀梨・Snow Man宮舘涼太・鈴木福の岡山1泊2日旅行で昼飲みを楽しんだ牡蠣小屋。カキとビールで最高の昼飲み体験を提供。',
    address: null, // 岡山県内要調査
    phone: null,
    website: null,
    episode_ids: ['8-pKbYjUTc4']
  },
  {
    name: '岡山サンセットクルージング船',
    description: '岡山の夕日を船上から眺めるサンセットクルージング体験。亀梨・宮舘涼太・鈴木福の3人が船上で美しい夕日を堪能。',
    address: null, // 岡山県内港湾要調査
    phone: null,
    website: null,
    episode_ids: ['fh2_iEESohc']
  },
  {
    name: '大阪の一人焼肉店',
    description: '亀梨が大阪で一人焼肉を楽しんだ店舗。関西出張の際のぼっち焼肉として利用した隠れた名店。',
    address: null, // 大阪府内要調査
    phone: null,
    website: null,
    episode_ids: ['chtW4R82cOg']
  },
  {
    name: '絶品かき氷専門店',
    description: 'Snow Man渡辺翔太との夏企画で訪れた絶品かき氷店。神のクオリティの味に2人とも悶絶した専門店。',
    address: null, // 東京都内要調査
    phone: null,
    website: null,
    episode_ids: ['xbEXP_yd8l0']
  },
  {
    name: 'バレ即終了変装接客店舗',
    description: '亀梨が変装して店長として接客し、ファンにバレるまでの企画を実施した店舗。サプライズ接客企画のロケ地。',
    address: null, // 具体的店舗要調査
    phone: null,
    website: null,
    episode_ids: ['P7JBBmjdJKI']
  },
  {
    name: 'スイスワイナリー・観光地',
    description: '亀梨のスイス旅行で訪れたワイナリーやヨーロッパの街並み。電車移動やワインテイスティングを楽しんだ観光地。',
    address: null, // スイス国内要調査
    phone: null,
    website: null,
    episode_ids: ['GpXjX8YfmvM']
  },
  {
    name: '城崎温泉の豪華朝食旅館',
    description: '兵庫県豊岡市の城崎温泉で豪華朝食を提供する旅館。朝ごはんが最高すぎて悶絶した温泉宿。',
    address: null, // 城崎温泉街要調査
    phone: null,
    website: null,
    episode_ids: ['gzZENFTu99Q']
  }
];

// 亀梨和也ロケーション登録システム（バッチ3）
export class KamenashiBatch3LocationImporter {
  private stats = {
    totalLocations: 0,
    successfulImports: 0,
    errors: 0
  };

  // メイン処理
  async importKamenashiBatch3Locations(): Promise<void> {
    console.log('📍 亀梨和也ロケーションデータベース登録（バッチ3）');
    console.log('='.repeat(60));
    console.log('🏡 旅行先・YouTuberコラボ・特別企画ロケ地を登録');
    console.log(`🎯 登録対象: ${KAMENASHI_BATCH3_LOCATIONS.length}箇所\n`);

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
    this.stats.totalLocations = KAMENASHI_BATCH3_LOCATIONS.length;
    const celebrityId = await this.getKamenashiId();

    for (const [index, location] of KAMENASHI_BATCH3_LOCATIONS.entries()) {
      console.log(`【${index + 1}/${KAMENASHI_BATCH3_LOCATIONS.length}】 ${location.name}`);

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

        // 新規ロケーションデータ作成
        let description = location.description;
        if (location.phone) {
          description += `\n電話番号: ${location.phone}`;
        }

        const locationData = {
          name: location.name,
          slug: `${location.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now()}`,
          description: description,
          address: location.address,
          website_url: location.website,
          episode_id: location.episode_ids[0], // 最初のエピソードIDを使用
          celebrity_id: celebrityId
        };

        const { error } = await supabase
          .from('locations')
          .insert([locationData]);

        if (error) {
          console.error('   ❌ ロケーション登録エラー:', error.message);
          this.stats.errors++;
        } else {
          console.log('   ✅ ロケーション登録成功');
          console.log(`      📍 ${location.address || '住所調査中'}`);
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
    console.log('📊 亀梨和也ロケーション登録完了レポート（バッチ3）');
    console.log('='.repeat(60));

    // 総ロケーション数取得
    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true });

    // 亀梨和也の総ロケーション数取得
    const celebrityId = await this.getKamenashiId();
    const { count: kamenashiLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId);

    console.log('\n📈 処理結果:');
    console.log(`📍 対象ロケーション: ${this.stats.totalLocations}箇所`);
    console.log(`✅ 新規登録: ${this.stats.successfulImports}箇所`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📍 総ロケーション数: ${totalLocations}箇所`);
    console.log(`📺 亀梨和也ロケーション数: ${kamenashiLocations}箇所`);

    const successRate = this.stats.totalLocations > 0 
      ? Math.round((this.stats.successfulImports / this.stats.totalLocations) * 100)
      : 0;
    console.log(`🎯 登録成功率: ${successRate}%`);

    console.log('\n🏪 バッチ3登録済みカテゴリ:');
    console.log('   🏡 高級宿泊施設: EL SUENITO、HIKAKIN豪邸、はじめしゃちょー豪邸');
    console.log('   🦪 岡山グルメ: 牡蠣小屋、サンセットクルージング');
    console.log('   🍧 スイーツ・特別企画: かき氷店、変装接客店舗');
    console.log('   🌍 海外・国内旅行: スイス観光地、城崎温泉旅館');
    console.log('   🥩 地方グルメ: 大阪一人焼肉店');

    console.log('\n📊 亀梨和也ロケーション統計（3バッチ合計）:');
    console.log(`   バッチ1: 10箇所（基本的な店舗・施設）`);
    console.log(`   バッチ2: 10箇所（焼肉・ラーメン・美容室）`);
    console.log(`   バッチ3: ${this.stats.successfulImports}箇所（旅行・コラボ・特別企画）`);
    console.log(`   合計: ${10 + 10 + this.stats.successfulImports}箇所`);

    console.log('\n📝 さらなる調査候補:');
    console.log('   🔍 具体的な店舗名が特定できていない箇所の詳細調査');
    console.log('   🔍 数珠つなぎ企画での各コラボ相手の店舗');
    console.log('   🔍 地方ロケでの詳細店舗（大阪、京都、横浜等）');
    console.log('   🔍 ゲスト回での訪問店舗の特定');

    console.log('\n🌟 特筆すべきロケ地の特徴:');
    console.log('   💰 超高額施設: HIKAKIN20億円ハウス、はじめしゃちょー4億円ハウス');
    console.log('   🎬 コラボ企画: Snow Man、なにわ男子、YouTuber等との多彩なコラボ');
    console.log('   🗾 全国展開: 東京、岡山、鳥取、京都、大阪、スイス等広範囲');
    console.log('   🏆 話題性: ファンの聖地化、メディア注目度が高い店舗多数');

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/locations');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');
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
  const importer = new KamenashiBatch3LocationImporter();
  await importer.importKamenashiBatch3Locations();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}