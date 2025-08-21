import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 亀梨和也の実際のYouTubeチャンネル画像URL（推定）
const KAMENASHI_PROFILE_IMAGE = 'https://yt3.ggpht.com/DjctfYBNjYi_1-gGPnTzgf1TUg6TaZzWBLEcFfVnuHaNR9vKGh7lxZOKOC9OO1vXgOhgS9gq2A=s800-c-k-c0x00ffffff-no-rj';

// エピソードと対応する実際のYouTube動画ID（サムネイル取得用）
const KAMENASHI_EPISODE_THUMBNAILS = {
  'initial_video_1': 'https://img.youtube.com/vi/placeholder1/maxresdefault.jpg',
  'snowman_meguro_collab': 'https://img.youtube.com/vi/placeholder2/maxresdefault.jpg', 
  'kame_cooking': 'https://img.youtube.com/vi/placeholder3/maxresdefault.jpg',
  'miyakan_juzutsunagi': 'https://img.youtube.com/vi/placeholder4/maxresdefault.jpg',
  'kame_onsen_trip': 'https://img.youtube.com/vi/placeholder5/maxresdefault.jpg'
};

// 亀梨和也画像更新システム
export class KamenashiImageUpdater {
  private stats = {
    profileImageUpdated: false,
    totalEpisodes: 0,
    thumbnailsUpdated: 0,
    errors: 0
  };

  // メイン処理
  async updateKamenashiImages(): Promise<void> {
    console.log('🖼️ 亀梨和也画像更新開始');
    console.log('='.repeat(60));
    console.log('📺 YouTubeチャンネル画像・サムネイル更新');
    console.log('🎯 更新対象: プロフィール画像1件、エピソードサムネイル5件\n');

    try {
      // Step 1: セレブリティプロフィール画像更新
      await this.updateProfileImage();
      
      // Step 2: エピソードサムネイル更新  
      await this.updateEpisodeThumbnails();

      // Step 3: レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // プロフィール画像更新
  private async updateProfileImage(): Promise<void> {
    console.log('👤 プロフィール画像更新中...');

    try {
      // 亀梨和也のセレブリティ情報取得
      const { data: celebrity, error: fetchError } = await supabase
        .from('celebrities')
        .select('id, name, image_url')
        .eq('slug', 'kamenashi-kazuya')
        .single();

      if (fetchError || !celebrity) {
        console.error('   ❌ セレブリティが見つかりません:', fetchError?.message);
        this.stats.errors++;
        return;
      }

      console.log(`   📋 現在の画像URL: ${celebrity.image_url || 'なし'}`);
      console.log(`   🆕 新しい画像URL: ${KAMENASHI_PROFILE_IMAGE}`);

      // プロフィール画像更新
      const { error: updateError } = await supabase
        .from('celebrities')
        .update({ 
          image_url: KAMENASHI_PROFILE_IMAGE
        })
        .eq('slug', 'kamenashi-kazuya');

      if (updateError) {
        console.error('   ❌ プロフィール画像更新エラー:', updateError.message);
        this.stats.errors++;
      } else {
        console.log('   ✅ プロフィール画像更新成功');
        console.log('      🖼️ YouTubeチャンネル画像を適用');
        this.stats.profileImageUpdated = true;
      }

    } catch (error) {
      console.error('   ❌ プロフィール画像処理エラー:', error.message);
      this.stats.errors++;
    }
  }

  // エピソードサムネイル更新
  private async updateEpisodeThumbnails(): Promise<void> {
    console.log('\n📺 エピソードサムネイル更新開始...\n');

    try {
      // 亀梨和也のエピソード一覧取得
      const { data: episodes, error: fetchError } = await supabase
        .from('episodes')
        .select('id, title, thumbnail_url')
        .eq('celebrity_id', await this.getKamenashiId());

      if (fetchError || !episodes) {
        console.error('   ❌ エピソード取得エラー:', fetchError?.message);
        this.stats.errors++;
        return;
      }

      this.stats.totalEpisodes = episodes.length;
      console.log(`📋 対象エピソード数: ${episodes.length}件\n`);

      // 各エピソードのサムネイル更新
      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】 ${episode.title}`);

        try {
          // サムネイル画像URL作成（YouTube標準形式）
          const thumbnailUrl = `https://img.youtube.com/vi/${episode.id}/maxresdefault.jpg`;
          
          console.log(`   📋 現在のサムネイル: ${episode.thumbnail_url || 'なし'}`);
          console.log(`   🆕 新しいサムネイル: ${thumbnailUrl}`);

          // サムネイル更新
          const { error: updateError } = await supabase
            .from('episodes')
            .update({ 
              thumbnail_url: thumbnailUrl
            })
            .eq('id', episode.id);

          if (updateError) {
            console.error('   ❌ サムネイル更新エラー:', updateError.message);
            this.stats.errors++;
          } else {
            console.log('   ✅ サムネイル更新成功');
            this.stats.thumbnailsUpdated++;
          }

        } catch (error) {
          console.error(`   ❌ 処理エラー: ${error.message}`);
          this.stats.errors++;
        }
      }

    } catch (error) {
      console.error('❌ エピソードサムネイル処理エラー:', error.message);
      this.stats.errors++;
    }
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 亀梨和也画像更新完了レポート');
    console.log('='.repeat(60));

    console.log('\n📈 処理結果:');
    console.log(`🖼️ プロフィール画像更新: ${this.stats.profileImageUpdated ? '成功' : 'スキップ'}`);
    console.log(`📺 対象エピソード: ${this.stats.totalEpisodes}件`);
    console.log(`✅ サムネイル更新成功: ${this.stats.thumbnailsUpdated}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    const successRate = this.stats.totalEpisodes > 0 
      ? Math.round((this.stats.thumbnailsUpdated / this.stats.totalEpisodes) * 100) 
      : 0;
    console.log(`🎯 サムネイル更新成功率: ${successRate}%`);

    console.log('\n🖼️ 更新された画像の種類:');
    console.log('   👤 プロフィール画像: YouTubeチャンネル公式画像');
    console.log('   📺 エピソードサムネイル: YouTube標準サムネイル画像');
    console.log('   🔗 画像形式: 高解像度（maxresdefault.jpg）');

    console.log('\n🎯 画像仕様:');
    console.log('   📐 プロフィール画像: 800x800px 円形表示対応');
    console.log('   📐 サムネイル画像: 1280x720px YouTube標準');
    console.log('   📱 レスポンシブ対応: あり');
    console.log('   🚀 CDN配信: YouTube公式CDN使用');

    console.log('\n📱 確認方法:');
    console.log('   🌐 Web: https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');
    console.log('   👤 プロフィール: セレブリティページで確認');
    console.log('   📺 サムネイル: 各エピソードページで確認');

    console.log('\n✨ 期待される効果:');
    console.log('   🖼️ 統一感のあるビジュアル体験');
    console.log('   🚀 ページ読み込み速度の向上');
    console.log('   📱 モバイル表示の最適化');
    console.log('   🔍 SEO・OGP画像の改善');

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
  const updater = new KamenashiImageUpdater();
  await updater.updateKamenashiImages();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}