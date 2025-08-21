import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const NEARLY_EQUAL_JOY_ID = '4d8f9c7e-1a23-456b-789c-0d1e2f3456af'; // ≒JOYのID

// ≒JOY 概要欄ロケーション抽出システム
export class NearlyEqualJoyExtractor {
  private youtubeApiKey: string;
  private stats = {
    totalEpisodes: 0,
    processedEpisodes: 0,
    episodesWithLocations: 0,
    totalLocationsExtracted: 0,
    successfulSaves: 0,
    skippedDuplicates: 0,
    errors: 0
  };

  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  // メイン処理
  async extractFromAllEpisodes(limit: number = 50): Promise<void> {
    console.log('🔍 ≒JOY概要欄ロケーション抽出開始');
    console.log('='.repeat(60));
    console.log(`📺 対象: 最新${limit}エピソード`);
    console.log('🎯 抽出対象: 撮影協力、店舗情報、ロケ地情報\n');

    try {
      // まず≒JOYのIDを確認
      const { data: celebrity } = await supabase
        .from('celebrities')
        .select('id, name, slug')
        .eq('slug', 'nearly-equal-joy')
        .single();

      if (!celebrity) {
        console.error('❌ ≒JOYが見つかりません');
        return;
      }

      const celebId = celebrity.id;
      console.log(`✅ セレブリティ確認: ${celebrity.name} (ID: ${celebId})`);

      // エピソード取得
      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('id, video_url, title, date, celebrity_id')
        .eq('celebrity_id', celebId)
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
          // YouTube概要欄取得
          const description = await this.getVideoDescription(episode.video_url);
          
          if (!description) {
            console.log('   📄 概要欄なし');
            this.stats.processedEpisodes++;
            continue;
          }

          // 店舗情報抽出
          const locations = this.extractLocations(description, episode);
          
          if (locations.length === 0) {
            console.log('   📍 店舗情報なし');
          } else {
            console.log(`   📍 ${locations.length}件の店舗情報を発見`);
            this.stats.episodesWithLocations++;
            
            // データベース保存
            for (const location of locations) {
              console.log(`      🔍 抽出: ${location.name}`);
              const saved = await this.saveLocation(location, episode, celebId);
              if (saved === 'success') {
                this.stats.successfulSaves++;
                console.log(`         ✅ 保存: ${location.name}`);
                if (location.address && location.address !== '東京都内') {
                  console.log(`         📍 ${location.address}`);
                }
              } else if (saved === 'duplicate') {
                this.stats.skippedDuplicates++;
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
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`   ❌ エラー: ${error.message}`);
          this.stats.errors++;
        }
      }

      await this.generateReport(celebId);

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
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

  // 店舗情報の抽出（≒JOY特化）
  private extractLocations(description: string, episode: any) {
    const locations = [];
    const foundNames = new Set<string>();

    // 1. 撮影協力パターン
    const cooperationPatterns = [
      /【?撮影協力】?\s*[:：]?\s*\n?([^\n]+)/gi,
      /撮影協力\s*[:：]\s*([^\n]+)/gi,
      /協力\s*[:：]\s*([^\n]+)/gi,
      /Special Thanks?\s*[:：]\s*([^\n]+)/gi,
      /取材協力\s*[:：]\s*([^\n]+)/gi,
      /ロケ地\s*[:：]\s*([^\n]+)/gi,
      /場所提供\s*[:：]\s*([^\n]+)/gi,
      /会場\s*[:：]\s*([^\n]+)/gi
    ];

    for (const pattern of cooperationPatterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        const text = match[1].trim();
        const stores = this.parseMultipleStores(text);
        
        for (const store of stores) {
          const locationData = this.createLocationData(store, episode, 'cooperation');
          if (locationData && !foundNames.has(locationData.name)) {
            locations.push(locationData);
            foundNames.add(locationData.name);
          }
        }
      }
    }

    // 2. URL付き店舗情報パターン
    const urlPatterns = [
      /([^【】\n]+)(?:さん|様)?\s*(?:HP|ホームページ|WEB|Web|URL)?\s*[:：]?\s*(https?:\/\/[^\s\n]+)/gi,
    ];

    for (const pattern of urlPatterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        const name = this.cleanStoreName(match[1]);
        const url = match[2];
        
        if (this.isValidStoreName(name) && !foundNames.has(name)) {
          const locationData = this.createLocationData(name, episode, 'url_reference', url);
          if (locationData) {
            locations.push(locationData);
            foundNames.add(name);
          }
        }
      }
    }

    // 3. 住所付き店舗パターン
    const addressPatterns = [
      /([^【】\n]+)\s*\n?\s*(?:〒\d{3}-\d{4})?\s*((?:東京都|神奈川県|千葉県|埼玉県|大阪府|京都府|兵庫県|愛知県|福岡県|北海道)[^\n]+)/gi,
      /([^【】\n]+)\s*\n?\s*住所\s*[:：]\s*([^\n]+)/gi,
      /([^【】\n]+)\s*\n?\s*場所\s*[:：]\s*([^\n]+)/gi
    ];

    for (const pattern of addressPatterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        const name = this.cleanStoreName(match[1]);
        const address = match[2].trim();
        
        if (this.isValidStoreName(name) && !foundNames.has(name)) {
          const locationData = this.createLocationData(name, episode, 'address_reference', null, address);
          if (locationData) {
            locations.push(locationData);
            foundNames.add(name);
          }
        }
      }
    }

