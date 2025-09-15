// 木下ゆうか専用データ抽出スクリプト（既存システム準拠版）
import { createClient } from '@supabase/supabase-js';

// 環境変数の設定（既存システムと同じ）
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// 木下ゆうかの基本情報（既存システムと同じ構造）
const KINOSHITA_YUKA_CELEBRITY = {
  name: '木下ゆうか',
  slug: 'kinoshita-yuka',
  bio: '元祖大食いYouTuber。2014年からYouTube活動開始、チャンネル登録者数525万人超え。可愛らしい見た目とは裏腹に5キロ以上の大盛り料理を軽々と完食する。全国の飲食店を訪問し、大食いチャレンジを行う。BitStar Production所属。',
  image_url: 'https://yt3.ggpht.com/ytc/AIdro_kSlCJnJfI7ysLLNnzEo7n3w6YjWEP9W6CaJ-aV1Q=s800-c-k-c0x00ffffff-no-rj',
  birth_date: '1985-02-04',
  social_media: {
    youtube: 'https://www.youtube.com/channel/UCFTVNLC7ysej-sD5lkLqNGA',
    instagram: 'https://www.instagram.com/yuka_kinoshita_0204/',
    twitter: 'https://twitter.com/Yukakinoshita0204'
  }
};

// サンプルエピソードデータ（実際のYouTube APIから取得する前のテスト用）
const KINOSHITA_YUKA_EPISODES = [
  {
    title: '【大食い】回転寿司で100皿チャレンジ！',
    description: '人気回転寿司チェーン「スシロー渋谷店」で100皿チャレンジに挑戦！マグロ、サーモン、うに等を大量摂取。',
    air_date: '2024-01-15',
    view_count: 1500000,
    external_url: 'https://www.youtube.com/watch?v=test123'
  },
  {
    title: '【激辛】蒙古タンメン中本で全メニュー制覇',
    description: '蒙古タンメン中本新宿店で激辛メニューを全制覇。汗だくになりながらも完食を目指す。',
    air_date: '2024-01-22',
    view_count: 1200000,
    external_url: 'https://www.youtube.com/watch?v=test456'
  },
  {
    title: '【ラーメン】一蘭で替え玉20玉チャレンジ',
    description: '一蘭渋谷店で替え玉20玉に挑戦。とんこつスープをたっぷり楽しみながら大盛りラーメンを堪能。',
    air_date: '2024-01-29',
    view_count: 1800000,
    external_url: 'https://www.youtube.com/watch?v=test789'
  },
  {
    title: '【焼肉】食べ放題で肉5kg完食チャレンジ',
    description: '焼肉きんぐ新宿東口店で食べ放題コース。カルビ、ハラミ、タンなど計5kgの肉を制限時間内に完食。',
    air_date: '2024-02-05',
    view_count: 2100000,
    external_url: 'https://www.youtube.com/watch?v=test101'
  },
  {
    title: '【デカ盛り】メガ盛り丼で限界チャレンジ',
    description: '人気デカ盛り店「大盛食堂池袋店」で特盛かつ丼（米3合分）に挑戦。ソースたっぷりのとんかつとご飯の山。',
    air_date: '2024-02-12',
    view_count: 1600000,
    external_url: 'https://www.youtube.com/watch?v=test102'
  }
];

class KinoshitaYukaDataImporter {
  private celebrityId: string | null = null;

  constructor() {
    console.log('🏪 木下ゆうかデータベース登録開始');
    console.log('============================================================');
    console.log('📺 YouTubeチャンネル「Yuka Kinoshita木下ゆうか」');
    console.log(`🎯 登録対象: セレブリティ1件、エピソード${KINOSHITA_YUKA_EPISODES.length}件`);
    console.log('');
  }

  // セレブリティ情報の登録（亀梨和也と同じロジック）
  async addKinoshitaYukaCelebrity() {
    console.log('👤 セレブリティ情報登録中...');

    try {
      // 既存データを確認
      const { data: existing } = await supabase
        .from('celebrities')
        .select('id')
        .eq('slug', KINOSHITA_YUKA_CELEBRITY.slug)
        .single();

      if (existing) {
        console.log('   ⚠️ 既存セレブリティをスキップ: 木下ゆうか');
        this.celebrityId = existing.id;
        return existing;
      }

      // UUID手動生成（亀梨和也と同じ）
      function generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      // 新規セレブリティデータ作成（social_mediaは含めずに基本情報のみ）
      const celebrityData = {
        id: generateUUID(),
        name: KINOSHITA_YUKA_CELEBRITY.name,
        slug: KINOSHITA_YUKA_CELEBRITY.slug,
        bio: KINOSHITA_YUKA_CELEBRITY.bio,
        image_url: KINOSHITA_YUKA_CELEBRITY.image_url,
        birth_date: KINOSHITA_YUKA_CELEBRITY.birth_date
      };

      const { error } = await supabase
        .from('celebrities')
        .insert([celebrityData]);

      if (error) {
        console.error('   ❌ セレブリティ登録エラー:', error.message);
        throw error;
      } else {
        console.log('   ✅ セレブリティ登録成功: 木下ゆうか');
        console.log(`      📺 YouTubeチャンネル: ${KINOSHITA_YUKA_CELEBRITY.social_media.youtube}`);
        console.log(`      📅 生年月日: ${KINOSHITA_YUKA_CELEBRITY.birth_date}`);
        this.celebrityId = celebrityData.id;
      }

    } catch (error) {
      console.error('   ❌ セレブリティ処理エラー:', error.message);
      throw error;
    }
  }

