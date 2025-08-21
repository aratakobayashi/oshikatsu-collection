import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { YouTubeDescriptionExtractor, RestaurantLinkGenerator } from './youtube-description-extractor';

// 本番環境設定読み込み
dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const NOT_EQUAL_ME_ID = 'ed64611c-a6e5-4b84-a36b-7383b73913d5';

interface Episode {
  id: string;
  video_url: string;
  title: string;
  date: string;
  celebrity_id: string;
}

export class NotEqualMeLocationProcessor {
  private extractor: YouTubeDescriptionExtractor;
  private linkGenerator: RestaurantLinkGenerator;
  private stats = {
    totalEpisodes: 0,
    processedEpisodes: 0,
    successfulExtractions: 0,
    totalLocationsExtracted: 0,
    skippedEpisodes: 0,
    errorEpisodes: 0,
    apiErrors: 0,
    duplicatesSkipped: 0
  };

  constructor() {
    this.extractor = new YouTubeDescriptionExtractor();
    this.linkGenerator = new RestaurantLinkGenerator();
  }

  // 既存の低品質ロケーションデータをクリーンアップ
  async cleanupExistingData(): Promise<void> {
    console.log('🧹 ≠ME 既存ロケーションデータのクリーンアップ');
    console.log('-'.repeat(60));

    try {
      // 既存の低品質データを確認
      const { data: existingLocations, error: fetchError } = await supabase
        .from('locations')
        .select('id, name, address, tags')
        .eq('celebrity_id', NOT_EQUAL_ME_ID);

      if (fetchError) {
        throw new Error(`既存データ取得エラー: ${fetchError.message}`);
      }

      console.log(`📍 既存ロケーション数: ${existingLocations?.length || 0}件`);

      if (existingLocations && existingLocations.length > 0) {
        // 住所なし、または低品質データをフィルタ
        const lowQualityLocations = existingLocations.filter(loc => 
          !loc.address || 
          loc.address === 'null' || 
          loc.tags?.includes('自動抽出') ||
          loc.tags?.includes('スコア5') ||
          loc.tags?.includes('スコア10')
        );

        console.log(`🗑️  削除対象: ${lowQualityLocations.length}件（住所なし・低品質データ）`);

        if (lowQualityLocations.length > 0) {
          const idsToDelete = lowQualityLocations.map(loc => loc.id);
          
          const { error: deleteError } = await supabase
            .from('locations')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) {
            console.error('❌ 削除エラー:', deleteError);
          } else {
            console.log(`✅ ${lowQualityLocations.length}件の低品質データを削除完了`);
          }
        }
      }

      console.log('✅ クリーンアップ完了\n');
    } catch (error) {
      console.error('❌ クリーンアップエラー:', error);
      throw error;
    }
  }

  // ≠MEの全エピソードを処理
  async processAllEpisodesWithAI(): Promise<void> {
    const startTime = Date.now();
    
    console.log('🚀 ≠ME 全エピソード AI抽出処理開始（本番環境）');
    console.log('='.repeat(80));
    console.log('🤖 OpenAI GPT-4による高精度抽出システム');
    console.log('📺 YouTube概要欄からロケーション情報を構造化抽出\n');

    try {
      // 1. 既存データのクリーンアップ
      await this.cleanupExistingData();

      // 2. 全エピソード取得
      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('id, video_url, title, date, celebrity_id')
        .eq('celebrity_id', NOT_EQUAL_ME_ID)
        .order('date', { ascending: false });

      if (error || !episodes) {
        console.error('❌ エピソード取得エラー:', error);
        throw error;
      }

      this.stats.totalEpisodes = episodes.length;
      console.log(`📺 対象エピソード: ${this.stats.totalEpisodes}件\n`);

      // 3. API キー確認
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-test')) {
        console.log('⚠️  OpenAI APIキーが未設定またはテスト用です');
        console.log('💡 実際の抽出にはOpenAI APIキーが必要です');
        console.log('🔄 モックデータで処理を継続します\n');
      }

      // 4. 各エピソードを処理
      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】 ${episode.title}`);
        console.log(`📅 ${new Date(episode.date).toLocaleDateString('ja-JP')}`);
        console.log(`🎬 ${episode.video_url}`);

        try {
          // YouTube URLからVideo IDを抽出
          const videoId = this.extractor.extractVideoId(episode.video_url);
          if (!videoId) {
            console.log('❌ Video ID抽出失敗');
            this.stats.skippedEpisodes++;
            continue;
          }

          // AI抽出実行
          const extractedLocations = await this.extractLocationsFromEpisode(episode, videoId);
          
          if (extractedLocations.length === 0) {
            console.log('📍 ロケーション情報なし');
          } else {
            console.log(`📍 ${extractedLocations.length}件のロケーションを発見`);
            
            // データベースに保存
            for (const location of extractedLocations) {
              const saved = await this.saveLocation(location, episode as Episode);
              if (saved) {
                this.stats.totalLocationsExtracted++;
                console.log(`   💾 保存: ${location.name} (${location.confidence})`);
              } else {
                this.stats.duplicatesSkipped++;
                console.log(`   ⚠️  重複スキップ: ${location.name}`);
              }
            }
            
            this.stats.successfulExtractions++;
          }

          this.stats.processedEpisodes++;

          // 進捗表示（20件ごと）
          if ((index + 1) % 20 === 0) {
            console.log(`\n📊 進捗: ${index + 1}/${episodes.length} (${Math.round((index + 1) / episodes.length * 100)}%)`);
            console.log(`🎯 成功: ${this.stats.successfulExtractions}件, 総ロケーション: ${this.stats.totalLocationsExtracted}件`);
            console.log(`❌ エラー: ${this.stats.errorEpisodes}件, API制限: ${this.stats.apiErrors}件\n`);
          }

          // API制限を考慮した待機（実際のAPI使用時）
          if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-test')) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error) {
          console.error(`❌ エピソード処理エラー (${episode.title}):`, error);
          this.stats.errorEpisodes++;
          
          if (error.message?.includes('rate_limit')) {
            this.stats.apiErrors++;
            console.log('⏱️  API制限のため5分間待機...');
            await new Promise(resolve => setTimeout(resolve, 300000));
          }
        }
      }

      // 処理時間計算
      const processingTime = Math.round((Date.now() - startTime) / 1000 / 60);

      // 最終レポート
      await this.generateFinalReport(processingTime);

    } catch (error) {
      console.error('❌ 処理エラー:', error);
      throw error;
    }
  }

  // エピソードからロケーション抽出
  private async extractLocationsFromEpisode(episode: Episode, videoId: string) {
    try {
      // YouTube概要欄取得
      const description = await this.extractor.getVideoDescription(videoId);
      
      if (!description) {
        return [];
      }

      // AI抽出実行
      const restaurants = await this.extractor.extractRestaurantInfo(description);
      
      // ExtractedLocation形式に変換
      const extractedLocations = [];
      
      for (const restaurant of restaurants) {
        // サービスリンク生成
        const serviceLinks = await this.linkGenerator.generateServiceLinks(restaurant);
        
        extractedLocations.push({
          name: restaurant.name,
          address: restaurant.address,
          category: this.mapTypeToCategory(restaurant.type),
          description: `${restaurant.mentioned_context} (動画: ${episode.title})`,
          confidence: restaurant.confidence,
          service_links: serviceLinks,
          source: 'youtube_description' as const
        });
      }

      return extractedLocations;
    } catch (error) {
      console.error('❌ ロケーション抽出エラー:', error);
      return [];
    }
  }

  // 料理タイプをカテゴリにマッピング
  private mapTypeToCategory(type: string): string {
    const mapping: { [key: string]: string } = {
      '和食': 'restaurant',
      '洋食': 'restaurant',
      '中華': 'restaurant',
      'イタリアン': 'restaurant',
      'フレンチ': 'restaurant',
      'カフェ': 'cafe',
      'ラーメン': 'restaurant',
      '焼肉': 'restaurant',
      '寿司': 'restaurant',
      'ファストフード': 'restaurant',
      'バー': 'restaurant',
      'その他': 'other'
    };
    
    return mapping[type] || 'restaurant';
  }

  // ロケーションをデータベースに保存
  private async saveLocation(location: any, episode: Episode): Promise<boolean> {
    try {
      const slug = this.generateSlug(location.name);

      // 重複チェック（名前とエピソードID）
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', location.name)
        .eq('episode_id', episode.id)
        .eq('celebrity_id', NOT_EQUAL_ME_ID)
        .limit(1);

      if (existing && existing.length > 0) {
        return false; // 重複
      }

      const locationData = {
        name: location.name,
        slug: slug,
        description: location.description,
        address: location.address,
        website_url: location.service_links.googleMaps,
        tags: ['AI抽出', 'YouTube概要欄', location.confidence, location.category, '≠ME'],
        episode_id: episode.id,
        celebrity_id: NOT_EQUAL_ME_ID,
        category: location.category
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      if (error) {
        console.error(`❌ 保存エラー (${location.name}):`, error);
        return false;
      }

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

  // 最終レポート
  private async generateFinalReport(processingTimeMinutes: number): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 ≠ME 全エピソード処理完了！');
    console.log('='.repeat(80));

    // 最新のロケーション数を取得
    const { count: finalLocationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', NOT_EQUAL_ME_ID);

    console.log('\n📊 処理結果サマリー:');
    console.log(`📺 総エピソード数: ${this.stats.totalEpisodes}件`);
    console.log(`✅ 処理済みエピソード: ${this.stats.processedEpisodes}件`);
    console.log(`🎯 ロケーション抽出成功: ${this.stats.successfulExtractions}件`);
    console.log(`📍 総抽出ロケーション数: ${this.stats.totalLocationsExtracted}件`);
    console.log(`📍 データベース保存済み: ${finalLocationCount}件`);
    console.log(`⚠️  重複スキップ: ${this.stats.duplicatesSkipped}件`);
    console.log(`❌ エラー数: ${this.stats.errorEpisodes}件`);
    console.log(`🚫 API制限エラー: ${this.stats.apiErrors}件`);
    console.log(`⏱️  処理時間: ${processingTimeMinutes}分`);

    // ロケーション付与率計算
    const locationAssignmentRate = Math.round((this.stats.successfulExtractions / this.stats.totalEpisodes) * 100);
    console.log(`\n🎯 ロケーション付与率: ${locationAssignmentRate}% (${this.stats.successfulExtractions}/${this.stats.totalEpisodes})`);

    // 品質分析
    if (finalLocationCount && finalLocationCount > 0) {
      const { data: qualityData } = await supabase
        .from('locations')
        .select('tags, episode_id')
        .eq('celebrity_id', NOT_EQUAL_ME_ID);

      if (qualityData) {
        const highConfidence = qualityData.filter(l => l.tags?.includes('high')).length;
        const mediumConfidence = qualityData.filter(l => l.tags?.includes('medium')).length;
        const lowConfidence = qualityData.filter(l => l.tags?.includes('low')).length;
        const withEpisodes = qualityData.filter(l => l.episode_id).length;

        console.log('\n🔍 品質分析:');
        console.log(`   高信頼度: ${highConfidence}件 (${Math.round(highConfidence / finalLocationCount * 100)}%)`);
        console.log(`   中信頼度: ${mediumConfidence}件 (${Math.round(mediumConfidence / finalLocationCount * 100)}%)`);
        console.log(`   低信頼度: ${lowConfidence}件 (${Math.round(lowConfidence / finalLocationCount * 100)}%)`);
        console.log(`   ✅ エピソード紐づけ済み: ${withEpisodes}件 (${Math.round(withEpisodes / finalLocationCount * 100)}%)`);
      }
    }

    // サンプルロケーション表示
    if (finalLocationCount && finalLocationCount > 0) {
      const { data: sampleLocations } = await supabase
        .from('locations')
        .select('name, address, tags, episode_id')
        .eq('celebrity_id', NOT_EQUAL_ME_ID)
        .order('created_at', { ascending: false })
        .limit(5);

      if (sampleLocations && sampleLocations.length > 0) {
        console.log('\n📍 最新ロケーションサンプル:');
        sampleLocations.forEach((loc, index) => {
          console.log(`   ${index + 1}. ${loc.name}`);
          console.log(`      📮 ${loc.address || '住所不明'}`);
          console.log(`      📺 エピソード紐づけ: ${loc.episode_id ? '✅' : '❌'}`);
          console.log(`      🏷️  ${loc.tags?.filter(tag => ['high', 'medium', 'low'].includes(tag))[0] || '信頼度不明'}`);
        });
      }
    }

    console.log('\n📱 結果確認:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/not-equal-me');
    
    console.log('\n💡 今後の改善案:');
    console.log('1. 概要欄の構造分析による抽出精度向上');
    console.log('2. 重複ロケーションの自動統合');
    console.log('3. ファンによる情報確認システム');
    
    console.log('\n' + '='.repeat(80));
  }
}

async function main() {
  const processor = new NotEqualMeLocationProcessor();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'process';

  switch (command) {
    case 'cleanup':
      console.log('🧹 クリーンアップのみ実行');
      await processor.cleanupExistingData();
      break;
      
    case 'process':
      console.log('🚀 ≠ME 全エピソード処理開始');
      await processor.processAllEpisodesWithAI();
      break;
      
    default:
      console.log('使用方法:');
      console.log('  npm run production:not-equal-me cleanup  # 既存データクリーンアップ');
      console.log('  npm run production:not-equal-me process  # 全エピソード処理');
  }
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}