import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load production environment variables
dotenv.config({ path: join(projectRoot, '.env.production') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableCounts() {
  console.log('📊 データベースの各テーブルのデータ数を確認中...\n');

  const tables = [
    'episodes',
    'locations',
    'items',
    'celebrities',
    'episode_celebrities',
    'episode_locations',
    'episode_items',
    'users',
    'articles',
    'tags',
    'article_tags'
  ];

  const results = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results[table] = `エラー: ${error.message}`;
      } else {
        results[table] = count || 0;
      }
    } catch (err) {
      results[table] = `エラー: ${err.message}`;
    }
  }

  console.log('=== テーブル別データ数 ===\n');

  // メインテーブル
  console.log('【メインテーブル】');
  console.log(`📺 episodes (エピソード): ${results.episodes?.toLocaleString() || results.episodes}`);
  console.log(`📍 locations (ロケ地): ${results.locations?.toLocaleString() || results.locations}`);
  console.log(`🛍️ items (アイテム): ${results.items?.toLocaleString() || results.items}`);
  console.log(`👤 celebrities (タレント): ${results.celebrities?.toLocaleString() || results.celebrities}`);
  console.log(`📝 articles (記事): ${results.articles?.toLocaleString() || results.articles}`);
  console.log(`🏷️ tags (タグ): ${results.tags?.toLocaleString() || results.tags}`);
  console.log(`👥 users (ユーザー): ${results.users?.toLocaleString() || results.users}`);

  console.log('\n【関連テーブル】');
  console.log(`🔗 episode_celebrities: ${results.episode_celebrities?.toLocaleString() || results.episode_celebrities}`);
  console.log(`🔗 episode_locations: ${results.episode_locations?.toLocaleString() || results.episode_locations}`);
  console.log(`🔗 episode_items: ${results.episode_items?.toLocaleString() || results.episode_items}`);
  console.log(`🔗 article_tags: ${results.article_tags?.toLocaleString() || results.article_tags}`);

  // 追加の詳細情報を取得
  console.log('\n=== 詳細分析 ===\n');

  // エピソードの番組別内訳
  const { data: episodeBreakdown } = await supabase
    .from('episodes')
    .select('program_name')
    .not('program_name', 'is', null);

  if (episodeBreakdown) {
    const programCounts = {};
    episodeBreakdown.forEach(ep => {
      programCounts[ep.program_name] = (programCounts[ep.program_name] || 0) + 1;
    });

    console.log('【番組別エピソード数】');
    Object.entries(programCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([program, count]) => {
        console.log(`  ${program}: ${count}`);
      });
  }

  // ロケ地の都道府県別内訳（上位10件）
  const { data: locationBreakdown } = await supabase
    .from('locations')
    .select('address')
    .not('address', 'is', null);

  if (locationBreakdown) {
    const prefectureCounts = {};
    locationBreakdown.forEach(loc => {
      const prefecture = loc.address.split(/[市区町村]/)[0];
      if (prefecture) {
        prefectureCounts[prefecture] = (prefectureCounts[prefecture] || 0) + 1;
      }
    });

    console.log('\n【都道府県別ロケ地数（上位10件）】');
    Object.entries(prefectureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([prefecture, count]) => {
        console.log(`  ${prefecture}: ${count}`);
      });
  }

  // アフィリエイトリンク設定状況
  const { data: affiliateData } = await supabase
    .from('locations')
    .select('tabelog_url')
    .not('tabelog_url', 'is', null);

  console.log('\n【アフィリエイト設定状況】');
  console.log(`  食べログURL設定済み: ${affiliateData?.length || 0}件`);

  // 最近追加されたデータ
  const { data: recentEpisodes } = await supabase
    .from('episodes')
    .select('title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentEpisodes && recentEpisodes.length > 0) {
    console.log('\n【最近追加されたエピソード（5件）】');
    recentEpisodes.forEach(ep => {
      const date = new Date(ep.created_at).toLocaleDateString('ja-JP');
      console.log(`  ${date}: ${ep.title}`);
    });
  }

  process.exit(0);
}

checkTableCounts().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});