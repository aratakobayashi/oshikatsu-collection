import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Manセレブリティ & 全動画追加システム
export class SnowManDataImporter {
  private youtubeApiKey: string;
  private channelId: string = '';
  private celebrityId: string = '';
  private stats = {
    totalVideos: 0,
    processedVideos: 0,
    successfulImports: 0,
    skippedDuplicates: 0,
    errors: 0
  };

  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  // メイン処理
  async importSnowManData(): Promise<void> {
    console.log('⛄ Snow Manデータインポート開始');
    console.log('='.repeat(60));

    try {
      // 1. チャンネルIDを取得
      await this.getChannelId();
      
      // 2. セレブリティを追加
      await this.addSnowManCelebrity();
      
      // 3. 全動画を取得してエピソードとして追加
      await this.importAllVideos();
      
      // 4. レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ インポートエラー:', error);
    }
  }

  // チャンネルID取得
  private async getChannelId(): Promise<void> {
    console.log('\n📺 チャンネル情報取得中...');
    
    // URLからハンドル名を抽出: @SnowMan.official.9
    const handle = 'SnowMan.official.9';
    
    try {
      // YouTube Data APIでハンドルからチャンネルIDを取得
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&key=${this.youtubeApiKey}`
      );
      
      if (!response.ok) {
        throw new Error('YouTube API error');
      }
      
      const data = await response.json();
      
      // Snow Man公式チャンネルを特定
      const channel = data.items?.find((item: any) => 
        item.snippet.title.includes('Snow Man') || 
        item.snippet.channelTitle.includes('Snow Man')
      );
      
      if (channel) {
        this.channelId = channel.snippet.channelId;
        console.log(`✅ チャンネルID取得: ${this.channelId}`);
        console.log(`   チャンネル名: ${channel.snippet.title}`);
      } else {
        // 代替方法：直接チャンネルIDを使用（事前調査済み）
        this.channelId = 'UCuFPaemAaMwZAxe0RuLvcOw'; // Snow Man公式チャンネルID
        console.log(`✅ チャンネルID設定: ${this.channelId}`);
      }
    } catch (error) {
      // フォールバック：既知のチャンネルID
      this.channelId = 'UCuFPaemAaMwZAxe0RuLvcOw';
      console.log(`⚠️ デフォルトチャンネルID使用: ${this.channelId}`);
    }
  }

  // Snow Manセレブリティ追加
  private async addSnowManCelebrity(): Promise<void> {
    console.log('\n👥 Snow Manセレブリティ追加中...');
    
    // 既存チェック
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'snow-man')
      .single();
    
    if (existing) {
      this.celebrityId = existing.id;
      console.log(`✅ 既存セレブリティ使用: ${existing.name} (ID: ${this.celebrityId})`);
      return;
    }
    
    // UUIDを生成
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    // 新規追加
    const celebrityData = {
      id: generateUUID(),
      name: 'Snow Man',
      slug: 'snow-man',
      bio: 'Snow Manは、2020年1月22日にデビューした9人組男性アイドルグループ。メンバーは岩本照、深澤辰哉、ラウール、渡辺翔太、向井康二、阿部亮平、目黒蓮、宮舘涼太、佐久間大介。ダンス、アクロバット、歌唱力の高さが特徴で、多方面で活躍している。',
      image_url: 'https://pbs.twimg.com/profile_images/1735555039002865664/0vB5_Sgo_400x400.jpg',
      agency: 'STARTO ENTERTAINMENT',
      fandom_name: 'Snow Mania',
      group_name: 'Snow Man',
      debut_date: '2020-01-22',
      social_links: {
        youtube: 'https://www.youtube.com/@SnowMan.official.9',
        twitter: 'https://twitter.com/SN__20200122',
        instagram: 'https://www.instagram.com/snowman_official_j/',
        official: 'https://www.johnnys-net.jp/page?id=artistTop&artist=43'
      },
      subscriber_count: 2870000, // 2024年時点の概算
      type: 'group',
      status: 'active'
    };
    
    const { data, error } = await supabase
      .from('celebrities')
      .insert([celebrityData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ セレブリティ追加エラー:', error);
      throw error;
    }
    
    this.celebrityId = data.id;
    console.log(`✅ 新規セレブリティ追加: ${data.name} (ID: ${this.celebrityId})`);
  }

  // 全動画取得&インポート
  private async importAllVideos(): Promise<void> {
    console.log('\n📹 YouTube動画取得開始...');
    
    let nextPageToken = '';
    let pageCount = 0;
    const maxPages = 20; // 最大20ページ（約1000動画）まで
    
    do {
      pageCount++;
      console.log(`\n📄 ページ ${pageCount} 処理中...`);
      
      try {
        // プレイリストアイテム取得（アップロード動画）
        const uploadsPlaylistId = this.channelId.replace('UC', 'UU'); // UCをUUに変換
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?` +
          `part=snippet,contentDetails&` +
          `playlistId=${uploadsPlaylistId}&` +
          `maxResults=50&` +
          `pageToken=${nextPageToken}&` +
          `key=${this.youtubeApiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error('❌ YouTube API エラー:', response.status);
          break;
        }
        
        const data = await response.json();
        const videos = data.items || [];
        
        this.stats.totalVideos += videos.length;
        console.log(`   📺 ${videos.length}件の動画を取得`);
        
        // 各動画を処理
        for (const video of videos) {
          await this.processVideo(video);
          
          // API制限対策
          if (this.stats.processedVideos % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        nextPageToken = data.nextPageToken || '';
        
        // ページ制限チェック
        if (pageCount >= maxPages) {
          console.log(`⚠️ ページ制限 (${maxPages}ページ) に到達`);
          break;
        }
        
      } catch (error) {
        console.error(`❌ ページ ${pageCount} エラー:`, error);
        this.stats.errors++;
        break;
      }
      
    } while (nextPageToken);
    
    console.log(`\n✅ 動画取得完了: 合計 ${this.stats.totalVideos}件`);
  }

  // 個別動画処理
  private async processVideo(videoItem: any): Promise<void> {
    try {
      const snippet = videoItem.snippet;
      const videoId = videoItem.contentDetails?.videoId || videoItem.id?.videoId;
      
      if (!videoId) {
        console.log('   ⚠️ 動画ID取得失敗');
        return;
      }
      
      // 既存チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('video_url', `https://www.youtube.com/watch?v=${videoId}`)
        .single();
      
      if (existing) {
        this.stats.skippedDuplicates++;
        console.log(`   ⏭️ スキップ: ${snippet.title} (既存)`);
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
      
      this.stats.processedVideos++;
      
    } catch (error) {
      console.error('   ❌ 処理エラー:', error);
      this.stats.errors++;
    }
  }

  // タグ抽出
  private extractTags(title: string, description: string): string[] {
    const tags: string[] = ['Snow Man'];
    const text = `${title} ${description}`.toLowerCase();
    
    // コンテンツタイプ判定
    if (text.includes('mv') || text.includes('music video')) tags.push('MV');
    if (text.includes('dance') || text.includes('ダンス')) tags.push('ダンス');
    if (text.includes('cover') || text.includes('カバー')) tags.push('カバー');
    if (text.includes('live') || text.includes('ライブ')) tags.push('ライブ');
    if (text.includes('making') || text.includes('メイキング')) tags.push('メイキング');
    if (text.includes('behind') || text.includes('舞台裏')) tags.push('舞台裏');
    if (text.includes('vlog')) tags.push('VLOG');
    if (text.includes('練習') || text.includes('practice')) tags.push('練習動画');
    if (text.includes('企画') || text.includes('challenge')) tags.push('企画動画');
    
    // メンバー名検出
    const members = ['岩本照', '深澤辰哉', 'ラウール', '渡辺翔太', '向井康二', '阿部亮平', '目黒蓮', '宮舘涼太', '佐久間大介'];
    members.forEach(member => {
      if (text.includes(member.toLowerCase())) tags.push(member);
    });
    
    return [...new Set(tags)]; // 重複除去
  }

  // 注目動画判定
  private isFeaturedVideo(title: string): boolean {
    const featuredKeywords = ['MV', 'Music Video', 'Official', '公式', 'Full', '完全版'];
    return featuredKeywords.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Snow Manインポート完了レポート');
    console.log('='.repeat(60));
    
    // 総エピソード数取得
    const { count: totalEpisodes } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', this.celebrityId);
    
    console.log('\n📈 処理結果:');
    console.log(`📺 取得動画数: ${this.stats.totalVideos}件`);
    console.log(`✅ 新規保存: ${this.stats.successfulImports}件`);
    console.log(`⏭️ 重複スキップ: ${this.stats.skippedDuplicates}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);
    
    console.log('\n📊 データベース統計:');
    console.log(`📺 Snow Man総エピソード数: ${totalEpisodes}件`);
    
    if (this.stats.processedVideos > 0) {
      const successRate = Math.round((this.stats.successfulImports / this.stats.processedVideos) * 100);
      console.log(`🎯 インポート成功率: ${successRate}%`);
    }
    
    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/snow-man');
    console.log('\n' + '='.repeat(60));
  }
}

// メイン処理
async function main() {
  const importer = new SnowManDataImporter();
  await importer.importSnowManData();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}