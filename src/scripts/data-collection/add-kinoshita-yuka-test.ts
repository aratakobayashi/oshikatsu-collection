// 木下ゆうか専用データ抽出スクリプト（テスト版 - OpenAI APIなし）
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
}

interface KinoshitaYukaVideo {
  video_id: string;
  title: string;
  description: string;
  published_at: string;
  view_count: number;
  restaurants: RestaurantInfo[];
}

class KinoshitaYukaTestExtractor {
  private channelId = 'UCFTVNLC7ysej-sD5lkLqNGA'; // 木下ゆうかのチャンネルID
  private celebrityId: string | null = null;

  constructor() {
    console.log('🍽️ 木下ゆうかデータ抽出システム（テスト版）初期化中...');
  }

  // 1. 木下ゆうかをCelebritiesテーブルに追加
  async addKinoshitaYukaCelebrity() {
    console.log('👤 木下ゆうかを芸能人データベースに追加中...');
    
    const celebrityData = {
      name: '木下ゆうか',
      slug: 'kinoshita-yuka',
      bio: '元祖大食いYouTuber。2014年からYouTube活動開始、チャンネル登録者数525万人超え。可愛らしい見た目とは裏腹に5キロ以上の大盛り料理を軽々と完食する。全国の飲食店を訪問し、大食いチャレンジを行う。',
      image_url: 'https://yt3.ggpht.com/ytc/AIdro_kSlCJnJfI7ysLLNnzEo7n3w6YjWEP9W6CaJ-aV1Q=s800-c-k-c0x00ffffff-no-rj',
      birth_date: '1985-02-04',
      social_media: {
        youtube: `https://www.youtube.com/channel/${this.channelId}`,
        instagram: 'https://www.instagram.com/yuka_kinoshita_0204/',
        twitter: 'https://twitter.com/Yukakinoshita0204'
      }
    };

    // まず既存データを確認
    const { data: existingCelebrity } = await supabase
      .from('celebrities')
      .select()
      .eq('name', '木下ゆうか')
      .single();

    if (existingCelebrity) {
      console.log('✅ 木下ゆうか既存データ使用:', existingCelebrity.name);
      this.celebrityId = existingCelebrity.id;
      return existingCelebrity;
    }

    // 新規追加
    const { data, error } = await supabase
      .from('celebrities')
      .insert(celebrityData)
      .select()
      .single();

    if (error) {
      console.error('❌ 芸能人データ追加エラー:', error);
      throw error;
    }

    this.celebrityId = data.id;
    console.log('✅ 木下ゆうか追加完了:', data.name);
    return data;
  }