    // 4. 特定の店舗キーワードパターン
    const storePatterns = [
      /([^、。\n]+(?:店|カフェ|レストラン|ホテル|スタジオ|施設|会場|ホール|シアター|劇場|美術館|博物館|公園|ショップ|ストア))[^\n]*で/gi,
      /([^、。\n]+(?:店|カフェ|レストラン))[^\n]*に(?:行った|訪れた|伺った)/gi
    ];

    for (const pattern of storePatterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        const name = this.cleanStoreName(match[1]);
        
        if (this.isValidStoreName(name) && !foundNames.has(name)) {
          const locationData = this.createLocationData(name, episode, 'keyword_match');
          if (locationData) {
            locations.push(locationData);
            foundNames.add(name);
          }
        }
      }
    }

    return locations;
  }

  // 複数店舗の分割
  private parseMultipleStores(text: string): string[] {
    const stores = text.split(/[、,・／/｜|]/).map(s => this.cleanStoreName(s)).filter(s => s.length > 0);
    
    return stores.filter(store => {
      return !store.startsWith('http') && 
             !store.startsWith('@') && 
             !store.includes('.com') &&
             !store.includes('.jp') &&
             store.length > 2 &&
             store.length < 50;
    });
  }

  // 店舗名のクリーンアップ
  private cleanStoreName(text: string): string {
    return text
      .replace(/[【】\[\]()（）「」『』""''《》〈〉]/g, '')
      .replace(/[:：]\s*$/, '')
      .replace(/^\s*[、。・]\s*/, '')
      .replace(/さん$|様$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 有効な店舗名かチェック（≒JOY特化）
  private isValidStoreName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 50) return false;
    
    // 除外キーワード（厳格化）
    const excludeKeywords = [
      // SNS・プラットフォーム
      'Twitter', 'Instagram', 'YouTube', 'TikTok', 'LINE',
      'Amazon', 'Rakuten', 'Qoo10',
      
      // 一般的な除外
      'ありがとう', 'よろしく', 'お願い', 'します', 'でした',
      'お問い合わせ', 'contact', 'inquiry',
      
      // リンク関連
      'こちら', 'はこちら', 'リンク', 'URL', 'サイト', 'ページ',
      '詳細', '特設', '動画', 'video', '再生リスト',
      
      // 制作関連
      'プロデューサー', 'ディレクター', 'スタッフ', 'カメラマン',
      '製作', '制作', '協力', 'のみなさま', 'みなさま', '皆様',
      '編集', '撮影', '音楽', '楽曲', '提供', 'BGM',
      
      // 企画・コンテンツ関連
      '企画', 'やって欲しい', 'お便り', 'おすすめ', 'メイク',
      '歌ってみた', '踊ってみた', 'シリーズ', '過去の',
      'チャンネル', 'アカウント', '公式', 'オフィシャル',
      
      // ≒JOY固有の除外
      'ニアリー', 'JOY', 'イコール', '≒'
    ];
    
    const nameLower = name.toLowerCase();
    
    // 除外キーワードチェック
    if (excludeKeywords.some(keyword => nameLower.includes(keyword.toLowerCase()))) {
      return false;
    }
    
    // URL含む場合は除外
    if (name.includes('http') || name.includes('.com') || name.includes('.jp')) {
      return false;
    }
    
    // 記号だけの場合は除外
    if (/^[▼●■⭐️👇！？]+$/.test(name)) {
      return false;
    }
    
    // メンバー名らしいパターンを除外
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name) || // "Firstname Lastname"
        /[あ-ん]{2,4}\s[あ-ん]{2,4}/.test(name)) { // ひらがな名前
      return false;
    }
    
    return true;
  }

  // ロケーションデータ作成
  private createLocationData(name: string, episode: any, source: string, url?: string, address?: string) {
    if (!this.isValidStoreName(name)) return null;

    const category = this.detectCategory(name);
    
    return {
      name: name,
      address: address || this.guessAddress(name),
      category: category,
      description: this.generateDescription(name, episode, source),
      website: url,
      tags: this.generateTags(name, category, source),
      confidence: this.determineConfidence(source, address, url),
      source: source
    };
  }

  // カテゴリ判定
  private detectCategory(name: string): string {
    const categories = {
      'cafe': ['カフェ', 'cafe', 'coffee', 'コーヒー', '珈琲', '喫茶', 'スイーツ', 'ケーキ'],
      'restaurant': ['レストラン', 'restaurant', '食堂', '料理', 'ダイニング', '焼肉', 'ラーメン', '寿司', 'そば', 'うどん', '居酒屋', '食事処', 'グリル', '鉄板', 'ビストロ'],
      'studio': ['スタジオ', 'studio', '撮影所'],
      'hotel': ['ホテル', 'hotel', '旅館', '宿', 'リゾート'],
      'shop': ['ショップ', 'shop', '店', 'ストア', 'store', 'ブティック', 'セレクト'],
      'facility': ['施設', '会場', 'ホール', 'シアター', '劇場', '美術館', '博物館', '公園', 'センター', 'アリーナ'],
      'entertainment': ['ボウリング', 'カラオケ', 'ゲームセンター', 'アミューズメント', 'プール', 'スパ', '温泉']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase()))) {
        return category;
      }
    }

    return 'other';
  }

  // 説明文生成
  private generateDescription(name: string, episode: any, source: string): string {
    const sourceDescriptions = {
      'cooperation': `${episode.title}の撮影協力店舗`,
      'url_reference': `${episode.title}で紹介された店舗`,
      'address_reference': `${episode.title}で訪問した店舗`,
      'keyword_match': `${episode.title}に関連する店舗`
    };

    return sourceDescriptions[source] || `${episode.title}で言及された店舗`;
  }

  // タグ生成
  private generateTags(name: string, category: string, source: string): string[] {
    const tags = ['概要欄抽出', category, '≒JOY'];
    
    if (source === 'cooperation') tags.push('撮影協力', 'filming_location');
    if (source === 'url_reference') tags.push('公式リンク付き');
    if (source === 'address_reference') tags.push('住所明記');
    
    return tags;
  }

  // 信頼度判定
  private determineConfidence(source: string, address?: string, url?: string): string {
    if (source === 'cooperation') return 'high';
    if (source === 'address_reference' && address) return 'high';
    if (source === 'url_reference' && url) return 'medium';
    return 'medium';
  }

  // 住所推測
  private guessAddress(name: string): string {
    const areas = ['渋谷', '新宿', '原宿', '表参道', '池袋', '銀座', '六本木', '赤坂', '青山', '恵比寿', '中目黒', '代官山', '吉祥寺', '下北沢', '高円寺', '中野', '秋葉原', '上野', '浅草', '築地', '品川', '目黒', '自由が丘', '二子玉川', '横浜', '川崎', '大宮', '千葉', '船橋'];
    
    for (const area of areas) {
      if (name.includes(area)) {
        return `東京都${area}周辺`;
      }
    }

    return '東京都内';
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
        slug: `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: location.description,
        address: location.address,
        website_url: location.website || `https://www.google.com/maps/search/${encodeURIComponent(location.name + ' ' + location.address)}`,
        tags: location.tags,
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

  // レポート生成
  private async generateReport(celebrityId: string): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ≒JOY概要欄抽出完了レポート');
    console.log('='.repeat(60));

    const { count: totalCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrityId);

    console.log('\n📈 処理結果:');
    console.log(`📺 処理エピソード: ${this.stats.processedEpisodes}/${this.stats.totalEpisodes}件`);
    console.log(`🎯 店舗情報があったエピソード: ${this.stats.episodesWithLocations}件`);
    console.log(`📍 抽出された店舗総数: ${this.stats.totalLocationsExtracted}件`);
    console.log(`✅ 新規保存: ${this.stats.successfulSaves}件`);
    console.log(`⚠️ 重複スキップ: ${this.stats.skippedDuplicates}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📍 ≒JOY総ロケーション数: ${totalCount}件`);

    if (this.stats.processedEpisodes > 0) {
      const extractionRate = Math.round((this.stats.episodesWithLocations / this.stats.processedEpisodes) * 100);
      console.log(`\n🎯 概要欄からの抽出率: ${extractionRate}%`);
    }

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/nearly-equal-joy');
    console.log('\n' + '='.repeat(60));
  }
}

// メイン処理
async function main() {
  const extractor = new NearlyEqualJoyExtractor();
  
  const args = process.argv.slice(2);
  const limit = parseInt(args[0]) || 30;

  console.log(`🚀 ≒JOY概要欄抽出開始: 最新${limit}エピソード`);
  await extractor.extractFromAllEpisodes(limit);
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}