import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Location Processor with Auto Images & Categories
 * 新規ロケーション追加時に画像とカテゴリを自動付与する改善システム
 */

export interface ProcessedLocation {
  name: string;
  address: string;
  description: string;
  category: LocationCategory;
  image_urls: string[];
  search_keywords: string[];
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export type LocationCategory = 
  | 'restaurant' 
  | 'cafe' 
  | 'shop' 
  | 'tourist' 
  | 'entertainment' 
  | 'hotel'
  | 'other';

// Unsplash高品質画像セット（カテゴリ別）
const CATEGORY_IMAGES = {
  restaurant: [
    'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop&q=80'
  ],
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=250&fit=crop&q=80'
  ],
  shop: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop&q=80'
  ],
  tourist: [
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80'
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508973379184-7517410fb0bc?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488841714725-bb4c32d1ac94?w=400&h=250&fit=crop&q=80'
  ],
  hotel: [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574263867128-a3d06c4b2110?w=400&h=250&fit=crop&q=80'
  ],
  other: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80'
  ]
};

// 特定料理ジャンル向け画像セット
const CUISINE_IMAGES = {
  ramen: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400&h=250&fit=crop&q=80'
  ],
  sushi: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=250&fit=crop&q=80'
  ],
  yakiniku: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400&h=250&fit=crop&q=80'
  ],
  pizza: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop&q=80'
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=250&fit=crop&q=80'
  ],
  sweets: [
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=250&fit=crop&q=80'
  ]
};

export class EnhancedAutoLocationProcessor {
  private openai: OpenAI;
  private supabase: any;