  // 2. YouTube APIで最新動画リストを取得
  async getLatestVideos(maxResults: number = 5): Promise<KinoshitaYukaVideo[]> {
    console.log(`📺 木下ゆうかの最新動画${maxResults}件を取得中...`);
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${this.channelId}&part=snippet&order=date&maxResults=${maxResults}&type=video`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('YouTube API エラー:', data);
      throw new Error(`YouTube API エラー: ${data.error?.message || response.statusText}`);
    }

    const videos: KinoshitaYukaVideo[] = [];
    
    for (const item of data.items) {
      // 各動画の詳細情報を取得
      const videoDetailUrl = `https://www.googleapis.com/youtube/v3/videos?key=${youtubeApiKey}&id=${item.id.videoId}&part=snippet,statistics`;
      const videoResponse = await fetch(videoDetailUrl);
      const videoData = await videoResponse.json();
      
      if (videoData.items && videoData.items.length > 0) {
        const video = videoData.items[0];
        videos.push({
          video_id: item.id.videoId,
          title: video.snippet.title,
          description: video.snippet.description || '',
          published_at: video.snippet.publishedAt,
          view_count: parseInt(video.statistics.viewCount || '0'),
          restaurants: []
        });
      }
      
      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ ${videos.length}件の動画情報を取得完了`);
    return videos;
  }

  // 3. シンプルなパターンマッチングで店舗情報を抽出（テスト版）
  async extractRestaurantInfoSimple(video: KinoshitaYukaVideo): Promise<RestaurantInfo[]> {
    console.log(`🔍 「${video.title}」から店舗情報を抽出中（パターンマッチング版）...`);

    const restaurants: RestaurantInfo[] = [];
    const text = `${video.title} ${video.description}`;
    
    // 店舗名のパターンをチェック
    const storePatterns = [
      /([^、。\s]+(?:店|本店|支店|分店))/g,
      /([^、。\s]+(?:ラーメン|うどん|そば|焼肉|寿司|定食|レストラン|カフェ|居酒屋))/g,
      /([^、。\s]+(?:食堂|大衆食堂|中華料理|洋食|和食))/g
    ];

    // 住所のパターンをチェック  
    const addressPatterns = [
      /(東京都[^、。\s]*)/g,
      /(神奈川県[^、。\s]*)/g,
      /(千葉県[^、。\s]*)/g,
      /(埼玉県[^、。\s]*)/g,
      /(大阪[^、。\s]*)/g,
      /(京都[^、。\s]*)/g,
      /([^、。\s]*区[^、。\s]*)/g,
      /([^、。\s]*市[^、。\s]*)/g
    ];

    let storeNames: string[] = [];
    let addresses: string[] = [];

    // 店舗名抽出
    storePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        storeNames.push(...matches);
      }
    });

    // 住所抽出
    addressPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        addresses.push(...matches);
      }
    });

    // 重複除去
    storeNames = [...new Set(storeNames)];
    addresses = [...new Set(addresses)];

    // 店舗情報を組み合わせ
    if (storeNames.length > 0) {
      for (let i = 0; i < storeNames.length; i++) {
        const name = storeNames[i];
        const address = addresses[i] || addresses[0] || '住所不明';
        
        // 料理ジャンル推測
        let type = '不明';
        if (name.includes('ラーメン')) type = 'ラーメン';
        else if (name.includes('焼肉')) type = '焼肉';
        else if (name.includes('寿司')) type = '寿司';
        else if (name.includes('うどん')) type = 'うどん';
        else if (name.includes('そば')) type = 'そば';
        else if (name.includes('カフェ')) type = 'カフェ';
        else if (name.includes('定食')) type = '定食';
        else if (name.includes('食堂')) type = '食堂';
        else if (name.includes('中華')) type = '中華料理';
        else if (name.includes('レストラン')) type = 'レストラン';

        restaurants.push({
          name: name,
          address: address,
          type: type,
          mentioned_context: `動画「${video.title}」で言及`,
          confidence: storeNames.length === 1 ? 'high' : 'medium'
        });
      }
    }

    console.log(`✅ ${restaurants.length}件の店舗情報を抽出（パターンマッチング）`);
    return restaurants;
  }

  // 4. データベースに保存
  async saveToDatabase(videos: KinoshitaYukaVideo[]) {
    console.log('💾 データベースに保存中...');
    
    let totalRestaurants = 0;
    let successfulInserts = 0;

    for (const video of videos) {
      if (video.restaurants.length === 0) continue;

      // Episodeとして動画を保存
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .upsert({
          title: video.title,
          description: video.description,
          air_date: new Date(video.published_at).toISOString().split('T')[0],
          platform: 'YouTube',
          external_id: video.video_id,
          view_count: video.view_count
        }, { onConflict: 'external_id' })
        .select()
        .single();

      if (episodeError) {
        console.error(`❌ Episode保存エラー (${video.title}):`, episodeError);
        continue;
      }

      // 各店舗をLocationsとして保存
      for (const restaurant of video.restaurants) {
        totalRestaurants++;
        
        const locationData = {
          name: restaurant.name,
          address: restaurant.address,
          type: restaurant.type,
          tabelog_url: restaurant.tabelog_url,
          description: restaurant.mentioned_context,
          featured_in: video.title
        };

        // Location の既存データ確認
        const { data: existingLocation } = await supabase
          .from('locations')
          .select()
          .eq('name', restaurant.name)
          .single();

        let location;
        if (existingLocation) {
          location = existingLocation;
          console.log(`✅ 既存Location使用: ${restaurant.name}`);
        } else {
          const { data: newLocation, error: locationError } = await supabase
            .from('locations')
            .insert(locationData)
            .select()
            .single();

          if (locationError) {
            console.error(`❌ Location保存エラー (${restaurant.name}):`, locationError);
            continue;
          }
          location = newLocation;
        }

        // Episode-Location関連を保存
        if (this.celebrityId) {
          // Episode-Location関係の既存確認
          const { data: existingRelation } = await supabase
            .from('episode_locations')
            .select()
            .eq('episode_id', episode.id)
            .eq('location_id', location.id)
            .single();

          if (!existingRelation) {
            const { error: relationError } = await supabase
              .from('episode_locations')
              .insert({
                episode_id: episode.id,
                location_id: location.id,
                celebrity_id: this.celebrityId
              });

            if (!relationError) {
              successfulInserts++;
              console.log(`✅ 保存成功: ${restaurant.name} (${restaurant.address})`);
            }
          } else {
            successfulInserts++;
            console.log(`✅ 既存関係使用: ${restaurant.name}`);
          }
        }
      }
    }

    console.log(`✅ データベース保存完了: ${successfulInserts}/${totalRestaurants}件成功`);
    return { total: totalRestaurants, success: successfulInserts };
  }

  // 5. メイン実行関数
  async run() {
    try {
      console.log('🚀 木下ゆうかデータ抽出開始（テスト版）！');
      
      // 1. 芸能人データ追加
      await this.addKinoshitaYukaCelebrity();
      
      // 2. 最新動画取得（テストは5件）
      const videos = await this.getLatestVideos(5);
      
      // 動画情報を表示
      console.log('\n📺 取得した動画一覧:');
      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   視聴回数: ${video.view_count.toLocaleString()}回`);
        console.log(`   投稿日: ${video.published_at}`);
        console.log(`   概要: ${video.description.substring(0, 100)}...`);
        console.log('');
      });
      
      // 3. 各動画から店舗情報抽出
      for (const video of videos) {
        const restaurants = await this.extractRestaurantInfoSimple(video);
        video.restaurants = restaurants;
        
        // 抽出結果を表示
        if (restaurants.length > 0) {
          console.log(`\n🍽️ 「${video.title}」から抽出した店舗:`);
          restaurants.forEach((restaurant, i) => {
            console.log(`  ${i + 1}. ${restaurant.name}`);
            console.log(`     住所: ${restaurant.address}`);
            console.log(`     ジャンル: ${restaurant.type}`);
            console.log(`     信頼度: ${restaurant.confidence}`);
          });
        }
      }
      
      // 4. データベース保存
      const result = await this.saveToDatabase(videos);
      
      console.log('\n🎉 木下ゆうかデータ抽出完了（テスト版）！');
      console.log(`📊 結果: ${result.success}/${result.total}件の店舗を収録`);
      
      // 総合レポート
      const totalVideos = videos.length;
      const videosWithRestaurants = videos.filter(v => v.restaurants.length > 0).length;
      const totalExtracted = videos.reduce((sum, v) => sum + v.restaurants.length, 0);
      
      console.log('\n📈 抽出結果サマリー:');
      console.log(`・処理動画数: ${totalVideos}件`);
      console.log(`・店舗発見動画数: ${videosWithRestaurants}件`);
      console.log(`・総抽出店舗数: ${totalExtracted}件`);
      console.log(`・データベース保存成功率: ${((result.success / result.total) * 100).toFixed(1)}%`);
      
      return result;
      
    } catch (error) {
      console.error('❌ 木下ゆうかデータ抽出エラー:', error);
      throw error;
    }
  }
}

// 実行関数
async function main() {
  const extractor = new KinoshitaYukaTestExtractor();
  await extractor.run();
}

// スクリプト実行
main().catch(console.error);

export { KinoshitaYukaTestExtractor };