  // エピソード情報の登録（既存システムと同じロジック）
  async addKinoshitaYukaEpisodes() {
    console.log(`✅ セレブリティID確認: ${this.celebrityId}`);
    console.log('');
    console.log('📺 エピソード登録開始...');
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < KINOSHITA_YUKA_EPISODES.length; i++) {
      const episode = KINOSHITA_YUKA_EPISODES[i];
      
      console.log(`【${i + 1}/${KINOSHITA_YUKA_EPISODES.length}】 ${episode.title}`);

      try {
        const episodeData = {
          title: episode.title,
          description: episode.description,
          air_date: episode.air_date,
          view_count: episode.view_count,
          external_url: episode.external_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('episodes')
          .upsert(episodeData, { 
            onConflict: 'title',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        console.log('   ✅ エピソード登録成功');
        console.log(`      📅 配信日: ${episode.air_date}`);
        console.log(`      👀 再生回数: ${episode.view_count.toLocaleString()}回`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ エピソード登録エラー: ${error}`);
        errorCount++;
      }
    }

    return { success: successCount, error: errorCount };
  }

  // メイン実行関数（既存システムと同じ構造）
  async run() {
    try {
      // 1. セレブリティ登録
      await this.addKinoshitaYukaCelebrity();
      
      // 2. エピソード登録
      const episodeResult = await this.addKinoshitaYukaEpisodes();

      // 3. 完了レポート（既存システムと同じ形式）
      console.log('');
      console.log('============================================================');
      console.log('📊 木下ゆうかデータベース登録完了レポート');
      console.log('============================================================');
      console.log('');
      console.log('📈 処理結果:');
      console.log('👤 セレブリティ登録: 完了');
      console.log(`📺 対象エピソード: ${KINOSHITA_YUKA_EPISODES.length}件`);
      console.log(`✅ 新規登録エピソード: ${episodeResult.success}件`);
      console.log(`❌ エラー: ${episodeResult.error}件`);
      console.log('');

      // データベース統計の取得
      const { count: totalCelebrities } = await supabase
        .from('celebrities')
        .select('*', { count: 'exact', head: true });

      const { count: yukaEpisodes } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .ilike('title', '%木下%');

      console.log('📊 データベース統計:');
      console.log(`👥 総セレブリティ数: ${totalCelebrities}人`);
      console.log(`📺 木下ゆうかエピソード数: ${yukaEpisodes}件`);
      console.log(`🎯 エピソード登録成功率: ${((episodeResult.success / KINOSHITA_YUKA_EPISODES.length) * 100).toFixed(0)}%`);
      console.log('');

      console.log('🎉 木下ゆうかチャンネル詳細情報:');
      console.log('📺 チャンネル名: Yuka Kinoshita木下ゆうか');
      console.log('📅 開設日: 2014年5月');
      console.log('👥 登録者数: 約525万人（2024年時点）');
      console.log('⏰ 更新頻度: 毎日18時');
      console.log('🎬 月間投稿: 30本の高頻度更新');
      console.log('');
      console.log('🌟 チャンネルの特徴:');
      console.log('   🍽️ 大食いチャレンジ企画');
      console.log('   🍜 全国の飲食店巡り');
      console.log('   🔥 激辛料理チャレンジ');
      console.log('   🏪 チェーン店完全制覇');
      console.log('   📱 リアルな大食いの記録');
      console.log('');

      console.log('📱 ソーシャルメディア:');
      console.log(`   YouTube: ${KINOSHITA_YUKA_CELEBRITY.social_media.youtube}`);
      console.log(`   Instagram: ${KINOSHITA_YUKA_CELEBRITY.social_media.instagram}`);
      console.log(`   Twitter: ${KINOSHITA_YUKA_CELEBRITY.social_media.twitter}`);
      console.log('');

      console.log('📱 確認URL:');
      console.log(`   https://oshikatsu-collection.netlify.app/celebrities/${KINOSHITA_YUKA_CELEBRITY.slug}`);
      console.log('');
      console.log('============================================================');

      return {
        celebrity: this.celebrityId,
        episodes: episodeResult
      };

    } catch (error) {
      console.error('❌ 木下ゆうかデータ登録エラー:', error);
      throw error;
    }
  }
}

// 実行関数
async function main() {
  const importer = new KinoshitaYukaDataImporter();
  await importer.run();
}

// スクリプト実行
main().catch(console.error);