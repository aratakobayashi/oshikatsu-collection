import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Episode {
  id: string;
  title: string;
  date: string;
  celebrity_id: string;
  celebrity_name?: string;
}

interface EpisodeWithCelebrity extends Episode {
  celebrities: {
    name: string;
    slug: string;
    type: string;
  };
}

async function analyzeEpisodesWithoutLocations() {
  console.log('🔍 ロケーション未設定エピソード分析開始');
  console.log('='.repeat(60));

  // ロケーションが設定されていないエピソードを取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      date,
      celebrity_id,
      celebrities (
        name,
        slug,
        type
      )
    `)
    .not('id', 'in',
      `(SELECT DISTINCT episode_id FROM episode_locations WHERE episode_id IS NOT NULL)`
    )
    .order('date', { ascending: false });

  if (error) {
    console.error('❌ データ取得エラー:', error);
    return;
  }

  if (!episodes || episodes.length === 0) {
    console.log('✅ ロケーション未設定のエピソードは見つかりませんでした');
    return;
  }

  console.log(`📊 ロケーション未設定エピソード数: ${episodes.length}件`);
  console.log('');

  // セレブリティ別に集計
  const groupedByCelebrity = episodes.reduce((acc, episode: any) => {
    const celebName = episode.celebrities?.name || '不明';
    const celebType = episode.celebrities?.type || '不明';
    const celebSlug = episode.celebrities?.slug || 'unknown';

    const key = `${celebName} (${celebType})`;

    if (!acc[key]) {
      acc[key] = {
        celebrity: celebName,
        type: celebType,
        slug: celebSlug,
        episodes: []
      };
    }

    acc[key].episodes.push({
      id: episode.id,
      title: episode.title,
      date: episode.date
    });

    return acc;
  }, {} as Record<string, any>);

  console.log('📈 セレブリティ別内訳:');
  console.log('='.repeat(60));

  let grurmeEpisodes = 0;
  let otherEpisodes = 0;

  for (const [celebKey, data] of Object.entries(groupedByCelebrity)) {
    console.log(`\n🎭 ${celebKey} - ${data.episodes.length}件`);

    // グルメ関連かどうか判定
    const isGourmet = data.slug.includes('kodoku') ||
                     data.slug.includes('gurume') ||
                     data.celebrity.includes('グルメ') ||
                     data.celebrity.includes('孤独');

    if (isGourmet) {
      grurmeEpisodes += data.episodes.length;
      console.log('   🍴 グルメ系 - 手法1（孤独のグルメテンプレート）適用推奨');
    } else {
      otherEpisodes += data.episodes.length;
      console.log(`   📱 その他（${data.type}） - 手法2または3適用検討`);
    }

    // 最新5件のエピソードタイトルを表示
    const recentEpisodes = data.episodes
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    recentEpisodes.forEach((ep: any) => {
      const date = new Date(ep.date).toLocaleDateString('ja-JP');
      console.log(`      • ${ep.title} (${date})`);
    });

    if (data.episodes.length > 5) {
      console.log(`      ... 他${data.episodes.length - 5}件`);
    }
  }

  // 推奨アクション
  console.log('\n' + '='.repeat(60));
  console.log('💡 推奨アクション');
  console.log('='.repeat(60));

  if (grurmeEpisodes > 0) {
    console.log(`\n🍴 グルメ系エピソード: ${grurmeEpisodes}件`);
    console.log('   ✅ 手法1: 孤独のグルメテンプレート使用');
    console.log('   ✅ 品質管理システム完備済み');
    console.log('   ✅ 食べログアフィリエイト対応済み');
    console.log('\n   📝 実行手順:');
    console.log('   1. 5エピソードずつ段階的に処理');
    console.log('   2. テンプレートコピー: scripts/templates/add-season-episode-template.ts');
    console.log('   3. 品質チェック: scripts/templates/verify-season-data-template.ts');
  }

  if (otherEpisodes > 0) {
    console.log(`\n📱 その他エピソード: ${otherEpisodes}件`);
    console.log('   ⚠️  手法2または3での対応検討が必要');
    console.log('   • 概要欄に店舗情報があるか確認');
    console.log('   • ファンサイト情報の利用可能性確認');
  }

  // 処理優先順位
  console.log('\n🎯 処理優先順位:');
  console.log('1. グルメ系エピソード（確実な収益化）');
  console.log('2. YouTube概要欄に店舗情報があるエピソード');
  console.log('3. ファンサイト情報が充実しているセレブリティ');

  console.log('\n='.repeat(60));
  console.log('🔍 分析完了');
}

// メイン実行
analyzeEpisodesWithoutLocations().catch(console.error);

export { analyzeEpisodesWithoutLocations };