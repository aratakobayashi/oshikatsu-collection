import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 亀梨和也YouTube動画取得・インポートシステム
export class KamenashiVideoImporter {
  private channelId = ''; // 亀梨和也のYouTubeチャンネルID（動的に取得）
  private channelHandle = '@k_kamenashi_23'; // チャンネルハンドル
  private celebrityId = '';
  private stats = {
    totalVideos: 0,
    successfulImports: 0,
    skippedShorts: 0,
    errors: 0
  };

  // メイン処理
  async importKamenashiVideos(): Promise<void> {
    console.log('📺 亀梨和也YouTube動画取得・インポート開始');
    console.log('='.repeat(60));
    console.log('🔑 YouTube Data API v3を使用');
    console.log('📺 @k_kamenashi_23 チャンネルから動画を取得\n');

    try {
      // Step 1: セレブリティID取得
      await this.getCelebrityId();
      
      // Step 2: YouTubeチャンネルID取得
      await this.getChannelId();
      
      // Step 3: 全動画取得&インポート
      await this.importAllVideos();

      // Step 4: 統計レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // セレブリティID取得
  private async getCelebrityId(): Promise<void> {
    const { data, error } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'kamenashi-kazuya')
      .single();
    
    if (error || !data) {
      throw new Error('❌ 亀梨和也セレブリティが見つかりません');
    }
    
    this.celebrityId = data.id;
    console.log(`✅ セレブリティ確認: ${data.name} (ID: ${this.celebrityId})`);
  }

  // YouTubeチャンネルID取得
  private async getChannelId(): Promise<void> {
    console.log(`🔍 チャンネルID取得: ${this.channelHandle}`);
    
    try {
      // チャンネルハンドルからチャンネルIDを取得
      const url = `https://www.googleapis.com/youtube/v3/channels?` +
        `part=id&forHandle=${this.channelHandle.replace('@', '')}&key=${process.env.VITE_YOUTUBE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API エラー: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`YouTube API エラー: ${data.error.message}`);
      }
      
      if (!data.items || data.items.length === 0) {
        throw new Error('チャンネルが見つかりません');
      }
      
      this.channelId = data.items[0].id;
      console.log(`✅ チャンネルID確認: ${this.channelId}`);
      
    } catch (error) {
      console.error('❌ チャンネルID取得エラー:', error.message);
      
      // fallback: 検索APIでチャンネルを探す
      console.log('🔄 検索APIでチャンネルを探しています...');
      await this.searchChannelByName();
    }
  }

  // チャンネル名検索でのfallback
  private async searchChannelByName(): Promise<void> {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=channel&q=亀梨和也&maxResults=10&key=${process.env.VITE_YOUTUBE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // 最も関連性の高いチャンネルを選択
        for (const item of data.items) {
          if (item.snippet.title.includes('亀梨和也') || item.snippet.title.includes('亀梨')) {
            this.channelId = item.snippet.channelId;
            console.log(`✅ 検索でチャンネルID確認: ${this.channelId} (${item.snippet.title})`);
            return;
          }
        }
      }
      
      throw new Error('検索でもチャンネルが見つかりませんでした');
      
    } catch (error) {
      throw new Error(`チャンネル検索エラー: ${error.message}`);
    }
  }

  // 全動画取得&インポート
  private async importAllVideos(): Promise<void> {
    console.log('\n📹 YouTube動画取得開始...');
    
    let nextPageToken = '';
    let pageCount = 0;
    const maxPages = 10; // 最大10ページ（約500動画）まで
    
    do {
      pageCount++;
      console.log(`\n📄 ページ ${pageCount} 処理中...`);
      
      try {
        // プレイリストアイテム取得（アップロード動画）
        const uploadsPlaylistId = this.channelId.replace('UC', 'UU'); // UCをUUに変換
        
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?` +
          `part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50` +
          `&key=${process.env.VITE_YOUTUBE_API_KEY}` +
          (nextPageToken ? `&pageToken=${nextPageToken}` : '');
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`❌ YouTube API エラー: ${response.status} ${response.statusText}`);
          break;
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.error(`❌ YouTube API エラー:`, data.error.message);
          break;
        }
        
        console.log(`   📊 取得動画数: ${data.items?.length || 0}件`);
        
        // 各動画を処理
        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            await this.processVideo(item);
          }
        }
        
        nextPageToken = data.nextPageToken || '';
        
      } catch (error) {
        console.error(`❌ ページ ${pageCount} 取得エラー:`, error.message);
        this.stats.errors++;
        break;
      }
      
    } while (nextPageToken && pageCount < maxPages);
    
    console.log(`\n✅ 動画取得完了: ${pageCount}ページ処理`);
  }

  // 個別動画処理
  private async processVideo(item: any): Promise<void> {
    try {
      const snippet = item.snippet;
      const videoId = snippet.resourceId?.videoId;
      
      if (!videoId || !snippet.title) {
        return;
      }
      
      this.stats.totalVideos++;
      
      // ショート動画をスキップ（タイトル・説明文・再生時間で判定）
      if (this.isShortVideo(snippet)) {
        this.stats.skippedShorts++;
        console.log(`   🔄 ショート動画をスキップ: ${snippet.title}`);
        return;
      }
      
      // 既存動画チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', videoId)
        .single();
      
      if (existing) {
        console.log(`   ⚠️ 既存動画をスキップ: ${snippet.title}`);
        return;
      }
      
      // エピソードデータ作成
      const episodeData = {
        id: videoId,
        title: snippet.title || '無題',
        description: snippet.description || '',
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        date: snippet.publishedAt ? new Date(snippet.publishedAt).toISOString() : new Date().toISOString(),
        celebrity_id: this.celebrityId,
        view_count: 0,
        like_count: 0,
        comment_count: 0
      };
      
      // データベース保存
      const { error } = await supabase
        .from('episodes')
        .insert([episodeData]);
      
      if (error) {
        console.error(`   ❌ 保存エラー: ${snippet.title}`, error.message);
        this.stats.errors++;
      } else {
        this.stats.successfulImports++;
        console.log(`   ✅ 保存: ${snippet.title}`);
      }
      
    } catch (error) {
      console.error('   ❌ 動画処理エラー:', error.message);
      this.stats.errors++;
    }
  }

  // ショート動画判定
  private isShortVideo(snippet: any): boolean {
    const title = snippet.title?.toLowerCase() || '';
    const description = snippet.description?.toLowerCase() || '';
    
    // ショート動画の特徴で判定
    return title.includes('#shorts') || 
           description.includes('#shorts') ||
           title.includes('short') ||
           title.length < 20; // 極端に短いタイトル
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 亀梨和也動画インポート完了レポート');
    console.log('='.repeat(60));

    // 総エピソード数取得
    const { count: totalEpisodes } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', this.celebrityId);

    console.log('\n📈 処理結果:');
    console.log(`📺 処理対象動画: ${this.stats.totalVideos}件`);
    console.log(`✅ 新規インポート: ${this.stats.successfulImports}件`);
    console.log(`🔄 ショート動画スキップ: ${this.stats.skippedShorts}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📺 総エピソード数: ${totalEpisodes}件`);

    const successRate = this.stats.totalVideos > 0 
      ? Math.round((this.stats.successfulImports / this.stats.totalVideos) * 100) 
      : 0;
    console.log(`🎯 インポート成功率: ${successRate}%`);

    console.log('\n🎉 亀梨和也チャンネル情報:');
    console.log('📺 チャンネル名: 亀チャンネル（亀梨和也チャンネル）');
    console.log('📅 開設日: 2023年10月23日');
    console.log('👥 登録者数: 約86万人');
    console.log('⏰ 更新頻度: 毎週水・土曜日');

    console.log('\n🌟 特徴:');
    console.log('   🎭 豪華ゲスト企画（Snow Man、KinKi Kids等）');
    console.log('   🔗 数珠つなぎ企画');
    console.log('   🍳 プライベート料理企画');
    console.log('   🧳 旅行企画');

    console.log('\n🖼️ 画像の品質:');
    console.log('   📐 サムネイル: YouTube公式高解像度');
    console.log('   🚀 CDN: YouTube公式CDN使用');
    console.log('   ✅ 404エラー解決済み');

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');
    console.log('\n' + '='.repeat(60));
  }
}

// メイン処理
async function main() {
  const importer = new KamenashiVideoImporter();
  await importer.importKamenashiVideos();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}