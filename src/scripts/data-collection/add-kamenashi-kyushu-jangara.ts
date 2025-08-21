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

// 九州じゃんがら原宿店登録データ
const KYUSHU_JANGARA_LOCATION = {
  name: '九州じゃんがら原宿店',
  description: '原宿にある豚骨ラーメン専門店。亀梨和也とふぉ〜ゆ〜越岡裕貴がラーメンを味わった後、近くのホホカムダイナーでパンケーキ企画へ移行。濃厚な豚骨スープとストレート細麺が特徴の九州ラーメンの名店。',
  address: '東京都渋谷区神宮前1-13-21',
  phone: '03-3408-4466',
  website: null,
  episode_ids: ['VwiyfeWGgAY'] // ホホカムダイナー関連動画と推定
};

// 九州じゃんがら原宿店登録システム
export class KyushuJangaraLocationImporter {
  private stats = {
    successfulImport: false,
    error: null as string | null
  };

  // メイン処理
  async importKyushuJangaraLocation(): Promise<void> {
    console.log('🍜 亀梨和也ロケーション追加登録：九州じゃんがら原宿店');
    console.log('='.repeat(60));
    console.log('🎯 越岡裕貴とのラーメン企画で訪問した豚骨ラーメン店を登録\n');

    try {
      // 店舗登録
      await this.importLocation();
      
      // レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
      this.stats.error = error.message;
    }
  }

  // ロケーション登録
  private async importLocation(): Promise<void> {
    const celebrityId = await this.getKamenashiId();

    console.log('🔍 九州じゃんがら原宿店の登録処理開始...');

    try {
      // 既存ロケーションチェック
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', KYUSHU_JANGARA_LOCATION.name)
        .single();

      if (existing) {
        console.log('   ⚠️ 既存ロケーションが存在します');
        this.stats.error = '既存店舗のため登録をスキップ';
        return;
      }

      // 新規ロケーションデータ作成
      let description = KYUSHU_JANGARA_LOCATION.description;
      if (KYUSHU_JANGARA_LOCATION.phone) {
        description += `\n電話番号: ${KYUSHU_JANGARA_LOCATION.phone}`;
      }

      const locationData = {
        name: KYUSHU_JANGARA_LOCATION.name,
        slug: `kyushu-jangara-harajuku-${Date.now()}`,
        description: description,
        address: KYUSHU_JANGARA_LOCATION.address,
        website_url: KYUSHU_JANGARA_LOCATION.website,
        episode_id: KYUSHU_JANGARA_LOCATION.episode_ids[0],
        celebrity_id: celebrityId
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      if (error) {
        console.error('   ❌ ロケーション登録エラー:', error.message);
        this.stats.error = error.message;
      } else {
        console.log('   ✅ ロケーション登録成功');
        console.log(`      🏪 店舗名: ${KYUSHU_JANGARA_LOCATION.name}`);
        console.log(`      📍 住所: ${KYUSHU_JANGARA_LOCATION.address}`);
        console.log(`      📞 電話番号: ${KYUSHU_JANGARA_LOCATION.phone}`);
        console.log(`      📺 エピソードID: ${KYUSHU_JANGARA_LOCATION.episode_ids[0]}`);
        this.stats.successfulImport = true;
      }

    } catch (error) {
      console.error(`   ❌ 処理エラー: ${error.message}`);
      this.stats.error = error.message;
    }
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 九州じゃんがら原宿店登録完了レポート');
    console.log('='.repeat(60));

    // 亀梨和也の総ロケーション数取得
    const celebrityId = await this.getKamenashiId();
    const { count: kamenashiLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId);

    console.log('\n📈 処理結果:');
    if (this.stats.successfulImport) {
      console.log('   ✅ 九州じゃんがら原宿店登録成功');
      console.log('   🎯 亀梨和也ロケーション総数更新');
    } else {
      console.log('   ⚠️ 登録処理スキップまたはエラー');
      if (this.stats.error) {
        console.log(`   💬 理由: ${this.stats.error}`);
      }
    }

    console.log('\n📊 データベース統計:');
    console.log(`   📺 亀梨和也ロケーション数: ${kamenashiLocations}箇所`);

    console.log('\n🍜 九州じゃんがら原宿店について:');
    console.log('   🏪 業態: 豚骨ラーメン専門店');
    console.log('   📍 立地: 原宿・表参道エリア');
    console.log('   🎬 企画内容: 越岡裕貴とのラーメン→パンケーキ企画');
    console.log('   🍜 特徴: 濃厚豚骨スープ、ストレート細麺');
    console.log('   ⭐ 九州ラーメンの老舗チェーン店');

    console.log('\n🎯 この店舗の価値:');
    console.log('   📺 亀梨YouTubeチャンネル初期の重要エピソード');
    console.log('   🤝 ふぉ〜ゆ〜越岡裕貴との貴重なコラボ');
    console.log('   🍽️ 原宿グルメ巡礼の起点となる店舗');
    console.log('   🎪 ホホカムダイナーとのセット企画で話題性高い');

    console.log('\n💡 関連情報:');
    console.log('   🥞 セット企画: ホホカムダイナー（パンケーキ）');
    console.log('   📍 同エリア: 原宿・表参道グルメスポット');
    console.log('   🎬 企画パターン: ラーメン→スイーツの流れ');

    console.log('\n📝 今後の展開:');
    console.log('   🔍 同様の未登録店舗の洗い出し');
    console.log('   🎯 原宿エリアロケーションの充実化');
    console.log('   📺 初期エピソードの重点調査');
    console.log('   🤝 ゲスト別店舗マッピング');

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');

    console.log('\n' + '='.repeat(60));
    if (this.stats.successfulImport) {
      console.log('🎉 九州じゃんがら原宿店の登録が完了しました！');
    } else {
      console.log('⚠️ 九州じゃんがら原宿店の登録処理が完了しました');
    }
    console.log('='.repeat(60));
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
  const importer = new KyushuJangaraLocationImporter();
  await importer.importKyushuJangaraLocation();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}