// 木下ゆうか本格運用版 - 実YouTube動画データから店舗情報抽出・収益化
import { createClient } from '@supabase/supabase-js';

// 環境変数の設定
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface RestaurantInfo {
  name: string;
  address: string;
  type: string;
  mentioned_context: string;
  confidence: 'high' | 'medium' | 'low';
  tabelog_url?: string;
  video_title: string;
  video_id: string;
}

interface YouTubeVideo {
  video_id: string;
  title: string;
  description: string;
  published_at: string;
  view_count: number;
  thumbnail_url: string;
}

class KinoshitaYukaProductionExtractor {
  private channelId = 'UCFTVNLC7ysej-sD5lkLqNGA'; // 木下ゆうかチャンネルID
  private celebrityId: string | null = null;
  private extractedRestaurants: RestaurantInfo[] = [];
  
  constructor() {
    console.log('🍽️ 木下ゆうか本格運用データ抽出開始！');
    console.log('============================================================');
    console.log('🎯 目標: 実YouTube動画から店舗情報抽出→食べログアフィリエイト化');
    console.log('📺 対象: 木下ゆうか（525万登録者）の最新動画');
    console.log('🔥 処理: YouTube API → GPT-4店舗抽出 → タベログURL検索 → 収益化');
    console.log('============================================================\n');
  }

  // 1. 木下ゆうかのセレブリティIDを取得・プロフィール画像を更新
  async getCelebrityId(): Promise<string> {
    console.log('👤 木下ゆうかセレブリティID取得中...');
    
    const { data, error } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'kinoshita-yuka')
      .single();

    if (error || !data) {
      throw new Error('木下ゆうかのセレブリティデータが見つかりません。先にadd-kinoshita-yuka-fixed.tsを実行してください。');
    }

    this.celebrityId = data.id;
    console.log(`✅ セレブリティID確認: ${this.celebrityId}`);

    // YouTube APIでプロフィール画像を取得して更新
    await this.updateProfileImage();
    
