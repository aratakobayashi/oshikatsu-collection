/**
 * 本番環境のSupabaseデータベースからYouTubeショート動画と思われる重複エピソードを分析・削除するスクリプト
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 環境変数を読み込み
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

// Supabaseクライアント初期化
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase環境変数が設定されていません');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Episode {
  id: string;
  title: string;
  video_url?: string;
  duration_minutes?: number;
  air_date?: string;
  season?: number;
  episode_number?: number;
  created_at: string;
  updated_at: string;
}

interface EpisodeLocation {
  episode_id: string;
  location_id: string;
}

interface EpisodeItem {
  episode_id: string;
  item_id: string;
}

class ShortsAnalyzer {
  private backupDir = './data-backup';

  constructor() {
    // バックアップディレクトリを作成
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 指定されたエピソードIDの詳細を取得
   */
  async getEpisodeDetails(episodeIds: string[]): Promise<Episode[]> {
    console.log('🔍 指定されたエピソードの詳細を取得中...');
    
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .in('id', episodeIds);

    if (error) {
      throw new Error(`エピソード取得エラー: ${error.message}`);
    }

    return data || [];
  }

  /**
   * YouTubeショート動画の可能性があるエピソードを検索
   */
  async findPotentialShorts(): Promise<Episode[]> {
    console.log('🔍 YouTubeショート動画の可能性があるエピソードを検索中...');
    
    // 1. duration_minutes < 1 のエピソード
    const { data: shortDuration, error: shortError } = await supabase
      .from('episodes')
      .select('*')
      .lt('duration_minutes', 1);

    if (shortError) {
      console.warn(`短時間エピソード取得警告: ${shortError.message}`);
    }

    // 2. タイトルに "Shorts" が含まれるエピソード
    const { data: shortsTitle, error: titleError } = await supabase
      .from('episodes')
      .select('*')
      .ilike('title', '%shorts%');

    if (titleError) {
      console.warn(`ショートタイトル取得警告: ${titleError.message}`);
    }

    // 3. 非常に短いタイトル（10文字以下）のエピソード
    const { data: shortTitle, error: shortTitleError } = await supabase
      .from('episodes')
      .select('*')
      .lt('char_length(title)', 10);

    if (shortTitleError) {
      console.warn(`短いタイトル取得警告: ${shortTitleError.message}`);
    }

    // 4. video_urlがYouTube Shortsパターンのもの
    const { data: shortsUrl, error: urlError } = await supabase
      .from('episodes')
      .select('*')
      .like('video_url', '%youtube.com/shorts%');

    if (urlError) {
      console.warn(`ショートURL取得警告: ${urlError.message}`);
    }

    // 結果をマージして重複を除去
    const allPotentialShorts = [
      ...(shortDuration || []),
      ...(shortsTitle || []),
      ...(shortTitle || []),
      ...(shortsUrl || [])
    ];

    const uniqueShorts = Array.from(
      new Map(allPotentialShorts.map(episode => [episode.id, episode])).values()
    );

    return uniqueShorts;
  }

  /**
   * エピソードの関連データを取得
   */
  async getEpisodeRelations(episodeId: string): Promise<{
    locations: EpisodeLocation[];
    items: EpisodeItem[];
  }> {
    const [locationsResult, itemsResult] = await Promise.all([
      supabase
        .from('episode_locations')
        .select('*')
        .eq('episode_id', episodeId),
      supabase
        .from('episode_items')
        .select('*')
        .eq('episode_id', episodeId)
    ]);

    return {
      locations: locationsResult.data || [],
      items: itemsResult.data || []
    };
  }

  /**
   * バックアップを作成
   */
  async createBackup(episodeIds: string[]): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFilename = `shorts-deletion-backup-${timestamp}.json`;
    const backupPath = path.join(this.backupDir, backupFilename);

    console.log(`📦 バックアップを作成中: ${backupFilename}`);

    const backupData = {
      timestamp: new Date().toISOString(),
      episodeIds,
      episodes: [],
      episodeLocations: [],
      episodeItems: []
    };

    // エピソードデータをバックアップ
    for (const episodeId of episodeIds) {
      const episode = await this.getEpisodeDetails([episodeId]);
      const relations = await this.getEpisodeRelations(episodeId);
      
      if (episode.length > 0) {
        backupData.episodes.push(episode[0]);
        backupData.episodeLocations.push(...relations.locations);
        backupData.episodeItems.push(...relations.items);
      }
    }

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ バックアップが完了しました: ${backupPath}`);
    
    return backupPath;
  }

  /**
   * エピソードとその関連データを安全に削除
   */
  async deleteEpisodes(episodeIds: string[]): Promise<void> {
    console.log(`🗑️  ${episodeIds.length}個のエピソードを削除中...`);

    for (const episodeId of episodeIds) {
      try {
        // 1. 関連データを先に削除
        await supabase
          .from('episode_locations')
          .delete()
          .eq('episode_id', episodeId);

        await supabase
          .from('episode_items')
          .delete()
          .eq('episode_id', episodeId);

        // 2. エピソード自体を削除
        const { error } = await supabase
          .from('episodes')
          .delete()
          .eq('id', episodeId);

        if (error) {
          throw new Error(`エピソード削除エラー (${episodeId}): ${error.message}`);
        }

        console.log(`✅ エピソード削除完了: ${episodeId}`);
      } catch (error) {
        console.error(`❌ エピソード削除失敗 (${episodeId}): ${error}`);
        throw error;
      }
    }
  }

  /**
   * メイン分析関数
   */
  async analyzeShorts(): Promise<void> {
    console.log('🎬 YouTubeショート動画分析を開始します...\n');

    // 指定されたエピソードIDを確認
    const targetIds = [
      '7b98f022368ab29d1c36a39f2fc644a4',
      'f6fbdaf782086799e7e17afd6f9d14b7'
    ];

    console.log('=== 指定されたエピソードの詳細 ===');
    const targetEpisodes = await this.getEpisodeDetails(targetIds);
    
    if (targetEpisodes.length === 0) {
      console.log('❌ 指定されたエピソードが見つかりませんでした');
      return;
    }

    targetEpisodes.forEach((episode, index) => {
      console.log(`\n${index + 1}. エピソード詳細:`);
      console.log(`   ID: ${episode.id}`);
      console.log(`   タイトル: ${episode.title}`);
      console.log(`   動画URL: ${episode.video_url || 'なし'}`);
      console.log(`   時間: ${episode.duration_minutes || 'なし'}分`);
      console.log(`   放送日: ${episode.air_date || 'なし'}`);
      console.log(`   シーズン: ${episode.season || 'なし'}`);
      console.log(`   エピソード番号: ${episode.episode_number || 'なし'}`);
    });

    // 潜在的なショート動画を検索
    console.log('\n=== 潜在的なショート動画の検索 ===');
    const potentialShorts = await this.findPotentialShorts();
    
    console.log(`\n🔍 ${potentialShorts.length}個の潜在的なショート動画を発見しました:`);
    
    potentialShorts.forEach((episode, index) => {
      console.log(`\n${index + 1}. ${episode.title}`);
      console.log(`   ID: ${episode.id}`);
      console.log(`   時間: ${episode.duration_minutes || 'なし'}分`);
      console.log(`   URL: ${episode.video_url || 'なし'}`);
      
      // ショートと判定される理由を表示
      const reasons = [];
      if (episode.duration_minutes && episode.duration_minutes < 1) {
        reasons.push('短時間動画');
      }
      if (episode.title.toLowerCase().includes('shorts')) {
        reasons.push('タイトルにShorts');
      }
      if (episode.title.length < 10) {
        reasons.push('短いタイトル');
      }
      if (episode.video_url && episode.video_url.includes('youtube.com/shorts')) {
        reasons.push('ShortsURL');
      }
      
      console.log(`   判定理由: ${reasons.join(', ')}`);
    });

    // 各エピソードの関連データを確認
    console.log('\n=== 関連データの確認 ===');
    for (const episode of targetEpisodes) {
      const relations = await this.getEpisodeRelations(episode.id);
      console.log(`\n${episode.title} (${episode.id}):`);
      console.log(`  - 関連ロケーション: ${relations.locations.length}件`);
      console.log(`  - 関連アイテム: ${relations.items.length}件`);
    }
  }

  /**
   * 削除実行関数（確認付き）
   */
  async executeDelection(episodeIds: string[]): Promise<void> {
    console.log('\n🚨 削除実行フェーズ 🚨');
    console.log(`削除対象: ${episodeIds.length}個のエピソード`);
    
    // バックアップ作成
    const backupPath = await this.createBackup(episodeIds);
    console.log(`バックアップ完了: ${backupPath}`);

    // 削除実行
    await this.deleteEpisodes(episodeIds);
    console.log('✅ 削除が完了しました');
  }
}

// メイン実行
async function main() {
  const analyzer = new ShortsAnalyzer();
  
  const args = process.argv.slice(2);
  const isExecutionMode = args.includes('--execute');
  
  try {
    // まず分析を実行
    await analyzer.analyzeShorts();
    
    if (isExecutionMode) {
      console.log('\n⚠️  削除実行モードが有効になっています');
      
      // 指定されたエピソードIDを削除
      const targetIds = [
        '7b98f022368ab29d1c36a39f2fc644a4',
        'f6fbdaf782086799e7e17afd6f9d14b7'
      ];
      
      await analyzer.executeDelection(targetIds);
    } else {
      console.log('\n💡 これは分析モードです。実際に削除を実行するには --execute フラグを追加してください:');
      console.log('   npx tsx scripts/analyze-and-delete-shorts.ts -- --execute');
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// ESモジュールでメイン実行の判定
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  main();
}

export { ShortsAnalyzer };