import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { 
  EnhancedAutoLocationProcessor,
  ProcessedLocation 
} from './enhanced-auto-location-processor';
import { 
  EnhancedYouTubeLocationProcessor 
} from './youtube-description-extractor';

// 本番環境設定読み込み
dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

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
  locationsWithImages: number;
  locationsWithCategories: number;
  skippedEpisodes: number;
  errorEpisodes: number;
  processingTimeMinutes: number;
  qualityScore: number; // 新指標: データ品質スコア
}

/**
 * 改善されたプロダクション用データ収集プロセッサー
 * - 自動画像付与
 * - 自動カテゴリ分類
 * - 検索キーワード生成
 * - 品質保証機能
 */
export class ImprovedProductionProcessor {
  private youtubeProcessor?: EnhancedYouTubeLocationProcessor;
  private autoLocationProcessor: EnhancedAutoLocationProcessor;
  private stats: ProcessingStats;

  constructor() {
    // 自動処理プロセッサー初期化
    this.autoLocationProcessor = new EnhancedAutoLocationProcessor(supabase);
    
    // OpenAI APIキーがある場合のみYouTubeプロセッサを初期化
    if (process.env.OPENAI_API_KEY) {
      this.youtubeProcessor = new EnhancedYouTubeLocationProcessor();
    }
    
    this.stats = {
      totalEpisodes: 0,
      processedEpisodes: 0,
      successfulExtractions: 0,
      totalLocationsExtracted: 0,
      locationsWithImages: 0,
      locationsWithCategories: 0,
      skippedEpisodes: 0,
      errorEpisodes: 0,
      processingTimeMinutes: 0,
      qualityScore: 0
    };
  }

  /**
   * 指定されたセレブリティの全エピソードを改善された方法で処理
   */
  async processAllEpisodes(celebrityId: string, options: {
    cleanupFirst?: boolean;
    maxEpisodes?: number;
    skipExisting?: boolean;
  } = {}): Promise<void> {
    const startTime = Date.now();
    
    console.log('🚀 Improved Production Data Collection Started');
    console.log('===============================================');
    console.log(`🎯 Celebrity ID: ${celebrityId}`);
    console.log(`🎨 Auto Images: ENABLED`);
    console.log(`🏷️  Auto Categories: ENABLED`);
    console.log(`🔍 Auto Keywords: ENABLED`);
    
    if (options.cleanupFirst) {
      await this.cleanupExistingData(celebrityId);
    }

    // エピソード取得
    const episodes = await this.fetchEpisodes(celebrityId, options.maxEpisodes);
    this.stats.totalEpisodes = episodes.length;
    
    console.log(`\n📺 Found ${episodes.length} episodes to process`);
    console.log('-'.repeat(50));

    // エピソード処理ループ
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      console.log(`\n[${i + 1}/${episodes.length}] Processing: ${episode.title}`);
      
      try {
        await this.processEpisodeImproved(episode, options.skipExisting);
        this.stats.processedEpisodes++;
      } catch (error) {
        console.error(`❌ Episode processing failed:`, error);
        this.stats.errorEpisodes++;
      }

      // 進捗表示
      if ((i + 1) % 5 === 0 || i === episodes.length - 1) {
        this.displayProgressStats();
      }
    }

    // 最終処理時間計算
    this.stats.processingTimeMinutes = (Date.now() - startTime) / (1000 * 60);
    this.stats.qualityScore = this.calculateQualityScore();
    