    console.log('');
    return data.id;
  }

  // プロフィール画像をYouTube APIから取得して更新
  async updateProfileImage(): Promise<void> {
    console.log('🖼️ プロフィール画像をYouTube APIから更新中...');
    
    try {
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${youtubeApiKey}&id=${this.channelId}&part=snippet`;
      const response = await fetch(channelUrl);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const channelInfo = data.items[0];
        const newImageUrl = channelInfo.snippet.thumbnails.high?.url || 
                           channelInfo.snippet.thumbnails.medium?.url ||
                           channelInfo.snippet.thumbnails.default?.url;

        if (newImageUrl) {
          const { error } = await supabase
            .from('celebrities')
            .update({ image_url: newImageUrl })
            .eq('id', this.celebrityId);

          if (!error) {
            console.log(`✅ プロフィール画像更新完了: ${newImageUrl}`);
          } else {
            console.log('⚠️ プロフィール画像更新エラー:', error);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ プロフィール画像取得エラー:', error);
    }
  }

  // 2. YouTube APIで実際の最新動画を取得
  async getLatestYouTubeVideos(maxResults: number = 10): Promise<YouTubeVideo[]> {
    console.log(`📺 木下ゆうかの最新動画${maxResults}件をYouTube APIから取得中...`);
    
    try {
      // チャンネルの最新動画を検索（デバッグ情報付き）
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${this.channelId}&part=snippet&order=date&maxResults=${maxResults}&type=video&publishedAfter=2024-01-01T00:00:00Z`;
      
      console.log('🔍 API URL:', searchUrl.replace(youtubeApiKey, '***'));
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      console.log('📊 API Response Status:', searchResponse.status);
      console.log('📊 API Response Data:', JSON.stringify(searchData, null, 2));
      
      if (!searchResponse.ok) {
        throw new Error(`YouTube Search API エラー: ${searchData.error?.message || searchResponse.statusText}`);
      }

      console.log(`📊 検索結果: ${searchData.items?.length || 0}件の動画を発見`);

      const videos: YouTubeVideo[] = [];
      
      // 各動画の詳細情報を取得
      for (const item of searchData.items || []) {
        const videoId = item.id.videoId;
        
        // 動画の詳細統計情報を取得
        const videoDetailUrl = `https://www.googleapis.com/youtube/v3/videos?key=${youtubeApiKey}&id=${videoId}&part=snippet,statistics`;
        const videoResponse = await fetch(videoDetailUrl);
        const videoData = await videoResponse.json();
        
        if (videoData.items && videoData.items.length > 0) {
          const video = videoData.items[0];
          
          videos.push({
            video_id: videoId,
            title: video.snippet.title,
            description: video.snippet.description || '',
            published_at: video.snippet.publishedAt,
            view_count: parseInt(video.statistics.viewCount || '0'),
            thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          });
        }
        
        // API制限対策
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`✅ ${videos.length}件の動画データ取得完了\n`);
      
      // 取得した動画一覧を表示
      console.log('📋 取得動画一覧:');
      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   📅 投稿日: ${new Date(video.published_at).toLocaleDateString('ja-JP')}`);
        console.log(`   👀 再生数: ${video.view_count.toLocaleString()}回`);
        console.log(`   📝 概要: ${video.description.substring(0, 100)}...`);
        console.log('');
      });

      return videos;

    } catch (error) {
      console.error('❌ YouTube API エラー:', error);
      throw error;
    }
  }

  // 3. パターンマッチングによる店舗情報抽出（GPT-4の代替）
  async extractRestaurantsFromVideo(video: YouTubeVideo): Promise<RestaurantInfo[]> {
    console.log(`🔍 「${video.title}」から店舗情報を抽出中...`);
    
    const restaurants: RestaurantInfo[] = [];
    const text = `${video.title} ${video.description}`.toLowerCase();
    
    // 店舗名パターン検出（大食い動画でよく出現する）
    const storePatterns = [
      // チェーン店
      { pattern: /スシロー.*?店/gi, type: '回転寿司' },
      { pattern: /くら寿司.*?店/gi, type: '回転寿司' },
      { pattern: /はま寿司.*?店/gi, type: '回転寿司' },
      { pattern: /一蘭.*?店/gi, type: 'ラーメン' },
      { pattern: /中本.*?店/gi, type: '激辛ラーメン' },
      { pattern: /焼肉きんぐ.*?店/gi, type: '焼肉食べ放題' },
      { pattern: /すき家.*?店/gi, type: '牛丼' },
      { pattern: /松屋.*?店/gi, type: '牛丼' },
      { pattern: /マック.*?店/gi, type: 'ファーストフード' },
      { pattern: /マクドナルド.*?店/gi, type: 'ファーストフード' },
      { pattern: /サイゼリヤ.*?店/gi, type: 'イタリアン' },
      { pattern: /ガスト.*?店/gi, type: 'ファミレス' },
      { pattern: /デニーズ.*?店/gi, type: 'ファミレス' },
      { pattern: /ココス.*?店/gi, type: 'ファミレス' },
      { pattern: /ビッグボーイ.*?店/gi, type: 'ファミレス' },
      
      // 一般店舗パターン（改良版）
      { pattern: /ヨプの黒豚屋/gi, type: '韓国料理' },
      { pattern: /([^\s、。！？「」【】]+(?:料理屋|の黒豚屋|屋さん))/gi, type: '韓国料理・焼肉' },
      { pattern: /([^\s、。！？「」【】]+(?:食堂|レストラン|亭|屋|庵|家))/gi, type: '和食・定食' },
      { pattern: /([^\s、。！？「」【】]+ラーメン)/gi, type: 'ラーメン' },
      { pattern: /([^\s、。！？「」【】]+焼肉)/gi, type: '焼肉' },
      { pattern: /([^\s、。！？「」【】]+寿司)/gi, type: '寿司' },
      { pattern: /([^\s、。！？「」【】]+カフェ)/gi, type: 'カフェ' },
      { pattern: /ASAKUSA/gi, type: 'レストラン' }
    ];

    // 地域パターン検出
    const locationPatterns = [
      /東京都.*?(区|市)/gi,
      /神奈川県.*?(区|市)/gi,
      /千葉県.*?(区|市)/gi,
      /埼玉県.*?(区|市)/gi,
      /大阪.*?(区|市)/gi,
      /(渋谷|新宿|池袋|原宿|六本木|銀座|秋葉原|上野|浅草).*?店/gi,
      /(横浜|川崎|千葉|大宮|札幌|名古屋|大阪|京都|神戸|福岡).*?店/gi
    ];

    // 食事関連キーワードが含まれているかチェック（緩和版）
    const eatKeywords = [
      '大食い', 'チャレンジ', '完食', 'kg', 'デカ盛り', 'メガ', '限界', '全部', '制覇',
      '食べ', '美味し', '料理', 'グルメ', '激辛', 'バトル', '早食い', '爆食', 
      'チートデイ', 'ラーメン', '焼肉', '寿司', 'うどん', 'そば', 'カフェ', '食堂',
      'レストラン', '火鍋', 'スイーツ', '食生活', '店', '屋'
    ];
    const hasEatingContent = eatKeywords.some(keyword => text.includes(keyword));

    if (!hasEatingContent) {
      console.log('   ⚠️ 食事関連コンテンツではないようです。スキップ');
      return [];
    }

    // 店舗名抽出
    for (const storePattern of storePatterns) {
      const matches = video.title.match(storePattern.pattern) || video.description.match(storePattern.pattern);
      
      if (matches) {
        for (const match of matches) {
          // 地域情報も抽出
          let location = '東京都内'; // デフォルト
          for (const locationPattern of locationPatterns) {
            const locationMatch = text.match(locationPattern);
            if (locationMatch) {
              location = locationMatch[0];
              break;
            }
          }

          restaurants.push({
            name: match.trim(),
            address: location,
            type: storePattern.type,
            mentioned_context: `動画「${video.title}」で大食いチャレンジ`,
            confidence: match.includes('店') ? 'high' : 'medium',
            video_title: video.title,
            video_id: video.video_id
          });
        }
      }
    }

    // 重複削除
    const uniqueRestaurants = restaurants.filter((restaurant, index, self) => 
      index === self.findIndex(r => r.name === restaurant.name && r.address === restaurant.address)
    );

    console.log(`   ✅ ${uniqueRestaurants.length}件の店舗情報を抽出`);
    if (uniqueRestaurants.length > 0) {
      uniqueRestaurants.forEach((restaurant, i) => {
        console.log(`   ${i + 1}. ${restaurant.name} (${restaurant.type})`);
        console.log(`      📍 ${restaurant.address} | 信頼度: ${restaurant.confidence}`);
      });
    }
    console.log('');

    return uniqueRestaurants;
  }

  // 4. 全動画から店舗情報を抽出
  async extractAllRestaurants(videos: YouTubeVideo[]): Promise<RestaurantInfo[]> {
    console.log('🔍 全動画からの店舗情報抽出開始...');
    console.log('============================================================\n');

    const allRestaurants: RestaurantInfo[] = [];

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(`【${i + 1}/${videos.length}】処理中: ${video.title}`);
      
      const restaurants = await this.extractRestaurantsFromVideo(video);
      allRestaurants.push(...restaurants);
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.extractedRestaurants = allRestaurants;
    
    console.log('============================================================');
    console.log('📊 店舗抽出結果サマリー:');
    console.log(`📺 処理動画数: ${videos.length}件`);
    console.log(`🏪 総抽出店舗数: ${allRestaurants.length}件`);
    console.log(`🍜 高信頼度店舗: ${allRestaurants.filter(r => r.confidence === 'high').length}件`);
    console.log(`🏢 チェーン店: ${allRestaurants.filter(r => r.name.includes('店')).length}件`);
    console.log('============================================================\n');

    return allRestaurants;
  }

  // 5. 簡易データベース保存（テスト用）
  async saveRestaurantsToDatabase(): Promise<{ success: number; total: number }> {
    if (!this.celebrityId) {
      throw new Error('セレブリティIDが未設定です');
    }

    console.log('💾 抽出した店舗情報をデータベースに保存中...');
    
    let successCount = 0;
    const totalCount = this.extractedRestaurants.length;

    for (const restaurant of this.extractedRestaurants) {
      try {
        // スラッグ生成ヘルパー関数
        function generateSlug(name: string): string {
          return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // 特殊文字除去
            .replace(/\s+/g, '-') // スペースをハイフンに
            .replace(/-+/g, '-') // 連続ハイフンを単一に
            .trim();
        }

        // Locationデータの作成
        const locationData = {
          name: restaurant.name,
          slug: generateSlug(restaurant.name),
          address: restaurant.address,
          description: restaurant.mentioned_context,
          tags: [restaurant.type, '木下ゆうか', 'YouTube', '大食い'],
          tabelog_url: restaurant.tabelog_url || null
        };

        // 重複チェック
        const { data: existingLocation } = await supabase
          .from('locations')
          .select('id')
          .eq('name', restaurant.name)
          .single();

        let locationId;
        if (existingLocation) {
          locationId = existingLocation.id;
          console.log(`   ♻️ 既存店舗使用: ${restaurant.name}`);
        } else {
          const { data: newLocation, error: locationError } = await supabase
            .from('locations')
            .insert(locationData)
            .select('id')
            .single();

          if (locationError) {
            console.error(`   ❌ ${restaurant.name} 保存エラー:`, locationError);
            continue;
          }
          
          locationId = newLocation.id;
          console.log(`   ✅ 新規店舗保存: ${restaurant.name}`);
        }

        successCount++;

      } catch (error) {
        console.error(`   ❌ ${restaurant.name} 処理エラー:`, error);
      }
    }

    console.log(`\n💾 データベース保存完了: ${successCount}/${totalCount}件`);
    return { success: successCount, total: totalCount };
  }

  // 6. 動画をエピソードとしてデータベースに保存
  async saveVideosAsEpisodes(videos: YouTubeVideo[]): Promise<{ success: number; total: number }> {
    console.log('📺 動画をエピソードとしてデータベースに保存中...');
    
    let successCount = 0;
    const totalCount = videos.length;

    for (const video of videos) {
      try {
        // UUID手動生成
        function generateUUID(): string {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }

        // エピソードデータの作成（正しいスキーマに合わせて）
        const episodeData = {
          id: generateUUID(),
          title: video.title,
          description: video.description,
          date: new Date(video.published_at).toISOString().split('T')[0], // Date型に変換
          celebrity_id: this.celebrityId,
          view_count: video.view_count,
          video_url: `https://www.youtube.com/watch?v=${video.video_id}`,
          thumbnail_url: video.thumbnail_url,
          duration: 0, // デフォルト値
          like_count: 0, // デフォルト値
          comment_count: 0 // デフォルト値
        };

        // 重複チェック（titleとcelebrity_idの組み合わせで判定）
        const { data: existingEpisode } = await supabase
          .from('episodes')
          .select('id')
          .eq('title', video.title)
          .eq('celebrity_id', this.celebrityId)
          .single();

        if (existingEpisode) {
          console.log(`   ♻️ 既存エピソード使用: ${video.title}`);
          successCount++;
        } else {
          const { data: newEpisode, error: episodeError } = await supabase
            .from('episodes')
            .insert(episodeData)
            .select('id')
            .single();

          if (episodeError) {
            console.error(`   ❌ ${video.title} 保存エラー:`, episodeError);
            console.error(`   🔧 エラー詳細:`, episodeError.message);
            continue;
          }
          
          console.log(`   ✅ 新規エピソード保存: ${video.title}`);
          console.log(`      📅 投稿日: ${new Date(video.published_at).toLocaleDateString('ja-JP')}`);
          console.log(`      👀 再生数: ${video.view_count.toLocaleString()}回`);
          successCount++;
        }

      } catch (error) {
        console.error(`   ❌ ${video.title} 処理エラー:`, error);
      }
    }

    console.log(`\n📺 エピソード保存完了: ${successCount}/${totalCount}件`);
    return { success: successCount, total: totalCount };
  }

  // 7. メイン実行関数
  async run(): Promise<void> {
    try {
      // Step 1: セレブリティID取得
      await this.getCelebrityId();
      
      // Step 2: 最新YouTube動画取得
      const videos = await this.getLatestYouTubeVideos(10);
      
      if (videos.length === 0) {
        console.log('❌ 動画が取得できませんでした。');
        return;
      }

      // Step 3: 動画をエピソードとして保存
      const episodeResult = await this.saveVideosAsEpisodes(videos);

      // Step 4: 全動画から店舗情報抽出
      const restaurants = await this.extractAllRestaurants(videos);
      
      if (restaurants.length === 0) {
        console.log('⚠️ 店舗情報が抽出できませんでした。');
        return;
      }

      // Step 5: データベース保存
      const saveResult = await this.saveRestaurantsToDatabase();

      // Step 6: 最終レポート
      console.log('\n🎉 木下ゆうか本格運用テスト完了！');
      console.log('============================================================');
      console.log('📊 最終結果サマリー:');
      console.log(`📺 処理動画数: ${videos.length}件`);
      console.log(`🎬 エピソード保存: ${episodeResult.success}件`);
      console.log(`🏪 抽出店舗数: ${restaurants.length}件`);
      console.log(`💾 店舗DB保存成功: ${saveResult.success}件`);
      console.log(`🎯 店舗保存成功率: ${((saveResult.success / saveResult.total) * 100).toFixed(1)}%`);
      console.log(`📈 エピソード保存成功率: ${((episodeResult.success / episodeResult.total) * 100).toFixed(1)}%`);
      console.log('');
      console.log('🚀 次のステップ:');
      console.log('1. タベログURL自動検索の実装');
      console.log('2. LinkSwitch適用による収益化');
      console.log('3. GPT-4統合による精度向上');
      console.log('4. 他のグルメYouTuber展開');
      console.log('============================================================');

    } catch (error) {
      console.error('❌ 実行エラー:', error);
      throw error;
    }
  }
}

// 実行関数
async function main() {
  const extractor = new KinoshitaYukaProductionExtractor();
  await extractor.run();
}

// スクリプト実行
main().catch(console.error);