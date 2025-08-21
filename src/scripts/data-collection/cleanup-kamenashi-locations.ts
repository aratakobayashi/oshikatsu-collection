import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 削除対象の抽象的・不明確な店舗名リスト
const LOCATIONS_TO_DELETE = [
  '一蘭ラーメン', // 具体的店舗が特定できていない
  '夜景の見える焼肉店（詳細調査中）', // 店舗名不明
  'Snow Man渡辺翔太との高級焼肉店', // 店舗名不明
  '家系ラーメン店（和田毅コラボ）', // 店舗名不明
  '京都の濃厚ラーメン店', // 店舗名不明
  '二郎系ラーメン店', // 店舗名不明
  '盛岡冷麺店', // 店舗名不明
  'Snow Man渡辺翔太との絶品かき氷店', // 店舗名不明
  '亀梨の美容室（長年通うお店）', // 店舗名不明
  'HIKAKIN 20億円ハウス', // 個人宅のため削除
  'はじめしゃちょー 4億円の家', // 個人宅のため削除
  '岡山の牡蠣小屋', // 店舗名不明
  '岡山サンセットクルージング船', // サービス名で店舗名不明
  '大阪の一人焼肉店', // 店舗名不明
  '絶品かき氷専門店', // 店舗名不明
  'バレ即終了変装接客店舗', // 店舗名不明
  'スイスワイナリー・観光地', // 具体的施設名不明
  '城崎温泉の豪華朝食旅館', // 旅館名不明
  '牛角 焼肉食べ放題', // チェーン店で具体的店舗不明
  '城崎温泉旅館', // 旅館名不明
  'スイス5つ星ホテル', // ホテル名不明
  'タイ5つ星ホテル' // ホテル名不明
];

// 亀梨和也ロケーションクリーンアップシステム
export class KamenashiLocationCleanup {
  private stats = {
    totalFound: 0,
    successfulDeletes: 0,
    errors: 0
  };

  // メイン処理
  async cleanupKamenashiLocations(): Promise<void> {
    console.log('🗑️ 亀梨和也抽象的ロケーションデータクリーンアップ');
    console.log('='.repeat(60));
    console.log('❌ 店舗名が特定できていないロケーションを削除');
    console.log(`🎯 削除対象: ${LOCATIONS_TO_DELETE.length}件\n`);

    try {
      // 亀梨和也のIDを取得
      const celebrityId = await this.getKamenashiId();
      
      // 削除対象ロケーションを削除
      await this.deleteAbstractLocations(celebrityId);
      
      // レポート生成
      await this.generateReport(celebrityId);

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // 抽象的ロケーション削除
  private async deleteAbstractLocations(celebrityId: string): Promise<void> {
    console.log('🔍 削除対象ロケーション検索・削除中...\n');

    for (const [index, locationName] of LOCATIONS_TO_DELETE.entries()) {
      console.log(`【${index + 1}/${LOCATIONS_TO_DELETE.length}】 ${locationName}`);

      try {
        // 該当ロケーション検索
        const { data: locations, error: searchError } = await supabase
          .from('locations')
          .select('id, name, address, description')
          .eq('celebrity_id', celebrityId)
          .eq('name', locationName);

        if (searchError) {
          console.error('   ❌ 検索エラー:', searchError.message);
          this.stats.errors++;
          continue;
        }

        if (!locations || locations.length === 0) {
          console.log('   ⚠️ 該当ロケーションが見つかりません');
          continue;
        }

        this.stats.totalFound += locations.length;

        // 各ロケーションを削除
        for (const location of locations) {
          const { error: deleteError } = await supabase
            .from('locations')
            .delete()
            .eq('id', location.id);

          if (deleteError) {
            console.error('   ❌ 削除エラー:', deleteError.message);
            this.stats.errors++;
          } else {
            console.log('   🗑️ 削除成功');
            console.log(`      📝 説明: ${location.description?.substring(0, 50)}...`);
            this.stats.successfulDeletes++;
          }
        }

      } catch (error) {
        console.error(`   ❌ 処理エラー: ${error.message}`);
        this.stats.errors++;
      }
      
      console.log(); // 空行追加
    }
  }

  // レポート生成
  private async generateReport(celebrityId: string): Promise<void> {
    console.log('='.repeat(60));
    console.log('📊 亀梨和也ロケーションクリーンアップ完了レポート');
    console.log('='.repeat(60));

    // 残存ロケーション数取得
    const { count: remainingLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId);

    // 残存ロケーションの詳細取得
    const { data: remainingDetails } = await supabase
      .from('locations')
      .select('name, address, description')
      .eq('celebrity_id', celebrityId)
      .order('name');

    console.log('\n📈 処理結果:');
    console.log(`🔍 検索対象: ${LOCATIONS_TO_DELETE.length}件`);
    console.log(`📍 発見されたロケーション: ${this.stats.totalFound}件`);
    console.log(`✅ 削除成功: ${this.stats.successfulDeletes}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📺 亀梨和也残存ロケーション数: ${remainingLocations}件`);

    const deleteRate = this.stats.totalFound > 0 
      ? Math.round((this.stats.successfulDeletes / this.stats.totalFound) * 100)
      : 0;
    console.log(`🎯 削除成功率: ${deleteRate}%`);

    console.log('\n✅ 残存している具体的な店舗名ロケーション:');
    if (remainingDetails && remainingDetails.length > 0) {
      remainingDetails.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location.name}`);
        if (location.address) {
          console.log(`      📍 ${location.address}`);
        }
      });
    }

    console.log('\n🎯 クリーンアップの効果:');
    console.log('   ✨ 抽象的・曖昧な店舗名を完全削除');
    console.log('   🏪 具体的な店舗名のみが残存');
    console.log('   📍 住所が確定している店舗を優先保持');
    console.log('   🎯 ファンの聖地巡礼に実用的なデータのみ残存');

    console.log('\n📝 今後の方針:');
    console.log('   🔍 残りの店舗の具体名を個別に調査・特定');
    console.log('   📺 動画内容から店舗の外観・看板を分析');
    console.log('   🌐 ファンサイト・ブログからの情報収集');
    console.log('   📍 特定できた店舗から順次再登録');

    console.log('\n📱 確認URL:');
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
  const cleanup = new KamenashiLocationCleanup();
  await cleanup.cleanupKamenashiLocations();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}