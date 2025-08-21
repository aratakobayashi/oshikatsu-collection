import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 亀梨和也修正済みエピソード修正システム
export class KamenashiEpisodeFixer {
  private stats = {
    deletedEpisodes: 0,
    errors: 0
  };

  // メイン処理
  async fixKamenashiEpisodes(): Promise<void> {
    console.log('🔧 亀梨和也エピソード修正開始');
    console.log('='.repeat(60));
    console.log('❌ プレースホルダーエピソード削除');
    console.log('📝 実際のYouTube動画IDでの再登録が必要\n');

    try {
      // Step 1: 亀梨和也のセレブリティID取得
      const { data: celebrity } = await supabase
        .from('celebrities')
        .select('id, name')
        .eq('slug', 'kamenashi-kazuya')
        .single();

      if (!celebrity) {
        console.error('❌ 亀梨和也が見つかりません');
        return;
      }

      console.log(`✅ セレブリティ確認: ${celebrity.name} (ID: ${celebrity.id})\n`);

      // Step 2: プレースホルダーエピソード削除
      await this.deletePlaceholderEpisodes(celebrity.id);

      // Step 3: レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // プレースホルダーエピソード削除
  private async deletePlaceholderEpisodes(celebrityId: string): Promise<void> {
    console.log('🗑️ プレースホルダーエピソード削除開始...\n');

    try {
      // 亀梨和也の現在のエピソード一覧取得
      const { data: episodes, error: fetchError } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', celebrityId);

      if (fetchError || !episodes) {
        console.error('   ❌ エピソード取得エラー:', fetchError?.message);
        this.stats.errors++;
        return;
      }

      console.log(`📋 現在のエピソード数: ${episodes.length}件\n`);

      // プレースホルダーIDのリスト
      const placeholderIds = [
        'initial_video_1',
        'snowman_meguro_collab', 
        'kame_cooking',
        'miyakan_juzutsunagi',
        'kame_onsen_trip'
      ];

      // 各プレースホルダーエピソードを削除
      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】 ${episode.title}`);

        if (placeholderIds.includes(episode.id)) {
          try {
            // プレースホルダーエピソード削除
            const { error: deleteError } = await supabase
              .from('episodes')
              .delete()
              .eq('id', episode.id);

            if (deleteError) {
              console.error('   ❌ 削除エラー:', deleteError.message);
              this.stats.errors++;
            } else {
              console.log('   🗑️ プレースホルダーエピソード削除成功');
              this.stats.deletedEpisodes++;
            }

          } catch (error) {
            console.error(`   ❌ 処理エラー: ${error.message}`);
            this.stats.errors++;
          }
        } else {
          console.log('   ✅ 有効なエピソード（削除対象外）');
        }
      }

    } catch (error) {
      console.error('❌ プレースホルダー削除処理エラー:', error.message);
      this.stats.errors++;
    }
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 亀梨和也エピソード修正完了レポート');
    console.log('='.repeat(60));

    // 修正後のエピソード数取得
    const { count: remainingEpisodes } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', await this.getKamenashiId());

    console.log('\n📈 処理結果:');
    console.log(`🗑️ 削除されたプレースホルダーエピソード: ${this.stats.deletedEpisodes}件`);
    console.log(`📺 残存エピソード数: ${remainingEpisodes}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n🔧 修正内容:');
    console.log('   ❌ プレースホルダー動画ID削除');
    console.log('   🖼️ 404エラーのサムネイル問題解決');
    console.log('   📺 データベースクリーンアップ完了');

    console.log('\n📝 次のステップ:');
    console.log('   1. 実際のYouTube APIを使用した動画取得');
    console.log('   2. 正確な動画ID・タイトル・サムネイルでの再登録');
    console.log('   3. YouTube Data API v3による自動取得推奨');

    console.log('\n💡 推奨アクション:');
    console.log('   🔑 YouTube Data APIキーでの動画一覧取得');
    console.log('   📺 @k_kamenashi_23 チャンネルからの直接取得');
    console.log('   🚫 ショート動画の除外フィルタリング');
    console.log('   ✅ 高解像度サムネイルの自動設定');

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
  const fixer = new KamenashiEpisodeFixer();
  await fixer.fixKamenashiEpisodes();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}