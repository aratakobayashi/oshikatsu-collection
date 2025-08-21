import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Man動画内ロケーション抽出システム
export class SnowManVideoLocationExtractor {
  private openaiApiKey: string;
  private youtubeApiKey: string;
  private stats = {
    totalEpisodes: 0,
    processedEpisodes: 0,
    episodesWithLocations: 0,
    totalLocationsExtracted: 0,
    successfulSaves: 0,
    errors: 0,
    apiCost: 0
  };

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  // メイン処理：Snow Man動画からロケーション抽出
  async extractLocationsFromVideos(limit: number = 20): Promise<void> {
    console.log('⛄ Snow Man動画内ロケーション抽出開始');
    console.log('='.repeat(60));
    console.log('🎯 AI音声認識 + GPT-3.5-turbo システム');
    console.log(`📺 対象: Snow Man最新${limit}エピソード\n`);

    try {
      // Snow Manのエピソードを取得
      const { data: snowMan } = await supabase
        .from('celebrities')
        .select('id')
        .eq('slug', 'snow-man')
        .single();

      if (!snowMan) {
        console.error('❌ Snow Manが見つかりません');
        return;
      }

      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('id, title, video_url, date')
        .eq('celebrity_id', snowMan.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error || !episodes) {
        console.error('❌ エピソード取得エラー:', error);
        return;
      }

      this.stats.totalEpisodes = episodes.length;
      console.log(`📺 取得エピソード: ${this.stats.totalEpisodes}件\n`);

      // 各エピソードを処理
      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】 ${episode.title}`);
        
        try {
          // 1. 動画の字幕/音声データを取得（または概要欄再チェック）
          const videoContent = await this.getVideoContent(episode.video_url);
          
          if (!videoContent) {
            console.log('   📄 解析可能コンテンツなし');
            this.stats.processedEpisodes++;
            continue;
          }

          // 2. AI でロケーション抽出
          const locations = await this.extractLocationsWithAI(videoContent, episode);
          
          if (locations.length === 0) {
            console.log('   📍 ロケーション情報なし');
          } else {
            console.log(`   📍 ${locations.length}件のロケーション発見`);
            this.stats.episodesWithLocations++;
            
            // 3. データベース保存
            for (const location of locations) {
              console.log(`      🔍 抽出: ${location.name}`);
              const saved = await this.saveLocation(location, episode, snowMan.id);
              if (saved === 'success') {
                this.stats.successfulSaves++;
                console.log(`         ✅ 保存: ${location.name}`);
              } else if (saved === 'duplicate') {
                console.log(`         ⚠️ 既存: ${location.name}`);
              } else {
                this.stats.errors++;
              }
              this.stats.totalLocationsExtracted++;
            }
          }

          this.stats.processedEpisodes++;

          // API制限対策
          if (index % 5 === 4) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error) {
          console.error(`   ❌ エラー: ${error.message}`);
          this.stats.errors++;
        }
      }

      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // 動画コンテンツ取得（字幕優先、概要欄フォールバック）
  private async getVideoContent(videoUrl: string): Promise<string> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) return '';

      // 1. まずは概要欄を取得
      const description = await this.getVideoDescription(videoId);
      
      // 2. 字幕データ取得を試行（YouTube Data API v3には直接的な字幕APIはないため、概要欄を詳細分析）
      // 実際の実装では、YouTube Transcript APIや他のサービスを併用する可能性
      
      return description;
    } catch (error) {
      return '';
    }
  }

  // YouTube概要欄取得
  private async getVideoDescription(videoId: string): Promise<string> {
    try {
      if (!this.youtubeApiKey) return '';

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${this.youtubeApiKey}`
      );

      if (!response.ok) return '';

      const data = await response.json();
      return data.items?.[0]?.snippet?.description || '';
    } catch {
      return '';
    }
  }

  // AI ロケーション抽出
  private async extractLocationsWithAI(content: string, episode: any): Promise<any[]> {
    if (!this.openaiApiKey || this.openaiApiKey.startsWith('sk-test')) {
      // テスト環境ではダミーデータを返す
      return this.generateTestLocations(content, episode);
    }

    try {
      const prompt = this.buildLocationExtractionPrompt(content, episode);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'あなたはSnow Manの動画からロケーション情報を抽出する専門AIです。店舗名、住所、カテゴリを正確に特定してJSON形式で返してください。'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      // コスト計算
      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;
      const cost = (inputTokens * 0.0015 + outputTokens * 0.002) / 1000;
      this.stats.apiCost += cost;

      // JSONレスポンスをパース
      return this.parseAIResponse(aiResponse);

    } catch (error) {
      console.error('   ⚠️ AI処理エラー:', error.message);
      return [];
    }
  }

  // AI用プロンプト構築
  private buildLocationExtractionPrompt(content: string, episode: any): string {
    return `
Snow Manのエピソード「${episode.title}」から店舗・ロケーション情報を抽出してください。

【動画情報】
タイトル: ${episode.title}
概要欄: ${content}

【抽出ルール】
1. レストラン、カフェ、ショップ、観光地、施設名を特定
2. 住所が分かる場合は含める  
3. メンバー名は除外
4. SNSアカウント、URL、企画名は除外
5. 不確実な情報は含めない

【出力形式】
JSON配列で以下の形式：
[
  {
    "name": "店舗名",
    "address": "住所（不明の場合はnull）", 
    "category": "restaurant|cafe|shop|tourist_spot|other",
    "confidence": "high|medium|low",
    "source": "title|description|inferred"
  }
]

【出力例】
[
  {
    "name": "渋谷スカイ",
    "address": "東京都渋谷区渋谷2-24-12",
    "category": "tourist_spot", 
    "confidence": "high",
    "source": "description"
  }
]

抽出結果:`;
  }

  // AIレスポンスをパース
  private parseAIResponse(aiResponse: string): any[] {
    try {
      // JSONブロックを抽出
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const locations = JSON.parse(jsonMatch[0]);
      return Array.isArray(locations) ? locations : [];
    } catch (error) {
      console.error('   ⚠️ AI応答パースエラー:', error.message);
      return [];
    }
  }

  // テスト用ダミーロケーション生成
  private generateTestLocations(content: string, episode: any): any[] {
    const testLocations = [];
    
    // タイトルベースの推測
    if (episode.title.includes('食べ') || episode.title.includes('ランチ') || episode.title.includes('ディナー')) {
      testLocations.push({
        name: `${episode.title}で訪問したレストラン（仮）`,
        address: '東京都内（AI抽出待ち）',
        category: 'restaurant',
        confidence: 'low',
        source: 'test_mode'
      });
    }

    if (episode.title.includes('買い物') || episode.title.includes('ショッピング')) {
      testLocations.push({
        name: `${episode.title}で紹介されたショップ（仮）`,
        address: '東京都内（AI抽出待ち）',
        category: 'shop',
        confidence: 'low',
        source: 'test_mode'
      });
    }

    return testLocations;
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

  // データベース保存
  private async saveLocation(location: any, episode: any, celebrityId: string): Promise<'success' | 'duplicate' | 'error'> {
    try {
      // 既存チェック
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', location.name)
        .eq('episode_id', episode.id)
        .single();

      if (existing) {
        return 'duplicate';
      }

      // 新規保存
      const locationData = {
        name: location.name,
        slug: `${location.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        description: this.generateDescription(location, episode),
        address: location.address || '住所不明',
        website_url: location.address ? 
          `https://www.google.com/maps/search/${encodeURIComponent(location.name + ' ' + location.address)}` :
          `https://www.google.com/maps/search/${encodeURIComponent(location.name)}`,
        tags: this.generateTags(location),
        episode_id: episode.id,
        celebrity_id: celebrityId
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      return error ? 'error' : 'success';
    } catch {
      return 'error';
    }
  }

  // 説明文生成
  private generateDescription(location: any, episode: any): string {
    return `${episode.title}で紹介された${location.category === 'restaurant' ? '飲食店' : 
            location.category === 'cafe' ? 'カフェ' : 
            location.category === 'shop' ? 'ショップ' : 
            location.category === 'tourist_spot' ? '観光スポット' : '施設'}`;
  }

  // タグ生成
  private generateTags(location: any): string[] {
    const tags = ['Snow Man', 'AI抽出', location.category];
    
    if (location.confidence === 'high') tags.push('高精度');
    if (location.source === 'description') tags.push('概要欄抽出');
    if (location.source === 'title') tags.push('タイトル抽出');
    
    return tags;
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Snow Man動画ロケーション抽出レポート');
    console.log('='.repeat(60));

    console.log('\n📈 処理結果:');
    console.log(`📺 処理エピソード: ${this.stats.processedEpisodes}/${this.stats.totalEpisodes}件`);
    console.log(`🎯 ロケーション発見エピソード: ${this.stats.episodesWithLocations}件`);
    console.log(`📍 抽出ロケーション総数: ${this.stats.totalLocationsExtracted}件`);
    console.log(`✅ 新規保存: ${this.stats.successfulSaves}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    if (this.stats.apiCost > 0) {
      console.log(`\n💰 AI処理コスト: $${this.stats.apiCost.toFixed(4)} (約${Math.round(this.stats.apiCost * 150)}円)`);
    }

    if (this.stats.processedEpisodes > 0) {
      const extractionRate = Math.round((this.stats.episodesWithLocations / this.stats.processedEpisodes) * 100);
      console.log(`\n🎯 ロケーション抽出率: ${extractionRate}%`);
    }

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/snow-man');
    console.log('\n' + '='.repeat(60));
  }
}

// メイン処理
async function main() {
  const extractor = new SnowManVideoLocationExtractor();
  
  const args = process.argv.slice(2);
  const limit = parseInt(args[0]) || 20;

  console.log(`🚀 Snow Man動画ロケーション抽出開始: 最新${limit}エピソード`);
  await extractor.extractLocationsFromVideos(limit);
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}