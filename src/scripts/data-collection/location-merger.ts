import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 本番環境設定読み込み
dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const EQUAL_LOVE_ID = '259e44a6-5a33-40cf-9d78-86cfbd9df2ac';

interface Location {
  id: string;
  name: string;
  address: string;
  episode_id: string;
  slug: string;
  description: string;
  website_url: string;
  tags: string[];
  celebrity_id: string;
  created_at: string;
  updated_at: string;
}

interface LocationGroup {
  name: string;
  locations: Location[];
  masterLocation: Location;
  episodes: string[];
}

export class LocationMerger {
  private stats = {
    totalLocations: 0,
    uniqueLocations: 0,
    duplicatesRemoved: 0,
    episodeLinksCreated: 0,
    errorCount: 0
  };

  // 重複ロケーションの分析と統合
  async mergeLocations(): Promise<void> {
    console.log('🔄 ロケーション統合処理開始');
    console.log('='.repeat(80));

    try {
      // 1. 全ロケーション取得
      const locations = await this.getAllLocations();
      
      // 2. 名前・住所でグループ化
      const locationGroups = await this.groupLocationsByIdentity(locations);
      
      // 3. 各グループを統合
      for (const group of locationGroups) {
        await this.mergeLocationGroup(group);
      }

      // 4. 最終レポート
      await this.generateMergeReport();

    } catch (error) {
      console.error('❌ 統合処理エラー:', error);
      throw error;
    }
  }

  // 全ロケーション取得
  private async getAllLocations(): Promise<Location[]> {
    console.log('📍 既存ロケーション取得中...');

    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .order('name');

    if (error) {
      throw new Error(`ロケーション取得エラー: ${error.message}`);
    }

    this.stats.totalLocations = locations?.length || 0;
    console.log(`✅ ${this.stats.totalLocations}件のロケーションを取得`);

    return locations as Location[] || [];
  }

