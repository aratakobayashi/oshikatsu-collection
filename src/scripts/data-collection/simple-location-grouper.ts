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
  address: string;
  locations: Location[];
  episodeIds: string[];
  count: number;
}

export class SimpleLocationGrouper {
  private stats = {
    totalLocations: 0,
    uniqueGroups: 0,
    totalDuplicates: 0,
    largestGroup: 0
  };

  // 重複ロケーションの分析（削除せずにグループ化のみ）
  async analyzeLocationGroups(): Promise<void> {
    console.log('🔍 ロケーショングループ分析開始');
    console.log('='.repeat(80));
    console.log('💡 既存構造を維持してグループ化表示用の分析を実行');
    console.log('');

    try {
      // 1. 全ロケーション取得
      const locations = await this.getAllLocations();
      
      // 2. 名前・住所でグループ化
      const locationGroups = await this.groupLocationsByIdentity(locations);
      
      // 3. グループ分析レポート
      await this.generateGroupAnalysisReport(locationGroups);

    } catch (error) {
      console.error('❌ 分析エラー:', error);
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
      // 最も詳細な情報を持つロケーションを参照用に選択
      const referenceLocation = this.selectReferenceLocation(locs);
      
      return {
        name: referenceLocation.name,
        address: referenceLocation.address || '',
        locations: locs,
        episodeIds: locs.map(l => l.episode_id).filter(Boolean),
        count: locs.length
      };
    });

    // 統計更新
    this.stats.uniqueGroups = locationGroups.length;
    this.stats.totalDuplicates = this.stats.totalLocations - this.stats.uniqueGroups;
    this.stats.largestGroup = Math.max(...locationGroups.map(g => g.count));

    console.log(`✅ ${this.stats.uniqueGroups}個のユニークロケーショングループ`);
    console.log(`🔄 ${locationGroups.filter(g => g.count > 1).length}個のグループに重複あり`);

    return locationGroups;
  }

  // 参照用ロケーションを選択（最も詳細な情報を持つもの）
  private selectReferenceLocation(locations: Location[]): Location {
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

  // グループ分析レポート生成
  private async generateGroupAnalysisReport(locationGroups: LocationGroup[]): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 ロケーショングループ分析完了！');
    console.log('='.repeat(80));

    console.log('\n📊 分析結果サマリー:');
    console.log(`📍 総ロケーション数: ${this.stats.totalLocations}件`);
    console.log(`🏷️  ユニークグループ数: ${this.stats.uniqueGroups}個`);
    console.log(`🔄 重複ロケーション数: ${this.stats.totalDuplicates}件`);
    console.log(`📈 最大グループサイズ: ${this.stats.largestGroup}件`);

    const reductionRate = Math.round((this.stats.totalDuplicates / this.stats.totalLocations) * 100);
    console.log(`💾 潜在的削減率: ${reductionRate}%`);

    // 重複グループの詳細
    const duplicateGroups = locationGroups.filter(g => g.count > 1);
    console.log(`\n🔍 重複グループ詳細 (${duplicateGroups.length}個):`);
    
    duplicateGroups
      .sort((a, b) => b.count - a.count) // 重複数の多い順
      .slice(0, 10) // 上位10個
      .forEach((group, index) => {
        console.log(`\n${index + 1}. 📍 ${group.name}`);
        console.log(`   📮 ${group.address}`);
        console.log(`   🔢 重複数: ${group.count}件`);
        console.log(`   📺 関連エピソード: ${group.episodeIds.length}個`);
        
        // エピソードIDをサンプル表示
        const sampleEpisodes = group.episodeIds.slice(0, 3);
        console.log(`   🎬 サンプルエピソード: ${sampleEpisodes.join(', ')}${group.episodeIds.length > 3 ? '...' : ''}`);
      });

    // フロントエンド用のグループ化APIの例
    console.log('\n💡 フロントエンド実装ガイド:');
    console.log('1. ロケーション一覧取得時に名前+住所でグループ化');
    console.log('2. 各グループの代表ロケーションを表示');
    console.log('3. 詳細ページで関連エピソード一覧を表示');
    console.log('4. 「○○で△△回訪問」のような表示');

    // サンプルグループ化クエリ例
    console.log('\n📝 実装例 (JavaScript):');
    console.log(`
const groupedLocations = locations.reduce((groups, location) => {
  const key = \`\${location.name.trim().toLowerCase()}|\${(location.address || '').trim().toLowerCase()}\`;
  if (!groups[key]) {
    groups[key] = {
      name: location.name,
      address: location.address,
      locations: [],
      episodeCount: 0
    };
  }
  groups[key].locations.push(location);
  groups[key].episodeCount = groups[key].locations.length;
  return groups;
}, {});
    `);

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/equal-love');
    console.log('\n' + '='.repeat(80));
  }

  // 特定グループの詳細分析
  async analyzeSpecificGroup(locationName: string): Promise<void> {
    console.log(`🔍 特定グループ分析: ${locationName}`);
    console.log('-'.repeat(50));

    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, episode_id, created_at, tags')
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .ilike('name', `%${locationName}%`);

    if (error || !locations) {
      console.error('❌ データ取得エラー:', error);
      return;
    }

    console.log(`📍 "${locationName}" 関連ロケーション: ${locations.length}件`);
    
    locations.forEach((loc, index) => {
      console.log(`\n${index + 1}. ID: ${loc.id}`);
      console.log(`   📺 Episode: ${loc.episode_id}`);
      console.log(`   📅 作成日: ${new Date(loc.created_at).toLocaleDateString('ja-JP')}`);
      console.log(`   🏷️  タグ: ${loc.tags?.join(', ') || 'なし'}`);
    });

    // エピソード情報も取得
    const episodeIds = locations.map(l => l.episode_id).filter(Boolean);
    if (episodeIds.length > 0) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title, date')
        .in('id', episodeIds);

      if (episodes) {
        console.log(`\n📺 関連エピソード詳細:`);
        episodes.forEach((ep, index) => {
          console.log(`   ${index + 1}. ${ep.title}`);
          console.log(`      📅 ${new Date(ep.date).toLocaleDateString('ja-JP')}`);
        });
      }
    }
  }
}

// メイン実行
async function main() {
  const grouper = new SimpleLocationGrouper();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  switch (command) {
    case 'analyze':
      console.log('🔍 グループ分析モード');
      await grouper.analyzeLocationGroups();
      break;
      
    case 'detail':
      const locationName = args[1];
      if (!locationName) {
        console.log('使用方法: npm run group-locations detail "ロケーション名"');
        return;
      }
      console.log('🔍 詳細分析モード');
      await grouper.analyzeSpecificGroup(locationName);
      break;
      
    default:
      console.log('使用方法:');
      console.log('  npm run group-locations analyze  # 全体分析');
      console.log('  npm run group-locations detail "ボートレース浜名湖"  # 特定分析');
  }
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}