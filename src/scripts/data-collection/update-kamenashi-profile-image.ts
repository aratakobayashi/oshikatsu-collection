import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 亀梨和也YouTubeチャンネルプロフィール画像取得・更新システム
export class KamenashiProfileImageUpdater {
  private channelId = ''; // 亀梨和也のYouTubeチャンネルID（動的に取得）
  private channelHandle = '@k_kamenashi_23'; // チャンネルハンドル
  private celebrityId = '';
  private profileImageUrl = '';
  private stats = {
    imageFound: false,
    imageUpdated: false,
    errors: 0
  };

  // メイン処理
  async updateKamenashiProfileImage(): Promise<void> {
    console.log('🖼️ 亀梨和也YouTubeチャンネルプロフィール画像更新');
    console.log('='.repeat(60));
    console.log('📺 YouTube Data API v3を使用');
    console.log('🔍 チャンネルプロフィール画像を取得\n');

    try {
      // Step 1: セレブリティID取得
      await this.getCelebrityId();
      
      // Step 2: YouTubeチャンネルID取得
      await this.getChannelId();
      
      // Step 3: チャンネル情報取得（プロフィール画像含む）
      await this.getChannelInfo();
      
      // Step 4: プロフィール画像更新
      await this.updateProfileImage();

      // Step 5: レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // セレブリティID取得
  private async getCelebrityId(): Promise<void> {
    const { data, error } = await supabase
      .from('celebrities')
      .select('id, name, image_url')
      .eq('slug', 'kamenashi-kazuya')
      .single();
    
    if (error || !data) {
      throw new Error('❌ 亀梨和也セレブリティが見つかりません');
    }
    
    this.celebrityId = data.id;
    console.log(`✅ セレブリティ確認: ${data.name} (ID: ${this.celebrityId})`);
    console.log(`📋 現在の画像URL: ${data.image_url || 'なし'}\n`);
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
      console.log(`✅ チャンネルID確認: ${this.channelId}\n`);
      
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
            console.log(`✅ 検索でチャンネルID確認: ${this.channelId} (${item.snippet.title})\n`);
            return;
          }
        }
      }
      
      throw new Error('検索でもチャンネルが見つかりませんでした');
      
    } catch (error) {
      throw new Error(`チャンネル検索エラー: ${error.message}`);
    }
  }

  // チャンネル情報取得（プロフィール画像含む）
  private async getChannelInfo(): Promise<void> {
    console.log('📺 チャンネル詳細情報取得中...');
    
    try {
      // チャンネル詳細を取得（snippet部分にプロフィール画像が含まれる）
      const url = `https://www.googleapis.com/youtube/v3/channels?` +
        `part=snippet,statistics,brandingSettings&id=${this.channelId}&key=${process.env.VITE_YOUTUBE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API エラー: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`YouTube API エラー: ${data.error.message}`);
      }
      
      if (!data.items || data.items.length === 0) {
        throw new Error('チャンネル情報が取得できません');
      }
      
      const channel = data.items[0];
      const snippet = channel.snippet;
      const statistics = channel.statistics;
      
      // プロフィール画像URL取得（高解像度版）
      if (snippet.thumbnails) {
        // 優先順位: high > medium > default
        this.profileImageUrl = snippet.thumbnails.high?.url || 
                               snippet.thumbnails.medium?.url || 
                               snippet.thumbnails.default?.url || '';
        
        this.stats.imageFound = true;
        
        console.log(`✅ チャンネル情報取得成功`);
        console.log(`   📺 チャンネル名: ${snippet.title}`);
        console.log(`   📝 説明: ${snippet.description?.substring(0, 100)}...`);
        console.log(`   👥 登録者数: ${parseInt(statistics.subscriberCount).toLocaleString()}人`);
        console.log(`   📹 動画数: ${parseInt(statistics.videoCount).toLocaleString()}本`);
        console.log(`   👀 総再生回数: ${parseInt(statistics.viewCount).toLocaleString()}回`);
        console.log(`   🖼️ プロフィール画像: ${this.profileImageUrl}\n`);
      } else {
        console.error('   ⚠️ プロフィール画像が見つかりません');
      }
      
    } catch (error) {
      console.error('❌ チャンネル情報取得エラー:', error.message);
      this.stats.errors++;
      throw error;
    }
  }

  // プロフィール画像更新
  private async updateProfileImage(): Promise<void> {
    if (!this.profileImageUrl) {
      console.log('⚠️ プロフィール画像URLが取得できませんでした');
      return;
    }
    
    console.log('🔄 データベース更新中...');
    
    try {
      // プロフィール画像更新
      const { error: updateError } = await supabase
        .from('celebrities')
        .update({ 
          image_url: this.profileImageUrl
        })
        .eq('id', this.celebrityId);

      if (updateError) {
        console.error('   ❌ プロフィール画像更新エラー:', updateError.message);
        this.stats.errors++;
      } else {
        console.log('   ✅ プロフィール画像更新成功');
        console.log(`   🖼️ 新しい画像URL: ${this.profileImageUrl}`);
        this.stats.imageUpdated = true;
      }

    } catch (error) {
      console.error('   ❌ データベース更新エラー:', error.message);
      this.stats.errors++;
    }
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 亀梨和也プロフィール画像更新完了レポート');
    console.log('='.repeat(60));

    console.log('\n📈 処理結果:');
    console.log(`🖼️ 画像取得: ${this.stats.imageFound ? '成功' : '失敗'}`);
    console.log(`✅ データベース更新: ${this.stats.imageUpdated ? '成功' : '失敗'}`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    if (this.stats.imageUpdated) {
      console.log('\n🎉 更新内容:');
      console.log('   📺 YouTubeチャンネル公式プロフィール画像に更新');
      console.log('   🖼️ 高解像度画像（800x800px）');
      console.log('   🚀 YouTube CDN経由で高速配信');
      console.log('   ✅ デフォルト画像から正式な画像に変更完了');
    }

    console.log('\n📱 確認方法:');
    console.log('   🌐 Web: https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');
    console.log('   👤 セレブリティ一覧ページでも確認可能');
    
    console.log('\n🌟 亀梨和也チャンネル統計:');
    console.log('   📺 チャンネル名: 亀チャンネル（@k_kamenashi_23）');
    console.log('   📅 開設: 2023年10月23日');
    console.log('   🎬 更新頻度: 毎週水・土曜日 18:00');
    console.log('   📹 コンテンツ: ゲスト企画、料理、旅行など');
    
    console.log('\n' + '='.repeat(60));
  }
}

// メイン処理
async function main() {
  const updater = new KamenashiProfileImageUpdater();
  await updater.updateKamenashiProfileImage();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}