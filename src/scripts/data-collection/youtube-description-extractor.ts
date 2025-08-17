import OpenAI from 'openai';

// YouTube概要欄から飲食店情報を抽出するAIシステム
export interface RestaurantInfo {
  name: string;
  address: string;
  type: string;
  mentioned_context: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ServiceLinks {
  gurunavi?: string;
  tabelog?: string;
  googleMaps?: string;
  hotpepper?: string;
  retty?: string;
}

export interface ExtractedLocation {
  name: string;
  address: string;
  category: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  service_links: ServiceLinks;
  source: 'youtube_description';
}

export class YouTubeDescriptionExtractor {
  private openai: OpenAI;
  private youtubeApiKey: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  // YouTube APIから概要欄を取得
  async getVideoDescription(videoId: string): Promise<string> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${this.youtubeApiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return '';
      }
      
      return data.items[0].snippet.description || '';
    } catch (error) {
      console.error('Error fetching YouTube description:', error);
      return '';
    }
  }

  // AIで飲食店情報を構造化抽出
  async extractRestaurantInfo(description: string): Promise<RestaurantInfo[]> {
    if (!description.trim()) {
      return [];
    }

    const prompt = `
以下のYouTube動画概要欄から、実際に訪れた飲食店・カフェ・レストランの情報のみを正確に抽出してください。

抽出条件:
1. 明確な店舗名が記載されている
2. 住所情報（都道府県・市区町村レベル以上）が含まれている  
3. 実際に訪問したことが明示または強く示唆されている
4. 推測や不確実な情報は除外する

出力は以下のJSON形式で、配列として返してください:
{
  "restaurants": [
    {
      "name": "正確な店舗名",
      "address": "完全な住所（番地まで含む）",
      "type": "料理ジャンル（和食・洋食・カフェ・ラーメンなど）",
      "mentioned_context": "概要欄での具体的な言及内容（どのように紹介されていたか）",
      "confidence": "high|medium|low"
    }
  ]
}

概要欄テキスト:
${description}
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "あなたは飲食店情報の抽出に特化したAIアシスタントです。正確性を最優先とし、不確実な情報は含めません。"
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.1, // より一貫した結果のため低温度
        max_tokens: 1500
      });

      const responseContent = completion.choices[0].message.content;
      
      if (!responseContent) {
        return [];
      }

      // JSONパース
      try {
        const parsed = JSON.parse(responseContent);
        return parsed.restaurants || [];
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw AI response:', responseContent);
        return [];
      }

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return [];
    }
  }

  // Video URLからVideo IDを抽出
  extractVideoId(videoUrl: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // 直接Video IDの場合
    ];

    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return '';
  }
}

export class RestaurantLinkGenerator {
  
  // 各サービスのリンクを生成
  async generateServiceLinks(restaurant: RestaurantInfo): Promise<ServiceLinks> {
    const encodedName = encodeURIComponent(restaurant.name);
    const encodedAddress = encodeURIComponent(restaurant.address);
    
    const links: ServiceLinks = {
      googleMaps: `https://www.google.com/maps/search/${encodedAddress}`,
      tabelog: `https://tabelog.com/rstLst/?sw=${encodedName}`,
      retty: `https://retty.me/search/?q=${encodedName}`
    };

    // ぐるなび検索リンク（APIキーがある場合は実際の検索も可能）
    if (process.env.GURUNAVI_API_KEY) {
      links.gurunavi = await this.searchGurunavi(restaurant);
    } else {
      links.gurunavi = `https://r.gnavi.co.jp/search/?sw=${encodedName}`;
    }

    // ホットペッパー検索リンク
    links.hotpepper = `https://www.hotpepper.jp/CST010/?SA11=${encodedName}`;

    return links;
  }

  // ぐるなび API検索（APIキーがある場合）
  private async searchGurunavi(restaurant: RestaurantInfo): Promise<string> {
    try {
      const apiUrl = 'https://api.gnavi.co.jp/RestSearchAPI/v3/';
      const params = new URLSearchParams({
        keyid: process.env.GURUNAVI_API_KEY || '',
        name: restaurant.name,
        address: restaurant.address,
        hit_per_page: '1'
      });

      const response = await fetch(`${apiUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Gurunavi API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.rest && data.rest.length > 0) {
        return data.rest[0].url_mobile || data.rest[0].url;
      }
      
    } catch (error) {
      console.error('Gurunavi API search failed:', error);
    }
    
    // APIが失敗した場合は検索ページへ
    return `https://r.gnavi.co.jp/search/?sw=${encodeURIComponent(restaurant.name)}`;
  }
}

// メイン処理クラス
export class EnhancedYouTubeLocationProcessor {
  private extractor: YouTubeDescriptionExtractor;
  private linkGenerator: RestaurantLinkGenerator;

  constructor() {
    this.extractor = new YouTubeDescriptionExtractor();
    this.linkGenerator = new RestaurantLinkGenerator();
  }

  // YouTube動画から飲食店情報を抽出・処理
  async processVideo(videoUrl: string): Promise<ExtractedLocation[]> {
    console.log(`🎥 処理開始: ${videoUrl}`);
    
    // 1. Video ID抽出
    const videoId = this.extractor.extractVideoId(videoUrl);
    if (!videoId) {
      console.error('Invalid YouTube URL');
      return [];
    }

    // 2. 概要欄取得
    console.log(`📝 概要欄取得中...`);
    const description = await this.extractor.getVideoDescription(videoId);
    if (!description) {
      console.log('概要欄が空です');
      return [];
    }

    console.log(`📝 概要欄長さ: ${description.length}文字`);

    // 3. AI抽出
    console.log(`🤖 AI抽出中...`);
    const restaurants = await this.extractor.extractRestaurantInfo(description);
    
    if (restaurants.length === 0) {
      console.log('飲食店情報が見つかりませんでした');
      return [];
    }

    console.log(`🏪 ${restaurants.length}件の飲食店を発見`);

    // 4. サービスリンク生成 & 結果作成
    const results: ExtractedLocation[] = [];
    
    for (const restaurant of restaurants) {
      console.log(`🔗 リンク生成中: ${restaurant.name}`);
      
      const serviceLinks = await this.linkGenerator.generateServiceLinks(restaurant);
      
      const location: ExtractedLocation = {
        name: restaurant.name,
        address: restaurant.address,
        category: 'restaurant',
        description: restaurant.mentioned_context,
        confidence: restaurant.confidence,
        service_links: serviceLinks,
        source: 'youtube_description'
      };
      
      results.push(location);
    }

    return results;
  }

  // テスト用メソッド
  async testExtraction(videoUrl: string): Promise<void> {
    console.log('='.repeat(60));
    console.log('🧪 YouTube概要欄抽出テスト');
    console.log('='.repeat(60));
    
    const results = await this.processVideo(videoUrl);
    
    console.log(`\n📊 結果: ${results.length}件の飲食店を抽出`);
    
    for (const [index, result] of results.entries()) {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   住所: ${result.address}`);
      console.log(`   信頼度: ${result.confidence}`);
      console.log(`   説明: ${result.description}`);
      console.log(`   🔗 Google Maps: ${result.service_links.googleMaps}`);
      console.log(`   🔗 ぐるなび: ${result.service_links.gurunavi}`);
      console.log(`   🔗 食べログ: ${result.service_links.tabelog}`);
    }
  }
}

// テスト実行
async function main() {
  const processor = new EnhancedYouTubeLocationProcessor();
  
  // =LOVEのサンプル動画でテスト
  const testVideoUrl = 'https://www.youtube.com/watch?v=SAMPLE_VIDEO_ID'; // 実際のVideo IDに置き換え
  
  await processor.testExtraction(testVideoUrl);
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}