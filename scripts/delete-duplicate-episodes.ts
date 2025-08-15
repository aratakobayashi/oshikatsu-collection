/**
 * 重複エピソードの削除実行スクリプト
 * 指定された2つの重複エピソードを安全に削除します
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

class DuplicateEpisodeDeleter {
  private backupDir = './data-backup';

  constructor() {
    // バックアップディレクトリを作成
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * エピソードの詳細と関連データを取得
   */
  async getEpisodeWithRelations(episodeId: string) {
    console.log(`📋 エピソード ${episodeId} の詳細を取得中...`);

    // エピソード詳細
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (episodeError) {
      throw new Error(`エピソード取得エラー: ${episodeError.message}`);
    }

    // 関連データを並行取得
    const [locationsResult, itemsResult] = await Promise.all([
      supabase.from('episode_locations').select('*').eq('episode_id', episodeId),
      supabase.from('episode_items').select('*').eq('episode_id', episodeId)
    ]);

    return {
      episode,
      locations: locationsResult.data || [],
      items: itemsResult.data || [],
      hasRelations: (locationsResult.data?.length || 0) > 0 || (itemsResult.data?.length || 0) > 0
    };
  }

  /**
   * 削除前のバックアップ作成
   */
  async createDeletionBackup(episodeIds: string[]): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFilename = `duplicate-episodes-deletion-${timestamp}-${Date.now()}.json`;
    const backupPath = path.join(this.backupDir, backupFilename);

    console.log(`📦 削除前バックアップを作成中: ${backupFilename}`);

    const backupData = {
      timestamp: new Date().toISOString(),
      purpose: 'YouTube Shorts duplicate episodes deletion backup',
      episodeIds,
      episodes: [],
      episodeLocations: [],
      episodeItems: [],
      deletionPlan: []
    };

    // 各エピソードのデータを収集
    for (const episodeId of episodeIds) {
      try {
        const data = await this.getEpisodeWithRelations(episodeId);
        
        backupData.episodes.push(data.episode);
        backupData.episodeLocations.push(...data.locations);
        backupData.episodeItems.push(...data.items);
        
        backupData.deletionPlan.push({
          episodeId,
          title: data.episode.title,
          hasRelations: data.hasRelations,
          relationsCount: {
            locations: data.locations.length,
            items: data.items.length
          }
        });

        console.log(`  ✅ ${data.episode.title}: 関連データ${data.locations.length + data.items.length}件`);
      } catch (error) {
        console.error(`  ❌ エピソード ${episodeId} のバックアップ失敗: ${error}`);
        throw error;
      }
    }

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ バックアップ完了: ${backupPath}`);
    
    return backupPath;
  }

  /**
   * エピソードと関連データを安全に削除
   */
  async deleteEpisodeWithRelations(episodeId: string, episodeTitle: string): Promise<void> {
    console.log(`🗑️  削除開始: ${episodeTitle} (${episodeId})`);

    try {
      // 1. episode_locations を削除
      const { error: locationsError } = await supabase
        .from('episode_locations')
        .delete()
        .eq('episode_id', episodeId);

      if (locationsError) {
        throw new Error(`関連ロケーション削除エラー: ${locationsError.message}`);
      }

      // 2. episode_items を削除
      const { error: itemsError } = await supabase
        .from('episode_items')
        .delete()
        .eq('episode_id', episodeId);

      if (itemsError) {
        throw new Error(`関連アイテム削除エラー: ${itemsError.message}`);
      }

      // 3. episodes を削除
      const { error: episodeError } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episodeId);

      if (episodeError) {
        throw new Error(`エピソード削除エラー: ${episodeError.message}`);
      }

      console.log(`  ✅ 削除完了: ${episodeTitle}`);
    } catch (error) {
      console.error(`  ❌ 削除失敗: ${error}`);
      throw error;
    }
  }

  /**
   * 削除実行の確認
   */
  async confirmDeletion(episodeIds: string[]): Promise<boolean> {
    console.log('\n🚨 重複エピソード削除の確認 🚨');
    console.log('以下のエピソードを削除します:\n');

    for (const episodeId of episodeIds) {
      try {
        const data = await this.getEpisodeWithRelations(episodeId);
        console.log(`📺 ${data.episode.title}`);
        console.log(`   ID: ${episodeId}`);
        console.log(`   URL: ${data.episode.video_url || 'なし'}`);
        console.log(`   関連データ: ${data.locations.length}ロケーション, ${data.items.length}アイテム`);
        
        if (data.hasRelations) {
          console.log(`   ⚠️  関連データあり - これらも削除されます`);
        }
        console.log('');
      } catch (error) {
        console.error(`   ❌ エピソード詳細取得失敗: ${error}`);
      }
    }

    return true; // スクリプトの場合は自動実行
  }

  /**
   * メイン削除処理
   */
  async executeDeletion(episodeIds: string[]): Promise<void> {
    console.log('🎬 重複エピソード削除処理を開始します...\n');

    // 削除確認
    const confirmed = await this.confirmDeletion(episodeIds);
    if (!confirmed) {
      console.log('削除がキャンセルされました');
      return;
    }

    // バックアップ作成
    const backupPath = await this.createDeletionBackup(episodeIds);

    // 削除実行
    console.log('\n🗑️  削除実行中...');
    let deletedCount = 0;

    for (const episodeId of episodeIds) {
      try {
        const data = await this.getEpisodeWithRelations(episodeId);
        await this.deleteEpisodeWithRelations(episodeId, data.episode.title);
        deletedCount++;
      } catch (error) {
        console.error(`エピソード削除失敗 ${episodeId}: ${error}`);
        // 一つ失敗しても他は続行
      }
    }

    console.log('\n✅ 削除処理完了');
    console.log(`📊 削除完了: ${deletedCount}/${episodeIds.length} エピソード`);
    console.log(`💾 バックアップ: ${backupPath}`);

    // 削除後の確認
    await this.verifyDeletion(episodeIds);
  }

  /**
   * 削除後の確認
   */
  async verifyDeletion(episodeIds: string[]): Promise<void> {
    console.log('\n🔍 削除後確認中...');

    for (const episodeId of episodeIds) {
      const { data, error } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('id', episodeId);

      if (error) {
        console.error(`確認エラー ${episodeId}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`⚠️  削除失敗 ${episodeId}: まだ存在します`);
      } else {
        console.log(`✅ 削除確認 ${episodeId}: 正常に削除されました`);
      }
    }
  }
}

// メイン実行
async function main() {
  const deleter = new DuplicateEpisodeDeleter();
  
  // 削除対象の重複エピソードID
  const duplicateEpisodeIds = [
    '7b98f022368ab29d1c36a39f2fc644a4', // よにのちゃんねる【ドライブ!!】よにのマップ作れそうな日
    // 'f6fbdaf782086799e7e17afd6f9d14b7'  // #442【ドライブ!!】よにのマップ作れそうな日 - こちらは関連データありなので保持
  ];

  console.log('重要: 以下の理由でエピソードを削除します:');
  console.log('- 7b98f022368ab29d1c36a39f2fc644a4: 関連データなしの重複エピソード');
  console.log('- f6fbdaf782086799e7e17afd6f9d14b7: 関連データありのため保持');
  console.log('');

  try {
    await deleter.executeDeletion(duplicateEpisodeIds);
  } catch (error) {
    console.error('❌ 削除処理中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// ESモジュールでメイン実行の判定
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  main();
}

export { DuplicateEpisodeDeleter };