import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

interface MovieDramaCandidate {
  id: string;
  title: string;
  celebrity_name: string;
  date: string;
  type: 'movie' | 'drama' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

function analyzeEpisodeType(title: string): {
  type: 'movie' | 'drama' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  notes: string;
} {
  const moviePatterns = [
    /【映画】/i,
    /劇場版/i,
    /movie/i,
    /映画/i,
    /THE MOVIE/i,
    /劇場/i,
  ];

  const dramaPatterns = [
    /【ドラマ】/i,
    /ドラマ/i,
    /drama/i,
    /第\d+話/i,
    /最終回/i,
    /～.*役/i, // 役名表記
    /- .*役/i, // 役名表記（英語形式）
  ];

  let type: 'movie' | 'drama' | 'unknown' = 'unknown';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let notes = '';

  // 映画パターンの検証
  for (const pattern of moviePatterns) {
    if (pattern.test(title)) {
      type = 'movie';
      confidence = title.includes('【映画】') ? 'high' : 'medium';
      notes = `映画パターン検出: ${pattern.source}`;
      break;
    }
  }

  // ドラマパターンの検証（映画が検出されていない場合のみ）
  if (type === 'unknown') {
    for (const pattern of dramaPatterns) {
      if (pattern.test(title)) {
        type = 'drama';
        confidence = title.includes('【ドラマ】') ? 'high' : 'medium';
        notes = `ドラマパターン検出: ${pattern.source}`;
        break;
      }
    }
  }

  // 年号パターン（制作年を含む）
  if (type !== 'unknown') {
    const yearPattern = /\(20\d{2}\)/;
    if (yearPattern.test(title)) {
      confidence = confidence === 'low' ? 'medium' : 'high';
      notes += '; 制作年表記あり';
    }
  }

  return { type, confidence, notes: notes || '映画・ドラマパターンなし' };
}

async function findMovieDramaEpisodes() {
  console.log('🎬 映画・ドラマエピソード検索開始');
  console.log('='.repeat(60));

  // ロケーションが設定されていないエピソードを取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      date,
      celebrities (
        name,
        type
      )
    `)
    .not('id', 'in',
      `(SELECT DISTINCT episode_id FROM episode_locations WHERE episode_id IS NOT NULL)`
    )
    .order('date', { ascending: false });

  if (error || !episodes) {
    console.error('❌ エピソード取得エラー:', error);
    return;
  }

  console.log(`📊 ロケーション未設定エピソード: ${episodes.length}件`);
  console.log('🔍 映画・ドラマエピソードを解析中...\n');

  const candidates: MovieDramaCandidate[] = [];

  for (const episode of episodes) {
    const analysis = analyzeEpisodeType(episode.title);

    if (analysis.type !== 'unknown') {
      candidates.push({
        id: episode.id,
        title: episode.title,
        celebrity_name: (episode as any).celebrities?.name || '不明',
        date: episode.date,
        type: analysis.type,
        confidence: analysis.confidence,
        notes: analysis.notes
      });
    }
  }

  // 結果統計
  const stats = {
    total_candidates: candidates.length,
    movies: candidates.filter(c => c.type === 'movie').length,
    dramas: candidates.filter(c => c.type === 'drama').length,
    high_confidence: candidates.filter(c => c.confidence === 'high').length,
    medium_confidence: candidates.filter(c => c.confidence === 'medium').length,
    low_confidence: candidates.filter(c => c.confidence === 'low').length,
  };

  console.log('📈 映画・ドラマエピソード統計');
  console.log('='.repeat(60));
  console.log(`🎬 映画エピソード: ${stats.movies}件`);
  console.log(`📺 ドラマエピソード: ${stats.dramas}件`);
  console.log(`✅ 高信頼度: ${stats.high_confidence}件`);
  console.log(`🟡 中信頼度: ${stats.medium_confidence}件`);
  console.log(`🟠 低信頼度: ${stats.low_confidence}件`);
  console.log(`📊 合計: ${stats.total_candidates}件 (${Math.round(stats.total_candidates/episodes.length*100)}%)`);

  // 高信頼度の候補を表示（最大20件）
  const highConfidenceCandidates = candidates
    .filter(c => c.confidence === 'high')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  if (highConfidenceCandidates.length > 0) {
    console.log('\n🎯 高信頼度映画・ドラマエピソード（最新20件）');
    console.log('='.repeat(60));

    highConfidenceCandidates.forEach((candidate, index) => {
      const date = new Date(candidate.date).toLocaleDateString('ja-JP');
      console.log(`${index + 1}. [${candidate.type.toUpperCase()}] ${candidate.title}`);
      console.log(`   セレブ: ${candidate.celebrity_name} | 日付: ${date}`);
      console.log(`   分析: ${candidate.notes}`);
      console.log('');
    });
  }

  // セレブリティ別統計
  const byCelebrity = candidates.reduce((acc, candidate) => {
    const key = candidate.celebrity_name;
    if (!acc[key]) acc[key] = { movies: 0, dramas: 0, total: 0 };

    acc[key][candidate.type]++;
    acc[key].total++;
    return acc;
  }, {} as Record<string, { movies: number; dramas: number; total: number }>);

  const topCelebrities = Object.entries(byCelebrity)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 10);

  console.log('\n🌟 映画・ドラマ出演の多いセレブリティ TOP10');
  console.log('='.repeat(60));
  topCelebrities.forEach(([name, stats], index) => {
    console.log(`${index + 1}. ${name}: ${stats.total}件 (映画${stats.movies}, ドラマ${stats.dramas})`);
  });

  // 推奨アクション
  console.log('\n💡 推奨アクション');
  console.log('='.repeat(60));

  if (stats.total_candidates >= 50) {
    console.log('✅ 十分な映画・ドラマエピソード数！聖地巡礼情報調査を推奨');
    console.log('   1. 高信頼度エピソードから5-10件をテスト');
    console.log('   2. 聖地巡礼サイト・ファンサイトで情報収集');
    console.log('   3. TMDB APIとの連携で詳細情報取得');
  } else if (stats.total_candidates >= 20) {
    console.log('🟡 中程度の映画・ドラマエピソード数');
    console.log('   1. 高信頼度エピソードを優先的に処理');
    console.log('   2. 成功事例を基に拡大検討');
  } else {
    console.log('❌ 映画・ドラマエピソード数が少ない');
    console.log('   1. 他の手法（ファンサイト情報等）を検討');
    console.log('   2. 新規映画・ドラマ出演セレブの追加を検討');
  }

  console.log('\n='.repeat(60));
  console.log('🎬 映画・ドラマエピソード検索完了');
}

// メイン実行
findMovieDramaEpisodes().catch(console.error);

export { findMovieDramaEpisodes };