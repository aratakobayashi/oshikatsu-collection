import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { 
  EnhancedYouTubeLocationProcessor, 
  ExtractedLocation 
} from './youtube-description-extractor';

// 本番環境設定読み込み
dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const EQUAL_LOVE_ID = '259e44a6-5a33-40cf-9d78-86cfbd9df2ac';

interface Episode {
  id: string;
  video_url: string;
  title: string;
  date: string;
  celebrity_id: string;
}

interface ProcessingStats {
  totalEpisodes: number;
  processedEpisodes: number;
  successfulExtractions: number;
  totalLocationsExtracted: number;
  skippedEpisodes: number;
  errorEpisodes: number;
  processingTimeMinutes: number;
}

export class ProductionEqualLoveProcessor {
  private youtubeProcessor?: EnhancedYouTubeLocationProcessor;
  private stats: ProcessingStats;

  constructor() {
    // OpenAI APIキーがある場合のみYouTubeプロセッサを初期化
    if (process.env.OPENAI_API_KEY) {
      this.youtubeProcessor = new EnhancedYouTubeLocationProcessor();
    }
    
    this.stats = {
      totalEpisodes: 0,
      processedEpisodes: 0,
      successfulExtractions: 0,
      totalLocationsExtracted: 0,
      skippedEpisodes: 0,
      errorEpisodes: 0,
      processingTimeMinutes: 0
    };
  }

  // 既存データのクリーンアップ
  async cleanupExistingData(): Promise<void> {
    console.log('🧹 本番環境: =LOVE データクリーンアップ開始');
    console.log('='.repeat(80));

    try {
      // ロケーションデータ削除
      const { data: deletedLocations, error: locationError } = await supabase
        .from('locations')
        .delete()
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .select();

      if (locationError) {
        console.error('❌ ロケーション削除エラー:', locationError);
        throw locationError;
      }

      console.log(`✅ ${deletedLocations?.length || 0}件のロケーションを削除`);

      // アイテムデータ削除
      const { data: deletedItems, error: itemError } = await supabase
        .from('items')
        .delete()
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .select();

      if (itemError) {
        console.error('❌ アイテム削除エラー:', itemError);
        throw itemError;
      }

      console.log(`✅ ${deletedItems?.length || 0}件のアイテムを削除`);

      // 削除後確認
      const { count: remainingLocations } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', EQUAL_LOVE_ID);

      const { count: remainingItems } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', EQUAL_LOVE_ID);

      console.log(`📊 削除後 - ロケーション: ${remainingLocations}件, アイテム: ${remainingItems}件`);
      console.log('🎉 クリーンアップ完了\n');

    } catch (error) {
      console.error('❌ クリーンアップエラー:', error);
      throw error;
    }
  }