  // ロケーションをグループ化（名前と住所で判定）
  private async groupLocationsByIdentity(locations: Location[]): Promise<LocationGroup[]> {
    console.log('\n🔍 ロケーションのグループ化中...');

    const groups: { [key: string]: Location[] } = {};

    locations.forEach(location => {
      // 名前と住所を正規化してキーとする
      const normalizedName = location.name.trim().toLowerCase();
      const normalizedAddress = (location.address || '').trim().toLowerCase();
      const key = `${normalizedName}|${normalizedAddress}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(location);
    });

    // LocationGroupオブジェクトに変換
    const locationGroups: LocationGroup[] = Object.entries(groups).map(([key, locs]) => {
      // マスターロケーション選択（最も詳細な情報を持つものを選ぶ）
      const masterLocation = this.selectMasterLocation(locs);
      
      return {
        name: masterLocation.name,
        locations: locs,
        masterLocation: masterLocation,
        episodes: locs.map(l => l.episode_id).filter(Boolean)
      };
    });

    this.stats.uniqueLocations = locationGroups.length;
    const duplicateGroups = locationGroups.filter(g => g.locations.length > 1);

    console.log(`✅ ${this.stats.uniqueLocations}個のユニークロケーション`);
    console.log(`🔄 ${duplicateGroups.length}個のロケーションに重複あり`);

    return locationGroups;
  }

  // マスターロケーションを選択
  private selectMasterLocation(locations: Location[]): Location {
    // 最も詳細な情報を持つロケーションを選ぶ
    return locations.reduce((best, current) => {
      let bestScore = this.calculateLocationScore(best);
      let currentScore = this.calculateLocationScore(current);
      
      return currentScore > bestScore ? current : best;
    });
  }

  // ロケーションの詳細度スコア計算
  private calculateLocationScore(location: Location): number {
    let score = 0;
    
    if (location.address?.length > 10) score += 3;
    if (location.description?.length > 20) score += 2;
    if (location.website_url) score += 1;
    if (location.tags?.length > 0) score += 1;
    
    return score;
  }

  // ロケーショングループを統合
  private async mergeLocationGroup(group: LocationGroup): Promise<void> {
    if (group.locations.length === 1) {
      // 重複なし：既存ロケーションを中間テーブルに移行
      await this.migrateToLocationEpisodes(group.masterLocation, [group.masterLocation.episode_id]);
      return;
    }

    console.log(`\n🔄 統合処理: ${group.name} (${group.locations.length}件の重複)`);

    try {
      // 1. マスターロケーションの更新（episode_idを削除）
      await this.updateMasterLocation(group.masterLocation);

      // 2. 中間テーブルにエピソードリンクを作成
      await this.migrateToLocationEpisodes(group.masterLocation, group.episodes);

      // 3. 重複ロケーションを削除
      const duplicateIds = group.locations
        .filter(l => l.id !== group.masterLocation.id)
        .map(l => l.id);

      if (duplicateIds.length > 0) {
        await this.deleteDuplicateLocations(duplicateIds);
        this.stats.duplicatesRemoved += duplicateIds.length;
      }

      console.log(`✅ ${group.name}: ${group.episodes.length}エピソードとリンク`);

    } catch (error) {
      console.error(`❌ 統合エラー (${group.name}):`, error);
      this.stats.errorCount++;
    }
  }

  // マスターロケーションを更新（episode_idを削除）
  private async updateMasterLocation(location: Location): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .update({ episode_id: null })
      .eq('id', location.id);

    if (error) {
      throw new Error(`マスターロケーション更新エラー: ${error.message}`);
    }
  }

  // 中間テーブルにエピソードリンクを作成
  private async migrateToLocationEpisodes(location: Location, episodeIds: string[]): Promise<void> {
    const uniqueEpisodeIds = [...new Set(episodeIds.filter(Boolean))];
    
    for (const episodeId of uniqueEpisodeIds) {
      try {
        const { error } = await supabase
          .from('location_episodes')
          .insert({
            location_id: location.id,
            episode_id: episodeId
          });

        if (error && !error.message.includes('duplicate')) {
          console.error(`中間テーブル挿入エラー (${location.name} - ${episodeId}):`, error);
        } else if (!error) {
          this.stats.episodeLinksCreated++;
        }
      } catch (err) {
        console.error(`エピソードリンク作成エラー:`, err);
      }
    }
  }

  // 重複ロケーションを削除
  private async deleteDuplicateLocations(locationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .in('id', locationIds);

    if (error) {
      throw new Error(`重複削除エラー: ${error.message}`);
    }
  }

  // 統合レポート生成
  private async generateMergeReport(): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 ロケーション統合完了！');
    console.log('='.repeat(80));

    // 最新の統計取得
    const { count: finalLocationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID);

    const { count: episodeLinkCount } = await supabase
      .from('location_episodes')
      .select('*', { count: 'exact', head: true });

    console.log('\n📊 統合結果:');
    console.log(`📍 処理前ロケーション数: ${this.stats.totalLocations}件`);
    console.log(`📍 処理後ロケーション数: ${finalLocationCount}件`);
    console.log(`🗑️  削除した重複: ${this.stats.duplicatesRemoved}件`);
    console.log(`🔗 作成したエピソードリンク: ${this.stats.episodeLinksCreated}件`);
    console.log(`❌ エラー数: ${this.stats.errorCount}件`);

    const reductionRate = Math.round((this.stats.duplicatesRemoved / this.stats.totalLocations) * 100);
    console.log(`\n📈 データ効率化: ${reductionRate}%のストレージ削減`);

    // サンプル確認
    const { data: sampleLocations } = await supabase
      .from('locations')
      .select('id, name, address')
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .limit(5);

    if (sampleLocations && sampleLocations.length > 0) {
      console.log('\n📍 統合後のサンプルロケーション:');
      for (const location of sampleLocations) {
        const { count: episodeCount } = await supabase
          .from('location_episodes')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', location.id);

        console.log(`   • ${location.name} (${episodeCount}エピソード)`);
      }
    }

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/equal-love');
    console.log('\n' + '='.repeat(80));
  }

  // 中間テーブル存在確認
  async checkLocationEpisodesTable(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('location_episodes')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  // 統合前の事前確認
  async preCheckMerge(): Promise<void> {
    console.log('🔍 統合前の事前確認');
    console.log('-'.repeat(40));

    // 中間テーブル確認
    const tableExists = await this.checkLocationEpisodesTable();
    console.log(`📋 location_episodesテーブル: ${tableExists ? '✅ 存在' : '❌ 不存在'}`);

    if (!tableExists) {
      console.log('\n⚠️  まず中間テーブルを作成してください:');
      console.log('1. scripts/create-location-episodes-table.sql を Supabase で実行');
      console.log('2. その後このスクリプトを再実行');
      return;
    }

    // 現在の統計
    const locations = await this.getAllLocations();
    const groups = await this.groupLocationsByIdentity(locations);
    
    console.log('\n📊 統合予測:');
    console.log(`   現在: ${this.stats.totalLocations}ロケーション`);
    console.log(`   統合後: ${this.stats.uniqueLocations}ロケーション`);
    console.log(`   削減予定: ${this.stats.totalLocations - this.stats.uniqueLocations}件`);

    console.log('\n✅ 統合準備完了');
  }
}

// メイン実行
async function main() {
  const merger = new LocationMerger();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  switch (command) {
    case 'check':
      console.log('🔍 事前確認モード');
      await merger.preCheckMerge();
      break;
      
    case 'merge':
      console.log('🔄 統合実行モード');
      await merger.mergeLocations();
      break;
      
    default:
      console.log('使用方法:');
      console.log('  npm run merge-locations check  # 事前確認');
      console.log('  npm run merge-locations merge  # 統合実行');
  }
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}