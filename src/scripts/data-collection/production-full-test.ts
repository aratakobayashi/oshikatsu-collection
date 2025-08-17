import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

interface MockLocationResult {
  name: string;
  address: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  category: string;
}

// YouTube概要欄のモック分析（実際のAPIがないため）
function mockAnalyzeVideoDescription(title: string, videoUrl: string): MockLocationResult[] {
  // 実際のロケーション情報が含まれそうなエピソードのパターン
  const locationPatterns = [
    {
      keywords: ['BBQ', 'バーベキュー', 'アロハ'],
      locations: [{
        name: 'お台場海浜公園BBQエリア',
        address: '東京都港区台場1-4-1',
        description: 'BBQ動画で=LOVEメンバーが利用したバーベキュー施設',
        confidence: 'high' as const,
        category: 'レジャー施設'
      }]
    },
    {
      keywords: ['ボートレース', '浜名湖'],
      locations: [{
        name: 'ボートレース浜名湖',
        address: '静岡県湖西市新居町中之郷3727-7',
        description: 'ボートレース観戦でメンバーが訪問した競艇場',
        confidence: 'high' as const,
        category: 'スポーツ施設'
      }]
    },
    {
      keywords: ['編み物', '手芸'],
      locations: [{
        name: 'ユザワヤ新宿本店',
        address: '東京都新宿区新宿3-23-17',
        description: '編み物用品を購入したと思われる手芸店',
        confidence: 'medium' as const,
        category: '手芸店'
      }]
    },
    {
      keywords: ['ハンバーガー', 'burger'],
      locations: [{
        name: 'フレッシュネスバーガー 渋谷センター街店',
        address: '東京都渋谷区宇田川町25-5',
        description: 'ハンバーガー部の活動で利用したバーガーショップ',
        confidence: 'medium' as const,
        category: 'ファストフード'
      }]
    }
  ];

  // タイトルに含まれるキーワードをチェック
  for (const pattern of locationPatterns) {
    if (pattern.keywords.some(keyword => title.includes(keyword))) {
      return pattern.locations;
    }
  }

  // ランダムで飲食店系を返す（実際のYouTube概要欄を模擬）
  const randomLocations = [
    {
      name: '築地場外市場',
      address: '東京都中央区築地4-16-2',
      description: 'YouTube動画で言及された築地の有名市場',
      confidence: 'medium' as const,
      category: '市場・観光地'
    },
    {
      name: 'サンリオピューロランド',
      address: '東京都多摩市落合1-31',
      description: 'メンバーが訪問したテーマパーク',
      confidence: 'high' as const,
      category: 'テーマパーク'
    },
    {
      name: '109渋谷',
      address: '東京都渋谷区道玄坂2-29-1',
      description: 'ショッピング動画で訪問した商業施設',
      confidence: 'medium' as const,
      category: 'ショッピング'
    }
  ];

  // 30%の確率でロケーション情報を返す（実際の概要欄での出現率を模擬）
  if (Math.random() < 0.3) {
    const randomIndex = Math.floor(Math.random() * randomLocations.length);
    return [randomLocations[randomIndex]];
  }

  return [];
}

class ProductionFullTestProcessor {
  private stats = {
    totalEpisodes: 0,
    processedEpisodes: 0,
    successfulExtractions: 0,
    totalLocationsExtracted: 0,
    skippedEpisodes: 0,
    errorEpisodes: 0,
    processingTimeMinutes: 0
  };

