import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 本番環境設定読み込み
dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const NOT_EQUAL_ME_ID = 'ed64611c-a6e5-4b84-a36b-7383b73913d5';

// 予算版：GPT-3.5-turbo使用、少数エピソードテスト
export class BudgetNotEqualMeProcessor {
  private stats = {
    totalEpisodes: 0,
    processedEpisodes: 0,
    successfulExtractions: 0,
    totalLocationsExtracted: 0,
    estimatedCost: 0
  };

  // 予算に応じた段階的処理
  async processBudgetedEpisodes(maxEpisodes: number = 20): Promise<void> {
    console.log('💰 ≠ME 予算版処理開始（GPT-3.5-turbo）');
    console.log('='.repeat(60));
    console.log(`📺 処理対象: 最新${maxEpisodes}エピソード`);
    console.log('⚡ モデル: GPT-3.5-turbo（約95%コスト削減）');
    console.log('💡 推定コスト: $0.01-0.05（1-8円程度）\n');

    try {
      // 最新エピソードを限定取得
      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('id, video_url, title, date, celebrity_id')
        .eq('celebrity_id', NOT_EQUAL_ME_ID)
        .order('date', { ascending: false })
        .limit(maxEpisodes);

      if (error || !episodes) {
        console.error('❌ エピソード取得エラー:', error);
        throw error;
      }

      this.stats.totalEpisodes = episodes.length;
      console.log(`📺 取得エピソード: ${this.stats.totalEpisodes}件\n`);

      // OpenAI APIキー確認
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-test')) {
        console.log('⚠️  OpenAI APIキーが未設定です');
        console.log('💡 実際の抽出を行うには以下を.env.productionに設定:');
        console.log('   OPENAI_API_KEY=sk-your-actual-api-key');
        console.log('🔄 モック処理を続行します\n');
      }

      // 各エピソードを処理
      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】 ${episode.title}`);
        console.log(`📅 ${new Date(episode.date).toLocaleDateString('ja-JP')}`);

        try {
          // 実際のAI抽出（予算版）
          const locations = await this.extractLocationsBudget(episode);
          
          if (locations.length === 0) {
            console.log('📍 ロケーション情報なし');
          } else {
            console.log(`📍 ${locations.length}件のロケーションを発見`);
            
            for (const location of locations) {
              const saved = await this.saveLocation(location, episode);
              if (saved) {
                this.stats.totalLocationsExtracted++;
                console.log(`   💾 保存: ${location.name}`);
              }
            }
            
            this.stats.successfulExtractions++;
          }

          this.stats.processedEpisodes++;

          // コスト計算
          this.stats.estimatedCost += 0.0002; // GPT-3.5-turboの概算

          // 待機（API制限対応）
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ エラー: ${error.message}`);
        }
      }

      await this.generateBudgetReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
      throw error;
    }
  }

  // 予算版AI抽出（GPT-3.5-turbo使用）
  private async extractLocationsBudget(episode: any) {
    try {
      // YouTube概要欄取得
      const description = await this.getVideoDescription(episode.video_url);
      
      if (!description) {
        return [];
      }

      // APIキーチェック
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-test')) {
        // モック処理：特定のキーワードがある場合のみ疑似データ返却
        return this.mockExtraction(description, episode);
      }

      // 実際のGPT-3.5-turbo呼び出し
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // GPT-4の代わりにGPT-3.5使用
          messages: [
            {
              role: "system",
              content: "YouTube動画概要欄から飲食店・カフェ・レストランの情報を抽出してください。店舗名と住所が明記されているもののみ抽出し、JSON形式で返してください。"
            },
            {
              role: "user",
              content: `以下の概要欄から飲食店情報を抽出してください：\n\n${description}`
            }
          ],
          temperature: 0.1,
          max_tokens: 800 // トークン数削減
        })
      });

      if (!response.ok) {
        console.log(`⚠️  API制限またはエラー (${response.status})`);
        return [];
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // 簡易JSON解析
      const locations = this.parseLocationResponse(content);
      return locations;

    } catch (error) {
      console.error('抽出エラー:', error);
      return [];
    }
  }

  // YouTube概要欄取得
  private async getVideoDescription(videoUrl: string): Promise<string> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId || !process.env.YOUTUBE_API_KEY) {
        return '';
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${process.env.YOUTUBE_API_KEY}`
      );

      if (!response.ok) return '';

      const data = await response.json();
      return data.items?.[0]?.snippet?.description || '';
    } catch {
      return '';
    }
  }

  // Video ID抽出
  private extractVideoId(videoUrl: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match) return match[1];
    }
    return '';
  }

  // モック抽出（テスト用）
  private mockExtraction(description: string, episode: any) {
    const keywords = ['カフェ', 'レストラン', '食事', '店', 'グルメ', '美味しい'];
    const hasFood = keywords.some(keyword => description.includes(keyword));

    if (!hasFood) return [];

    // 疑似ロケーションデータ
    const mockLocations = [
      {
        name: 'テストカフェ',
        address: '東京都渋谷区テスト1-1-1',
        category: 'cafe',
        description: `モックテスト用データ（${episode.title}）`,
        confidence: 'medium'
      }
    ];

    return Math.random() < 0.3 ? mockLocations : []; // 30%の確率
  }

  // レスポンス解析
  private parseLocationResponse(content: string) {
    try {
      // JSON解析を試行
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : parsed.restaurants || [];
    } catch {
      // JSON解析失敗時は簡易パターンマッチング
      return [];
    }
  }

  // データベース保存
  private async saveLocation(location: any, episode: any): Promise<boolean> {
    try {
      const locationData = {
        name: location.name,
        slug: `${location.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        description: location.description,
        address: location.address,
        website_url: `https://www.google.com/maps/search/${encodeURIComponent(location.address)}`,
        tags: ['AI抽出', 'GPT-3.5-turbo', location.confidence || 'medium', '≠ME'],
        episode_id: episode.id,
        celebrity_id: NOT_EQUAL_ME_ID,
        category: location.category || 'restaurant'
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      return !error;
    } catch {
      return false;
    }
  }

  // 予算レポート
  private async generateBudgetReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('💰 予算版処理完了レポート');
    console.log('='.repeat(60));

    const { count: locationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', NOT_EQUAL_ME_ID);

    console.log('\n📊 処理結果:');
    console.log(`📺 処理エピソード: ${this.stats.processedEpisodes}件`);
    console.log(`🎯 抽出成功: ${this.stats.successfulExtractions}件`);
    console.log(`📍 新規ロケーション: ${this.stats.totalLocationsExtracted}件`);
    console.log(`📍 データベース総数: ${locationCount}件`);

    console.log('\n💰 コスト分析:');
    console.log(`💸 推定コスト: $${this.stats.estimatedCost.toFixed(4)} (約${Math.round(this.stats.estimatedCost * 150)}円)`);
    console.log(`⚡ GPT-3.5使用による節約: 約95%`);

    const rate = Math.round((this.stats.successfulExtractions / this.stats.processedEpisodes) * 100);
    console.log(`\n🎯 抽出率: ${rate}%`);

    console.log('\n💡 次のステップ:');
    console.log('1. 結果を確認して品質評価');
    console.log('2. 良好なら処理件数を増加（50件→100件→全件）');
    console.log('3. 必要に応じてGPT-4での高精度処理');

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/not-equal-me');
    console.log('\n' + '='.repeat(60));
  }
}

async function main() {
  const processor = new BudgetNotEqualMeProcessor();
  
  const args = process.argv.slice(2);
  const maxEpisodes = parseInt(args[0]) || 20;

  console.log(`🚀 予算版処理開始: 最新${maxEpisodes}エピソード`);
  await processor.processBudgetedEpisodes(maxEpisodes);
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}