  // 全エピソード取得
  async getAllEpisodes(): Promise<Episode[]> {
    console.log('📺 =LOVE 全エピソード取得中...');

    try {
      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('id, video_url, title, date, celebrity_id')
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ エピソード取得エラー:', error);
        throw error;
      }

      this.stats.totalEpisodes = episodes?.length || 0;
      console.log(`✅ ${this.stats.totalEpisodes}件のエピソードを取得`);

      return episodes as Episode[] || [];

    } catch (error) {
      console.error('❌ エピソード取得エラー:', error);
      throw error;
    }
  }

  // 単一エピソードの処理
  async processEpisode(episode: Episode): Promise<number> {
    console.log(`\n🎬 処理中: ${episode.title}`);
    console.log(`📅 日付: ${new Date(episode.date).toLocaleDateString('ja-JP')}`);
    console.log(`🔗 URL: ${episode.video_url}`);

    try {
      if (!episode.video_url || !episode.video_url.includes('youtube.com') && !episode.video_url.includes('youtu.be')) {
        console.log('⏭️  YouTube動画ではないためスキップ');
        this.stats.skippedEpisodes++;
        return 0;
      }

      // YouTube概要欄から抽出
      if (!this.youtubeProcessor) {
        console.log('❌ YouTubeプロセッサが初期化されていません（OpenAI APIキーが必要）');
        this.stats.errorEpisodes++;
        return 0;
      }
      
      const extractedLocations = await this.youtubeProcessor.processVideo(episode.video_url);

      if (extractedLocations.length === 0) {
        console.log('📍 ロケーション情報なし');
        return 0;
      }

      // データベースに保存
      let savedCount = 0;
      for (const location of extractedLocations) {
        const saved = await this.saveLocation(location, episode);
        if (saved) {
          savedCount++;
        }
      }

      if (savedCount > 0) {
        this.stats.successfulExtractions++;
        this.stats.totalLocationsExtracted += savedCount;
        console.log(`✅ ${savedCount}/${extractedLocations.length}件のロケーションを保存`);
      }

      return savedCount;

    } catch (error) {
      console.error(`❌ エピソード処理エラー: ${error}`);
      this.stats.errorEpisodes++;
      return 0;
    }
  }

  // ロケーションをデータベースに保存
  private async saveLocation(location: ExtractedLocation, episode: Episode): Promise<boolean> {
    try {
      const slug = this.generateSlug(location.name);

      // 重複チェック（同じエピソードでの重複も確認）
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', location.name)
        .eq('episode_id', episode.id)
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  重複スキップ: ${location.name} (同エピソード)`);
        return false;
      }

      const locationData = {
        name: location.name,
        slug: slug,
        description: `${location.description} (動画: ${episode.title})`,
        address: location.address,
        website_url: location.service_links.googleMaps,
        tags: ['AI抽出', 'YouTube概要欄', location.confidence, 'restaurant'],
        episode_id: episode.id,  // ⭐ エピソード紐づけを追加
        celebrity_id: EQUAL_LOVE_ID
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      if (error) {
        console.error(`❌ 保存エラー (${location.name}):`, error);
        return false;
      }

      console.log(`   💾 保存: ${location.name} (${location.address})`);
      return true;

    } catch (error) {
      console.error(`❌ 保存処理エラー:`, error);
      return false;
    }
  }

  // スラッグ生成
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  }

  // 全エピソードの一括処理
  async processAllEpisodes(): Promise<void> {
    const startTime = Date.now();
    
    console.log('🚀 =LOVE 全エピソード AI抽出処理開始');
    console.log('='.repeat(80));

    try {
      // 1. 既存データクリーンアップ
      await this.cleanupExistingData();

      // 2. 全エピソード取得
      const episodes = await this.getAllEpisodes();

      if (episodes.length === 0) {
        console.log('❌ 処理対象のエピソードがありません');
        return;
      }

      // 3. 各エピソードを処理
      console.log('\n📍 ロケーション抽出処理開始');
      console.log('-'.repeat(80));

      for (const [index, episode] of episodes.entries()) {
        console.log(`\n【${index + 1}/${episodes.length}】`);
        
        await this.processEpisode(episode);
        this.stats.processedEpisodes++;

        // API制限対策（1秒待機）
        if (index < episodes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 10エピソードごとに進捗報告
        if ((index + 1) % 10 === 0) {
          console.log(`\n📊 進捗: ${index + 1}/${episodes.length} (${Math.round((index + 1) / episodes.length * 100)}%)`);
          console.log(`🎯 成功: ${this.stats.successfulExtractions}件, 総ロケーション: ${this.stats.totalLocationsExtracted}件`);
        }
      }

      // 4. 処理時間計算
      this.stats.processingTimeMinutes = Math.round((Date.now() - startTime) / 1000 / 60);

      // 5. 最終レポート
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ 処理中にエラーが発生:', error);
      throw error;
    }
  }

  // 最終レポート生成
  async generateFinalReport(): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 =LOVE 全エピソード処理完了！');
    console.log('='.repeat(80));

    // 最新のロケーション数を取得
    const { count: finalLocationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID);

    console.log('\n📊 処理結果サマリー:');
    console.log(`📺 総エピソード数: ${this.stats.totalEpisodes}件`);
    console.log(`✅ 処理済みエピソード: ${this.stats.processedEpisodes}件`);
    console.log(`🎯 ロケーション抽出成功: ${this.stats.successfulExtractions}件`);
    console.log(`📍 総抽出ロケーション数: ${this.stats.totalLocationsExtracted}件`);
    console.log(`📍 データベース保存済み: ${finalLocationCount}件`);
    console.log(`⏭️  スキップ: ${this.stats.skippedEpisodes}件`);
    console.log(`❌ エラー: ${this.stats.errorEpisodes}件`);
    console.log(`⏱️  処理時間: ${this.stats.processingTimeMinutes}分`);

    // ロケーション付与率計算
    const locationAssignmentRate = Math.round((this.stats.successfulExtractions / this.stats.totalEpisodes) * 100);
    console.log(`\n🎯 ロケーション付与率: ${locationAssignmentRate}% (${this.stats.successfulExtractions}/${this.stats.totalEpisodes})`);

    // 品質分析
    if (finalLocationCount && finalLocationCount > 0) {
      const { data: qualityData } = await supabase
        .from('locations')
        .select('tags, episode_id')
        .eq('celebrity_id', EQUAL_LOVE_ID);

      if (qualityData) {
        const highConfidence = qualityData.filter(l => l.tags?.includes('high')).length;
        const mediumConfidence = qualityData.filter(l => l.tags?.includes('medium')).length;
        const lowConfidence = qualityData.filter(l => l.tags?.includes('low')).length;
        const withEpisodes = qualityData.filter(l => l.episode_id).length;

        console.log('\n🔍 品質分析:');
        console.log(`   高信頼度: ${highConfidence}件 (${Math.round(highConfidence / finalLocationCount * 100)}%)`);
        console.log(`   中信頼度: ${mediumConfidence}件 (${Math.round(mediumConfidence / finalLocationCount * 100)}%)`);
        console.log(`   低信頼度: ${lowConfidence}件 (${Math.round(lowConfidence / finalLocationCount * 100)}%)`);
        console.log(`   エピソード紐づけ済み: ${withEpisodes}件 (${Math.round(withEpisodes / finalLocationCount * 100)}%)`);
      }
    }

    console.log('\n📱 結果確認:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/equal-love');
    
    console.log('\n' + '='.repeat(80));
  }

  // テスト実行（少数エピソードで動作確認）
  async runTest(limitEpisodes: number = 5): Promise<void> {
    console.log(`🧪 テスト実行: 最新${limitEpisodes}エピソードで動作確認`);
    console.log('='.repeat(60));

    try {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, video_url, title, date, celebrity_id')
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .order('date', { ascending: false })
        .limit(limitEpisodes);

      if (!episodes || episodes.length === 0) {
        console.log('❌ テスト対象のエピソードがありません');
        return;
      }

      console.log(`📺 ${episodes.length}件のエピソードでテスト実行\n`);

      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】`);
        await this.processEpisode(episode as Episode);
        
        if (index < episodes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log('\n🎉 テスト完了！');
      console.log(`🎯 ${this.stats.successfulExtractions}/${episodes.length}エピソードでロケーション抽出成功`);
      console.log(`📍 総${this.stats.totalLocationsExtracted}件のロケーションを抽出`);

    } catch (error) {
      console.error('❌ テスト実行エラー:', error);
    }
  }
}

// メイン実行
async function main() {
  const processor = new ProductionEqualLoveProcessor();
  
  // 環境変数チェック
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEYが設定されていません');
    console.log('テスト実行のみ行います（モックデータなし）');
    console.log('\n実際の抽出を行うには、.env.productionにOPENAI_API_KEY=sk-your-key-hereを設定してください\n');
  }

  // 実行モード選択
  const args = process.argv.slice(2);
  const mode = args[0] || 'test';

  switch (mode) {
    case 'test':
      console.log('🧪 テストモード: 最新5エピソードで動作確認');
      await processor.runTest(5);
      break;
      
    case 'full':
      console.log('🚀 フルモード: 全エピソード処理');
      if (!process.env.OPENAI_API_KEY) {
        console.log('❌ OPENAI_API_KEYが必要です');
        process.exit(1);
      }
      await processor.processAllEpisodes();
      break;
      
    case 'cleanup':
      console.log('🧹 クリーンアップモード');
      await processor.cleanupExistingData();
      break;
      
    default:
      console.log('使用方法:');
      console.log('  npm run production:equal-love test   # テスト実行');
      console.log('  npm run production:equal-love full   # 全エピソード処理');
      console.log('  npm run production:equal-love cleanup # データクリーンアップのみ');
  }
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}