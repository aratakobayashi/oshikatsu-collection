import { createClient } from '@supabase/supabase-js';
import { 
  EnhancedYouTubeLocationProcessor, 
  ExtractedLocation,
  RestaurantInfo,
  ServiceLinks 
} from './youtube-description-extractor';

interface Episode {
  id: string;
  video_url: string;
  title: string;
  celebrity_id: string;
}

interface DatabaseLocation {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  image_url?: string;
  website_url?: string;
  category?: string;
  tags?: string[];
  episode_id: string;
  celebrity_id: string;
  service_links?: ServiceLinks;
  confidence?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export class DatabaseLocationProcessor {
  private supabase: any;
  private youtubeProcessor: EnhancedYouTubeLocationProcessor;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    );
    
    this.youtubeProcessor = new EnhancedYouTubeLocationProcessor();
  }

  // スラッグ生成
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 特殊文字を除去
      .replace(/\s+/g, '-')     // スペースをハイフンに
      .replace(/-+/g, '-')      // 連続ハイフンを単一に
      .trim();
  }

  // 重複チェック
  private async isDuplicateLocation(name: string, address: string, episodeId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('locations')
      .select('id')
      .eq('episode_id', episodeId)
      .eq('name', name)
      .limit(1);

    if (error) {
      console.error('Duplicate check error:', error);
      return false;
    }

    return data && data.length > 0;
  }

  // 抽出されたロケーションをデータベースに保存
  async saveExtractedLocation(location: ExtractedLocation, episodeId: string, celebrityId: string): Promise<boolean> {
    try {
      // 重複チェック
      if (await this.isDuplicateLocation(location.name, location.address, episodeId)) {
        console.log(`⏭️  重複スキップ: ${location.name}`);
        return false;
      }

      const slug = this.generateSlug(location.name);
      
      // service_linksをJSONとして保存するためにlocationsテーブルのスキーマ更新が必要
      // 今回はwebsite_urlにGoogle Mapsリンクを設定
      const dbLocation: DatabaseLocation = {
        name: location.name,
        slug: slug,
        description: location.description,
        address: location.address,
        website_url: location.service_links.googleMaps,
        category: location.category,
        tags: ['AI抽出', 'YouTube概要欄', location.confidence],
        episode_id: episodeId,
        celebrity_id: celebrityId,
        confidence: location.confidence,
        source: location.source
      };

      const { data, error } = await this.supabase
        .from('locations')
        .insert([dbLocation])
        .select();

      if (error) {
        console.error('Database save error:', error);
        return false;
      }

      console.log(`✅ 保存完了: ${location.name} (${location.address})`);
      
      // service_linksを別途保存（カスタムテーブルまたはメタデータとして）
      await this.saveServiceLinks(data[0].id, location.service_links);
      
      return true;
    } catch (error) {
      console.error('Save location error:', error);
      return false;
    }
  }

  // サービスリンクを保存（将来的にはlocation_linksテーブルなどに）
  private async saveServiceLinks(locationId: string, serviceLinks: ServiceLinks): Promise<void> {
    // 現在はconsole出力のみ。実際にはlocation_linksテーブルなどに保存
    console.log(`🔗 サービスリンク (Location ID: ${locationId}):`);
    console.log(`   ぐるなび: ${serviceLinks.gurunavi}`);
    console.log(`   食べログ: ${serviceLinks.tabelog}`);
    console.log(`   ホットペッパー: ${serviceLinks.hotpepper}`);
    console.log(`   Retty: ${serviceLinks.retty}`);
    
    // TODO: 専用テーブルに保存
    // const linkData = {
    //   location_id: locationId,
    //   gurunavi_url: serviceLinks.gurunavi,
    //   tabelog_url: serviceLinks.tabelog,
    //   hotpepper_url: serviceLinks.hotpepper,
    //   retty_url: serviceLinks.retty
    // };
  }

  // 特定のエピソードを処理
  async processEpisode(episodeId: string): Promise<number> {
    console.log(`\n🎬 エピソード処理開始: ${episodeId}`);
    
    // エピソード情報取得
    const { data: episodes, error } = await this.supabase
      .from('episodes')
      .select('id, video_url, title, celebrity_id')
      .eq('id', episodeId)
      .limit(1);

    if (error || !episodes || episodes.length === 0) {
      console.error('Episode not found:', error);
      return 0;
    }

    const episode: Episode = episodes[0];
    
    if (!episode.video_url) {
      console.log('Video URL not found');
      return 0;
    }

    console.log(`📺 動画: ${episode.title}`);
    console.log(`🔗 URL: ${episode.video_url}`);

    // YouTube概要欄から飲食店情報を抽出
    const extractedLocations = await this.youtubeProcessor.processVideo(episode.video_url);
    
    if (extractedLocations.length === 0) {
      console.log('飲食店情報が見つかりませんでした');
      return 0;
    }

    // データベースに保存
    let savedCount = 0;
    for (const location of extractedLocations) {
      const saved = await this.saveExtractedLocation(location, episode.id, episode.celebrity_id);
      if (saved) {
        savedCount++;
      }
    }

    console.log(`📊 ${savedCount}/${extractedLocations.length}件のロケーションを保存`);
    return savedCount;
  }

  // 特定のセレブリティの全エピソードを処理
  async processCelebrityEpisodes(celebrityId: string, limit: number = 10): Promise<void> {
    console.log('='.repeat(80));
    console.log(`🌟 セレブリティ処理開始: ${celebrityId}`);
    console.log('='.repeat(80));

    // エピソード一覧取得
    const { data: episodes, error } = await this.supabase
      .from('episodes')
      .select('id, video_url, title, celebrity_id')
      .eq('celebrity_id', celebrityId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error || !episodes) {
      console.error('Failed to fetch episodes:', error);
      return;
    }

    console.log(`📺 ${episodes.length}件のエピソードを処理`);

    let totalSaved = 0;
    
    for (const [index, episode] of episodes.entries()) {
      console.log(`\n📍 進捗: ${index + 1}/${episodes.length}`);
      
      const savedCount = await this.processEpisode(episode.id);
      totalSaved += savedCount;
      
      // API制限対策で少し待機
      if (index < episodes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`🎉 処理完了: 合計${totalSaved}件のロケーションを保存`);
    console.log('='.repeat(80));
  }

  // =LOVE専用の処理
  async processEqualLove(): Promise<void> {
    const EQUAL_LOVE_ID = '259e44a6-5a33-40cf-9d78-86cfbd9df2ac';
    
    console.log('🌟 =LOVE のYouTube概要欄ベース飲食店抽出を開始');
    
    // 既存のAI抽出データをクリーンアップ（オプション）
    console.log('🧹 既存のAI抽出データをクリーンアップ中...');
    const { error: deleteError } = await this.supabase
      .from('locations')
      .delete()
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .eq('source', 'youtube_description');
    
    if (deleteError) {
      console.error('Cleanup error:', deleteError);
    } else {
      console.log('✅ クリーンアップ完了');
    }

    // 最新10エピソードを処理
    await this.processCelebrityEpisodes(EQUAL_LOVE_ID, 10);
  }
}

// テスト実行
async function main() {
  const processor = new DatabaseLocationProcessor();
  
  // =LOVEの処理実行
  await processor.processEqualLove();
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}