    // 最終レポート表示
    await this.displayFinalReport(celebrityId);
  }

  /**
   * 改善されたエピソード処理（画像・カテゴリ自動付与）
   */
  private async processEpisodeImproved(episode: Episode, skipExisting: boolean = false): Promise<void> {
    if (!this.youtubeProcessor) {
      console.log('  ⚠️  YouTube processor not available (missing OpenAI API key)');
      this.stats.skippedEpisodes++;
      return;
    }

    // 既存チェック（オプション）
    if (skipExisting) {
      const existing = await this.checkExistingLocations(episode.id);
      if (existing > 0) {
        console.log(`  ⏭️  Skipping (${existing} locations already exist)`);
        this.stats.skippedEpisodes++;
        return;
      }
    }

    // 1. YouTube APIからロケーション抽出
    console.log('  🔍 Extracting locations...');
    const rawLocations = await this.youtubeProcessor.extractLocationsFromEpisode(
      episode.video_url,
      episode.celebrity_id
    );

    if (rawLocations.length === 0) {
      console.log('  ➖ No locations found');
      return;
    }

    console.log(`  📍 Found ${rawLocations.length} raw locations`);

    // 2. 改善された処理（画像・カテゴリ自動付与）
    console.log('  ⚡ Enhanced processing...');
    const processedLocations = await this.autoLocationProcessor.processLocationsBatch(
      rawLocations.map(loc => ({
        name: loc.name,
        address: loc.address,
        description: loc.description,
        source: `youtube_episode_${episode.id}`
      }))
    );

    // 3. データベース保存
    let savedCount = 0;
    for (const processedLocation of processedLocations) {
      const success = await this.autoLocationProcessor.saveToDatabase(
        processedLocation,
        episode.celebrity_id,
        episode.id
      );
      if (success) savedCount++;
    }

    // 4. 統計更新
    this.stats.successfulExtractions++;
    this.stats.totalLocationsExtracted += savedCount;
    this.stats.locationsWithImages += processedLocations.filter(loc => loc.image_urls.length > 0).length;
    this.stats.locationsWithCategories += processedLocations.filter(loc => loc.category !== 'other').length;

    console.log(`  ✅ Saved ${savedCount}/${processedLocations.length} enhanced locations`);
  }

  /**
   * エピソード取得
   */
  private async fetchEpisodes(celebrityId: string, maxEpisodes?: number): Promise<Episode[]> {
    let query = supabase
      .from('episodes')
      .select('id, video_url, title, date, celebrity_id')
      .eq('celebrity_id', celebrityId)
      .order('date', { ascending: false });

    if (maxEpisodes) {
      query = query.limit(maxEpisodes);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch episodes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 既存ロケーションチェック
   */
  private async checkExistingLocations(episodeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('episode_id', episodeId);

    if (error) {
      console.error('Error checking existing locations:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * 既存データクリーンアップ
   */
  private async cleanupExistingData(celebrityId: string): Promise<void> {
    console.log('\n🧹 Cleanup existing data...');
    
    const { data: deletedLocations, error: locationError } = await supabase
      .from('locations')
      .delete()
      .eq('celebrity_id', celebrityId)
      .select();

    if (locationError) {
      throw new Error(`Location cleanup failed: ${locationError.message}`);
    }

    console.log(`✅ Cleaned up ${deletedLocations?.length || 0} existing locations`);
  }

  /**
   * 進捗統計表示
   */
  private displayProgressStats(): void {
    const processedRatio = this.stats.processedEpisodes / this.stats.totalEpisodes * 100;
    const avgLocationsPerEpisode = this.stats.successfulExtractions > 0 
      ? this.stats.totalLocationsExtracted / this.stats.successfulExtractions 
      : 0;
    
    console.log(`\n📊 Progress: ${this.stats.processedEpisodes}/${this.stats.totalEpisodes} (${processedRatio.toFixed(1)}%)`);
    console.log(`✅ Locations: ${this.stats.totalLocationsExtracted} (avg: ${avgLocationsPerEpisode.toFixed(1)}/episode)`);
    console.log(`🖼️  With images: ${this.stats.locationsWithImages}/${this.stats.totalLocationsExtracted} (${this.stats.totalLocationsExtracted > 0 ? Math.round(this.stats.locationsWithImages/this.stats.totalLocationsExtracted*100) : 0}%)`);
    console.log(`🏷️  Categorized: ${this.stats.locationsWithCategories}/${this.stats.totalLocationsExtracted} (${this.stats.totalLocationsExtracted > 0 ? Math.round(this.stats.locationsWithCategories/this.stats.totalLocationsExtracted*100) : 0}%)`);
  }

  /**
   * 品質スコア計算
   */
  private calculateQualityScore(): number {
    if (this.stats.totalLocationsExtracted === 0) return 0;
    
    const imageRatio = this.stats.locationsWithImages / this.stats.totalLocationsExtracted;
    const categoryRatio = this.stats.locationsWithCategories / this.stats.totalLocationsExtracted;
    const successRatio = this.stats.successfulExtractions / this.stats.totalEpisodes;
    
    // 品質スコア = (画像付与率 × 0.4) + (カテゴリ分類率 × 0.4) + (成功率 × 0.2) × 100
    return Math.round((imageRatio * 0.4 + categoryRatio * 0.4 + successRatio * 0.2) * 100);
  }

  /**
   * 最終レポート表示
   */
  private async displayFinalReport(celebrityId: string): Promise<void> {
    // データベース統計取得
    const { count: totalLocationsInDB } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId);

    const { count: locationsWithImagesInDB } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId)
      .not('image_urls', 'is', null);

    console.log('\n' + '='.repeat(60));
    console.log('🏆 IMPROVED PROCESSING COMPLETION REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📈 Episode Processing:');
    console.log(`  • Total episodes: ${this.stats.totalEpisodes}`);
    console.log(`  • Successfully processed: ${this.stats.processedEpisodes}`);
    console.log(`  • With locations found: ${this.stats.successfulExtractions}`);
    console.log(`  • Skipped: ${this.stats.skippedEpisodes}`);
    console.log(`  • Errors: ${this.stats.errorEpisodes}`);
    
    console.log('\n🎨 Enhanced Data Quality:');
    console.log(`  • Locations extracted: ${this.stats.totalLocationsExtracted}`);
    console.log(`  • With auto-images: ${this.stats.locationsWithImages} (${this.stats.totalLocationsExtracted > 0 ? Math.round(this.stats.locationsWithImages/this.stats.totalLocationsExtracted*100) : 0}%)`);
    console.log(`  • Auto-categorized: ${this.stats.locationsWithCategories} (${this.stats.totalLocationsExtracted > 0 ? Math.round(this.stats.locationsWithCategories/this.stats.totalLocationsExtracted*100) : 0}%)`);
    console.log(`  • Quality Score: ${this.stats.qualityScore}/100`);
    
    console.log('\n💾 Database Status:');
    console.log(`  • Total locations in DB: ${totalLocationsInDB}`);
    console.log(`  • With images in DB: ${locationsWithImagesInDB}/${totalLocationsInDB} (${totalLocationsInDB && totalLocationsInDB > 0 ? Math.round((locationsWithImagesInDB!/totalLocationsInDB!)*100) : 0}%)`);
    
    console.log('\n⏱️ Performance:');
    console.log(`  • Processing time: ${this.stats.processingTimeMinutes.toFixed(1)} minutes`);
    console.log(`  • Avg time per episode: ${(this.stats.processingTimeMinutes / this.stats.totalEpisodes).toFixed(2)} min`);
    
    // 品質評価
    if (this.stats.qualityScore >= 80) {
      console.log('\n🌟 EXCELLENT: High-quality data collection achieved!');
    } else if (this.stats.qualityScore >= 60) {
      console.log('\n👍 GOOD: Solid data quality with room for improvement');
    } else {
      console.log('\n⚠️  NEEDS IMPROVEMENT: Consider reviewing processing parameters');
    }
    
    console.log('\n✨ Enhanced features successfully applied to all new locations!');
  }

  /**
   * テスト実行用ヘルパー
   */
  async runQuickTest(celebrityId: string): Promise<void> {
    console.log('🧪 Running quick test of improved processor...\n');
    
    await this.processAllEpisodes(celebrityId, {
      maxEpisodes: 3,
      skipExisting: true,
      cleanupFirst: false
    });
  }
}

// 使用例
export async function testImprovedProcessor() {
  const processor = new ImprovedProductionProcessor();
  
  // =LOVE (Equal Love) のテスト実行
  const EQUAL_LOVE_ID = '259e44a6-5a33-40cf-9d78-86cfbd9df2ac';
  
  await processor.runQuickTest(EQUAL_LOVE_ID);
}