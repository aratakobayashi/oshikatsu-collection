import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const NOT_EQUAL_ME_ID = 'ed64611c-a6e5-4b84-a36b-7383b73913d5';

// 完全無料の抽出システム
export class FreeApiExtractor {
  private stats = {
    totalEpisodes: 0,
    processedEpisodes: 0,
    successfulExtractions: 0,
    totalLocationsExtracted: 0
  };

  // 完全無料のロケーション抽出
  async extractWithFreeApis(maxEpisodes: number = 50): Promise<void> {
    console.log('🆓 完全無料ロケーション抽出開始');
    console.log('='.repeat(60));
    console.log('💡 使用技術: キーワードマッチング + パターン認識');
    console.log('🎯 API費用: $0（完全無料）\n');

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

      this.stats.totalEpisodes = episodes.length;
      console.log(`📺 処理対象: ${this.stats.totalEpisodes}件\n`);

      // 各エピソードを処理
      for (const [index, episode] of episodes.entries()) {
        console.log(`【${index + 1}/${episodes.length}】 ${episode.title}`);
        
        const locations = await this.extractLocationsFree(episode);
        
        if (locations.length === 0) {
          console.log('📍 ロケーション情報なし');
        } else {
          console.log(`📍 ${locations.length}件のロケーションを発見`);
          
          for (const location of locations) {
            console.log(`   🔍 抽出: ${location.name} (${location.category})`);
            const saved = await this.saveLocation(location, episode);
            if (saved) {
              this.stats.totalLocationsExtracted++;
              console.log(`   💾 保存: ${location.name}`);
            }
          }
          this.stats.successfulExtractions++;
        }

        this.stats.processedEpisodes++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await this.generateFreeReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // 無料でのロケーション抽出（タイトル＋概要欄）
  private async extractLocationsFree(episode: any) {
    try {
      // 1. タイトルベース抽出（メイン）
      const titleLocations = this.extractFromTitle(episode.title, episode);
      
      // 2. YouTube概要欄取得＆抽出（補助）
      const description = await this.getVideoDescription(episode.video_url);
      const descriptionLocations = description ? this.extractByPatterns(description, episode) : [];

      // 統合して重複除去
      const allLocations = [...titleLocations, ...descriptionLocations];
      const uniqueLocations = allLocations.filter((loc, index, arr) => 
        arr.findIndex(l => l.name.toLowerCase() === loc.name.toLowerCase()) === index
      );

      return uniqueLocations.slice(0, 3); // 最大3件まで

    } catch (error) {
      return [];
    }
  }

  // タイトルからのロケーション抽出（≠ME特化）
  private extractFromTitle(title: string, episode: any) {
    const locations = [];

    // ≠MEに特化したタイトルパターン
    const titlePatterns = [
      // 店舗名がタイトルに含まれるパターン
      {
        pattern: /【([^】]*(?:カフェ|cafe|CAFE|Cafe)[^】]*)】/gi,
        category: 'cafe',
        confidence: 'high'
      },
      {
        pattern: /【([^】]*(?:スイパラ|スイーツパラダイス)[^】]*)】/gi,
        category: 'cafe',
        confidence: 'high',
        fullName: 'スイーツパラダイス'
      },
      {
        pattern: /【([^】]*(?:H&M|エイチアンドエム)[^】]*)】/gi,
        category: 'shopping',
        confidence: 'medium',
        fullName: 'H&M'
      },
      {
        pattern: /([^【】]*(?:マリオパーティ|ゲーム|クレーンゲーム)[^【】]*)/gi,
        category: 'entertainment',
        confidence: 'low'
      },
      
      // 場所系パターン
      {
        pattern: /([^【】]*(?:上野|渋谷|新宿|原宿|銀座|池袋)[^【】]*)/gi,
        category: 'area',
        confidence: 'medium'
      },
      
      // 活動系からロケーション推測
      {
        pattern: /【([^】]*(?:釣り)[^】]*)】/gi,
        category: 'restaurant',
        confidence: 'medium',
        description: '釣り体験ができる飲食店'
      },
      {
        pattern: /【([^】]*(?:購入品|コーデ|ショッピング)[^】]*)】/gi,
        category: 'shopping',
        confidence: 'low'
      },
      {
        pattern: /【([^】]*(?:撮影|収録)[^】]*)】/gi,
        category: 'studio',
        confidence: 'low'
      }
    ];

    for (const patternInfo of titlePatterns) {
      const matches = title.match(patternInfo.pattern);
      if (matches) {
        for (const match of matches) {
          const cleanMatch = match.replace(/【|】/g, '').trim();
          
          // 特定店舗の詳細情報
          let locationData = {
            name: patternInfo.fullName || cleanMatch,
            address: this.getLocationAddress(patternInfo.fullName || cleanMatch, title),
            category: patternInfo.category,
            description: patternInfo.description || `${episode.title}で訪問`,
            confidence: patternInfo.confidence,
            source: 'title_extraction'
          };

          // 有効な場所のみ追加
          if (this.isValidLocation(locationData)) {
            locations.push(locationData);
          }
        }
      }
    }

    return locations;
  }

  // ロケーションの住所取得
  private getLocationAddress(name: string, title: string): string {
    // 特定店舗の住所データベース
    const knownAddresses: { [key: string]: string } = {
      'スイーツパラダイス': title.includes('上野') ? '東京都台東区上野6-15-1 上野マルイ8F' : '東京都内各店舗',
      'H&M': '東京都内各店舗',
      'マリオパーティ': 'ゲーム施設（詳細不明）',
      'クレーンゲーム': 'アミューズメント施設'
    };

    // タイトルから地域情報抽出
    const areas = ['上野', '渋谷', '新宿', '原宿', '銀座', '池袋', '横浜', '秋葉原'];
    const foundArea = areas.find(area => title.includes(area));
    
    if (knownAddresses[name]) {
      return knownAddresses[name];
    }
    
    if (foundArea) {
      return `東京都${foundArea}周辺`;
    }

    return '東京都内（詳細不明）';
  }

  // 有効なロケーションかチェック
  private isValidLocation(location: any): boolean {
    // 除外キーワード
    const excludeKeywords = [
      'youtube', 'live', 'ライブ', '配信', 'チャンネル',
      'メイク', 'コーデ', '企画', 'ドッキリ', '対決',
      'ゲーム', 'マリオ', 'クレーン', '麻雀', 'イントロ'
    ];

    const nameCheck = location.name.toLowerCase();
    return !excludeKeywords.some(keyword => nameCheck.includes(keyword.toLowerCase()));
  }

  // パターンマッチングによる抽出
  private extractByPatterns(description: string, episode: any) {
    const locations = [];

    // 店舗名パターン（実際の≠ME動画から学習）
    const storePatterns = [
      // カフェ・レストラン
      /([あ-ん]{2,8}(?:カフェ|cafe|Cafe|CAFE))/gi,
      /([あ-ん]{2,8}(?:レストラン|restaurant))/gi,
      /((?:[あ-ん]{2,8}|[A-Za-z]{2,15})(?:ラーメン|らーめん))/gi,
      
      // 有名チェーン店
      /(スターバックス(?:コーヒー)?|starbucks)/gi,
      /(ドトール(?:コーヒー)?|doutor)/gi,
      /(タリーズ(?:コーヒー)?|tully'?s)/gi,
      /(マクドナルド|McDonald'?s|マック)/gi,
      /(ケンタッキー|KFC)/gi,
      /(サイゼリヤ|saizeriya)/gi,
      /(ガスト|gusto)/gi,
      /(ロッテリア|lotteria)/gi,
      
      // 商業施設
      /(渋谷109|109渋谷|shibuya109)/gi,
      /(新宿ルミネ|ルミネ新宿|lumine)/gi,
      /(表参道ヒルズ|omotesando hills)/gi,
      /(東京駅|tokyo station)/gi,
      /(羽田空港|haneda airport)/gi,
      
      // エンタメ施設
      /(サンリオピューロランド|puroland|ピューロランド)/gi,
      /(東京ディズニーランド|disneyland)/gi,
      /(東京ディズニーシー|disneysea)/gi,
      /(ユニバーサル(?:スタジオ)?(?:ジャパン)?|USJ)/gi,
      
      // 観光地
      /(浅草|asakusa)/gi,
      /(築地|tsukiji)/gi,
      /(原宿|harajuku)/gi,
      /(中華街|chinatown)/gi
    ];

    // 住所パターン
    const addressPatterns = [
      // 都道府県 + 市区町村 + 番地
      /((?:東京都|神奈川県|千葉県|埼玉県|大阪府|京都府|兵庫県|愛知県|福岡県|北海道|宮城県|広島県|静岡県)[^。\n]{5,30})/g,
      
      // 区 + 丁目
      /([あ-ん]{2,8}区[あ-ん]{2,15}(?:\d+-\d+-\d+|\d+丁目))/g,
      
      // 駅近表現
      /([あ-ん]{2,8}駅(?:前|近く|周辺|から徒歩\d+分))/g
    ];

    // パターンマッチング実行
    for (const pattern of storePatterns) {
      const matches = description.match(pattern);
      if (matches) {
        for (const match of matches) {
          // 住所を周辺テキストから抽出
          const context = this.getContextText(description, match);
          const address = this.findAddressInContext(context, addressPatterns);
          
          if (address || this.isFamousLocation(match)) {
            locations.push({
              name: this.cleanLocationName(match),
              address: address || this.getDefaultAddress(match),
              category: this.categorizeLocation(match),
              description: `${episode.title}で言及された店舗・施設`,
              confidence: address ? 'medium' : 'low',
              source: 'pattern_matching'
            });
          }
        }
      }
    }

    // 重複除去
    const uniqueLocations = locations.filter((loc, index, arr) => 
      arr.findIndex(l => l.name === loc.name) === index
    );

    return uniqueLocations.slice(0, 3); // 最大3件まで
  }

  // 周辺テキスト取得
  private getContextText(text: string, target: string): string {
    const index = text.indexOf(target);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + target.length + 100);
    return text.substring(start, end);
  }

  // 住所抽出
  private findAddressInContext(context: string, patterns: RegExp[]): string {
    for (const pattern of patterns) {
      const match = context.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return '';
  }

  // 有名な場所の判定
  private isFamousLocation(name: string): boolean {
    const famousPlaces = [
      'サンリオピューロランド', '109渋谷', '表参道ヒルズ', 
      'ディズニーランド', 'ディズニーシー', 'USJ',
      'スターバックス', 'マクドナルド', '浅草', '築地'
    ];
    
    return famousPlaces.some(place => 
      name.toLowerCase().includes(place.toLowerCase()) ||
      place.toLowerCase().includes(name.toLowerCase())
    );
  }

  // デフォルト住所取得
  private getDefaultAddress(name: string): string {
    const defaultAddresses: { [key: string]: string } = {
      'サンリオピューロランド': '東京都多摩市落合1-31',
      '109渋谷': '東京都渋谷区道玄坂2-29-1',
      '表参道ヒルズ': '東京都渋谷区神宮前4-12-10',
      '築地': '東京都中央区築地',
      '浅草': '東京都台東区浅草'
    };

    for (const [key, address] of Object.entries(defaultAddresses)) {
      if (name.includes(key)) {
        return address;
      }
    }

    return '住所不明';
  }

  // ロケーション名クリーニング
  private cleanLocationName(name: string): string {
    return name
      .replace(/[【】\[\]()（）]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // カテゴリ分類
  private categorizeLocation(name: string): string {
    const categories: { [key: string]: string } = {
      'カフェ|cafe|コーヒー|スターバックス|ドトール|タリーズ': 'cafe',
      'ラーメン|らーめん': 'restaurant',
      'マクドナルド|ケンタッキー|ガスト|サイゼ': 'restaurant',
      'ピューロランド|ディズニー|USJ': 'theme_park',
      '109|ルミネ|ヒルズ': 'shopping',
      '駅|空港': 'transportation',
      '浅草|築地|原宿|中華街': 'tourist_spot'
    };

    for (const [pattern, category] of Object.entries(categories)) {
      if (new RegExp(pattern, 'i').test(name)) {
        return category;
      }
    }

    return 'other';
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

  // データベース保存
  private async saveLocation(location: any, episode: any): Promise<boolean> {
    try {
      const locationData = {
        name: location.name,
        slug: `${location.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        description: location.description,
        address: location.address,
        website_url: `https://www.google.com/maps/search/${encodeURIComponent(location.address)}`,
        tags: ['無料抽出', 'タイトル抽出', location.category, location.confidence, '≠ME'],
        episode_id: episode.id,
        celebrity_id: NOT_EQUAL_ME_ID
      };

      console.log(`   📝 保存データ: ${JSON.stringify(locationData, null, 2)}`);

      const { data, error } = await supabase
        .from('locations')
        .insert([locationData])
        .select();

      if (error) {
        console.error(`   ❌ 保存エラー: ${error.message}`);
        return false;
      }

      console.log(`   ✅ 保存成功: ID ${data[0]?.id}`);
      return true;
    } catch (err) {
      console.error(`   ❌ 例外エラー: ${err.message}`);
      return false;
    }
  }

  // 無料版レポート
  private async generateFreeReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🆓 無料抽出完了レポート');
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
    console.log(`💸 API費用: $0.00 (完全無料)`);
    console.log(`⚡ 使用技術: パターンマッチング + YouTube API (無料枠)`);

    const rate = this.stats.processedEpisodes > 0 ? 
      Math.round((this.stats.successfulExtractions / this.stats.processedEpisodes) * 100) : 0;
    console.log(`\n🎯 抽出率: ${rate}%`);

    console.log('\n💡 精度向上のヒント:');
    console.log('1. より多くの店舗パターンを追加');
    console.log('2. 住所抽出パターンの改善');
    console.log('3. AI抽出との組み合わせ使用');

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/not-equal-me');
    console.log('\n' + '='.repeat(60));
  }
}

async function main() {
  const extractor = new FreeApiExtractor();
  
  const args = process.argv.slice(2);
  const maxEpisodes = parseInt(args[0]) || 50;

  console.log(`🆓 無料抽出開始: 最新${maxEpisodes}エピソード`);
  await extractor.extractWithFreeApis(maxEpisodes);
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}