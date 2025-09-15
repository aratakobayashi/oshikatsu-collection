// 木下ゆうか専用データ抽出スクリプト
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// 環境変数の設定
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

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

class KinoshitaYukaDataExtractor {
  private channelId = 'UCFTVNLC7ysej-sD5lkLqNGA'; // 木下ゆうかのチャンネルID
  private celebrityId: string | null = null;

  constructor() {
    console.log('🍽️ 木下ゆうかデータ抽出システム初期化中...');
  }

  // 1. 木下ゆうかをCelebritiesテーブルに追加
  async addKinoshitaYukaCelebrity() {
    console.log('👤 木下ゆうかを芸能人データベースに追加中...');
    
    const celebrityData = {
      name: '木下ゆうか',
      bio: '元祖大食いYouTuber。2014年からYouTube活動開始、チャンネル登録者数525万人超え。可愛らしい見た目とは裏腹に5キロ以上の大盛り料理を軽々と完食する。全国の飲食店を訪問し、大食いチャレンジを行う。',
      type: 'youtube_channel',
      agency: 'BitStar Production',
      debut_date: '2014-05-01',
      subscriber_count: 5250000,
      status: 'active',
      social_links: {
        youtube: `https://www.youtube.com/channel/${this.channelId}`,
        instagram: 'https://www.instagram.com/yuka_kinoshita_0204/',
        twitter: 'https://twitter.com/Yukakinoshita0204'
      }
    };

    const { data, error } = await supabase
      .from('celebrities')
      .upsert(celebrityData, { onConflict: 'name' })
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
  async getLatestVideos(maxResults: number = 50): Promise<KinoshitaYukaVideo[]> {
    console.log(`📺 木下ゆうかの最新動画${maxResults}件を取得中...`);
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${this.channelId}&part=snippet&order=date&maxResults=${maxResults}&type=video`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (!response.ok) {
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
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ ${videos.length}件の動画情報を取得完了`);
    return videos;
  }

  // 3. GPT-4で動画概要から店舗情報を抽出
  async extractRestaurantInfo(video: KinoshitaYukaVideo): Promise<RestaurantInfo[]> {
    console.log(`🤖 「${video.title}」から店舗情報を抽出中...`);

    const prompt = `
以下の木下ゆうかの大食い動画情報から、実際に訪問した飲食店・レストランの情報を正確に抽出してください。

動画タイトル: ${video.title}
動画概要: ${video.description}

抽出条件:
1. 明確な店舗名が記載されている
2. 住所情報（都道府県・市区町村レベル以上）が含まれている
3. 実際に訪問して食事をしたことが明示されている
4. チェーン店の場合は具体的な店舗名（○○店）まで特定
5. 大食いチャレンジメニューや通常メニューの区別は不要

出力は以下のJSON形式で、配列として返してください:
{
  "restaurants": [
    {
      "name": "正確な店舗名（○○店まで含む）",
      "address": "完全な住所（番地まで含む）", 
      "type": "料理ジャンル（ラーメン・焼肉・イタリアン・和食など）",
      "mentioned_context": "動画での具体的な言及内容",
      "confidence": "high|medium|low"
    }
  ]
}

※大食いチャレンジメニューでも通常営業している店舗なら抽出対象です
※情報が不明確な場合は除外してください
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "あなたは大食いYouTuber動画から正確な飲食店情報を抽出する専門AIです。不正確な情報は絶対に含めません。"
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) return [];

      try {
        const parsed = JSON.parse(responseContent);
        const restaurants = parsed.restaurants || [];
        console.log(`✅ ${restaurants.length}件の店舗情報を抽出`);
        return restaurants;
      } catch (parseError) {
        console.error('❌ AI応答のパースエラー:', parseError);
        return [];
      }

    } catch (error) {
      console.error('❌ OpenAI API エラー:', error);
      return [];
    }
  }

  // 4. タベログURL自動検索
  async findTabelogUrl(restaurant: RestaurantInfo): Promise<string | null> {
    console.log(`🔍 「${restaurant.name}」のタベログURL検索中...`);
    
    const searchQuery = `${restaurant.name} ${restaurant.address} site:tabelog.com`;
    
    try {
      // Google Custom Search APIを使用（既存のライブラリがあれば活用）
      const googleApiKey = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY;
      const searchEngineId = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
      
      if (!googleApiKey || !searchEngineId) {
        console.log('⚠️ Google Search API設定なし、タベログURL検索をスキップ');
        return null;
      }
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const tabelogUrl = data.items[0].link;
        console.log(`✅ タベログURL発見: ${tabelogUrl}`);
        return tabelogUrl;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ タベログURL検索エラー (${restaurant.name}):`, error);
      return null;
    }
  }

  // 5. データベースに保存
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

        const { data: location, error: locationError } = await supabase
          .from('locations')
          .upsert(locationData, { onConflict: 'name,address' })
          .select()
          .single();

        if (locationError) {
          console.error(`❌ Location保存エラー (${restaurant.name}):`, locationError);
          continue;
        }

        // Episode-Location関連を保存
        const { error: relationError } = await supabase
          .from('episode_locations')
          .upsert({
            episode_id: episode.id,
            location_id: location.id,
            celebrity_id: this.celebrityId
          }, { onConflict: 'episode_id,location_id' });

        if (!relationError) {
          successfulInserts++;
        }
      }
    }

    console.log(`✅ データベース保存完了: ${successfulInserts}/${totalRestaurants}件成功`);
    return { total: totalRestaurants, success: successfulInserts };
  }

  // 6. メイン実行関数
  async run() {
    try {
      console.log('🚀 木下ゆうかデータ抽出開始！');
      
      // 1. 芸能人データ追加
      await this.addKinoshitaYukaCelebrity();
      
      // 2. 最新動画取得
      const videos = await this.getLatestVideos(20); // まず20件でテスト
      
      // 3. 各動画から店舗情報抽出
      for (const video of videos) {
        const restaurants = await this.extractRestaurantInfo(video);
        
        // 4. タベログURL検索
        for (const restaurant of restaurants) {
          const tabelogUrl = await this.findTabelogUrl(restaurant);
          if (tabelogUrl) {
            restaurant.tabelog_url = tabelogUrl;
          }
        }
        
        video.restaurants = restaurants;
        
        // API制限を考慮して待機
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 5. データベース保存
      const result = await this.saveToDatabase(videos);
      
      console.log('🎉 木下ゆうかデータ抽出完了！');
      console.log(`📊 結果: ${result.success}/${result.total}件の店舗を収録`);
      
      return result;
      
    } catch (error) {
      console.error('❌ 木下ゆうかデータ抽出エラー:', error);
      throw error;
    }
  }
}

// 実行関数
async function main() {
  const extractor = new KinoshitaYukaDataExtractor();
  await extractor.run();
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}

export { KinoshitaYukaDataExtractor };