import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const NOT_EQUAL_ME_ID = 'ed64611c-a6e5-4b84-a36b-7383b73913d5';

// ≠ME動画概要欄分析専用クラス
export class NotEqualMeDescriptionAnalyzer {
  private youtubeApiKey: string;

  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  // YouTube概要欄取得
  private async getVideoDescription(videoUrl: string): Promise<string> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId || !this.youtubeApiKey) {
        return '';
      }

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

  // ≠ME動画概要欄分析メイン
  async analyzeDescriptions(maxEpisodes: number = 10): Promise<void> {
    console.log('🔍 ≠ME動画概要欄分析開始');
    console.log('='.repeat(60));
    console.log(`📺 分析対象: 最新${maxEpisodes}エピソード\n`);

    try {
      // エピソード取得
      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('id, video_url, title, date, celebrity_id')
        .eq('celebrity_id', NOT_EQUAL_ME_ID)
        .order('date', { ascending: false })
        .limit(maxEpisodes);

      if (error || !episodes) {
        console.error('❌ エピソード取得エラー:', error);
        return;
      }

      console.log(`📺 取得エピソード: ${episodes.length}件\n`);

      const analysisResults = {
        totalDescriptions: 0,
        emptyDescriptions: 0,
        locationKeywords: new Map<string, number>(),
        foodKeywords: new Map<string, number>(),
        placeKeywords: new Map<string, number>(),
        addressPatterns: new Set<string>(),
        commonPhrases: new Map<string, number>()
      };

      // 各エピソードの概要欄を分析
      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】 ${episode.title}`);
        
        const description = await this.getVideoDescription(episode.video_url);
        
        if (!description) {
          console.log('   📄 概要欄なし');
          analysisResults.emptyDescriptions++;
          continue;
        }

        console.log(`   📄 概要欄長さ: ${description.length}文字`);
        analysisResults.totalDescriptions++;

        // キーワード分析
        this.analyzeKeywords(description, analysisResults);
        
        // サンプル表示
        if (index < 3) {
          console.log(`   📝 概要欄サンプル:\n${this.formatDescription(description)}\n`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 分析結果レポート
      await this.generateAnalysisReport(analysisResults);

    } catch (error) {
      console.error('❌ 分析エラー:', error);
    }
  }

  // キーワード分析
  private analyzeKeywords(description: string, results: any): void {
    const text = description.toLowerCase();

    // 食事関連キーワード
    const foodKeywords = [
      'カフェ', 'cafe', 'レストラン', 'restaurant', 'ラーメン', 'らーめん',
      'スターバックス', 'starbucks', 'ドトール', 'doutor', 'タリーズ', 'tully',
      'マクドナルド', 'mcdonald', 'マック', 'ケンタッキー', 'kfc',
      '食事', '食べ', 'グルメ', '美味しい', 'おいしい', '料理',
      'ランチ', 'lunch', 'ディナー', 'dinner', '朝食', '昼食', '夕食',
      'お店', '店舗', 'お食事', 'カレー', 'curry', 'パスタ', 'pasta'
    ];

    // 場所関連キーワード
    const placeKeywords = [
      '渋谷', 'shibuya', '新宿', 'shinjuku', '原宿', 'harajuku',
      '表参道', 'omotesando', '銀座', 'ginza', '池袋', 'ikebukuro',
      '横浜', 'yokohama', '秋葉原', 'akihabara', '浅草', 'asakusa',
      '駅', 'station', '空港', 'airport', 'mall', 'モール',
      'ピューロランド', 'puroland', 'ディズニー', 'disney',
      '109', 'ルミネ', 'lumine', 'ヒルズ', 'hills'
    ];

    // 住所パターン
    const addressPatterns = [
      /東京都[^。\n]{5,30}/g,
      /神奈川県[^。\n]{5,30}/g,
      /[あ-ん]{2,8}区[あ-ん]{2,15}/g,
      /[あ-ん]{2,8}駅/g
    ];

    // キーワードカウント
    for (const keyword of foodKeywords) {
      const count = (text.match(new RegExp(keyword, 'gi')) || []).length;
      if (count > 0) {
        results.foodKeywords.set(keyword, (results.foodKeywords.get(keyword) || 0) + count);
      }
    }

    for (const keyword of placeKeywords) {
      const count = (text.match(new RegExp(keyword, 'gi')) || []).length;
      if (count > 0) {
        results.placeKeywords.set(keyword, (results.placeKeywords.get(keyword) || 0) + count);
      }
    }

    // 住所パターンマッチ
    for (const pattern of addressPatterns) {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach(match => results.addressPatterns.add(match));
      }
    }
  }

  // 概要欄フォーマット（表示用）
  private formatDescription(description: string): string {
    const lines = description.split('\n').slice(0, 5); // 最初の5行のみ
    return lines.map(line => `      ${line}`).join('\n') + (description.split('\n').length > 5 ? '\n      ...' : '');
  }

  // 分析結果レポート生成
  private async generateAnalysisReport(results: any): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ≠ME動画概要欄分析レポート');
    console.log('='.repeat(60));

    console.log('\n📈 基本統計:');
    console.log(`📺 分析動画数: ${results.totalDescriptions}件`);
    console.log(`📄 空概要欄: ${results.emptyDescriptions}件`);
    console.log(`📊 概要欄有効率: ${Math.round((results.totalDescriptions / (results.totalDescriptions + results.emptyDescriptions)) * 100)}%`);

    console.log('\n🍽️ 食事関連キーワード TOP10:');
    const sortedFood = Array.from(results.foodKeywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    if (sortedFood.length === 0) {
      console.log('   ❌ 食事関連キーワードが見つかりませんでした');
    } else {
      sortedFood.forEach(([keyword, count], index) => {
        console.log(`   ${index + 1}. ${keyword}: ${count}回`);
      });
    }

    console.log('\n📍 場所関連キーワード TOP10:');
    const sortedPlace = Array.from(results.placeKeywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    if (sortedPlace.length === 0) {
      console.log('   ❌ 場所関連キーワードが見つかりませんでした');
    } else {
      sortedPlace.forEach(([keyword, count], index) => {
        console.log(`   ${index + 1}. ${keyword}: ${count}回`);
      });
    }

    console.log('\n🗺️ 住所パターン:');
    if (results.addressPatterns.size === 0) {
      console.log('   ❌ 住所パターンが見つかりませんでした');
    } else {
      Array.from(results.addressPatterns).slice(0, 10).forEach((pattern, index) => {
        console.log(`   ${index + 1}. ${pattern}`);
      });
    }

    console.log('\n💡 パターンマッチング改善提案:');
    
    if (sortedFood.length > 0) {
      console.log('✅ 食事系キーワードベースのパターン強化');
      const topFoodKeywords = sortedFood.slice(0, 5).map(([keyword]) => keyword);
      console.log(`   推奨キーワード: ${topFoodKeywords.join(', ')}`);
    }
    
    if (sortedPlace.length > 0) {
      console.log('✅ 場所系キーワードベースのパターン強化');
      const topPlaceKeywords = sortedPlace.slice(0, 5).map(([keyword]) => keyword);
      console.log(`   推奨キーワード: ${topPlaceKeywords.join(', ')}`);
    }

    if (results.addressPatterns.size === 0 && sortedFood.length === 0 && sortedPlace.length === 0) {
      console.log('❌ パターンマッチングが困難な概要欄構造');
      console.log('💡 代替案:');
      console.log('   1. OpenAI無料枠($5クレジット)の活用');
      console.log('   2. タイトルベースのロケーション推測');
      console.log('   3. コメント欄からの情報抽出');
    }

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/not-equal-me');
    console.log('\n' + '='.repeat(60));
  }
}

async function main() {
  const analyzer = new NotEqualMeDescriptionAnalyzer();
  
  const args = process.argv.slice(2);
  const maxEpisodes = parseInt(args[0]) || 10;

  console.log(`🔍 概要欄分析開始: 最新${maxEpisodes}エピソード`);
  await analyzer.analyzeDescriptions(maxEpisodes);
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}