  constructor(supabaseClient?: any) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.supabase = supabaseClient;
  }

  /**
   * ロケーション情報を分析してカテゴリと画像を自動付与
   */
  async processLocation(rawLocation: {
    name: string;
    address: string;
    description?: string;
    source?: string;
  }): Promise<ProcessedLocation> {
    console.log(`🔄 Processing: ${rawLocation.name}`);

    try {
      // 1. AIでカテゴリ分析と説明文生成
      const aiAnalysis = await this.analyzeLocationWithAI(rawLocation);
      
      // 2. カテゴリに基づいて最適な画像セット選択
      const images = this.selectOptimalImages(aiAnalysis.category, rawLocation.name);
      
      // 3. 検索キーワード生成
      const searchKeywords = this.generateSearchKeywords(rawLocation.name, rawLocation.address);

      const processedLocation: ProcessedLocation = {
        name: rawLocation.name,
        address: rawLocation.address,
        description: aiAnalysis.description,
        category: aiAnalysis.category,
        image_urls: images,
        search_keywords: searchKeywords,
        confidence: aiAnalysis.confidence,
        source: rawLocation.source || 'auto-processed'
      };

      console.log(`  ✅ Categorized as: ${processedLocation.category}`);
      console.log(`  🖼️  Images assigned: ${images.length}`);
      console.log(`  🔍 Keywords: ${searchKeywords.slice(0, 3).join(', ')}...`);

      return processedLocation;

    } catch (error) {
      console.error(`  ❌ Error processing ${rawLocation.name}:`, error);
      
      // フォールバック処理
      return this.createFallbackLocation(rawLocation);
    }
  }

  /**
   * AIを使って場所を分析してカテゴリと説明文を生成
   */
  private async analyzeLocationWithAI(location: {
    name: string;
    address: string;
    description?: string;
  }): Promise<{
    category: LocationCategory;
    description: string;
    confidence: 'high' | 'medium' | 'low';
    cuisineType?: string;
  }> {
    const prompt = `
以下のロケーション情報を分析して、カテゴリ分類と魅力的な説明文を生成してください。

ロケーション情報:
- 名前: ${location.name}
- 住所: ${location.address}
- 既存説明: ${location.description || 'なし'}

分析タスク:
1. 最適なカテゴリを選択 (restaurant/cafe/shop/tourist/entertainment/hotel/other)
2. 魅力的で検索しやすい日本語説明文を生成 (50-80文字)
3. 料理系の場合は具体的ジャンルも特定

出力形式 (JSON):
{
  "category": "選択したカテゴリ",
  "description": "魅力的な説明文",
  "confidence": "high|medium|low",
  "cuisineType": "料理系の場合のジャンル (ramen/sushi/yakiniku/pizza/burger/sweets等)"
}

重要:
- 説明文は地域名や特徴を含める
- SEO効果も考慮した自然な文章
- 不確実な場合はconfidenceをmedium/lowに
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "あなたは日本の地域情報とグルメに詳しいカテゴリ分析の専門家です。正確で魅力的な分類と説明文を生成してください。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error('AI response is empty');
      }

      const analysis = JSON.parse(responseContent);
      return {
        category: analysis.category || 'other',
        description: analysis.description || `${location.name}の情報`,
        confidence: analysis.confidence || 'medium',
        cuisineType: analysis.cuisineType
      };

    } catch (error) {
      console.error('AI analysis failed, using fallback:', error);
      return this.createFallbackAnalysis(location);
    }
  }

  /**
   * カテゴリと料理タイプに基づいて最適な画像セットを選択
   */
  private selectOptimalImages(category: LocationCategory, locationName: string): string[] {
    // 料理ジャンル特定のキーワードチェック
    const nameL = locationName.toLowerCase();
    
    // 特定料理ジャンルの画像を優先
    if (nameL.includes('ラーメン') || nameL.includes('ramen')) {
      return CUISINE_IMAGES.ramen;
    }
    if (nameL.includes('寿司') || nameL.includes('すし') || nameL.includes('sushi')) {
      return CUISINE_IMAGES.sushi;
    }
    if (nameL.includes('焼肉') || nameL.includes('yakiniku') || nameL.includes('やきにく')) {
      return CUISINE_IMAGES.yakiniku;
    }
    if (nameL.includes('ピザ') || nameL.includes('pizza') || nameL.includes('ピッツァ')) {
      return CUISINE_IMAGES.pizza;
    }
    if (nameL.includes('バーガー') || nameL.includes('burger') || nameL.includes('hamburger')) {
      return CUISINE_IMAGES.burger;
    }
    if (nameL.includes('スイーツ') || nameL.includes('ケーキ') || nameL.includes('デザート') || 
        nameL.includes('パフェ') || nameL.includes('プリン')) {
      return CUISINE_IMAGES.sweets;
    }

    // カテゴリベースの画像選択
    return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.other;
  }

  /**
   * 検索キーワード生成
   */
  private generateSearchKeywords(name: string, address: string): string[] {
    const keywords = [name];
    
    // 住所からエリア抽出
    const addressParts = address.split(/[都道府県市区町村]/);
    addressParts.forEach(part => {
      if (part.trim().length > 1) {
        keywords.push(part.trim());
      }
    });

    // 名前からキーワード抽出
    const nameWords = name.split(/[\s・＆&]/);
    nameWords.forEach(word => {
      if (word.trim().length > 1) {
        keywords.push(word.trim());
      }
    });

    // 重複除去と長さ制限
    return [...new Set(keywords)].slice(0, 5);
  }

  /**
   * AI分析失敗時のフォールバック
   */
  private createFallbackAnalysis(location: {
    name: string;
    address: string;
  }): {
    category: LocationCategory;
    description: string;
    confidence: 'low';
  } {
    const name = location.name.toLowerCase();
    let category: LocationCategory = 'other';

    // シンプルなキーワードベース分類
    if (name.includes('レストラン') || name.includes('料理') || name.includes('食堂')) {
      category = 'restaurant';
    } else if (name.includes('カフェ') || name.includes('coffee') || name.includes('コーヒー')) {
      category = 'cafe';
    } else if (name.includes('ショップ') || name.includes('store') || name.includes('店')) {
      category = 'shop';
    } else if (name.includes('博物館') || name.includes('美術館') || name.includes('神社') || name.includes('寺')) {
      category = 'tourist';
    } else if (name.includes('カラオケ') || name.includes('ライブ') || name.includes('映画')) {
      category = 'entertainment';
    } else if (name.includes('ホテル') || name.includes('旅館') || name.includes('宿')) {
      category = 'hotel';
    }

    return {
      category,
      description: `${location.name}の詳細情報`,
      confidence: 'low'
    };
  }

  /**
   * 処理失敗時の最小限フォールバック
   */
  private createFallbackLocation(rawLocation: {
    name: string;
    address: string;
    description?: string;
    source?: string;
  }): ProcessedLocation {
    return {
      name: rawLocation.name,
      address: rawLocation.address,
      description: rawLocation.description || `${rawLocation.name}の詳細情報`,
      category: 'other',
      image_urls: CATEGORY_IMAGES.other,
      search_keywords: [rawLocation.name],
      confidence: 'low',
      source: rawLocation.source || 'fallback-processed'
    };
  }

  /**
   * バッチ処理: 複数ロケーションを一括処理
   */
  async processLocationsBatch(locations: Array<{
    name: string;
    address: string;
    description?: string;
    source?: string;
  }>): Promise<ProcessedLocation[]> {
    console.log(`🚀 Starting batch processing of ${locations.length} locations`);
    
    const results: ProcessedLocation[] = [];
    const batchSize = 5; // API制限を考慮

    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(locations.length/batchSize)}`);
      
      // バッチ内並列処理
      const batchPromises = batch.map(location => this.processLocation(location));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // レート制限対策
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n✅ Batch processing completed: ${results.length} locations processed`);
    return results;
  }

  /**
   * データベースに保存（Supabase）
   */
  async saveToDatabase(location: ProcessedLocation, celebrityId: string, episodeId?: string): Promise<boolean> {
    if (!this.supabase) {
      console.log('  ⚠️  Supabase client not provided, skipping database save');
      return false;
    }

    try {
      const locationData = {
        name: location.name,
        address: location.address,
        description: location.description,
        image_urls: location.image_urls,
        celebrity_id: celebrityId,
        episode_id: episodeId,
        category: location.category,
        search_keywords: location.search_keywords,
        confidence_level: location.confidence,
        data_source: location.source,
        created_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('locations')
        .insert(locationData);

      if (error) {
        console.error('  ❌ Database save error:', error);
        return false;
      }

      console.log('  💾 Saved to database successfully');
      return true;

    } catch (error) {
      console.error('  ❌ Database save failed:', error);
      return false;
    }
  }

  /**
   * 統計情報表示
   */
  displayBatchStats(results: ProcessedLocation[]): void {
    const stats = {
      total: results.length,
      byCategory: {} as Record<LocationCategory, number>,
      byConfidence: {
        high: 0,
        medium: 0,
        low: 0
      },
      withImages: results.filter(r => r.image_urls.length > 0).length
    };

    results.forEach(location => {
      // カテゴリ統計
      stats.byCategory[location.category] = (stats.byCategory[location.category] || 0) + 1;
      
      // 信頼度統計
      stats.byConfidence[location.confidence]++;
    });

    console.log('\n📊 Batch Processing Statistics:');
    console.log('='.repeat(50));
    console.log(`📝 Total locations: ${stats.total}`);
    console.log(`🖼️  With images: ${stats.withImages}/${stats.total} (${Math.round(stats.withImages/stats.total*100)}%)`);
    
    console.log('\n🏷️  Categories:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`  • ${category}: ${count}`);
    });
    
    console.log('\n🎯 Confidence levels:');
    Object.entries(stats.byConfidence).forEach(([level, count]) => {
      console.log(`  • ${level}: ${count}`);
    });
  }
}

/**
 * 使用例とテスト用ヘルパー関数
 */
export async function testEnhancedProcessor() {
  const processor = new EnhancedAutoLocationProcessor();
  
  const testLocations = [
    {
      name: '築地銀だこ 原宿店',
      address: '東京都渋谷区神宮前1-19-11 はらじゅくアッシュ1F',
      description: 'たこ焼きチェーン店'
    },
    {
      name: 'スターバックス 表参道店',
      address: '東京都渋谷区神宮前5-10-10',
      description: 'コーヒーチェーン'
    },
    {
      name: '明治神宮',
      address: '東京都渋谷区代々木神園町1-1',
      description: '明治天皇を祀る神社'
    }
  ];

  const results = await processor.processLocationsBatch(testLocations);
  processor.displayBatchStats(results);
  
  return results;
}