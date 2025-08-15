/**
 * YouTube Shortsエピソードの削除実行スクリプト
 * タイトルに#shortsが含まれるエピソードを安全に削除します
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
  created_at: string;
  updated_at: string;
}

class YouTubeShortsDeleter {
  private backupDir = './data-backup';

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * YouTube Shortsエピソードを検索
   */
  async findYouTubeShorts(): Promise<Episode[]> {
    console.log('🔍 YouTube Shortsエピソードを検索中...');
    
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .ilike('title', '%#shorts%');

    if (error) {
      throw new Error(`YouTube Shorts検索エラー: ${error.message}`);
    }

    console.log(`📺 ${data?.length || 0}個のYouTube Shortsを発見しました`);
    return data || [];
  }

  /**
   * エピソードの関連データ確認
   */
  async checkEpisodeRelations(episodeId: string) {
    const [locationsResult, itemsResult] = await Promise.all([
      supabase.from('episode_locations').select('episode_id').eq('episode_id', episodeId),
      supabase.from('episode_items').select('episode_id').eq('episode_id', episodeId)
    ]);

    return {
      locationsCount: locationsResult.data?.length || 0,
      itemsCount: itemsResult.data?.length || 0,
      hasRelations: (locationsResult.data?.length || 0) > 0 || (itemsResult.data?.length || 0) > 0
    };
  }

  /**
   * バックアップ作成
   */
  async createShortsBackup(episodes: Episode[]): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFilename = `youtube-shorts-deletion-${timestamp}-${Date.now()}.json`;
    const backupPath = path.join(this.backupDir, backupFilename);

    console.log(`📦 YouTube Shortsバックアップ作成中: ${backupFilename}`);

    const backupData = {
      timestamp: new Date().toISOString(),
      purpose: 'YouTube Shorts episodes deletion backup',
      totalEpisodes: episodes.length,
      episodes: [],
      episodeLocations: [],
      episodeItems: [],
      deletionPlan: []
    };

    // 各エピソードの詳細とリレーションを取得
    for (const episode of episodes) {
      try {
        const relations = await this.checkEpisodeRelations(episode.id);
        
        // 関連データも取得
        if (relations.hasRelations) {
          const [locationsData, itemsData] = await Promise.all([
            supabase.from('episode_locations').select('*').eq('episode_id', episode.id),
            supabase.from('episode_items').select('*').eq('episode_id', episode.id)
          ]);
          
          backupData.episodeLocations.push(...(locationsData.data || []));
          backupData.episodeItems.push(...(itemsData.data || []));
        }

        backupData.episodes.push(episode);
        backupData.deletionPlan.push({
          episodeId: episode.id,
          title: episode.title,
          hasRelations: relations.hasRelations,
          relationsCount: {
            locations: relations.locationsCount,
            items: relations.itemsCount
          }
        });

        console.log(`  📝 ${episode.title}: 関連データ${relations.locationsCount + relations.itemsCount}件`);
      } catch (error) {
        console.error(`  ❌ エピソード ${episode.id} のバックアップ失敗: ${error}`);
      }
    }

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ バックアップ完了: ${backupPath}`);
    
    return backupPath;
  }

  /**
   * エピソードと関連データを削除
   */
  async deleteEpisodeAndRelations(episodeId: string, title: string): Promise<void> {
    console.log(`🗑️  削除中: ${title.substring(0, 50)}...`);

    try {
      // 関連データを先に削除
      await Promise.all([
        supabase.from('episode_locations').delete().eq('episode_id', episodeId),
        supabase.from('episode_items').delete().eq('episode_id', episodeId)
      ]);

      // エピソード本体を削除
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episodeId);

      if (error) {
        throw new Error(`エピソード削除エラー: ${error.message}`);
      }

      console.log(`  ✅ 削除完了: ${episodeId}`);
    } catch (error) {
      console.error(`  ❌ 削除失敗 ${episodeId}: ${error}`);
      throw error;
    }
  }

  /**
   * YouTube Shorts削除実行
   */
  async deleteShortsEpisodes(): Promise<void> {
    console.log('🎬 YouTube Shorts削除処理を開始します...\n');

    // YouTube Shortsを検索
    const shortsEpisodes = await this.findYouTubeShorts();
    
    if (shortsEpisodes.length === 0) {
      console.log('削除対象のYouTube Shortsが見つかりませんでした');
      return;
    }

    console.log('\n📋 削除予定のYouTube Shorts:');
    shortsEpisodes.forEach((episode, index) => {
      console.log(`${index + 1}. ${episode.title}`);
      console.log(`   ID: ${episode.id}`);
      console.log(`   URL: ${episode.video_url || 'なし'}`);
    });

    // バックアップ作成
    const backupPath = await this.createShortsBackup(shortsEpisodes);

    // 削除実行
    console.log('\n🗑️  削除実行中...');
    let deletedCount = 0;
    let errorCount = 0;

    for (const episode of shortsEpisodes) {
      try {
        await this.deleteEpisodeAndRelations(episode.id, episode.title);
        deletedCount++;
      } catch (error) {
        console.error(`削除失敗 ${episode.id}: ${error}`);
        errorCount++;
      }
    }

    console.log('\n✅ YouTube Shorts削除処理完了');
    console.log(`📊 削除成功: ${deletedCount}個`);
    console.log(`❌ 削除失敗: ${errorCount}個`);
    console.log(`💾 バックアップ: ${backupPath}`);

    // 削除後の確認
    await this.verifyShortsDeleted();
  }

  /**
   * 削除後の確認
   */
  async verifyShortsDeleted(): Promise<void> {
    console.log('\n🔍 削除後確認中...');

    const { data, error } = await supabase
      .from('episodes')
      .select('id, title')
      .ilike('title', '%#shorts%');

    if (error) {
      console.error(`確認エラー: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      console.log(`⚠️  残存YouTube Shorts: ${data.length}個`);
      data.forEach(episode => {
        console.log(`   - ${episode.title} (${episode.id})`);
      });
    } else {
      console.log(`✅ 確認完了: すべてのYouTube Shortsが削除されました`);
    }
  }

  /**
   * ドライラン（削除せずに表示のみ）
   */
  async dryRun(): Promise<void> {
    console.log('🔍 YouTube Shortsドライラン（削除は実行されません）\n');

    const shortsEpisodes = await this.findYouTubeShorts();
    
    if (shortsEpisodes.length === 0) {
      console.log('対象のYouTube Shortsが見つかりませんでした');
      return;
    }

    console.log('📺 削除対象のYouTube Shorts:');
    
    for (let i = 0; i < shortsEpisodes.length; i++) {
      const episode = shortsEpisodes[i];
      const relations = await this.checkEpisodeRelations(episode.id);
      
      console.log(`\n${i + 1}. ${episode.title}`);
      console.log(`   ID: ${episode.id}`);
      console.log(`   URL: ${episode.video_url || 'なし'}`);
      console.log(`   関連データ: ${relations.locationsCount}ロケーション, ${relations.itemsCount}アイテム`);
      
      if (relations.hasRelations) {
        console.log(`   ⚠️  関連データありのため注意が必要`);
      }
    }

    console.log(`\n📊 合計: ${shortsEpisodes.length}個のYouTube Shortsが削除対象です`);
    console.log('💡 実際に削除するには --execute フラグを使用してください');
  }
}

// メイン実行
async function main() {
  const deleter = new YouTubeShortsDeleter();
  const args = process.argv.slice(2);
  const isExecuteMode = args.includes('--execute');
  const isDryRun = args.includes('--dry-run') || !isExecuteMode;

  try {
    if (isDryRun) {
      await deleter.dryRun();
    } else {
      await deleter.deleteShortsEpisodes();
    }
  } catch (error) {
    console.error('❌ 処理中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// ESモジュールでメイン実行の判定
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  main();
}

export { YouTubeShortsDeleter };