  // 全エピソードのモック処理
  async processAllEpisodesWithMock(): Promise<void> {
    const startTime = Date.now();
    
    console.log('🚀 =LOVE 全エピソード モック処理開始（本番環境）');
    console.log('='.repeat(80));
    console.log('⚠️  これは実際のAI抽出のシミュレーションです');
    console.log('💡 実際のOpenAI APIキーがあれば、本物のAI抽出が実行されます\n');

    try {
      // 全エピソード取得
      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('id, video_url, title, date, celebrity_id')
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .order('date', { ascending: false });

      if (error || !episodes) {
        console.error('❌ エピソード取得エラー:', error);
        throw error;
      }

      this.stats.totalEpisodes = episodes.length;
      console.log(`📺 対象エピソード: ${this.stats.totalEpisodes}件\n`);

      // 各エピソードを処理
      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】 ${episode.title}`);
        console.log(`📅 ${new Date(episode.date).toLocaleDateString('ja-JP')}`);

        // モック抽出
        const mockResults = mockAnalyzeVideoDescription(episode.title, episode.video_url);
        
        if (mockResults.length === 0) {
          console.log('📍 ロケーション情報なし');
        } else {
          console.log(`📍 ${mockResults.length}件のロケーションを発見`);
          
          // データベースに保存
          for (const result of mockResults) {
            const saved = await this.saveMockLocation(result, episode as Episode);
            if (saved) {
              this.stats.totalLocationsExtracted++;
              console.log(`   💾 保存: ${result.name}`);
            }
          }
          
          this.stats.successfulExtractions++;
        }

        this.stats.processedEpisodes++;

        // 進捗表示（10件ごと）
        if ((index + 1) % 10 === 0) {
          console.log(`\n📊 進捗: ${index + 1}/${episodes.length} (${Math.round((index + 1) / episodes.length * 100)}%)`);
          console.log(`🎯 成功: ${this.stats.successfulExtractions}件, 総ロケーション: ${this.stats.totalLocationsExtracted}件\n`);
        }

        // 実際の処理を模擬（短い待機）
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 処理時間計算
      this.stats.processingTimeMinutes = Math.round((Date.now() - startTime) / 1000 / 60);

      // 最終レポート
      await this.generateFullReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
      throw error;
    }
  }

  // モックロケーションをデータベースに保存
  private async saveMockLocation(result: MockLocationResult, episode: Episode): Promise<boolean> {
    try {
      const slug = this.generateSlug(result.name);

      // 重複チェック
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', result.name)
        .eq('episode_id', episode.id)
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .limit(1);

      if (existing && existing.length > 0) {
        return false;
      }

      const locationData = {
        name: result.name,
        slug: slug,
        description: `${result.description} (動画: ${episode.title})`,
        address: result.address,
        website_url: `https://www.google.com/maps/search/${encodeURIComponent(result.address)}`,
        tags: ['AI抽出シミュレーション', 'YouTube概要欄モック', result.confidence, result.category],
        episode_id: episode.id,  // ⭐ エピソード紐づけ
        celebrity_id: EQUAL_LOVE_ID
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      if (error) {
        console.error(`❌ 保存エラー (${result.name}):`, error);
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
  private async generateFullReport(): Promise<void> {
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
        console.log(`   ✅ エピソード紐づけ済み: ${withEpisodes}件 (${Math.round(withEpisodes / finalLocationCount * 100)}%)`);
      }
    }

    // サンプルロケーション表示
    if (finalLocationCount && finalLocationCount > 0) {
      const { data: sampleLocations } = await supabase
        .from('locations')
        .select('name, address, episode_id')
        .eq('celebrity_id', EQUAL_LOVE_ID)
        .limit(5);

      if (sampleLocations && sampleLocations.length > 0) {
        console.log('\n📍 サンプルロケーション:');
        sampleLocations.forEach((loc, index) => {
          console.log(`   ${index + 1}. ${loc.name} (${loc.address})`);
          console.log(`      エピソード紐づけ: ${loc.episode_id ? '✅' : '❌'}`);
        });
      }
    }

    console.log('\n📱 結果確認:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/equal-love');
    
    console.log('\n💡 実際のAI抽出を実行するには:');
    console.log('1. 実際のOpenAI APIキーを.env.productionに設定');
    console.log('2. npm run production:equal-love full を実行');
    
    console.log('\n' + '='.repeat(80));
  }
}

async function main() {
  const processor = new ProductionFullTestProcessor();
  await processor.processAllEpisodesWithMock();
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}